using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public interface IAlertService
    {
        Task<WellnessAlert> GenerateAlert(Guid userId, Guid dogId);
        Task<WellnessAlert> LogOutcome(Guid alertId, string outcome);
        Task<List<WellnessAlert>> GetRecentAlerts(Guid userId);
    }

    public class AlertService : IAlertService
    {
        private readonly AppDbContext _context;
        private readonly IProximityService _proximityService;
        private readonly INotificationService _notificationService;
        private readonly ISmsService _smsService;
        private const double ProximityRadiusMetres = 500.0;

        public AlertService(AppDbContext context, IProximityService proximityService, INotificationService notificationService, ISmsService smsService)
        {
            _context = context;
            _proximityService = proximityService;
            _notificationService = notificationService;
            _smsService = smsService;
        }

        public async Task<WellnessAlert> GenerateAlert(Guid userId, Guid dogId)
        {
            // 1. Get user's baseline
            var baseline = await _context.UserBaselines
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.LastUpdatedUtc)
                .FirstOrDefaultAsync();

            if (baseline == null)
                return null; // No baseline yet

            // 2. Get latest HumanVitals for userId
            var latestHuman = await _context.HumanVitals
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.TimestampUtc)
                .FirstOrDefaultAsync();

            if (latestHuman == null)
                return null;

            // 3. Calculate stress deviation from baseline
            double hrvDropPercent = 0;
            double hrRisePercent = 0;

            if (baseline.AvgHRV > 0 && latestHuman.HRV > 0)
            {
                hrvDropPercent = ((baseline.AvgHRV.Value - latestHuman.HRV.GetValueOrDefault()) / baseline.AvgHRV.Value) * 100;
            }

            if (baseline.AvgHeartRate > 0 && latestHuman.HeartRate > 0)
            {
                hrRisePercent = ((latestHuman.HeartRate.GetValueOrDefault() - baseline.AvgHeartRate.Value) / baseline.AvgHeartRate.Value) * 100;
            }

            // Determine threshold based on mode (20% for test, 25% for production)
            double threshold = baseline.IsTestMode.GetValueOrDefault() ? 20.0 : 25.0;

            // 4. Check if user is stressed
            bool isStressed = hrvDropPercent > threshold || hrRisePercent > threshold;

            if (!isStressed)
                return null; // No stress detected

            // 5. Get latest DogVitals for dogId
            var latestDog = await _context.DogVitals
                .Where(d => d.DogId == dogId)
                .OrderByDescending(d => d.TimestampUtc)
                .FirstOrDefaultAsync();

            if (latestDog == null)
                return null;

            // 6. Calculate proximity between human and dog
            bool isDogNearby = true; // Default assumption
            double? distanceMetres = null;

            if (latestHuman.Latitude.HasValue && latestHuman.Longitude.HasValue &&
                latestDog.Latitude.HasValue && latestDog.Longitude.HasValue)
            {
                distanceMetres = _proximityService.CalculateDistanceMetres(
                    latestHuman.Latitude.Value, latestHuman.Longitude.Value,
                    latestDog.Latitude.Value, latestDog.Longitude.Value);
                
                isDogNearby = distanceMetres <= ProximityRadiusMetres;
            }

            // 7. Generate suggestion based on proximity and dog state
            string suggestion = GenerateProximitySuggestion(latestDog.State, isDogNearby);

            // 8. Save new WellnessAlert to DB
            var newAlert = new WellnessAlert
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DogId = dogId,
                AlertType = "stress_detected",
                Suggestion = suggestion,
                DogStateAtAlert = latestDog.State,
                HRVAtAlert = latestHuman.HRV.GetValueOrDefault(),
                HRAtAlert = latestHuman.HeartRate.GetValueOrDefault(),
                IsDogNearby = isDogNearby,
                DistanceMetres = distanceMetres,
                CreatedAt = DateTime.UtcNow,
                IsActedOn = false
            };

            _context.WellnessAlerts.Add(newAlert);
            await _context.SaveChangesAsync();

            // Get dog name for notification
            var dogProfile = await _context.DogProfiles
                .Where(d => d.Id == dogId)
                .Select(d => d.Name)
                .FirstOrDefaultAsync();
            
            // Send stress alert notification
            await _notificationService.SendStressAlert(userId, suggestion, dogProfile ?? "Your dog", latestDog.State);

            // Send SMS if phone number exists
            var humanProfile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
            if (humanProfile != null && !string.IsNullOrEmpty(humanProfile.PhoneNumber))
            {
                var dogName = dogProfile ?? "Your dog";
                string smsBody = $"HoundHeart Alert: {suggestion} " +
                    $"{dogName} is {latestDog.State}. " +
                    (isDogNearby ? 
                        $"He is {distanceMetres:F0}m away." : 
                        "He is not nearby right now.");

                await _smsService.SendSms(
                    userId,
                    humanProfile.PhoneNumber,
                    "stress_alert",
                    smsBody,
                    newAlert.Id);
            }

            // 9. Return the saved alert
            return newAlert;
        }

        private string GenerateProximitySuggestion(string dogState, bool isDogNearby)
        {
            var state = dogState?.ToLower() ?? "unknown";

            if (!isDogNearby)
            {
                // Dog is not nearby - provide solo calming suggestions
                return "Your dog is not nearby right now. Try some slow deep breathing or find a calm space to rest for a few minutes.";
            }

            // Dog is nearby - provide dog-based calming suggestions
            if (state == "active")
            {
                return "Your dog is nearby and ready to go. A short walk together might help reset your energy.";
            }
            else if (state == "resting")
            {
                return "Your dog is calm and resting nearby. Sit quietly with them and focus on their breathing.";
            }
            else
            {
                return "Your dog is nearby. Spend some quiet time together to help regulate your stress levels.";
            }
        }

        public async Task<WellnessAlert> LogOutcome(Guid alertId, string outcome)
        {
            // 1. Fetch WellnessAlert by Id
            var alert = await _context.WellnessAlerts
                .FirstOrDefaultAsync(a => a.Id == alertId);

            if (alert == null)
                return null;

            // 2. Set Outcome = outcome (e.g. "improved", "no_change", "worsened")
            alert.Outcome = outcome;

            // 3. Set IsActedOn = true
            alert.IsActedOn = true;

            // 4. Set ResolvedAt = DateTime.UtcNow
            alert.ResolvedAt = DateTime.UtcNow;

            // 5. SaveChangesAsync()
            _context.WellnessAlerts.Update(alert);
            await _context.SaveChangesAsync();

            // 6. Return updated alert
            return alert;
        }

        public async Task<List<WellnessAlert>> GetRecentAlerts(Guid userId)
        {
            // 1. Fetch last 10 WellnessAlerts WHERE UserId = userId
            // 2. Order by CreatedAt DESC
            var alerts = await _context.WellnessAlerts
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToListAsync();

            // 3. Return list
            return alerts;
        }
    }
}