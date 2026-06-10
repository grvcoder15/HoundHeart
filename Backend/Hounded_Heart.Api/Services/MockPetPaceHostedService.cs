using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Services
{
    public class MockPetPaceHostedService : BackgroundService
    {
        private readonly ILogger<MockPetPaceHostedService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly Random _random = new();

        public MockPetPaceHostedService(ILogger<MockPetPaceHostedService> logger, IServiceScopeFactory scopeFactory, IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MockPetPaceHostedService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await GenerateMockDogVitals();
                    
                    // Check baseline readiness and determine interval
                    var intervalSeconds = await GetAppropriateInterval();
                    await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when cancellation is requested
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while generating mock dog vitals.");
                    // Wait a bit before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("MockPetPaceHostedService stopped.");
        }

        private async Task GenerateMockDogVitals()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var vitalsTrackingService = scope.ServiceProvider.GetRequiredService<IVitalsTrackingService>();

            // Get dog IDs with connected PetPace collars
            var dogIds = await context.DeviceConnections
                .Where(d => d.DeviceType == "PetPace" 
                         && d.IsConnected == true
                         && d.DogId != null)
                .Select(d => d.DogId.Value)
                .Distinct()
                .ToListAsync();

            if (!dogIds.Any())
            {
                _logger.LogInformation("No dogs have connected PetPace collar. Skipping vitals generation.");
                return;
            }

            _logger.LogInformation("Found {Count} dogs with connected PetPace collar. Generating vitals.", dogIds.Count);

            var currentHour = DateTime.UtcNow.Hour;
            var isNightTime = currentHour >= 22 || currentHour <= 7;

            var vitalsRecords = dogIds.Select(dogId => 
            {
                // Generate GPS coordinates (simulate dog location with larger variation than human)
                // Base location: Delhi, India with larger random variation (dogs move more)
                var baseLatitude = 28.6139;
                var baseLongitude = 77.2090;
                var latitude = baseLatitude + (_random.NextDouble() - 0.5) * 0.005; // ~±250m variation
                var longitude = baseLongitude + (_random.NextDouble() - 0.5) * 0.005;

                return new DogVitalsRecord
                {
                    Id = Guid.NewGuid(),
                    DogId = dogId,
                    HeartRate = _random.Next(60, 121), // 60-120 inclusive
                    ActivityScore = _random.Next(20, 91), // 20-90 inclusive
                    Temperature = (float)Math.Round(_random.NextDouble() * (39.5 - 37.5) + 37.5, 1), // 37.5-39.5 rounded to 1 decimal
                    RestScore = _random.Next(30, 81), // 30-80 inclusive
                    RespirationRate = (float)Math.Round(_random.NextDouble() * (30 - 15) + 15, 1), // 15-30 rounded to 1 decimal
                    State = isNightTime ? "resting" : (_random.Next(2) == 0 ? "active" : "resting"),
                    Latitude = latitude,
                    Longitude = longitude,
                    Source = "petpace_mock",
                    TimestampUtc = DateTime.UtcNow
                };
            }).ToList();

            context.DogVitals.AddRange(vitalsRecords);
            await context.SaveChangesAsync();

            // Track vitals insertion for baseline start time tracking
            foreach (var record in vitalsRecords)
            {
                await vitalsTrackingService.TrackDogVitalsInserted(record.DogId);
            }

            _logger.LogInformation("Generated {Count} mock dog vitals records at {Timestamp}", 
                vitalsRecords.Count, DateTime.UtcNow);
        }

        private async Task<int> GetAppropriateInterval()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Check if both human and dog baselines are established
            var hasHumanBaseline = await context.UserBaselines
                .AnyAsync(ub => ub.HumanBaselineEstablished == true);

            var hasDogBaseline = await context.DogBaselines
                .AnyAsync(db => db.DogBaselineEstablished);

            var baselineReady = hasHumanBaseline && hasDogBaseline;

            // Get configuration values
            var preBaselineInterval = _configuration.GetValue<int>("HoundHeart:PreBaselineIntervalSeconds", 90);
            var postBaselineInterval = _configuration.GetValue<int>("HoundHeart:PostBaselineIntervalSeconds", 30);

            if (baselineReady)
            {
                _logger.LogDebug("Running in POST-BASELINE mode - {IntervalSeconds}s intervals", postBaselineInterval);
                return postBaselineInterval;
            }
            else
            {
                _logger.LogDebug("Running in PRE-BASELINE mode - {IntervalSeconds}s intervals (Human: {HasHuman}, Dog: {HasDog})", 
                    preBaselineInterval, hasHumanBaseline, hasDogBaseline);
                return preBaselineInterval;
            }
        }
    }
}