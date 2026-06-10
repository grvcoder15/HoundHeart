using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IDailyVitalsSummaryService
    {
        /// <summary>
        /// Generates or updates the daily vitals summary for a specific date.
        /// </summary>
        /// <param name="targetDate">The date to generate the summary for</param>
        /// <param name="isTestMode">If true, processes data from last N minutes window instead of full day</param>
        /// <param name="testIntervalMinutes">Number of minutes to look back for test mode (default 60)</param>
        /// <returns>Number of users processed</returns>
        Task<int> GenerateDailySummaryAsync(DateTime targetDate, bool isTestMode = false, int testIntervalMinutes = 60);
    }
}
