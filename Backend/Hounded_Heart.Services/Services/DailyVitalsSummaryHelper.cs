using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class DailyVitalsSummaryHelper : IDailyVitalsSummaryService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DailyVitalsSummaryHelper> _logger;

        public DailyVitalsSummaryHelper(
            AppDbContext context,
            ILogger<DailyVitalsSummaryHelper> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> GenerateDailySummaryAsync(DateTime targetDate, bool isTestMode = false, int testIntervalMinutes = 60)
        {
            _logger.LogInformation($"📊 [DailySummary] Starting daily vitals summary generation for {targetDate:yyyy-MM-dd}");

            try
            {
                // Determine data time window
                DateTime startTime, endTime;

                if (isTestMode)
                {
                    // Test mode: last N minutes
                    endTime = DateTime.UtcNow;
                    startTime = endTime.AddMinutes(-testIntervalMinutes);
                    _logger.LogInformation($"📊 [DailySummary] TEST MODE: Processing data from {startTime:yyyy-MM-dd HH:mm:ss} to {endTime:yyyy-MM-dd HH:mm:ss} UTC ({testIntervalMinutes} minutes window)");
                }
                else
                {
                    // Production mode: full day
                    startTime = targetDate.Date;
                    endTime = startTime.AddDays(1);
                    _logger.LogInformation($"📊 [DailySummary] PRODUCTION MODE: Processing full day from {startTime:yyyy-MM-dd} to {endTime:yyyy-MM-dd} UTC");
                }

                // Get all distinct UserIds with data in the time window
                var userIds = await _context.HumanVitals
                    .Where(h => h.TimestampUtc >= startTime && h.TimestampUtc < endTime)
                    .Select(h => h.UserId)
                    .Distinct()
                    .ToListAsync();

                _logger.LogInformation($"📊 [DailySummary] Found {userIds.Count} users with data in the specified time window");

                int processedCount = 0;
                int skippedCount = 0;

                foreach (var userId in userIds)
                {
                    // Fetch all HumanVitals records in the time window
                    var vitalsData = await _context.HumanVitals
                        .Where(h => h.UserId == userId && h.TimestampUtc >= startTime && h.TimestampUtc < endTime)
                        .ToListAsync();

                    if (vitalsData.Count == 0)
                    {
                        skippedCount++;
                        continue;
                    }

                    // Calculate averages with null/zero checks (same logic as before)
                    var avgHeartRate = vitalsData
                        .Where(h => h.HeartRate.HasValue && h.HeartRate.Value > 0)
                        .Average(h => (double?)h.HeartRate);

                    var avgHRV = vitalsData
                        .Where(h => h.HRV.HasValue && h.HRV.Value > 0)
                        .Average(h => (double?)h.HRV);

                    var totalSteps = vitalsData
                        .Where(h => h.Steps.HasValue && h.Steps.Value > 0)
                        .Max(h => (int?)h.Steps) ?? 0;

                    var avgCalories = vitalsData
                        .Where(h => h.Calories > 0)
                        .Average(h => (double?)h.Calories);

                    var avgDistance = vitalsData
                        .Where(h => h.Distance.HasValue && h.Distance.Value > 0)
                        .Average(h => (double?)h.Distance);

                    var avgActiveMinutes = vitalsData
                        .Where(h => h.ActiveMinutes.HasValue && h.ActiveMinutes.Value > 0)
                        .Average(h => (double?)h.ActiveMinutes);

                    var avgSleepMinutes = vitalsData
                        .Where(h => h.SleepMinutes.HasValue && h.SleepMinutes.Value > 0)
                        .Average(h => (double?)h.SleepMinutes);

                    var avgStressScore = vitalsData
                        .Where(h => h.StressScore.HasValue && h.StressScore.Value > 0)
                        .Average(h => (double?)h.StressScore);

                    var avgAmbientTemperature = vitalsData
                        .Where(h => h.AmbientTemperature.HasValue && h.AmbientTemperature.Value > 0)
                        .Average(h => (double?)h.AmbientTemperature);

                    // Check if all aggregated values are null (skip if no valid data)
                    if (avgHeartRate == null && avgHRV == null && avgCalories == null &&
                        avgDistance == null && avgActiveMinutes == null && avgSleepMinutes == null &&
                        avgStressScore == null && avgAmbientTemperature == null && totalSteps == 0)
                    {
                        _logger.LogInformation($"⏭️  [DailySummary] Skipped UserId: {userId} for date: {targetDate:yyyy-MM-dd} - no valid data");
                        skippedCount++;
                        continue;
                    }

                    // Fetch SyncScore for this user for the target date
                    var syncScoreRecord = await _context.SyncScoreRecords
                        .Where(s => s.UserId == userId && s.CalculatedAt.Date == targetDate.Date)
                        .OrderByDescending(s => s.CalculatedAt)
                        .FirstOrDefaultAsync();

                    int? syncScore = syncScoreRecord?.Score;
                    string? syncTrend = syncScoreRecord?.Trend;

                    // Check for existing record with targetDate
                    var existingSummary = await _context.HumanDailySummaries
                        .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == targetDate.Date);

                    if (existingSummary != null)
                    {
                        // UPDATE existing record
                        existingSummary.AvgHeartRate = avgHeartRate;
                        existingSummary.AvgHRV = avgHRV;
                        existingSummary.TotalSteps = totalSteps > 0 ? totalSteps : null;
                        existingSummary.AvgCalories = avgCalories;
                        existingSummary.AvgDistance = avgDistance;
                        existingSummary.AvgActiveMinutes = avgActiveMinutes;
                        existingSummary.AvgSleepMinutes = avgSleepMinutes;
                        existingSummary.AvgStressScore = avgStressScore;
                        existingSummary.AvgAmbientTemperature = avgAmbientTemperature;
                        existingSummary.SyncScore = syncScore;
                        existingSummary.SyncTrend = syncTrend;
                        existingSummary.DataPointsCount = vitalsData.Count;
                        existingSummary.UpdatedAt = DateTime.UtcNow;

                        _context.HumanDailySummaries.Update(existingSummary);
                        _logger.LogInformation($"📝 [DailySummary] UPDATED UserId: {userId} for date: {targetDate:yyyy-MM-dd} — Records analyzed: {vitalsData.Count}");
                    }
                    else
                    {
                        // INSERT new record
                        var newSummary = new HumanDailySummary
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            Date = targetDate.Date,
                            AvgHeartRate = avgHeartRate,
                            AvgHRV = avgHRV,
                            TotalSteps = totalSteps > 0 ? totalSteps : null,
                            AvgCalories = avgCalories,
                            AvgDistance = avgDistance,
                            AvgActiveMinutes = avgActiveMinutes,
                            AvgSleepMinutes = avgSleepMinutes,
                            AvgStressScore = avgStressScore,
                            AvgAmbientTemperature = avgAmbientTemperature,
                            SyncScore = syncScore,
                            SyncTrend = syncTrend,
                            DataPointsCount = vitalsData.Count,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.HumanDailySummaries.Add(newSummary);
                        _logger.LogInformation($"✅ [DailySummary] CREATED UserId: {userId} for date: {targetDate:yyyy-MM-dd} — Records analyzed: {vitalsData.Count}");
                    }

                    processedCount++;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ [DailySummary] Daily summary generation completed for {targetDate:yyyy-MM-dd}. Processed: {processedCount}, Skipped: {skippedCount}");
                
                return processedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ [DailySummary] Error generating daily summary: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }
    }
}
