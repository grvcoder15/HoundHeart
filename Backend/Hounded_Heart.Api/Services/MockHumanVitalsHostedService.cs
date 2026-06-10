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
    public class MockHumanVitalsHostedService : BackgroundService
    {
        private readonly ILogger<MockHumanVitalsHostedService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly Random _random = new();

        public MockHumanVitalsHostedService(ILogger<MockHumanVitalsHostedService> logger, IServiceScopeFactory scopeFactory, IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MockHumanVitalsHostedService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await GenerateMockHumanVitals();
                    
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
                    _logger.LogError(ex, "Error occurred while generating mock human vitals.");
                    // Wait a bit before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("MockHumanVitalsHostedService stopped.");
        }

        private async Task GenerateMockHumanVitals()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var vitalsTrackingService = scope.ServiceProvider.GetRequiredService<IVitalsTrackingService>();
            var weatherService = scope.ServiceProvider.GetRequiredService<IWeatherService>();
            var smsService = scope.ServiceProvider.GetRequiredService<ISmsService>();

            // Get user IDs with connected HumanWatch devices
            var userIds = await context.DeviceConnections
                .Where(d => d.DeviceType == "HumanWatch" 
                         && d.IsConnected == true)
                .Select(d => d.UserId)
                .Distinct()
                .ToListAsync();

            if (!userIds.Any())
            {
                _logger.LogInformation("No users have connected HumanWatch. Skipping vitals generation.");
                return;
            }

            _logger.LogInformation("Found {Count} users with connected HumanWatch. Generating vitals.", userIds.Count);

            var currentHour = DateTime.UtcNow.Hour;
            var isNightTime = currentHour >= 22 || currentHour <= 7;
            var isWorkingHours = currentHour >= 9 && currentHour <= 17;

            var vitalsRecords = new System.Collections.Generic.List<HumanVitalsRecord>();

            foreach (var userId in userIds)
            {
                // 10% chance of stress spike to trigger stress detection
                var isStressSpike = _random.Next(10) == 0;

                // Generate HRV based on stress state
                double hrv;
                if (isStressSpike)
                {
                    hrv = _random.Next(20, 26); // 20-25ms for stress detection
                }
                else
                {
                    hrv = _random.Next(30, 61); // Normal range 30-60ms
                }

                // Generate HR (slightly higher during stress)
                int heartRate;
                if (isStressSpike)
                {
                    heartRate = _random.Next(85, 101); // Elevated HR during stress
                }
                else if (isNightTime)
                {
                    heartRate = _random.Next(60, 76); // Lower resting HR at night
                }
                else
                {
                    heartRate = _random.Next(65, 91); // Normal daytime HR
                }

                // Generate steps based on time of day
                int steps;
                if (isNightTime)
                {
                    steps = _random.Next(0, 50); // Very few steps at night
                }
                else if (isWorkingHours)
                {
                    steps = _random.Next(200, 800); // Moderate activity during work
                }
                else
                {
                    steps = _random.Next(400, 1200); // More activity during free time
                }

                // Sleep score (higher quality when not stressed)
                int sleepScore;
                if (isStressSpike)
                {
                    sleepScore = _random.Next(50, 75); // Poor sleep when stressed
                }
                else
                {
                    sleepScore = _random.Next(70, 96); // Good sleep normally
                }

                // Generate GPS coordinates (simulate user location with small variation)
                // Base location: Delhi, India with small random variation
                var baseLatitude = 28.6139;
                var baseLongitude = 77.2090;
                var latitude = baseLatitude + (_random.NextDouble() - 0.5) * 0.001; // ~±50m variation
                var longitude = baseLongitude + (_random.NextDouble() - 0.5) * 0.001;

                var humanVital = new HumanVitalsRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    HeartRate = heartRate,
                    HRV = hrv,
                    Steps = steps,
                    SleepMinutes = sleepScore,
                    StressScore = isStressSpike ? _random.Next(70, 91) : _random.Next(20, 51),
                    Latitude = latitude,
                    Longitude = longitude,
                    Source = "mock",
                    TimestampUtc = DateTime.UtcNow
                };

                // Enrich with weather data — failures are silently ignored
                var weather = await weatherService.GetCurrentWeather(latitude, longitude);
                if (weather != null)
                {
                    humanVital.AmbientTemperature = weather.TemperatureCelsius;
                    humanVital.WeatherCondition = weather.Condition;
                    humanVital.WeatherLocation = weather.LocationName;
                }

                vitalsRecords.Add(humanVital);
            }

            context.HumanVitals.AddRange(vitalsRecords);
            await context.SaveChangesAsync();

            // Track vitals insertion for baseline start time tracking
            foreach (var record in vitalsRecords)
            {
                await vitalsTrackingService.TrackHumanVitalsInserted(record.UserId);
            }

            // Baseline readiness check and SMS alert
            var today = DateTime.UtcNow.Date;
            foreach (var userId in userIds)
            {
                int distinctDays = await context.HumanVitals
                    .Where(v => v.UserId == userId)
                    .Select(v => v.TimestampUtc.Date)
                    .Distinct()
                    .CountAsync();

                if (distinctDays >= 7)
                {
                    bool baselineEstablished = await context.UserBaselines
                        .AnyAsync(b => b.UserId == userId && b.HumanBaselineEstablished == true);

                    if (!baselineEstablished)
                    {
                        var humanProfile = await context.HumanProfiles
                            .FirstOrDefaultAsync(h => h.UserId == userId);

                        if (humanProfile != null && !string.IsNullOrEmpty(humanProfile.PhoneNumber))
                        {
                            bool alreadySentToday = await context.MessageLogs
                                .AnyAsync(m => m.UserId == userId 
                                            && m.MessageType == "baseline_ready" 
                                            && m.SentAt.Date == today);

                            if (!alreadySentToday)
                            {
                                string smsBody = "HoundHeart: Your 7-day baseline data is ready! Open HoundHeart and tap Create My Baseline to activate full stress monitoring.";
                                await smsService.SendSms(
                                    userId,
                                    humanProfile.PhoneNumber,
                                    "baseline_ready",
                                    smsBody);
                            }
                        }
                    }
                }
            }

            var stressSpikes = vitalsRecords.Count(v => v.HRV.GetValueOrDefault(0) <= 25);
            _logger.LogInformation("Generated {Count} mock human vitals records at {Timestamp} ({StressCount} stress spikes)", 
                vitalsRecords.Count, DateTime.UtcNow, stressSpikes);
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