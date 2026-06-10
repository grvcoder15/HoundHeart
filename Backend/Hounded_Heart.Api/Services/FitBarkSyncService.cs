using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Hounded_Heart.Services.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Api.Services
{
    [ExcludeFromCodeCoverage]
    public class FitBarkSyncService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<FitBarkSyncService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public FitBarkSyncService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<FitBarkSyncService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FitBarkSyncService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PollFitBarkDataForAllDogs(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during FitBark sync cycle");
                }

                // Polling interval: 30 minutes as requested
                var intervalMinutes = _configuration.GetValue<int>("FitBark:SyncIntervalMinutes", 30);
                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
            }

            _logger.LogInformation("FitBarkSyncService stopped");
        }

        private async Task PollFitBarkDataForAllDogs(CancellationToken ct)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var fitBarkService = scope.ServiceProvider.GetRequiredService<IFitBarkService>();

            var connectedDogs = await context.FitBarkDogs
                .Where(d => !string.IsNullOrWhiteSpace(d.DogSlug))
                .ToListAsync(ct);

            _logger.LogInformation("🐾 FitBarkSyncService polling cycle started. Found {DogCount} dogs with non-empty DogSlug", connectedDogs.Count);

            if (connectedDogs.Count == 0)
            {
                _logger.LogWarning("❌ No FitBarkDogs found with non-empty DogSlug. Skipping sync cycle.");
                return;
            }

            foreach (var dog in connectedDogs)
            {
                _logger.LogInformation("📋 Processing dog: Id={DogId}, Name={Name}, DogSlug={DogSlug}", dog.Id, dog.Name, dog.DogSlug);
                await ProcessDogFitBarkData(dog, context, fitBarkService, ct);
            }

            _logger.LogInformation("✅ FitBarkSyncService polling cycle completed");
        }

        private async Task ProcessDogFitBarkData(
            FitBarkDog dog,
            AppDbContext context,
            IFitBarkService fitBarkService,
            CancellationToken ct)
        {
            try
            {
                _logger.LogDebug("🔄 Processing FitBark data for dog: Id={DogId}, Name={Name}, DogSlug={DogSlug}", dog.Id, dog.Name, dog.DogSlug);

                var (fromDate, toDate, resolution) = BuildActivityWindow();
                _logger.LogInformation(
                    "📅 Fetching FitBark activity for dog {DogSlug} from {FromDate} to {ToDate} with resolution {Resolution}",
                    dog.DogSlug,
                    fromDate,
                    toDate,
                    resolution);

                // Pull dog profile snapshot first (breed, birth, weight, goal, etc.) and keep FitBarkDogs table fresh.
                await SyncDogProfileSnapshot(dog, fitBarkService, ct);

                // Pull additional insights that power app cards as much as current backend model supports.
                await FetchAdditionalFitBarkInsights(dog, fitBarkService, fromDate, toDate, ct);

                // Approximate location using Zip/Country when available.
                var approxLocation = await ResolveApproxLocationAsync(dog, ct);
                if (approxLocation.Latitude.HasValue && approxLocation.Longitude.HasValue)
                {
                    _logger.LogInformation(
                        "📍 Resolved approximate location for {DogSlug}: Lat={Latitude}, Lon={Longitude}",
                        dog.DogSlug,
                        approxLocation.Latitude.Value,
                        approxLocation.Longitude.Value);
                }

                var activities = await fitBarkService.GetDailyActivityAsync(dog.DogSlug, fromDate, toDate, resolution);

                _logger.LogInformation("📊 GetDailyActivityAsync returned {ActivityCount} records for dog {DogSlug}", activities?.Count ?? 0, dog.DogSlug);

                if (activities == null || activities.Count == 0)
                {
                    _logger.LogWarning("⚠️ No FitBark activity found for dog {DogId} ({DogSlug}). This could mean: API call failed, no data available, or token issue.", dog.Id, dog.DogSlug);
                    return;
                }

                _logger.LogInformation("✓ Found {ActivityCount} activity records for dog {DogSlug}", activities.Count, dog.DogSlug);
                var insertedCount = 0;
                var skippedCount = 0;
                var failedParseCount = 0;

                foreach (var activity in activities)
                {
                    _logger.LogDebug("🔍 Processing activity: Date={Date}, ActivityValue={ActivityValue}, MinPlay={MinPlay}, MinActive={MinActive}, MinRest={MinRest}, NapTime={NapTime}",
                        activity.Date, activity.ActivityValue, activity.MinPlay, activity.MinActive, activity.MinRest, activity.NapTime);

                    if (!DateTime.TryParse(activity.Date, out var actDateRaw))
                    {
                        _logger.LogWarning("❌ Failed to parse activity date: {Date}", activity.Date);
                        failedParseCount++;
                        continue;
                    }
                    var actDateParsed = DateTime.SpecifyKind(actDateRaw, DateTimeKind.Utc);

                    // For continuous polling: use current poll time as primary identifier when resolution is non-daily.
                    // This ensures every 4-minute poll creates a distinct record even if FitBark returns same daily aggregate.
                    var baseTimestamp = (resolution == "DAILY") ? actDateParsed : DateTime.UtcNow;
                    var normalizedTimestamp = NormalizeTimestamp(baseTimestamp, resolution);

                    var existingVital = await context.DogVitals
                        .FirstOrDefaultAsync(
                            v => v.DogId == dog.Id &&
                                 v.TimestampUtc == normalizedTimestamp &&
                                 v.Source == "fitbark",
                            ct);

                    if (existingVital != null)
                    {
                        // Keep existing day-row current with latest values.
                        existingVital.ActivityValue = activity.ActivityValue;
                        existingVital.MinPlay = activity.MinPlay;
                        existingVital.MinActive = activity.MinActive;
                        existingVital.MinRest = activity.MinRest;
                        existingVital.NapTime = activity.NapTime;
                        existingVital.ActivityScore = activity.ActivityValue;
                        existingVital.RestScore = activity.MinRest;
                        existingVital.State = DetermineDogState(activity.MinPlay, activity.MinActive, activity.MinRest, activity.NapTime);
                        if (approxLocation.Latitude.HasValue && approxLocation.Longitude.HasValue)
                        {
                            existingVital.Latitude = approxLocation.Latitude.Value;
                            existingVital.Longitude = approxLocation.Longitude.Value;
                        }

                        // Estimated vitals (behavior-inferred, not medically measured)
                        var (updHR, updTemp, updResp) = EstimateVitalsFromActivity(
                            activity.ActivityValue, activity.MinActive, activity.MinRest, activity.MinPlay, activity.NapTime);
                        existingVital.HeartRate       = updHR;
                        existingVital.Temperature     = updTemp;
                        existingVital.RespirationRate = updResp;

                        _logger.LogDebug("🔁 Updated existing fitbark vital: DogId={DogId}, Date={Date}, VitalId={VitalId}",
                            dog.Id, normalizedTimestamp, existingVital.Id);
                        skippedCount++;
                        await UpsertFitBarkActivityLog(context, dog.DogSlug, actDateParsed, activity, ct);
                        continue;
                    }

                    var (newHR, newTemp, newResp) = EstimateVitalsFromActivity(
                        activity.ActivityValue, activity.MinActive, activity.MinRest, activity.MinPlay, activity.NapTime);

                    var newVital = new DogVitalsRecord
                    {
                        Id = Guid.NewGuid(),
                        DogId = dog.Id,
                        ActivityValue = activity.ActivityValue,
                        MinPlay = activity.MinPlay,
                        MinActive = activity.MinActive,
                        MinRest = activity.MinRest,
                        NapTime = activity.NapTime,
                        ActivityScore = activity.ActivityValue,
                        RestScore = activity.MinRest,
                        State = DetermineDogState(activity.MinPlay, activity.MinActive, activity.MinRest, activity.NapTime),
                        Latitude = approxLocation.Latitude,
                        Longitude = approxLocation.Longitude,
                        Source = "fitbark",
                        TimestampUtc = normalizedTimestamp,
                        // Estimated vitals (behavior-inferred, not medically measured)
                        HeartRate       = newHR,
                        Temperature     = newTemp,
                        RespirationRate = newResp
                    };

                    _logger.LogDebug("➕ Inserting new DogVitalsRecord: Id={VitalId}, DogId={DogId}, Date={Date}, Source=fitbark", 
                        newVital.Id, newVital.DogId, normalizedTimestamp);
                    
                    context.DogVitals.Add(newVital);
                    await UpsertFitBarkActivityLog(context, dog.DogSlug, actDateParsed, activity, ct);
                    insertedCount++;
                }

                if (insertedCount > 0)
                {
                    _logger.LogInformation("💾 Saving {InsertedCount} new DogVitals records to database...", insertedCount);
                    await context.SaveChangesAsync(ct);
                    _logger.LogInformation("✅ Successfully saved {InsertedCount} new records", insertedCount);
                }

                _logger.LogInformation(
                    "📈 Completed FitBark sync for dog {DogId} ({DogSlug}): Inserted={InsertedCount}, Skipped={SkippedCount}, FailedParse={FailedParseCount}",
                    dog.Id, dog.DogSlug, insertedCount, skippedCount, failedParseCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error processing FitBark data for dog {DogId} ({DogSlug})", dog.Id, dog.DogSlug);
            }
        }

        private async Task SyncDogProfileSnapshot(FitBarkDog dog, IFitBarkService fitBarkService, CancellationToken ct)
        {
            try
            {
                var dogInfo = await fitBarkService.GetDogInfoAsync(dog.DogSlug);
                if (dogInfo == null)
                {
                    _logger.LogWarning("ℹ️ Dog profile snapshot unavailable for {DogSlug}", dog.DogSlug);
                    return;
                }

                using var scope = _serviceScopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var existing = await context.FitBarkDogs.FirstOrDefaultAsync(d => d.Id == dog.Id, ct);
                if (existing == null)
                {
                    return;
                }

                if (!string.IsNullOrWhiteSpace(dogInfo.Name)) existing.Name = dogInfo.Name;
                if (!string.IsNullOrWhiteSpace(dogInfo.Birth)) existing.BirthDate = dogInfo.Birth;
                if (!string.IsNullOrWhiteSpace(dogInfo.Gender)) existing.Gender = dogInfo.Gender;
                if (!string.IsNullOrWhiteSpace(dogInfo.Country)) existing.Country = dogInfo.Country;
                if (!string.IsNullOrWhiteSpace(dogInfo.Zip)) existing.Zip = dogInfo.Zip;
                if (dogInfo.Weight.HasValue) existing.Weight = dogInfo.Weight.Value;
                if (dogInfo.DailyGoal.HasValue) existing.ActivityGoal = dogInfo.DailyGoal.Value;

                var breedName = dogInfo.Breed1?.Name ?? dogInfo.Breed2?.Name;
                if (!string.IsNullOrWhiteSpace(breedName)) existing.Breed = breedName;

                existing.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync(ct);

                _logger.LogInformation("🧾 Synced dog profile snapshot for {DogSlug}: Breed={Breed}, BirthDate={BirthDate}, Weight={Weight}",
                    dog.DogSlug, existing.Breed, existing.BirthDate, existing.Weight);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Failed to sync dog profile snapshot for {DogSlug}", dog.DogSlug);
            }
        }

        private async Task FetchAdditionalFitBarkInsights(
            FitBarkDog dog,
            IFitBarkService fitBarkService,
            string fromDate,
            string toDate,
            CancellationToken ct)
        {
            try
            {
                // Only fetch daily_goal — activity_totals/time_breakdown/similar_dogs_stats
                // consistently return 500/404 for this account and are not used downstream.
                var goal = await fitBarkService.GetDailyGoalAsync(dog.DogSlug);

                if (goal != null)
                {
                    _logger.LogInformation(
                        "🎯 Daily goal for {DogSlug}: Goal%={GoalPercent}, Current%={CurrentPercent}",
                        dog.DogSlug,
                        goal.DailyGoalPercentage,
                        goal.CurrentActivityPercentage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Failed to fetch daily goal for {DogSlug}", dog.DogSlug);
            }
        }

        private async Task<(double? Latitude, double? Longitude)> ResolveApproxLocationAsync(FitBarkDog dog, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dog.Zip) || string.IsNullOrWhiteSpace(dog.Country))
            {
                return (null, null);
            }

            var apiKey = _configuration["WeatherApi:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogDebug("WeatherApi key not configured; skipping approximate location resolution for {DogSlug}", dog.DogSlug);
                return (null, null);
            }

            try
            {
                var zip = Uri.EscapeDataString(dog.Zip.Trim());
                var country = Uri.EscapeDataString(dog.Country.Trim());
                var url = $"http://api.openweathermap.org/geo/1.0/zip?zip={zip},{country}&appid={apiKey}";

                var client = _httpClientFactory.CreateClient();
                using var response = await client.GetAsync(url, ct);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogDebug(
                        "Unable to resolve location for {DogSlug} with zip {Zip}/{Country}. Status: {StatusCode}",
                        dog.DogSlug,
                        dog.Zip,
                        dog.Country,
                        response.StatusCode);
                    return (null, null);
                }

                var payload = await response.Content.ReadAsStringAsync(ct);
                using var json = JsonDocument.Parse(payload);
                if (!json.RootElement.TryGetProperty("lat", out var latProp) ||
                    !json.RootElement.TryGetProperty("lon", out var lonProp))
                {
                    return (null, null);
                }

                return (latProp.GetDouble(), lonProp.GetDouble());
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Approximate location lookup failed for {DogSlug}", dog.DogSlug);
                return (null, null);
            }
        }

        private static async Task UpsertFitBarkActivityLog(
            AppDbContext context,
            string dogSlug,
            DateTime actDate,
            FitBarkActivityRecord activity,
            CancellationToken ct)
        {
            var existingLog = await context.FitBarkActivityLogs
                .FirstOrDefaultAsync(l => l.DogSlug == dogSlug && l.ActivityDate == actDate, ct);

            if (existingLog == null)
            {
                context.FitBarkActivityLogs.Add(new FitBarkActivityLog
                {
                    Id = Guid.NewGuid(),
                    DogSlug = dogSlug,
                    ActivityDate = DateTime.SpecifyKind(actDate, DateTimeKind.Utc),
                    ActivityValue = activity.ActivityValue,
                    MinPlay = activity.MinPlay,
                    MinActive = activity.MinActive,
                    MinRest = activity.MinRest,
                    NapTime = activity.NapTime,
                    FetchedAt = DateTime.UtcNow
                });
                return;
            }

            existingLog.ActivityValue = activity.ActivityValue;
            existingLog.MinPlay = activity.MinPlay;
            existingLog.MinActive = activity.MinActive;
            existingLog.MinRest = activity.MinRest;
            existingLog.NapTime = activity.NapTime;
            existingLog.FetchedAt = DateTime.UtcNow;
        }

        private (string FromDate, string ToDate, string Resolution) BuildActivityWindow()
        {
            var resolution = (_configuration["FitBark:ActivityResolution"] ?? "DAILY").Trim().ToUpperInvariant();
            if (resolution != "MINUTE" && resolution != "HOURLY" && resolution != "DAILY")
            {
                resolution = "DAILY";
            }

            if (resolution == "DAILY")
            {
                return (
                    DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                    DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    resolution);
            }

            var lookbackMinutes = _configuration.GetValue<int>("FitBark:LookbackMinutes", 20);
            if (lookbackMinutes < 5)
            {
                lookbackMinutes = 5;
            }

            var toUtc = DateTime.UtcNow;
            var fromUtc = toUtc.AddMinutes(-lookbackMinutes);

            return (
                fromUtc.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                toUtc.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                resolution);
        }

        private static DateTime NormalizeTimestamp(DateTime value, string resolution)
        {
            var utc = value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);

            if (resolution == "MINUTE")
            {
                return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, utc.Minute, 0, DateTimeKind.Utc);
            }

            if (resolution == "HOURLY")
            {
                return new DateTime(utc.Year, utc.Month, utc.Day, utc.Hour, 0, 0, DateTimeKind.Utc);
            }

            return new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);
        }

        /// <summary>
        /// Determine the dog's state based on the dominant activity in the FitBark time window.
        /// Returns the state with the highest duration: "playing", "active", "sleeping", "resting", or "unknown".
        /// </summary>
        private static string DetermineDogState(int minPlay, int minActive, int minRest, int napTime)
        {
            var activities = new[] { minPlay, minActive, napTime, minRest };
            var maxActivity = activities.Max();

            if (maxActivity == 0)
                return "unknown";

            if (minPlay == maxActivity)
                return "playing";
            if (minActive == maxActivity)
                return "active";
            if (napTime == maxActivity)
                return "sleeping";
            
            return "resting";
        }

        /// <summary>
        /// ⚠️ Behavior-inferred estimates — NOT medically measured values.
        /// HR (bpm):      72–160   | base 72 bpm at rest, scales with activity intensity
        /// Temp (°C):     38.3–39.2| base 38.3°C at rest, +0.9°C max at peak activity
        /// Resp (br/min): 16–34    | base 16 at rest, +18 at peak; reduced by heavy napping
        /// intensityRatio = min_active / (min_active + min_rest + 1)
        /// activityLevel  = min(1, activity_value / 1200)
        /// activityScore  = 0.5 * intensityRatio + 0.5 * activityLevel
        /// </summary>
        private static (int EstimatedHeartRate, double EstimatedTemperature, double EstimatedRespiration)
            EstimateVitalsFromActivity(int activityValue, int minActive, int minRest, int minPlay, int napTime)
        {
            var totalMinutes   = minActive + minRest + 1;
            var intensityRatio = Math.Min(1.0, (double)minActive / totalMinutes);
            var activityLevel  = Math.Min(1.0, activityValue / 1200.0);
            var activityScore  = (intensityRatio * 0.5) + (activityLevel * 0.5);

            var estimatedHR   = (int)Math.Round(72 + (activityScore * 88));
            var estimatedTemp = Math.Round(38.3 + (activityScore * 0.9), 1);
            var estimatedResp = Math.Round(16.0 + (activityScore * 18.0), 1);

            // Nap drag: heavy napping pulls HR and respiration slightly lower
            if (napTime > 60)
            {
                var napDrag = Math.Min(0.15, (napTime - 60) / 600.0);
                estimatedHR   = (int)Math.Round(estimatedHR * (1 - napDrag));
                estimatedResp = Math.Round(estimatedResp * (1 - napDrag), 1);
            }

            return (estimatedHR, estimatedTemp, estimatedResp);
        }
    }
}