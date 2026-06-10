using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public class StressDetectionResult
    {
        public bool IsStressed { get; set; }
        public float HRVDrop { get; set; }
        public float HRRise { get; set; }
        public float BaselineHRV { get; set; }
        public float BaselineHR { get; set; }
        public float CurrentHRV { get; set; }
        public int CurrentHR { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime DetectedAt { get; set; }
        public int DaysOfDataCollected { get; set; }
        public string CurrentThresholdDescription { get; set; } = string.Empty;
        public bool IsTestMode { get; set; }
    }

    public interface IStressService
    {
        Task<StressEvent?> CheckForStressAsync(Guid dogId, bool testMode = false);
        Task<List<StressEvent>> GetStressHistoryAsync(Guid dogId, int days = 7);
        Task<StressDetectionResult> CheckForStress(Guid userId);
    }

    public class StressService : IStressService
    {
        private readonly AppDbContext _context;
        private readonly IPetPaceService _petPaceService;
        private readonly INotificationService _notificationService;

        public StressService(AppDbContext context, IPetPaceService petPaceService, INotificationService notificationService)
        {
            _context = context;
            _petPaceService = petPaceService;
            _notificationService = notificationService;
        }

        public async Task<StressEvent?> CheckForStressAsync(Guid dogId, bool testMode = false)
        {
            DogVitals vitals;

            if (testMode)
            {
                // In test mode, get most recent record from last 10 minutes from database
                var cutoffTime = DateTime.UtcNow.AddMinutes(-10);
                var recentVital = await _context.DogVitals
                    .Where(d => d.DogId == dogId && d.TimestampUtc >= cutoffTime)
                    .OrderByDescending(d => d.TimestampUtc)
                    .FirstOrDefaultAsync();

                if (recentVital == null)
                {
                    return null; // No recent data available for testing
                }

                // Convert database record to DogVitals model
                vitals = new DogVitals
                {
                    DogId = dogId,
                    Timestamp = recentVital.TimestampUtc,
                    HeartRate = new HeartRateMetric 
                    { 
                        Bpm = recentVital.HeartRate ?? 0, 
                        Timestamp = recentVital.TimestampUtc 
                    },
                    HRV = new HRVMetric 
                    { 
                        Ms = 45.0, // Default HRV since it's not stored in DogVitalsRecord
                        Timestamp = recentVital.TimestampUtc 
                    },
                    Activity = new ActivityMetric 
                    { 
                        Intensity = recentVital.ActivityScore > 60 ? "High" : "Low",
                        Steps = 0,
                        Timestamp = recentVital.TimestampUtc 
                    },
                    Temperature = recentVital.Temperature ?? 38.5,
                    Status = recentVital.State ?? "Unknown"
                };
            }
            else
            {
                // Normal mode - use the external service
                vitals = await _petPaceService.GetLatestVitalsAsync(dogId);
            }

            // Simple Stress Logic: HR > 120 and HRV < 30
            if (vitals.HeartRate.Bpm > 120 || vitals.Status == "Stressed")
            {
                // Get userId from the dog record since StressEvent now uses UserId
                var dog = await _context.Dogs.AsNoTracking().FirstOrDefaultAsync(d => d.DogId == dogId);
                var userId = dog?.UserId ?? Guid.Empty;
                if (userId == Guid.Empty) return null;

                var stressEvent = new StressEvent
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    TimestampUtc = DateTime.UtcNow,
                    HRAtEvent = vitals.HeartRate.Bpm,
                    HRVAtEvent = vitals.HRV.Ms,
                    BaselineHRV = 45.0, // Default since we don't have baseline in this method
                    BaselineHR = 72.0, // Default since we don't have baseline in this method
                    DeviationScore = vitals.HeartRate.Bpm > 140 ? 25.0 : 15.0,
                    DogStateAtEvent = vitals.Status,
                    AlertFired = true,
                    OutcomeLogged = false
                };

                _context.StressEvents.Add(stressEvent);
                await _context.SaveChangesAsync();

                // Send Mock Notification
                if (userId != Guid.Empty)
                {
                    await _notificationService.SendNotificationAsync(
                        userId, 
                        "Stress Alert! \u26A0\uFE0F", 
                        $"{dog?.DogName ?? "Your dog"} seems stressed. High Heart Rate ({vitals.HeartRate.Bpm} bpm) detected.", 
                        "Stress");
                }

                return stressEvent;
            }

            return null;
        }

        public async Task<List<StressEvent>> GetStressHistoryAsync(Guid dogId, int days = 7)
        {
            // Get userId from the dog record since StressEvent now uses UserId
            var dog = await _context.Dogs.AsNoTracking().FirstOrDefaultAsync(d => d.DogId == dogId);
            var userId = dog?.UserId ?? Guid.Empty;
            if (userId == Guid.Empty) return new List<StressEvent>();
            
            var thresholdDate = DateTime.UtcNow.AddDays(-days);
            return await _context.StressEvents
                .AsNoTracking()
                .Where(s => s.UserId == userId && s.TimestampUtc >= thresholdDate)
                .OrderByDescending(s => s.TimestampUtc)
                .ToListAsync();
        }

        public async Task<StressDetectionResult> CheckForStress(Guid userId)
        {
            // 1. Get UserBaselines record
            var baseline = await _context.UserBaselines
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (baseline == null)
            {
                return new StressDetectionResult
                {
                    DetectedAt = DateTime.UtcNow,
                    IsStressed = false,
                    Reason = "No baseline established yet",
                    BaselineHR = 0,
                    BaselineHRV = 0,
                    CurrentHR = 0,
                    CurrentHRV = 0,
                    HRRise = 0,
                    HRVDrop = 0,
                    DaysOfDataCollected = 0,
                    CurrentThresholdDescription = "No baseline available",
                    IsTestMode = false
                };
            }

            // Early return if < 3 days of data collected (unless test mode)
            if (!baseline.IsTestMode.GetValueOrDefault() && baseline.DaysOfDataCollected.GetValueOrDefault() < 3)
            {
                return new StressDetectionResult
                {
                    DetectedAt = DateTime.UtcNow,
                    IsStressed = false,
                    Reason = $"Collecting baseline — Day {baseline.DaysOfDataCollected} of 7. Stress detection starts from Day 3.",
                    BaselineHR = (float)baseline.AvgHeartRate.GetValueOrDefault(),
                    BaselineHRV = (float)baseline.AvgHRV.GetValueOrDefault(),
                    CurrentHR = 0,
                    CurrentHRV = 0,
                    HRRise = 0,
                    HRVDrop = 0,
                    DaysOfDataCollected = baseline.DaysOfDataCollected.GetValueOrDefault(),
                    CurrentThresholdDescription = "Baseline collection phase — no stress detection",
                    IsTestMode = baseline.IsTestMode.GetValueOrDefault()
                };
            }

            // 2. Fetch the single most recent HumanVitals record
            var latest = await _context.HumanVitals
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.TimestampUtc)
                .FirstOrDefaultAsync();

            if (latest == null)
            {
                return new StressDetectionResult
                {
                    DetectedAt = DateTime.UtcNow,
                    IsStressed = false,
                    Reason = "No vitals data available",
                    BaselineHR = (float)baseline.AvgHeartRate.GetValueOrDefault(),
                    BaselineHRV = (float)baseline.AvgHRV.GetValueOrDefault(),
                    CurrentHR = 0,
                    CurrentHRV = 0,
                    HRRise = 0,
                    HRVDrop = 0,
                    DaysOfDataCollected = baseline.DaysOfDataCollected.GetValueOrDefault(),
                    CurrentThresholdDescription = "No recent vitals available",
                    IsTestMode = baseline.IsTestMode.GetValueOrDefault()
                };
            }

            // 3. Calculate deviations using double precision
            double hrvDrop = baseline.AvgHRV > 0 ? (baseline.AvgHRV.Value - latest.HRV.GetValueOrDefault()) / baseline.AvgHRV.Value * 100 : 0;
            double hrRise = baseline.AvgHeartRate > 0 ? (latest.HeartRate.GetValueOrDefault() - baseline.AvgHeartRate.Value) / baseline.AvgHeartRate.Value * 100 : 0;

            // 4. Determine progressive thresholds based on DaysOfDataCollected and TestMode
            double hrvThreshold, hrThreshold;
            string reasonPrefix, thresholdDescription;

            if (baseline.IsTestMode.GetValueOrDefault())
            {
                // Test mode always uses 20%/15% thresholds
                hrvThreshold = 20.0;
                hrThreshold = 15.0;
                reasonPrefix = "Test mode:";
                thresholdDescription = "Test mode — 20% HRV drop / 15% HR rise threshold";
            }
            else if (baseline.DaysOfDataCollected.GetValueOrDefault() >= 7)
            {
                // Day 7+: Full sensitivity
                hrvThreshold = 20.0;
                hrThreshold = 15.0;
                reasonPrefix = "Full sensitivity (Day 7+):";
                thresholdDescription = "Full sensitivity — 20% HRV drop / 15% HR rise threshold";
            }
            else if (baseline.DaysOfDataCollected.GetValueOrDefault() >= 5)
            {
                // Day 5-6: Developing detection
                hrvThreshold = 25.0;
                hrThreshold = 20.0;
                reasonPrefix = "Developing detection (Day 5-6):";
                thresholdDescription = "Developing detection — 25% HRV drop / 20% HR rise threshold";
            }
            else // DaysOfDataCollected 3 or 4
            {
                // Day 3-4: Early detection
                hrvThreshold = 30.0;
                hrThreshold = 25.0;
                reasonPrefix = "Early detection (Day 3-4):";
                thresholdDescription = "Early detection — 30% HRV drop / 25% HR rise threshold";
            }

            // 5. Determine if stressed using progressive thresholds
            bool isStressed = hrvDrop >= hrvThreshold || hrRise >= hrThreshold;

            var result = new StressDetectionResult
            {
                DetectedAt = DateTime.UtcNow,
                IsStressed = isStressed,
                BaselineHR = (float)baseline.AvgHeartRate.GetValueOrDefault(),
                BaselineHRV = (float)baseline.AvgHRV.GetValueOrDefault(),
                CurrentHR = latest.HeartRate.GetValueOrDefault(),
                CurrentHRV = (float)latest.HRV.GetValueOrDefault(),
                HRRise = (float)hrRise,
                HRVDrop = (float)hrvDrop,
                DaysOfDataCollected = baseline.DaysOfDataCollected.GetValueOrDefault(),
                CurrentThresholdDescription = thresholdDescription,
                IsTestMode = baseline.IsTestMode.GetValueOrDefault(),
                Reason = isStressed ? "Stress detected" : "No stress detected"
            };

            if (result.IsStressed)
            {
                // Check for duplicate stress events in the last 5 minutes to avoid spam
                var cutoffTime = DateTime.UtcNow.AddMinutes(-5);
                var existingEvent = await _context.StressEvents
                    .Where(e => e.UserId == userId && e.TimestampUtc >= cutoffTime)
                    .FirstOrDefaultAsync();

                if (existingEvent == null)
                {
                    // Insert new StressEvents record
                    var stressEvent = new StressEvent
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        TimestampUtc = DateTime.UtcNow,
                        HRVAtEvent = latest.HRV.GetValueOrDefault(),
                        HRAtEvent = latest.HeartRate.GetValueOrDefault(),
                        BaselineHRV = baseline.AvgHRV.GetValueOrDefault(),
                        BaselineHR = baseline.AvgHeartRate.GetValueOrDefault(),
                        DeviationScore = Math.Max(hrvDrop, hrRise),
                        AlertFired = true,
                        OutcomeLogged = false
                    };

                    _context.StressEvents.Add(stressEvent);
                    await _context.SaveChangesAsync();
                }

                // Set detailed reason based on what triggered stress
                if (hrvDrop >= hrvThreshold && hrRise >= hrThreshold)
                    result.Reason = $"{reasonPrefix} HRV dropped {hrvDrop:F1}% and HR rose {hrRise:F1}%";
                else if (hrvDrop >= hrvThreshold)
                    result.Reason = $"{reasonPrefix} HRV dropped {hrvDrop:F1}% below baseline";
                else
                    result.Reason = $"{reasonPrefix} HR rose {hrRise:F1}% above baseline";
            }
            else
            {
                result.Reason = $"No stress detected (HR rise: {hrRise:F1}%, HRV drop: {hrvDrop:F1}%) — {thresholdDescription}";
            }

            return result;
        }
    }
}
