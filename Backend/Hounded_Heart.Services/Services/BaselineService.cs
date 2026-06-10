using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Hounded_Heart.Models.DTOs;

namespace Hounded_Heart.Services.Services
{
    public interface IBaselineService
    {
        Task<bool> CalculateAndSaveUserBaselineAsync(Guid userId);
        Task<object> CalculateAndSaveBaselineAsync(Guid userId, int timeWindowMinutes = 15, int minimumRecords = 6, bool testMode = false);
        Task<BaselineProgress> GetBaselineProgressAsync(Guid userId, Guid dogId);
        Task<object> GetBaselineHistoryAsync(Guid userId, Guid dogId);
        Task<UserBaselines> GetBaseline(Guid userId);
        Task<bool> ResetBaselineAsync(Guid userId);
    }

    public class BaselineProgress
    {
        public double PercentComplete { get; set; }
        public int DaysRemaining { get; set; }
    }

    public class BaselineService : IBaselineService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BaselineService> _logger;

        public BaselineService(AppDbContext context, ILogger<BaselineService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> CalculateAndSaveUserBaselineAsync(Guid userId)
        {
            var result = await CalculateAndSaveBaselineAsync(userId);
            try
            {
                var successProperty = result.GetType().GetProperty("Success");
                return successProperty?.GetValue(result) is bool success && success;
            }
            catch
            {
                return false;
            }
        }

        // Simple flow: pull HumanVitals from the last timeWindowMinutes, average the core fields,
        // save to UserBaselines. No extra columns.
        public async Task<object> CalculateAndSaveBaselineAsync(Guid userId, int timeWindowMinutes = 15, int minimumRecords = 6, bool testMode = false)
        {
            try
            {
                _logger.LogInformation("[Baseline] Calculating baseline for user {UserId}", userId);

                var profile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
                DateTime windowStart;
                DateTime windowEnd;

                if (profile?.BaselineStartTime != null)
                {
                    windowStart = profile.BaselineStartTime.Value;
                    windowEnd = windowStart.AddMinutes(timeWindowMinutes);
                }
                else
                {
                    // Recovery path for migrated/legacy users where BaselineStartTime was never initialized.
                    var latestVitalsTimestamp = await _context.HumanVitals
                        .Where(v => v.UserId == userId)
                        .OrderByDescending(v => v.TimestampUtc)
                        .Select(v => (DateTime?)v.TimestampUtc)
                        .FirstOrDefaultAsync();

                    if (!latestVitalsTimestamp.HasValue)
                    {
                        _logger.LogInformation("[Baseline] Skipped for user {UserId}: no vitals found and BaselineStartTime missing", userId);
                        return new
                        {
                            Success = false,
                            Error = "No vitals found for baseline"
                        };
                    }

                    windowEnd = latestVitalsTimestamp.Value;
                    windowStart = windowEnd.AddMinutes(-timeWindowMinutes);

                    if (profile != null)
                    {
                        profile.BaselineStartTime = windowStart;
                        profile.UpdatedAt = DateTime.UtcNow;
                    }

                    _logger.LogWarning(
                        "[Baseline] BaselineStartTime missing for user {UserId}; using fallback window {WindowStart} to {WindowEnd}",
                        userId,
                        windowStart,
                        windowEnd);
                }

                _logger.LogInformation(
                    "[Baseline] Using fixed collection window for user {UserId}: {WindowStart} to {WindowEnd}",
                    userId,
                    windowStart,
                    windowEnd);

                var vitals = await _context.HumanVitals
                    .Where(v => v.UserId == userId && v.TimestampUtc >= windowStart && v.TimestampUtc <= windowEnd)
                    .ToListAsync();

                _logger.LogInformation("[Baseline] {Count} records found for user {UserId}", vitals.Count, userId);

                if (vitals.Count < minimumRecords && testMode)
                {
                    // In test mode, allow latest-N fallback to avoid being blocked by stale/misaligned start window.
                    vitals = await _context.HumanVitals
                        .Where(v => v.UserId == userId)
                        .OrderByDescending(v => v.TimestampUtc)
                        .Take(minimumRecords)
                        .ToListAsync();

                    _logger.LogInformation("[Baseline] Test-mode fallback selected latest {Count} records for user {UserId}", vitals.Count, userId);
                }

                if (vitals.Count < minimumRecords)
                {
                    _logger.LogInformation(
                        "[Baseline] Skipped for user {UserId}: {Count}/{Minimum} records in fixed window {WindowStart} to {WindowEnd}",
                        userId,
                        vitals.Count,
                        minimumRecords,
                        windowStart,
                        windowEnd);

                    return new
                    {
                        Success = false,
                        Error = "Insufficient records for baseline",
                        Required = minimumRecords,
                        Found = vitals.Count
                    };
                }

                // Core averages — only non-zero, non-null values count (Requirement FIX 2, FIX 3, FIX 4)
                double? avgHR    = vitals.Any(v => v.HeartRate.GetValueOrDefault(0) > 0)
                                 ? vitals.Where(v => v.HeartRate.GetValueOrDefault(0) > 0).Average(v => (double)v.HeartRate!)
                                 : (double?)null;

                double? avgHRV   = vitals.Any(v => v.HRV.GetValueOrDefault(0) > 0)
                                 ? vitals.Where(v => v.HRV.GetValueOrDefault(0) > 0).Average(v => v.HRV!.Value)
                                 : (double?)null;

                double? avgSteps = vitals.Any(v => v.Steps.GetValueOrDefault(0) > 0)
                                 ? vitals.Where(v => v.Steps.GetValueOrDefault(0) > 0).Average(v => (double)v.Steps!)
                                 : (double?)null;

                double? avgSleep = vitals.Any(v => v.SleepMinutes.GetValueOrDefault(0) > 0)
                                 ? vitals.Where(v => v.SleepMinutes.GetValueOrDefault(0) > 0).Average(v => (double)v.SleepMinutes!)
                                 : (double?)null;

                double? avgTemp  = vitals.Any(v => v.AmbientTemperature.GetValueOrDefault(0) > 0)
                                 ? vitals.Where(v => v.AmbientTemperature.GetValueOrDefault(0) > 0).Average(v => v.AmbientTemperature!.Value)
                                 : (double?)null;

                // High-resolution averages
                double? avgDeep  = vitals.Any(v => v.DeepSleepMinutes.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.DeepSleepMinutes.GetValueOrDefault(0) > 0).Average(v => (double)v.DeepSleepMinutes!) : (double?)null;
                double? avgRem   = vitals.Any(v => v.RemSleepMinutes.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.RemSleepMinutes.GetValueOrDefault(0) > 0).Average(v => (double)v.RemSleepMinutes!) : (double?)null;
                double? avgLight = vitals.Any(v => v.LightSleepMinutes.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.LightSleepMinutes.GetValueOrDefault(0) > 0).Average(v => (double)v.LightSleepMinutes!) : (double?)null;
                double? avgAwake = vitals.Any(v => v.AwakeSleepMinutes.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.AwakeSleepMinutes.GetValueOrDefault(0) > 0).Average(v => (double)v.AwakeSleepMinutes!) : (double?)null;
                double? avgStress = vitals.Any(v => v.StressScore.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.StressScore.GetValueOrDefault(0) > 0).Average(v => (double)v.StressScore!) : (double?)null;
                double? avgCal   = vitals.Any(v => v.Calories > 0) ? vitals.Where(v => v.Calories > 0).Average(v => v.Calories) : (double?)null;
                double? avgDist  = vitals.Any(v => v.Distance.GetValueOrDefault(0) > 0) ? vitals.Where(v => v.Distance.GetValueOrDefault(0) > 0).Average(v => v.Distance!.Value) : (double?)null;

                // HRV standard deviation (used for stress sensitivity)
                double? hrvStdDev = null;
                if (avgHRV.HasValue)
                {
                    var hrvValues = vitals.Where(v => v.HRV.GetValueOrDefault(0) > 0).Select(v => v.HRV!.Value).ToList();
                    if (hrvValues.Count > 1)
                    {
                        double mean = hrvValues.Average();
                        double variance = hrvValues.Average(v => Math.Pow(v - mean, 2));
                        hrvStdDev = Math.Sqrt(variance);
                    }
                }

                // Find or create the baseline record
                var baseline = await _context.UserBaselines.FirstOrDefaultAsync(b => b.UserId == userId);
                if (baseline == null)
                {
                    _logger.LogInformation("[Baseline] Creating new baseline for user {UserId}", userId);
                    baseline = new UserBaselines
                    {
                        Id     = Guid.NewGuid(),
                        UserId = userId
                    };
                    _context.UserBaselines.Add(baseline);
                }
                else
                {
                    _logger.LogInformation("[Baseline] Updating existing baseline for user {UserId}", userId);
                }

                baseline.AvgHeartRate  = avgHR;
                baseline.AvgHRV        = avgHRV;
                baseline.HRVStdDev     = hrvStdDev;
                baseline.AvgSteps      = avgSteps;
                baseline.AvgSleepScore = avgSleep; // Stores Avg Sleep Minutes (FIX 3)
                baseline.AvgAmbientTemperature = avgTemp; // FIX 4

                // New High-res fields
                baseline.AvgDeepSleepMinutes = avgDeep;
                baseline.AvgRemSleepMinutes = avgRem;
                baseline.AvgLightSleepMinutes = avgLight;
                baseline.AvgAwakeSleepMinutes = avgAwake;
                baseline.AvgStressScore = avgStress;
                baseline.AvgCalories = avgCal;
                baseline.AvgDistance = avgDist;

                baseline.LastUpdatedUtc            = DateTime.UtcNow;
                baseline.BaselineUpdatedAt         = DateTime.UtcNow;
                if (!baseline.BaselineCreatedAt.HasValue) baseline.BaselineCreatedAt = DateTime.UtcNow;

                baseline.DaysOfDataCollected       = vitals.Select(v => v.TimestampUtc.Date).Distinct().Count();
                baseline.HumanBaselineEstablished  = true;
                baseline.IsTestMode                = testMode;
                baseline.IsComplete                = avgHR.HasValue && avgSteps.HasValue && avgSleep.HasValue;

                if (profile != null)
                {
                    profile.HumanBaselineEstablished = true;
                    profile.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("[Baseline] Saved for user {UserId}. HR={HR}, HRV={HRV}, Steps={Steps}, Sleep={Sleep}",
                    userId, avgHR, avgHRV, avgSteps, avgSleep);

                return new { Success = true, Baseline = baseline };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Baseline] Failed for user {UserId}", userId);
                return new { Success = false, Error = ex.Message };
            }
        }

        public async Task<BaselineProgress> GetBaselineProgressAsync(Guid userId, Guid dogId)
        {
            var baseline = await _context.UserBaselines.FirstOrDefaultAsync(b => b.UserId == userId);
            if (baseline == null) return new BaselineProgress { PercentComplete = 0, DaysRemaining = 7 };

            int collected = baseline.DaysOfDataCollected.GetValueOrDefault(0);
            return new BaselineProgress
            {
                PercentComplete = Math.Min(100, (double)collected / 7.0 * 100.0),
                DaysRemaining   = Math.Max(0, 7 - collected)
            };
        }

        public async Task<object> GetBaselineHistoryAsync(Guid userId, Guid dogId)
        {
            var baseline = await GetBaseline(userId);
            return new { Current = baseline, History = new object[] { } };
        }

        public async Task<UserBaselines> GetBaseline(Guid userId)
        {
            return await _context.UserBaselines.FirstOrDefaultAsync(b => b.UserId == userId);
        }

        public async Task<bool> ResetBaselineAsync(Guid userId)
        {
            var baseline = await _context.UserBaselines.FirstOrDefaultAsync(b => b.UserId == userId);
            var profile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == userId);

            if (baseline == null && profile == null) return false;

            if (baseline != null)
            {
                _context.UserBaselines.Remove(baseline);
            }

            if (profile != null)
            {
                profile.BaselineStartTime = null;
                profile.HumanBaselineEstablished = false;
                profile.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

    }
}
