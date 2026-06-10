using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Services
{
    public class StressMonitoringService : BackgroundService
    {
        private readonly ILogger<StressMonitoringService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public StressMonitoringService(ILogger<StressMonitoringService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Stress Monitoring Service started - running every 30 seconds");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessStressMonitoring();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during stress monitoring cycle");
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        private async Task ProcessStressMonitoring()
        {
            using var scope = _scopeFactory.CreateScope();
            using var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Fetch users with Fitbit connection AND established baselines
            var eligibleUserIds = await (from h in context.HumanProfiles
                                       join u in context.Users on h.UserId equals u.UserId
                                       where h.HumanBaselineEstablished &&
                                             !string.IsNullOrEmpty(u.FitbitAccessToken) &&
                                             !string.IsNullOrEmpty(u.FitbitRefreshToken) &&
                                             u.IsActive && !u.IsDeleted
                                       select h.UserId).ToListAsync();

            if (!eligibleUserIds.Any())
            {
                _logger.LogDebug("No users found with Fitbit connection and established baselines for stress monitoring");
                return;
            }

            // Filter users who also have dogs with established baselines
            var usersWithEstablishedDogs = new List<Guid>();
            foreach (var userId in eligibleUserIds)
            {
                var hasEstablishedDog = await context.DogProfiles
                    .AnyAsync(d => d.UserId == userId && d.DogBaselineEstablished);
                
                if (hasEstablishedDog)
                {
                    usersWithEstablishedDogs.Add(userId);
                }
            }

            if (!usersWithEstablishedDogs.Any())
            {
                _logger.LogDebug("No users found with both human and dog established baselines");
                return;
            }

            _logger.LogDebug("Processing stress monitoring for {UserCount} users", usersWithEstablishedDogs.Count);

            foreach (var userId in usersWithEstablishedDogs)
            {
                await ProcessUserStressMonitoring(context, userId);
            }
        }

        private async Task ProcessUserStressMonitoring(AppDbContext context, Guid userId)
        {
            try
            {
                // Check for recent stress alerts (last 30 minutes)
                var thirtyMinutesAgo = DateTime.UtcNow.AddMinutes(-30);
                var recentAlert = await context.StressEvents
                    .Where(se => se.UserId == userId && se.TimestampUtc >= thirtyMinutesAgo)
                    .AsNoTracking()
                    .AnyAsync();

                if (recentAlert)
                {
                    _logger.LogDebug("Skipping user {UserId} - recent stress alert exists", userId);
                    return;
                }

                // Get latest vitals and baselines
                var latestVitals = await FetchLatestVitals(context, userId);
                if (latestVitals == null)
                {
                    _logger.LogDebug("No recent vitals found for user {UserId}", userId);
                    return;
                }

                // Calculate stress condition
                var stressResult = CalculateStress(latestVitals);
                if (!stressResult.StressDetected)
                {
                    return;
                }

                // Create and save stress event
                await SaveStressEvent(context, userId, latestVitals, stressResult);
                
                _logger.LogInformation("Stress detected for UserId {UserId} - HRV Drop: {HRVDrop}%, HR Rise: {HRRise}%", 
                    userId, stressResult.HRV_Drop_Percentage, stressResult.HR_Rise_Percentage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing stress monitoring for user {UserId}", userId);
            }
        }

        private async Task<UserVitalsData?> FetchLatestVitals(AppDbContext context, Guid userId)
        {
            // Get latest human vitals
            var latestHumanVitals = await context.HumanVitals
                .Where(hv => hv.UserId == userId)
                .OrderByDescending(hv => hv.TimestampUtc)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (latestHumanVitals == null)
            {
                return null;
            }

            // Get user baseline
            var userBaseline = await context.UserBaselines
                .Where(ub => ub.UserId == userId)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (userBaseline == null)
            {
                return null;
            }

            // Get latest dog vitals from any of the user's dogs with established baselines
            var latestDogVitals = await (from dp in context.DogProfiles
                                       where dp.UserId == userId && dp.DogBaselineEstablished
                                       join dv in context.DogVitals on dp.Id equals dv.DogId
                                       orderby dv.TimestampUtc descending
                                       select dv).AsNoTracking()
                                       .FirstOrDefaultAsync();

            // Get dog baseline (from first established dog)
            var dogBaseline = await (from dp in context.DogProfiles
                                   where dp.UserId == userId && dp.DogBaselineEstablished
                                   join db in context.DogBaselines on dp.Id equals db.DogId
                                   select db).AsNoTracking()
                                   .FirstOrDefaultAsync();

            return new UserVitalsData
            {
                UserId = userId,
                CurrentHR = latestHumanVitals.HeartRate.GetValueOrDefault(0),
                CurrentHRV = latestHumanVitals.HRV.GetValueOrDefault(0),
                BaselineHR = userBaseline.AvgHeartRate ?? 0,
                BaselineHRV = userBaseline.AvgHRV ?? 0,
                DogCurrentHR = latestDogVitals?.HeartRate,
                DogBaselineHR = dogBaseline?.AvgHeartRate
            };
        }

        private StressCalculationResult CalculateStress(UserVitalsData vitals)
        {
            // Calculate stress percentages
            var hrvDropPercentage = vitals.BaselineHRV > 0 
                ? ((vitals.BaselineHRV - vitals.CurrentHRV) / vitals.BaselineHRV) * 100 
                : 0;

            var hrRisePercentage = vitals.BaselineHR > 0 
                ? ((vitals.CurrentHR - vitals.BaselineHR) / vitals.BaselineHR) * 100 
                : 0;

            // Stress condition: HRV Drop >= 20% OR HR Rise >= 15%
            var stressDetected = hrvDropPercentage >= 20 || hrRisePercentage >= 15;

            // Calculate deviation score for existing field
            var deviationScore = Math.Max(hrvDropPercentage / 20.0, hrRisePercentage / 15.0);

            return new StressCalculationResult
            {
                StressDetected = stressDetected,
                HRV_Drop_Percentage = hrvDropPercentage,
                HR_Rise_Percentage = hrRisePercentage,
                DeviationScore = deviationScore
            };
        }

        private async Task SaveStressEvent(AppDbContext context, Guid userId, UserVitalsData vitals, StressCalculationResult stressResult)
        {
            var stressEvent = new StressEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TimestampUtc = DateTime.UtcNow,
                HRAtEvent = (int)Math.Round(vitals.CurrentHR),
                HRVAtEvent = vitals.CurrentHRV,
                BaselineHR = vitals.BaselineHR,
                BaselineHRV = vitals.BaselineHRV,
                DeviationScore = stressResult.DeviationScore,
                AlertFired = true,
                OutcomeLogged = false,
                DogStateAtEvent = vitals.DogCurrentHR?.ToString("F1") ?? "N/A"
            };

            context.StressEvents.Add(stressEvent);
            await context.SaveChangesAsync();
        }

        // Data transfer objects for internal use
        private class UserVitalsData
        {
            public Guid UserId { get; set; }
            public double CurrentHR { get; set; }
            public double CurrentHRV { get; set; }
            public double BaselineHR { get; set; }
            public double BaselineHRV { get; set; }
            public double? DogCurrentHR { get; set; }
            public double? DogBaselineHR { get; set; }
        }

        private class StressCalculationResult
        {
            public bool StressDetected { get; set; }
            public double HRV_Drop_Percentage { get; set; }
            public double HR_Rise_Percentage { get; set; }
            public double DeviationScore { get; set; }
        }
    }
}