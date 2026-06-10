using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class DailyVitalsSummaryService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<DailyVitalsSummaryService> _logger;
        private readonly IConfiguration _configuration;

        public DailyVitalsSummaryService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<DailyVitalsSummaryService> logger,
            IConfiguration configuration)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Read config
            var testModeEnabled = _configuration.GetValue<bool>("DailySummary:TestMode", false);
            var testIntervalMinutes = _configuration.GetValue<int>("DailySummary:TestIntervalMinutes", 60);

            if (testModeEnabled)
            {
                _logger.LogWarning($"⚠️ [DailySummary] TEST MODE ENABLED");
                _logger.LogWarning($"⚠️ [DailySummary] Will collect last {testIntervalMinutes} minutes of data and treat as '1 day'");
                _logger.LogWarning($"⚠️ [DailySummary] Running every {testIntervalMinutes} minutes - each run stores averages for TODAY's date");
            }
            else
            {
                _logger.LogInformation("📊 [DailySummary] PRODUCTION MODE - Running at midnight UTC");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    TimeSpan delay;

                    if (testModeEnabled)
                    {
                        // Test mode: run every N minutes
                        delay = TimeSpan.FromMinutes(testIntervalMinutes);
                        _logger.LogInformation($"📊 [DailySummary] Test mode: next execution in {testIntervalMinutes} minutes");
                    }
                    else
                    {
                        // Production mode: calculate delay to next midnight UTC
                        var now = DateTime.UtcNow;
                        var nextMidnight = now.Date.AddDays(1);
                        delay = nextMidnight - now;

                        if (delay.TotalMilliseconds > 0)
                        {
                            _logger.LogInformation($"📊 [DailySummary] Next execution scheduled for {nextMidnight:yyyy-MM-dd HH:mm:ss} UTC (in {delay.TotalHours:F1} hours)");
                        }
                    }

                    if (delay.TotalMilliseconds > 0)
                    {
                        await Task.Delay(delay, stoppingToken);
                    }

                    // Determine target date and check test mode
                    DateTime targetDate;
                    if (testModeEnabled)
                    {
                        // Test mode: process TODAY + last N minutes window
                        targetDate = DateTime.UtcNow.Date;
                        _logger.LogInformation($"📊 [DailySummary] TEST MODE: Collecting data from last {testIntervalMinutes} minutes");
                        _logger.LogInformation($"📊 [DailySummary] Time window: {DateTime.UtcNow.AddMinutes(-testIntervalMinutes):yyyy-MM-dd HH:mm:ss} to {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
                    }
                    else
                    {
                        // Production mode: process YESTERDAY (complete day)
                        targetDate = DateTime.UtcNow.Date.AddDays(-1);
                    }

                    _logger.LogInformation($"📊 [DailySummary] Starting daily summary generation for {targetDate:yyyy-MM-dd}");

                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var summaryService = scope.ServiceProvider.GetRequiredService<IDailyVitalsSummaryService>();
                        
                        // Pass test mode info to the helper
                        int processedCount = await summaryService.GenerateDailySummaryAsync(
                            targetDate, 
                            testModeEnabled, 
                            testIntervalMinutes
                        );
                        
                        if (testModeEnabled)
                        {
                            _logger.LogInformation($"✅ [DailySummary] TEST MODE CYCLE COMPLETE - Processed {processedCount} users");
                            _logger.LogInformation($"✅ [DailySummary] Stored averages in HumanDailySummaries for {targetDate:yyyy-MM-dd} (TODAY)");
                        }
                        else
                        {
                            _logger.LogInformation($"✅ [DailySummary] Completed - Processed {processedCount} users for {targetDate:yyyy-MM-dd}");
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("📊 [DailySummary] Service cancelled");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ [DailySummary] Daily summary generation failed: {ex.Message}");
                }
            }
        }
    }
}
