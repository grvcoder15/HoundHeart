using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class DailyVitalsSummaryHelper : IDailyVitalsSummaryService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DailyVitalsSummaryHelper> _logger;

        // IST offset = UTC+5:30
        private static readonly TimeSpan IstOffset = TimeSpan.FromHours(5.5);

        public DailyVitalsSummaryHelper(AppDbContext context, ILogger<DailyVitalsSummaryHelper> logger)
        {
            _context = context;
            _logger  = logger;
        }

        // ── Overload 1: background service (test or production midnight) ──
        public async Task<DailySummaryResult> GenerateDailySummaryAsync(DateTime targetDate, bool isTestMode = false, int testIntervalMinutes = 60)
        {
            DateTime startTime, endTime;

            if (isTestMode)
            {
                endTime   = DateTime.UtcNow;
                startTime = endTime.AddMinutes(-testIntervalMinutes);
                _logger.LogInformation($"📊 [DailySummary] TEST MODE: {startTime:yyyy-MM-dd HH:mm} → {endTime:yyyy-MM-dd HH:mm} UTC ({testIntervalMinutes} min)");
            }
            else
            {
                // Shift IST calendar date to UTC: July 3 IST = July 2 18:30Z → July 3 18:30Z
                startTime = DateTime.SpecifyKind(targetDate.Date - IstOffset, DateTimeKind.Utc);
                endTime   = startTime.AddDays(1);
                _logger.LogInformation($"📊 [DailySummary] PRODUCTION: IST {targetDate:yyyy-MM-dd} = UTC {startTime:yyyy-MM-dd HH:mm} → {endTime:yyyy-MM-dd HH:mm}");
            }

            return await ProcessSummaryAsync(targetDate.Date, startTime, endTime);
        }

        // ── Overload 2: manual trigger with explicit IST-aware UTC window ──
        public async Task<DailySummaryResult> GenerateDailySummaryAsync(DateTime calendarDate, DateTime utcStart, DateTime utcEnd)
        {
            _logger.LogInformation($"📊 [DailySummary] MANUAL: IST {calendarDate:yyyy-MM-dd} = UTC {utcStart:yyyy-MM-dd HH:mm} → {utcEnd:yyyy-MM-dd HH:mm}");
            return await ProcessSummaryAsync(calendarDate.Date, utcStart, utcEnd);
        }

        // ── Core logic ──
        private async Task<DailySummaryResult> ProcessSummaryAsync(DateTime calendarDate, DateTime startTime, DateTime endTime)
        {
            _logger.LogInformation($"📊 [DailySummary] Starting generation for {calendarDate:yyyy-MM-dd}");

            startTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc);
            endTime   = DateTime.SpecifyKind(endTime,   DateTimeKind.Utc);

            // Date column = UTC-safe representation of the IST calendar date
            var dateUtc = DateTime.SpecifyKind(calendarDate, DateTimeKind.Utc);

            var userIds = await _context.HumanVitals
                .Where(h => h.TimestampUtc >= startTime && h.TimestampUtc < endTime)
                .Select(h => h.UserId)
                .Distinct()
                .ToListAsync();

            _logger.LogInformation($"📊 [DailySummary] Found {userIds.Count} users with vitals data");

            var result = new DailySummaryResult();

            foreach (var userId in userIds)
            {
                // Each user saved independently — one failure never blocks others
                try
                {
                    var vitalsData = await _context.HumanVitals
                        .Where(h => h.UserId == userId && h.TimestampUtc >= startTime && h.TimestampUtc < endTime)
                        .ToListAsync();

                    if (vitalsData.Count == 0) { result.SkippedCount++; continue; }

                    // Averages (null/zero-safe)
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

                    if (avgHeartRate == null && avgHRV == null && avgCalories == null &&
                        avgDistance == null && avgActiveMinutes == null && avgSleepMinutes == null &&
                        avgStressScore == null && avgAmbientTemperature == null && totalSteps == 0)
                    {
                        _logger.LogInformation($"⏭️  [DailySummary] Skipped {userId} — no valid data");
                        result.SkippedCount++;
                        continue;
                    }

                    // SyncScore
                    var syncScoreRecord = await _context.SyncScoreRecords
                        .Where(s => s.UserId == userId && s.CalculatedAt >= startTime && s.CalculatedAt < endTime)
                        .OrderByDescending(s => s.CalculatedAt)
                        .FirstOrDefaultAsync();

                    int?    syncScore = syncScoreRecord?.Score;
                    string? syncTrend = syncScoreRecord?.Trend;

                    // Upsert
                    var existingSummary = await _context.HumanDailySummaries
                        .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == dateUtc);

                    if (existingSummary != null)
                    {
                        existingSummary.AvgHeartRate         = avgHeartRate;
                        existingSummary.AvgHRV               = avgHRV;
                        existingSummary.TotalSteps            = totalSteps > 0 ? totalSteps : null;
                        existingSummary.AvgCalories           = avgCalories;
                        existingSummary.AvgDistance           = avgDistance;
                        existingSummary.AvgActiveMinutes      = avgActiveMinutes;
                        existingSummary.AvgSleepMinutes       = avgSleepMinutes;
                        existingSummary.AvgStressScore        = avgStressScore;
                        existingSummary.AvgAmbientTemperature = avgAmbientTemperature;
                        existingSummary.SyncScore             = syncScore;
                        existingSummary.SyncTrend             = syncTrend;
                        existingSummary.DataPointsCount       = vitalsData.Count;
                        existingSummary.UpdatedAt             = DateTime.UtcNow;
                        _context.HumanDailySummaries.Update(existingSummary);
                        _logger.LogInformation($"📝 [DailySummary] UPDATED {userId} for {calendarDate:yyyy-MM-dd} — {vitalsData.Count} records");
                    }
                    else
                    {
                        _context.HumanDailySummaries.Add(new HumanDailySummary
                        {
                            Id                    = Guid.NewGuid(),
                            UserId                = userId,
                            Date                  = dateUtc,
                            AvgHeartRate          = avgHeartRate,
                            AvgHRV                = avgHRV,
                            TotalSteps            = totalSteps > 0 ? totalSteps : null,
                            AvgCalories           = avgCalories,
                            AvgDistance           = avgDistance,
                            AvgActiveMinutes      = avgActiveMinutes,
                            AvgSleepMinutes       = avgSleepMinutes,
                            AvgStressScore        = avgStressScore,
                            AvgAmbientTemperature = avgAmbientTemperature,
                            SyncScore             = syncScore,
                            SyncTrend             = syncTrend,
                            DataPointsCount       = vitalsData.Count,
                            CreatedAt             = DateTime.UtcNow,
                            UpdatedAt             = DateTime.UtcNow
                        });
                        _logger.LogInformation($"✅ [DailySummary] CREATED {userId} for {calendarDate:yyyy-MM-dd} — {vitalsData.Count} records");
                    }

                    await _context.SaveChangesAsync();
                    result.ProcessedCount++;
                }
                catch (Exception ex)
                {
                    var msg = $"UserId {userId}: {ex.InnerException?.Message ?? ex.Message}";
                    _logger.LogError($"❌ [DailySummary] Failed for {msg}");
                    result.Errors.Add(msg);

                    // Detach so next user starts with clean DbContext
                    foreach (var entry in _context.ChangeTracker.Entries().ToList())
                        entry.State = EntityState.Detached;
                }
            }

            _logger.LogInformation($"✅ [DailySummary] Done for {calendarDate:yyyy-MM-dd}. Processed={result.ProcessedCount}, Skipped={result.SkippedCount}, Errors={result.Errors.Count}");
            return result;
        }
    }
}
