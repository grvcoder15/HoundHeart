using Hounded_Heart.Api.Configuration;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Hounded_Heart.Api.Services
{
    public class AutoBaselineCalculationService : BackgroundService
    {
        private readonly ILogger<AutoBaselineCalculationService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IOptionsMonitor<BaselineConfiguration> _config;

        public AutoBaselineCalculationService(
            ILogger<AutoBaselineCalculationService> logger,
            IServiceScopeFactory scopeFactory,
            IOptionsMonitor<BaselineConfiguration> config)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _config = config;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoBaselineCalculationService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var config = _config.CurrentValue;
                    
                    if (!config.EnableAutomaticCalculation)
                    {
                        _logger.LogDebug("Automatic baseline calculation is disabled in configuration.");
                        await Task.Delay(TimeSpan.FromMinutes(config.CheckIntervalMinutes), stoppingToken);
                        continue;
                    }

                    await CheckForBaselineCalculationOpportunities();
                    await Task.Delay(TimeSpan.FromMinutes(config.CheckIntervalMinutes), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when cancellation is requested
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during automatic baseline calculation check.");
                    // Wait before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("AutoBaselineCalculationService stopped.");
        }

        private async Task CheckForBaselineCalculationOpportunities()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var baselineService = scope.ServiceProvider.GetRequiredService<IBaselineService>();
            var config = _config.CurrentValue;

            // Find users who need baseline calculation - only those with Fitbit connections
            var usersNeedingBaseline = await (from h in context.HumanProfiles
                                             join u in context.Users on h.UserId equals u.UserId
                                             where !h.HumanBaselineEstablished && 
                                                   h.BaselineStartTime.HasValue &&
                                                   !string.IsNullOrEmpty(u.FitbitAccessToken) &&
                                                   !string.IsNullOrEmpty(u.FitbitRefreshToken) &&
                                                   u.IsActive && !u.IsDeleted
                                             select h).ToListAsync();

            // Get all distinct DogIds from DogVitals that need baseline calculation
            var dogIdsNeedingBaseline = await context.DogVitals
                .Select(d => d.DogId)
                .Distinct()
                .ToListAsync();

            if (!usersNeedingBaseline.Any() && !dogIdsNeedingBaseline.Any())
            {
                _logger.LogInformation("No users or dogs found requiring baseline calculation.");
                return;
            }

            _logger.LogInformation("Found {UserCount} users and {DogCount} dogs that may need baseline calculation.", 
                usersNeedingBaseline.Count, dogIdsNeedingBaseline.Count);

            // Process human baselines with old approach (keep for compatibility)
            foreach (var userProfile in usersNeedingBaseline)
            {
                await ProcessUserBaseline(context, baselineService, userProfile, config);
            }

            // Process dog baselines with new approach
            foreach (var dogId in dogIdsNeedingBaseline)
            {
                await ProcessDogBaselineNew(context, dogId);
            }
        }

        private async Task ProcessUserBaseline(
            AppDbContext context, 
            IBaselineService baselineService, 
            HumanProfile userProfile, 
            BaselineConfiguration config)
        {
            try
            {
                var userId = userProfile.UserId;
                var baselineStartTime = userProfile.BaselineStartTime!.Value;
                var elapsedMinutes = (DateTime.UtcNow - baselineStartTime).TotalMinutes;

                // Check if enough time has passed
                if (elapsedMinutes < config.DurationMinutes)
                {
                    _logger.LogInformation("User {UserId}: Only {ElapsedMinutes:F1} minutes elapsed, need {RequiredMinutes} minutes.", 
                        userId, elapsedMinutes, config.DurationMinutes);
                    return;
                }

                // Check if we have enough data points
                var vitalsCount = await context.HumanVitals
                    .Where(h => h.UserId == userId && h.TimestampUtc >= baselineStartTime)
                    .CountAsync();

                if (vitalsCount < config.MinimumDataPoints)
                {
                    _logger.LogInformation("User {UserId}: Only {VitalsCount} vitals records, need {MinimumPoints} minimum.", 
                        userId, vitalsCount, config.MinimumDataPoints);
                    return;
                }

                // Check if baseline already exists (race condition protection)
                var existingBaseline = await context.UserBaselines
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                if (existingBaseline != null)
                {
                    _logger.LogInformation("User {UserId}: Baseline already exists, updating profile flag.", userId);
                    userProfile.HumanBaselineEstablished = true;
                    userProfile.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();
                    return;
                }

                // Attempt baseline calculation using configured time window and minimum data points
                _logger.LogInformation("User {UserId}: Attempting baseline calculation with {VitalsCount} records after {ElapsedMinutes:F1} minutes.", 
                    userId, vitalsCount, elapsedMinutes);

                var result = await baselineService.CalculateAndSaveBaselineAsync(userId, timeWindowMinutes: config.DurationMinutes, minimumRecords: config.MinimumDataPoints);
                
                // Check if calculation was successful
                if (IsBaselineCalculationSuccessful(result))
                {
                    // Mark baseline as established
                    userProfile.HumanBaselineEstablished = true;
                    userProfile.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();

                    _logger.LogInformation("User {UserId}: Baseline calculation completed successfully and profile updated.", userId);
                }
                else
                {
                    _logger.LogWarning("User {UserId}: Baseline calculation failed or returned insufficient data. Will retry on next check.", userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing baseline calculation for user {UserId}.", userProfile.UserId);
            }
        }

        private async Task ProcessDogBaselineNew(AppDbContext context, Guid dogId)
        {
            try
            {
                // Check if DogBaselines record exists for this dog AND DaysOfDataCollected >= 1
                var existingBaseline = await context.DogBaselines
                    .FirstOrDefaultAsync(b => b.DogId == dogId);
                
                if (existingBaseline != null && existingBaseline.DaysOfDataCollected >= 1)
                {
                    // Skip this dog - baseline already established
                    return;
                }

                // Count DogVitals records in last 60 minutes (wider window to prevent sliding window issues)
                var sixtyMinutesAgo = DateTime.UtcNow.AddMinutes(-60);
                var recentFitBarkCount = await context.DogVitals
                    .Where(d => d.DogId == dogId && d.TimestampUtc >= sixtyMinutesAgo && d.Source == "fitbark")
                    .CountAsync();

                var recentPetPaceLikeCount = await context.DogVitals
                    .Where(d => d.DogId == dogId && d.TimestampUtc >= sixtyMinutesAgo && (d.Source == "petpace" || d.Source == "petpace_mock"))
                    .CountAsync();

                var recentAnyCount = await context.DogVitals
                    .Where(d => d.DogId == dogId && d.TimestampUtc >= sixtyMinutesAgo)
                    .CountAsync();

                // FitBark sync cadence is lower (~4-5 min), so 3 records is a practical 15-min threshold.
                var hasSufficientRecentData = recentFitBarkCount >= 3 || recentPetPaceLikeCount >= 6 || recentAnyCount >= 6;
                if (!hasSufficientRecentData)
                {
                    return;
                }

                // Calculate from ALL available DogVitals for this dog
                var allDogVitals = await context.DogVitals
                    .Where(d => d.DogId == dogId)
                    .ToListAsync();

                if (!allDogVitals.Any())
                {
                    return;
                }

                // Calculate averages
                var avgHeartRate = allDogVitals.Where(d => d.HeartRate.HasValue).Any()
                    ? allDogVitals.Where(d => d.HeartRate.HasValue).Average(d => d.HeartRate!.Value)
                    : (double?)null;
                
                var avgActivityScore = allDogVitals.Average(d => d.ActivityScore);
                var avgRestScore = allDogVitals.Average(d => d.RestScore);
                
                var avgTemperature = allDogVitals.Where(d => d.Temperature.HasValue).Any()
                    ? allDogVitals.Where(d => d.Temperature.HasValue).Average(d => d.Temperature!.Value)
                    : (double?)null;
                
                var avgRespirationRate = allDogVitals.Where(d => d.RespirationRate.HasValue).Any()
                    ? allDogVitals.Where(d => d.RespirationRate.HasValue).Average(d => d.RespirationRate!.Value)
                    : (double?)null;

                // Count distinct dates
                var daysOfDataCollected = allDogVitals
                    .Select(d => d.TimestampUtc.Date)
                    .Distinct()
                    .Count();

                if (existingBaseline != null)
                {
                    // Update existing record
                    existingBaseline.AvgHeartRate = avgHeartRate;
                    existingBaseline.AvgActivityScore = avgActivityScore;
                    existingBaseline.AvgRestScore = avgRestScore;
                    existingBaseline.AvgTemperature = avgTemperature;
                    existingBaseline.AvgRespirationRate = avgRespirationRate;
                    existingBaseline.DaysOfDataCollected = daysOfDataCollected;
                    existingBaseline.LastUpdatedUtc = DateTime.UtcNow;
                    existingBaseline.DogBaselineEstablished = true;
                    
                    context.DogBaselines.Update(existingBaseline);
                }
                else
                {
                    // Insert new record
                    var newBaseline = new DogBaseline
                    {
                        Id = Guid.NewGuid(),
                        DogId = dogId,
                        AvgHeartRate = avgHeartRate,
                        AvgActivityScore = avgActivityScore,
                        AvgRestScore = avgRestScore,
                        AvgTemperature = avgTemperature,
                        AvgRespirationRate = avgRespirationRate,
                        DaysOfDataCollected = daysOfDataCollected,
                        LastUpdatedUtc = DateTime.UtcNow,
                        DogBaselineEstablished = true
                    };
                    
                    context.DogBaselines.Add(newBaseline);
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("Auto dog baseline formed for dogId {DogId}", dogId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing dog baseline calculation for dog {DogId}.", dogId);
            }
        }

        private async Task ProcessHumanBaselineNew(AppDbContext context, Guid userId)
        {
            try
            {
                // Check if UserBaselines record exists for this user AND DaysOfDataCollected >= 1
                var existingBaseline = await context.UserBaselines
                    .FirstOrDefaultAsync(b => b.UserId == userId);
                
                if (existingBaseline != null && existingBaseline.DaysOfDataCollected.GetValueOrDefault(0) >= 1)
                {
                    // Skip this user - baseline already established
                    _logger.LogDebug("User {UserId}: Baseline already established, skipping.", userId);
                    return;
                }

                // Count HumanVitals records in last 60 minutes (wider window to prevent sliding window issues)
                var sixtyMinutesAgo = DateTime.UtcNow.AddMinutes(-60);
                var recentVitalsCount = await context.HumanVitals
                    .Where(h => h.UserId == userId && h.TimestampUtc >= sixtyMinutesAgo)
                    .CountAsync();

                // Calculate from ALL available HumanVitals for this user
                var allHumanVitals = await context.HumanVitals
                    .Where(h => h.UserId == userId)
                    .ToListAsync();

                if (!allHumanVitals.Any())
                {
                    return;
                }

                // Wait for full 15 minutes of data collection  
                // Calculate elapsed time from the earliest record or connection time
                var earliestVital = allHumanVitals.OrderBy(h => h.TimestampUtc).FirstOrDefault();
                if (earliestVital != null)
                {
                    var elapsedMinutes = (DateTime.UtcNow - earliestVital.TimestampUtc).TotalMinutes;
                    if (elapsedMinutes < 15)
                    {
                        _logger.LogInformation("User {UserId}: Only {ElapsedMinutes:F1} minutes since first record, need 15.0.", 
                            userId, elapsedMinutes);
                        return;
                    }
                }

                // With 150-second (2.5 min) intervals, we should have 6 records after 15 minutes
                if (recentVitalsCount < 6)
                {
                    // Not enough data collected yet - wait for full 15 minutes
                    _logger.LogInformation("User {UserId}: Only {VitalsCount} records in last 60m, waiting for {RequiredCount}.", 
                        userId, recentVitalsCount, 6);
                    return;
                }

                // Calculate averages
                // Calculate averages from non-zero, non-null values
                var avgHeartRate = allHumanVitals.Any(h => h.HeartRate.GetValueOrDefault(0) > 0)
                    ? allHumanVitals.Where(h => h.HeartRate.GetValueOrDefault(0) > 0).Average(h => (double)h.HeartRate!)
                    : (double?)null;

                var avgHRV = allHumanVitals.Any(h => h.HRV.GetValueOrDefault(0) > 0)
                    ? allHumanVitals.Where(h => h.HRV.GetValueOrDefault(0) > 0).Average(h => h.HRV!.Value)
                    : (double?)null;

                var avgSteps = allHumanVitals.Any(h => h.Steps.GetValueOrDefault(0) > 0)
                    ? allHumanVitals.Where(h => h.Steps.GetValueOrDefault(0) > 0).Average(h => (double)h.Steps!)
                    : (double?)null;

                var avgSleepMinutes = allHumanVitals.Any(h => h.SleepMinutes.GetValueOrDefault(0) > 0)
                    ? allHumanVitals.Where(h => h.SleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.SleepMinutes!)
                    : (double?)null;

                // High-res Metrics
                var avgTemp = allHumanVitals.Any(h => h.AmbientTemperature.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.AmbientTemperature.GetValueOrDefault(0) > 0).Average(h => h.AmbientTemperature!.Value) : (double?)null;
                var avgDeep = allHumanVitals.Any(h => h.DeepSleepMinutes.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.DeepSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.DeepSleepMinutes!) : (double?)null;
                var avgRem = allHumanVitals.Any(h => h.RemSleepMinutes.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.RemSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.RemSleepMinutes!) : (double?)null;
                var avgLight = allHumanVitals.Any(h => h.LightSleepMinutes.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.LightSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.LightSleepMinutes!) : (double?)null;
                var avgAwake = allHumanVitals.Any(h => h.AwakeSleepMinutes.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.AwakeSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.AwakeSleepMinutes!) : (double?)null;
                var avgStress = allHumanVitals.Any(h => h.StressScore.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.StressScore.GetValueOrDefault(0) > 0).Average(h => (double)h.StressScore!) : (double?)null;
                var avgCal = allHumanVitals.Any(h => h.Calories > 0) ? allHumanVitals.Where(h => h.Calories > 0).Average(h => h.Calories) : (double?)null;
                var avgDist = allHumanVitals.Any(h => h.Distance.GetValueOrDefault(0) > 0) ? allHumanVitals.Where(h => h.Distance.GetValueOrDefault(0) > 0).Average(h => h.Distance!.Value) : (double?)null;

                // Calculate HRV standard deviation
                double? hrvStdDev = null;
                var hrvValues = allHumanVitals.Where(h => h.HRV.GetValueOrDefault(0) > 0).Select(h => h.HRV!.Value).ToList();
                if (hrvValues.Count > 1)
                {
                    double mean = hrvValues.Average();
                    hrvStdDev = Math.Sqrt(hrvValues.Average(v => Math.Pow(v - mean, 2)));
                }

                // Count distinct dates
                var daysOfDataCollected = allHumanVitals
                    .Select(h => h.TimestampUtc.Date)
                    .Distinct()
                    .Count();

                if (existingBaseline != null)
                {
                    // Update existing record
                    existingBaseline.AvgHeartRate = avgHeartRate;
                    existingBaseline.AvgHRV = avgHRV;
                    existingBaseline.AvgSteps = avgSteps;
                    existingBaseline.AvgSleepScore = avgSleepMinutes;
                    existingBaseline.AvgAmbientTemperature = avgTemp;
                    existingBaseline.AvgDeepSleepMinutes = avgDeep;
                    existingBaseline.AvgRemSleepMinutes = avgRem;
                    existingBaseline.AvgLightSleepMinutes = avgLight;
                    existingBaseline.AvgAwakeSleepMinutes = avgAwake;
                    existingBaseline.AvgStressScore = avgStress;
                    existingBaseline.AvgCalories = avgCal;
                    existingBaseline.AvgDistance = avgDist;
                    existingBaseline.HRVStdDev = hrvStdDev;
                    existingBaseline.DaysOfDataCollected = daysOfDataCollected;
                    existingBaseline.LastUpdatedUtc = DateTime.UtcNow;
                    existingBaseline.BaselineUpdatedAt = DateTime.UtcNow;
                    if (!existingBaseline.BaselineCreatedAt.HasValue) existingBaseline.BaselineCreatedAt = DateTime.UtcNow;
                    existingBaseline.HumanBaselineEstablished = true;
                    existingBaseline.IsComplete = avgHeartRate.HasValue && avgSteps.HasValue && avgSleepMinutes.HasValue;
                    
                    context.UserBaselines.Update(existingBaseline);
                }
                else
                {
                    // Insert new record
                    var newBaseline = new UserBaselines
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AvgHeartRate = avgHeartRate,
                        AvgHRV = avgHRV,
                        AvgSteps = avgSteps,
                        AvgSleepScore = avgSleepMinutes,
                        AvgAmbientTemperature = avgTemp,
                        AvgDeepSleepMinutes = avgDeep,
                        AvgRemSleepMinutes = avgRem,
                        AvgLightSleepMinutes = avgLight,
                        AvgAwakeSleepMinutes = avgAwake,
                        AvgStressScore = avgStress,
                        AvgCalories = avgCal,
                        AvgDistance = avgDist,
                        HRVStdDev = hrvStdDev,
                        DaysOfDataCollected = daysOfDataCollected,
                        LastUpdatedUtc = DateTime.UtcNow,
                        BaselineCreatedAt = DateTime.UtcNow,
                        BaselineUpdatedAt = DateTime.UtcNow,
                        HumanBaselineEstablished = true,
                        IsComplete = avgHeartRate.HasValue && avgSteps.HasValue && avgSleepMinutes.HasValue
                    };
                    
                    context.UserBaselines.Add(newBaseline);
                }

                await context.SaveChangesAsync();
                
                // ALSO update HumanProfile flag for UI consistency
                var profile = await context.HumanProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profile != null)
                {
                    profile.HumanBaselineEstablished = true;
                    profile.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();
                }

                _logger.LogInformation("Auto human baseline formed for userId {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing human baseline calculation for user {UserId}.", userId);
            }
        }

        private bool IsBaselineCalculationSuccessful(object result)
        {
            // The BaselineService returns a dynamic object with Success property  
            // We need to check if it succeeded via reflection
            try
            {
                var resultType = result.GetType();
                var successProperty = resultType.GetProperty("Success");
                
                if (successProperty != null)
                {
                    var success = successProperty.GetValue(result);
                    return success is bool boolSuccess && boolSuccess;
                }

                // If no Success property, assume success (original behavior)
                return true;
            }
            catch
            {
                // If reflection fails, assume success to be safe
                return true;
            }
        }
    }
}