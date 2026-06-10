using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;

namespace Hounded_Heart.Api.Services
{
    public class AutoBaselineService : BackgroundService
    {
        private readonly ILogger<AutoBaselineService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public AutoBaselineService(ILogger<AutoBaselineService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("AutoBaselineService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessBaselineCalculations();
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when cancellation is requested
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during baseline calculation process.");
                    // Wait before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("AutoBaselineService stopped.");
        }

        private async Task ProcessBaselineCalculations()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Get users with connected Human Watch devices
            var userIds = await context.DeviceConnections
                .Where(d => d.DeviceType == "HumanWatch" 
                         && d.IsConnected == true)
                .Select(d => d.UserId)
                .Distinct()
                .ToListAsync();

            if (!userIds.Any())
            {
                _logger.LogDebug("No users with connected Human Watch found.");
            }
            else
            {
                _logger.LogInformation("Processing baselines for {Count} users with connected Human Watch", userIds.Count);

                foreach (var userId in userIds)
                {
                    await ProcessUserBaseline(context, userId);
                }
            }

            // Get dogs with connected PetPace collars
            var dogIds = await context.DeviceConnections
                .Where(d => d.DeviceType == "PetPace" 
                         && d.IsConnected == true
                         && d.DogId != null)
                .Select(d => d.DogId.Value)
                .Distinct()
                .ToListAsync();

            if (!dogIds.Any())
            {
                _logger.LogDebug("No dogs with connected PetPace collar found.");
            }
            else
            {
                _logger.LogInformation("Processing dog baselines for {Count} dogs with connected PetPace collar", dogIds.Count);

                foreach (var dogId in dogIds)
                {
                    await ProcessDogBaseline(context, dogId);
                }
            }

            // Get dogs with FitBark data for baseline processing
            var fitBarkDogIds = await context.DogVitals
                .Where(d => d.Source == "fitbark")
                .Select(d => d.DogId)
                .Distinct()
                .ToListAsync();

            if (!fitBarkDogIds.Any())
            {
                _logger.LogDebug("No dogs with FitBark data found.");
            }
            else
            {
                _logger.LogInformation("Processing FitBark baselines for {Count} dogs with FitBark data", fitBarkDogIds.Count);

                foreach (var dogId in fitBarkDogIds)
                {
                    await ProcessFitBarkDogBaseline(context, dogId);
                }
            }
        }

        private async Task ProcessUserBaseline(AppDbContext context, Guid userId)
        {
            try
            {
                // Check if UserBaselines record exists for this user AND DaysOfDataCollected >= 1
                var existingBaseline = await context.UserBaselines
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                if (existingBaseline != null && existingBaseline.DaysOfDataCollected.GetValueOrDefault(0) >= 1)
                {
                    // Baseline already formed, skip this user
                    return;
                }

                // Count how many HumanVitals records exist for this user in the last 15 minutes
                // Count HumanVitals records in last 60 minutes (wider window to prevent sliding window issues)
                var sixtyMinutesAgo = DateTime.UtcNow.AddMinutes(-60);
                var recentVitalsCount = await context.HumanVitals
                    .Where(h => h.UserId == userId && h.TimestampUtc >= sixtyMinutesAgo)
                    .CountAsync();

                if (recentVitalsCount < 6)
                {
                    // Not enough recent data to trigger baseline calculation
                    return;
                }

                // Calculate baseline from ALL available HumanVitals records for this user
                var allUserVitals = await context.HumanVitals
                    .Where(h => h.UserId == userId)
                    .ToListAsync();

                if (!allUserVitals.Any())
                {
                    return;
                }

                // Calculate averages from non-zero, non-null values
                var avgHeartRate = allUserVitals.Any(h => h.HeartRate.GetValueOrDefault(0) > 0)
                    ? allUserVitals.Where(h => h.HeartRate.GetValueOrDefault(0) > 0).Average(h => (double)h.HeartRate!)
                    : (double?)null;

                var avgHRV = allUserVitals.Any(h => h.HRV.GetValueOrDefault(0) > 0)
                    ? allUserVitals.Where(h => h.HRV.GetValueOrDefault(0) > 0).Average(h => h.HRV!.Value)
                    : (double?)null;

                var avgSteps = allUserVitals.Any(h => h.Steps.GetValueOrDefault(0) > 0)
                    ? allUserVitals.Where(h => h.Steps.GetValueOrDefault(0) > 0).Average(h => (double)h.Steps!)
                    : (double?)null;

                var avgSleepMinutes = allUserVitals.Any(h => h.SleepMinutes.GetValueOrDefault(0) > 0)
                    ? allUserVitals.Where(h => h.SleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.SleepMinutes!)
                    : (double?)null;

                // High-res Metrics
                var avgTemp = allUserVitals.Any(h => h.AmbientTemperature.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.AmbientTemperature.GetValueOrDefault(0) > 0).Average(h => h.AmbientTemperature!.Value) : (double?)null;
                var avgDeep = allUserVitals.Any(h => h.DeepSleepMinutes.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.DeepSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.DeepSleepMinutes!) : (double?)null;
                var avgRem = allUserVitals.Any(h => h.RemSleepMinutes.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.RemSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.RemSleepMinutes!) : (double?)null;
                var avgLight = allUserVitals.Any(h => h.LightSleepMinutes.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.LightSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.LightSleepMinutes!) : (double?)null;
                var avgAwake = allUserVitals.Any(h => h.AwakeSleepMinutes.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.AwakeSleepMinutes.GetValueOrDefault(0) > 0).Average(h => (double)h.AwakeSleepMinutes!) : (double?)null;
                var avgStress = allUserVitals.Any(h => h.StressScore.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.StressScore.GetValueOrDefault(0) > 0).Average(h => (double)h.StressScore!) : (double?)null;
                var avgCal = allUserVitals.Any(h => h.Calories > 0) ? allUserVitals.Where(h => h.Calories > 0).Average(h => h.Calories) : (double?)null;
                var avgDist = allUserVitals.Any(h => h.Distance.GetValueOrDefault(0) > 0) ? allUserVitals.Where(h => h.Distance.GetValueOrDefault(0) > 0).Average(h => h.Distance!.Value) : (double?)null;

                // Calculate HRV standard deviation
                double? hrvStdDev = null;
                var hrvValues = allUserVitals.Where(h => h.HRV.GetValueOrDefault(0) > 0).Select(h => h.HRV!.Value).ToList();
                if (hrvValues.Count > 1)
                {
                    double mean = hrvValues.Average();
                    hrvStdDev = Math.Sqrt(hrvValues.Average(v => Math.Pow(v - mean, 2)));
                }

                // Count distinct dates
                var daysOfDataCollected = allUserVitals
                    .Select(h => h.TimestampUtc.Date)
                    .Distinct()
                    .Count();

                var hasCompleteHumanBaseline = avgHeartRate.HasValue && avgSteps.HasValue && avgSleepMinutes.HasValue;

                if (existingBaseline != null)
                {
                    // Update existing record
                    existingBaseline.AvgHeartRate = avgHeartRate;
                    existingBaseline.AvgHRV = avgHRV;
                    existingBaseline.HRVStdDev = hrvStdDev;
                    existingBaseline.AvgSleepScore = avgSleepMinutes;
                    existingBaseline.AvgSteps = avgSteps;
                    existingBaseline.AvgAmbientTemperature = avgTemp;
                    existingBaseline.AvgDeepSleepMinutes = avgDeep;
                    existingBaseline.AvgRemSleepMinutes = avgRem;
                    existingBaseline.AvgLightSleepMinutes = avgLight;
                    existingBaseline.AvgAwakeSleepMinutes = avgAwake;
                    existingBaseline.AvgStressScore = avgStress;
                    existingBaseline.AvgCalories = avgCal;
                    existingBaseline.AvgDistance = avgDist;
                    existingBaseline.DaysOfDataCollected = daysOfDataCollected;
                    existingBaseline.LastUpdatedUtc = DateTime.UtcNow;
                    existingBaseline.BaselineUpdatedAt = DateTime.UtcNow;
                    if (!existingBaseline.BaselineCreatedAt.HasValue) existingBaseline.BaselineCreatedAt = DateTime.UtcNow;
                    existingBaseline.HumanBaselineEstablished = hasCompleteHumanBaseline;
                    existingBaseline.IsComplete = hasCompleteHumanBaseline;

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
                        HRVStdDev = hrvStdDev,
                        AvgSleepScore = avgSleepMinutes,
                        AvgSteps = avgSteps,
                        AvgAmbientTemperature = avgTemp,
                        AvgDeepSleepMinutes = avgDeep,
                        AvgRemSleepMinutes = avgRem,
                        AvgLightSleepMinutes = avgLight,
                        AvgAwakeSleepMinutes = avgAwake,
                        AvgStressScore = avgStress,
                        AvgCalories = avgCal,
                        AvgDistance = avgDist,
                        DaysOfDataCollected = daysOfDataCollected,
                        LastUpdatedUtc = DateTime.UtcNow,
                        BaselineCreatedAt = DateTime.UtcNow,
                        BaselineUpdatedAt = DateTime.UtcNow,
                        HumanBaselineEstablished = hasCompleteHumanBaseline,
                        IsComplete = hasCompleteHumanBaseline
                    };

                    context.UserBaselines.Add(newBaseline);
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("Auto baseline formed for userId {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing baseline calculation for user {UserId}.", userId);
            }
        }

        private async Task ProcessDogBaseline(AppDbContext context, Guid dogId)
        {
            try
            {
                // Check if DogBaseline record exists for this dog AND DogBaselineEstablished is true
                var existingBaseline = await context.DogBaselines
                    .FirstOrDefaultAsync(b => b.DogId == dogId);

                if (existingBaseline != null && existingBaseline.DogBaselineEstablished)
                {
                    // Baseline already established, skip this dog
                    return;
                }

                // Count how many DogVitals records exist for this dog in the last 15 minutes
                // Count DogVitals records in last 60 minutes (wider window to prevent sliding window issues)
                var sixtyMinutesAgo = DateTime.UtcNow.AddMinutes(-60);
                var recentVitalsCount = await context.DogVitals
                    .Where(d => d.DogId == dogId && d.TimestampUtc >= sixtyMinutesAgo  && (d.Source == "petpace_mock" || d.Source == "petpace"))
                    .CountAsync();

                if (recentVitalsCount < 6)
                {
                    // Not enough recent data to trigger baseline calculation
                    return;
                }

                // Calculate baseline from ALL available DogVitals records for this dog (PetPace sources only)
                var allDogVitals = await context.DogVitals
                    .Where(d => d.DogId == dogId && (d.Source == "petpace_mock" || d.Source == "petpace"))
                    .ToListAsync();

                if (!allDogVitals.Any())
                {
                    return;
                }

                // Calculate averages with null-safe handling
                var avgHeartRate = allDogVitals.Any(d => d.HeartRate.HasValue)
                    ? allDogVitals.Where(d => d.HeartRate.HasValue).Average(d => d.HeartRate!.Value)
                    : (double?)null;

                var avgActivityScore = allDogVitals.Average(d => d.ActivityScore);

                var avgTemperature = allDogVitals.Any(d => d.Temperature.HasValue)
                    ? allDogVitals.Where(d => d.Temperature.HasValue).Average(d => d.Temperature!.Value)
                    : (double?)null;

                var avgRestScore = allDogVitals.Average(d => d.RestScore);

                var avgRespirationRate = allDogVitals.Any(d => d.RespirationRate.HasValue)
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
                    existingBaseline.AvgTemperature = avgTemperature;
                    existingBaseline.AvgRestScore = avgRestScore;
                    existingBaseline.AvgRespirationRate = avgRespirationRate;
                    existingBaseline.DaysOfDataCollected = daysOfDataCollected;
                    existingBaseline.LastUpdatedUtc = DateTime.UtcNow;
                    existingBaseline.DogBaselineEstablished = daysOfDataCollected >= 1;

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
                        AvgTemperature = avgTemperature,
                        AvgRestScore = avgRestScore,
                        AvgRespirationRate = avgRespirationRate,
                        DaysOfDataCollected = daysOfDataCollected,
                        LastUpdatedUtc = DateTime.UtcNow,
                        DogBaselineEstablished = daysOfDataCollected >= 1
                    };

                    context.DogBaselines.Add(newBaseline);
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("Auto baseline formed for dogId {DogId}", dogId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing baseline calculation for dog {DogId}.", dogId);
            }
        }

        private async Task ProcessFitBarkDogBaseline(AppDbContext context, Guid dogId)
        {
            try
            {
                var existingBaseline = await context.DogBaselines
                    .FirstOrDefaultAsync(b => b.DogId == dogId);

                // Load vitals once — used by both phases
                var fitbarkVitals = await context.DogVitals
                    .Where(d => d.DogId == dogId && d.Source == "fitbark")
                    .OrderBy(d => d.TimestampUtc)
                    .ToListAsync();

                if (!fitbarkVitals.Any())
                    return;

                // ── PHASE 1: Initial baseline (runs ONCE — triggers at 3+ records ≈ 15 min) ──
                if (existingBaseline == null || !existingBaseline.DogBaselineEstablished)
                {
                    // Need at least 3 records (sync every 4-5 min → ~15 min of data)
                    if (fitbarkVitals.Count < 3)
                    {
                        _logger.LogDebug("FitBark Phase 1 pending for dogId {DogId}: {Count}/3 records", dogId, fitbarkVitals.Count);
                        return;
                    }

                    // Average ALL available records for initial baseline
                    var avgActivityScore = fitbarkVitals.Any(v => v.ActivityValue.HasValue)
                        ? fitbarkVitals.Where(v => v.ActivityValue.HasValue).Average(v => (double)v.ActivityValue!.Value)
                        : 0.0;

                    var avgRestScore = fitbarkVitals.Any(v => v.MinRest.HasValue)
                        ? fitbarkVitals.Where(v => v.MinRest.HasValue).Average(v => (double)v.MinRest!.Value)
                        : 0.0;

                    var avgHeartRate = fitbarkVitals.Any(v => v.HeartRate.HasValue)
                        ? fitbarkVitals.Where(v => v.HeartRate.HasValue).Average(v => (double)v.HeartRate!.Value)
                        : (double?)null;

                    var avgTemperature = fitbarkVitals.Any(v => v.Temperature.HasValue)
                        ? fitbarkVitals.Where(v => v.Temperature.HasValue).Average(v => v.Temperature!.Value)
                        : (double?)null;

                    var avgRespirationRate = fitbarkVitals.Any(v => v.RespirationRate.HasValue)
                        ? fitbarkVitals.Where(v => v.RespirationRate.HasValue).Average(v => v.RespirationRate!.Value)
                        : (double?)null;

                    var days = fitbarkVitals.Select(d => d.TimestampUtc.Date).Distinct().Count();

                    if (existingBaseline != null)
                    {
                        existingBaseline.AvgActivityScore   = avgActivityScore;
                        existingBaseline.AvgRestScore        = avgRestScore;
                        existingBaseline.AvgHeartRate        = avgHeartRate;
                        existingBaseline.AvgTemperature      = avgTemperature;
                        existingBaseline.AvgRespirationRate  = avgRespirationRate;
                        existingBaseline.DaysOfDataCollected = days;
                        existingBaseline.LastUpdatedUtc      = DateTime.UtcNow;
                        existingBaseline.DogBaselineEstablished = true;
                        context.DogBaselines.Update(existingBaseline);
                    }
                    else
                    {
                        context.DogBaselines.Add(new DogBaseline
                        {
                            Id                      = Guid.NewGuid(),
                            DogId                   = dogId,
                            AvgActivityScore        = avgActivityScore,
                            AvgRestScore            = avgRestScore,
                            AvgHeartRate            = avgHeartRate,
                            AvgTemperature          = avgTemperature,
                            AvgRespirationRate      = avgRespirationRate,
                            DaysOfDataCollected     = days,
                            LastUpdatedUtc          = DateTime.UtcNow,
                            DogBaselineEstablished  = true
                        });
                    }

                    await context.SaveChangesAsync();
                    _logger.LogInformation(
                        "📊 Phase 1 FitBark baseline formed for dogId {DogId} using {Count} records",
                        dogId, fitbarkVitals.Count);
                    return;
                }

                // ── PHASE 2: Rolling average — last 10 records, runs every 5-min tick ──
                var last10 = fitbarkVitals
                    .OrderByDescending(d => d.TimestampUtc)
                    .Take(10)
                    .ToList();

                existingBaseline.AvgActivityScore = last10.Any(v => v.ActivityValue.HasValue)
                    ? last10.Where(v => v.ActivityValue.HasValue).Average(v => (double)v.ActivityValue!.Value)
                    : existingBaseline.AvgActivityScore;

                existingBaseline.AvgRestScore = last10.Any(v => v.MinRest.HasValue)
                    ? last10.Where(v => v.MinRest.HasValue).Average(v => (double)v.MinRest!.Value)
                    : existingBaseline.AvgRestScore;

                existingBaseline.AvgHeartRate = last10.Any(v => v.HeartRate.HasValue)
                    ? last10.Where(v => v.HeartRate.HasValue).Average(v => (double)v.HeartRate!.Value)
                    : existingBaseline.AvgHeartRate;

                existingBaseline.AvgTemperature = last10.Any(v => v.Temperature.HasValue)
                    ? last10.Where(v => v.Temperature.HasValue).Average(v => v.Temperature!.Value)
                    : existingBaseline.AvgTemperature;

                existingBaseline.AvgRespirationRate = last10.Any(v => v.RespirationRate.HasValue)
                    ? last10.Where(v => v.RespirationRate.HasValue).Average(v => v.RespirationRate!.Value)
                    : existingBaseline.AvgRespirationRate;

                existingBaseline.DaysOfDataCollected = fitbarkVitals.Select(d => d.TimestampUtc.Date).Distinct().Count();
                existingBaseline.LastUpdatedUtc      = DateTime.UtcNow;

                context.DogBaselines.Update(existingBaseline);
                await context.SaveChangesAsync();
                _logger.LogInformation(
                    "🔄 Phase 2 FitBark rolling baseline updated for dogId {DogId} (last {Count} records)",
                    dogId, last10.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing FitBark baseline calculation for dog {DogId}.", dogId);
            }
        }
    }
}