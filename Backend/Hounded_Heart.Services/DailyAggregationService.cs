using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Hounded_Heart.Api.Services;

namespace Hounded_Heart.Services.Services
{
    public class DailyAggregationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyAggregationService> _logger;

        public DailyAggregationService(IServiceProvider serviceProvider, ILogger<DailyAggregationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Run at 2 AM every day
                    var now = DateTime.Now;
                    var nextRun = DateTime.Today.AddDays(1).AddHours(2); // Next day at 2 AM
                    var delay = nextRun - now;

                    if (delay.TotalMilliseconds > 0)
                    {
                        _logger.LogInformation($"📊 Daily aggregation scheduled for {nextRun:yyyy-MM-dd HH:mm:ss}");
                        await Task.Delay(delay, stoppingToken);
                    }

                    await ProcessDailyAggregation();
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Daily aggregation failed: {ex.Message}");
                }

                // Wait 24 hours before next run (backup in case scheduling fails)
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task ProcessDailyAggregation()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            _logger.LogInformation("📊 Starting daily data aggregation...");

            // Process yesterday's data
            var yesterday = DateTime.Today.AddDays(-1);
            
            await AggregateHumanData(context, yesterday);
            await AggregateDogData(context, yesterday);
            
            // Optional: Clean up old raw data (keep last 7 days of raw data)
            await CleanupOldRawData(context, DateTime.Today.AddDays(-7));

            _logger.LogInformation($"✅ Daily aggregation completed for {yesterday:yyyy-MM-dd}");
        }

        private async Task AggregateHumanData(AppDbContext context, DateTime date)
        {
            _logger.LogInformation($"📊 Aggregating human data for {date:yyyy-MM-dd}");

            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            // Get users with Fitbit connections who have data for this day
            var usersWithData = await (from h in context.HumanVitals
                                     join u in context.Users on h.UserId equals u.UserId
                                     where h.TimestampUtc >= startDate && 
                                           h.TimestampUtc < endDate &&
                                           !string.IsNullOrEmpty(u.FitbitAccessToken) &&
                                           !string.IsNullOrEmpty(u.FitbitRefreshToken) &&
                                           u.IsActive && !u.IsDeleted
                                     group h by h.UserId into g
                                     select g.Key)
                .ToListAsync();

            foreach (var userId in usersWithData)
            {
                // Check if summary already exists
                var existingSummary = await context.HumanDailySummaries
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == date);

                if (existingSummary != null)
                {
                    _logger.LogInformation($"⏭️ Summary already exists for user {userId} on {date:yyyy-MM-dd}");
                    continue;
                }

                // Aggregate the data
                var dailyData = await context.HumanVitals
                    .Where(h => h.UserId == userId && h.TimestampUtc >= startDate && h.TimestampUtc < endDate)
                    .ToListAsync();

                if (dailyData.Count == 0) continue;

                var summary = new HumanDailySummary
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Date = date,
                    AvgHeartRate = dailyData.Any(d => d.HeartRate.GetValueOrDefault(0) > 0) ? dailyData.Where(d => d.HeartRate.GetValueOrDefault(0) > 0).Average(d => (double)d.HeartRate!) : 0,
                    AvgHRV = dailyData.Any(d => d.HRV.GetValueOrDefault(0) > 0) ? dailyData.Where(d => d.HRV.GetValueOrDefault(0) > 0).Average(d => d.HRV!.Value) : 0,
                    TotalSteps = dailyData.Sum(d => d.Steps.GetValueOrDefault(0)),
                    AvgSleepScore = dailyData.Any(d => d.SleepMinutes.GetValueOrDefault(0) > 0) ? dailyData.Where(d => d.SleepMinutes.GetValueOrDefault(0) > 0).Average(d => (double)d.SleepMinutes!) : 0,
                    AvgStressScore = dailyData.Any(d => d.StressScore.GetValueOrDefault(0) > 0) ? dailyData.Where(d => d.StressScore.GetValueOrDefault(0) > 0).Average(d => (double)d.StressScore!) : 0,
                    AvgAmbientTemperature = dailyData.Any(d => d.AmbientTemperature.GetValueOrDefault(0) > 0) ? dailyData.Where(d => d.AmbientTemperature.GetValueOrDefault(0) > 0).Average(d => d.AmbientTemperature!.Value) : 0,
                    MinHeartRate = dailyData.Where(d => d.HeartRate > 0).DefaultIfEmpty().Min(d => d?.HeartRate ?? 0),
                    MaxHeartRate = dailyData.Where(d => d.HeartRate > 0).DefaultIfEmpty().Max(d => d?.HeartRate ?? 0),
                    MinHRV = dailyData.Where(d => d.HRV > 0).DefaultIfEmpty().Min(d => d?.HRV ?? 0),
                    MaxHRV = dailyData.Where(d => d.HRV > 0).DefaultIfEmpty().Max(d => d?.HRV ?? 0),
                    DataPointsCount = dailyData.Count,
                    CreatedAt = DateTime.UtcNow
                };

                // Get corresponding dog data for sync score calculation
                var dogData = await GetDogDailySummary(context, userId, date);
                
                // Get previous day's human data for trend calculation
                var previousDayHuman = await context.HumanDailySummaries
                    .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == date.AddDays(-1));

                // Calculate sync score and related fields
                var (score, trend, title, description, action, disclaimer) = 
                    SyncScoreService.CalculateSyncScore(summary, dogData, previousDayHuman);

                summary.Score = score;
                summary.Trend = trend;
                summary.ScoreTitle = title;
                summary.ScoreDescription = description;
                summary.ScoreAction = action;
                summary.Disclaimer = disclaimer;

                context.HumanDailySummaries.Add(summary);
                _logger.LogInformation($"✅ Created human daily summary for user {userId}: {dailyData.Count} data points, sync score: {score}");
            }

            await context.SaveChangesAsync();
        }

        private async Task AggregateDogData(AppDbContext context, DateTime date)
        {
            _logger.LogInformation($"📊 Aggregating dog data for {date:yyyy-MM-dd}");

            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            // Get all dogs who have data for this day
            var dogsWithData = await context.DogVitals
                .Where(d => d.TimestampUtc >= startDate && d.TimestampUtc < endDate)
                .Join(context.Dogs, dv => dv.DogId, dog => dog.DogId, (dv, dog) => new { dv.DogId, dog.UserId })
                .GroupBy(d => d.DogId)
                .Select(g => new { DogId = g.Key, UserId = g.First().UserId })
                .ToListAsync();

            foreach (var dog in dogsWithData)
            {
                // Check if summary already exists
                var existingSummary = await context.DogDailySummaries
                    .FirstOrDefaultAsync(s => s.DogId == dog.DogId && s.Date == date);

                if (existingSummary != null)
                {
                    _logger.LogInformation($"⏭️ Summary already exists for dog {dog.DogId} on {date:yyyy-MM-dd}");
                    continue;
                }

                // Aggregate the data
                var dailyData = await context.DogVitals
                    .Where(d => d.DogId == dog.DogId && d.TimestampUtc >= startDate && d.TimestampUtc < endDate)
                    .ToListAsync();

                if (dailyData.Count == 0) continue;

                var summary = new DogDailySummary
                {
                    Id = Guid.NewGuid(),
                    DogId = dog.DogId,
                    UserId = dog.UserId,
                    Date = date,
                    AvgHeartRate = dailyData.Average(d => d.HeartRate ?? 0),
                    AvgTemperature = dailyData.Average(d => d.Temperature ?? 0),
                    AvgActivityScore = dailyData.Average(d => d.ActivityScore),
                    AvgRestScore = dailyData.Average(d => d.RestScore),
                    AvgRespirationRate = dailyData.Average(d => d.RespirationRate ?? 0),
                    MinHeartRate = dailyData.Min(d => d.HeartRate ?? 0),
                    MaxHeartRate = dailyData.Max(d => d.HeartRate ?? 0),
                    MinTemperature = dailyData.Min(d => d.Temperature ?? 0),
                    MaxTemperature = dailyData.Max(d => d.Temperature ?? 0),
                    
                    // Calculate state percentages
                    RestPercentage = (double)dailyData.Count(d => d.State == "Resting") / dailyData.Count * 100,
                    ActivePercentage = (double)dailyData.Count(d => d.State == "Active") / dailyData.Count * 100,
                    PlayPercentage = (double)dailyData.Count(d => d.State == "Playing") / dailyData.Count * 100,
                    SleepPercentage = (double)dailyData.Count(d => d.State == "Sleeping") / dailyData.Count * 100,
                    
                    DataPointsCount = dailyData.Count,
                    CreatedAt = DateTime.UtcNow
                };

                context.DogDailySummaries.Add(summary);
                _logger.LogInformation($"✅ Created dog daily summary for dog {dog.DogId}: {dailyData.Count} data points aggregated");
            }

            await context.SaveChangesAsync();
        }

        private async Task<DogDailySummary> GetDogDailySummary(AppDbContext context, Guid userId, DateTime date)
        {
            // Get the user's dog's data for the same date
            var dogSummary = await context.DogDailySummaries
                .FirstOrDefaultAsync(d => d.UserId == userId && d.Date == date);

            return dogSummary;
        }

        private async Task CleanupOldRawData(AppDbContext context, DateTime cutoffDate)
        {
            _logger.LogInformation($"🧹 Cleaning up raw data older than {cutoffDate:yyyy-MM-dd}");

            var humanVitalsDeleted = await context.HumanVitals
                .Where(h => h.TimestampUtc < cutoffDate)
                .ExecuteDeleteAsync();

            var dogVitalsDeleted = await context.DogVitals
                .Where(d => d.TimestampUtc < cutoffDate)
                .ExecuteDeleteAsync();

            _logger.LogInformation($"🧹 Cleanup complete: {humanVitalsDeleted} human vitals, {dogVitalsDeleted} dog vitals deleted");
        }
    }
}