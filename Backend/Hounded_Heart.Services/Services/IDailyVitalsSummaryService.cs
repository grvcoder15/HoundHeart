using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    /// <summary>
    /// Result of a daily summary generation run.
    /// </summary>
    public class DailySummaryResult
    {
        public int ProcessedCount { get; set; }
        public int SkippedCount  { get; set; }
        public List<string> Errors { get; set; } = new();
        public bool HasErrors => Errors.Count > 0;
    }

    public interface IDailyVitalsSummaryService
    {
        /// <summary>
        /// Generates or updates the daily vitals summary.
        /// Background service overload — uses test/production time window automatically.
        /// </summary>
        Task<DailySummaryResult> GenerateDailySummaryAsync(DateTime targetDate, bool isTestMode = false, int testIntervalMinutes = 60);

        /// <summary>
        /// Generates or updates the daily vitals summary with explicit UTC boundaries.
        /// Use when the caller knows the exact UTC window (e.g. IST-aware manual trigger).
        /// </summary>
        Task<DailySummaryResult> GenerateDailySummaryAsync(DateTime calendarDate, DateTime utcStart, DateTime utcEnd);
    }
}
