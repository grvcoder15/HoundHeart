using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Services
{
    public class WeeklyCleanupService : BackgroundService
    {
        private readonly ILogger<WeeklyCleanupService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly int _intervalMinutes;

        public WeeklyCleanupService(ILogger<WeeklyCleanupService> logger, IServiceScopeFactory scopeFactory, IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _intervalMinutes = _configuration.GetValue<int>("HoundHeart:CleanupIntervalMinutes", 2); // Default to 2 minutes for testing
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("WeeklyCleanupService started with {IntervalMinutes} minute intervals.", _intervalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformCleanup();
                    await Task.Delay(TimeSpan.FromMinutes(_intervalMinutes), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when cancellation is requested
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during data cleanup.");
                    // Wait a bit before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("WeeklyCleanupService stopped.");
        }

        private async Task PerformCleanup()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;
            var sevenDaysAgo = now.AddDays(-7);
            var thirtyDaysAgo = now.AddDays(-30);
            var ninetyDaysAgo = now.AddDays(-90);

            // Count records before deletion for logging
            var humanVitalsToDelete = await context.HumanVitals
                .Where(hv => hv.TimestampUtc < sevenDaysAgo)
                .CountAsync();

            var dogVitalsToDelete = await context.DogVitals
                .Where(dv => dv.TimestampUtc < sevenDaysAgo)
                .CountAsync();

            var syncScoresToDelete = await context.SyncScoreRecords
                .Where(ssr => ssr.CalculatedAt < thirtyDaysAgo)
                .CountAsync();

            var stressEventsToDelete = await context.StressEvents
                .Where(se => se.TimestampUtc < ninetyDaysAgo)
                .CountAsync();

            // Perform deletions
            if (humanVitalsToDelete > 0)
            {
                await context.HumanVitals
                    .Where(hv => hv.TimestampUtc < sevenDaysAgo)
                    .ExecuteDeleteAsync();
            }

            if (dogVitalsToDelete > 0)
            {
                await context.DogVitals
                    .Where(dv => dv.TimestampUtc < sevenDaysAgo)
                    .ExecuteDeleteAsync();
            }

            if (syncScoresToDelete > 0)
            {
                await context.SyncScoreRecords
                    .Where(ssr => ssr.CalculatedAt < thirtyDaysAgo)
                    .ExecuteDeleteAsync();
            }

            if (stressEventsToDelete > 0)
            {
                await context.StressEvents
                    .Where(se => se.TimestampUtc < ninetyDaysAgo)
                    .ExecuteDeleteAsync();
            }

            _logger.LogInformation("Cleanup complete: {HumanVitals} human vitals deleted, " +
                                 "{DogVitals} dog vitals deleted, {SyncScores} sync scores deleted, " +
                                 "{StressEvents} stress events deleted",
                humanVitalsToDelete, dogVitalsToDelete, syncScoresToDelete, stressEventsToDelete);
        }
    }
}