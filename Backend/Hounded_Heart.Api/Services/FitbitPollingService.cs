using System.Diagnostics.CodeAnalysis;
using System.Net.Http.Headers;
using System.Text.Json;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace Hounded_Heart.Api.Services
{
    [ExcludeFromCodeCoverage]
    public class FitbitPollingService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<FitbitPollingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _fitbitBaseUrl;

        public FitbitPollingService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<FitbitPollingService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _fitbitBaseUrl = _configuration["Fitbit:BaseUrl"] ?? "https://api.fitbit.com";
            
            // Fitbit API requires a User-Agent header
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "HoundHeart-App/1.0");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FitbitPollingService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PollFitbitDataForAllUsers(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during Fitbit polling cycle");
                }

                // Polling interval: 2 minutes 30 seconds (150s) as requested
                var intervalSeconds = _configuration.GetValue<int>("HoundHeart:PreBaselineIntervalSeconds", 150);
                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }

            _logger.LogInformation("FitbitPollingService stopped");
        }

        private async Task PollFitbitDataForAllUsers(CancellationToken ct)
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var fitbitTokenService = scope.ServiceProvider.GetRequiredService<IFitbitTokenService>();
            var vitalsService = scope.ServiceProvider.GetRequiredService<IVitalsService>();
            var weatherService = scope.ServiceProvider.GetRequiredService<IWeatherService>();

            var connectedUsers = await userRepository.GetAllFitbitConnectedUsersAsync();
            _logger.LogInformation("Polling Fitbit data for {UserCount} connected users", connectedUsers.Count);

            foreach (var user in connectedUsers)
            {
                var baselineService = scope.ServiceProvider.GetRequiredService<IBaselineService>();
                await ProcessUserFitbitData(user, userRepository, fitbitTokenService, vitalsService, weatherService, baselineService, ct);
            }
        }

        private async Task ProcessUserFitbitData(
            User user, 
            IUserRepository userRepository, 
            IFitbitTokenService fitbitTokenService,
            IVitalsService vitalsService,
            IWeatherService weatherService,
            IBaselineService baselineService,
            CancellationToken ct)
        {
            try
            {
                _logger.LogDebug("Processing Fitbit data for user {UserId}", user.UserId);

                // Check and refresh token if needed
                var validToken = await EnsureValidToken(user, userRepository, fitbitTokenService);
                if (string.IsNullOrEmpty(validToken))
                {
                    _logger.LogWarning("Unable to obtain valid token for user {UserId}, skipping", user.UserId);
                    return;
                }

                // Set authorization header for API calls
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", validToken);

                // Detect Location via IP (matches frontend logic)
                double latitude = 23.3441; // Default fallback
                double longitude = 85.3096;
                try {
                    var geoResponse = await _httpClient.GetStringAsync("https://get.geojs.io/v1/ip/geo.json");
                    using var geoDoc = JsonDocument.Parse(geoResponse);
                    if (geoDoc.RootElement.TryGetProperty("latitude", out var latProp) && 
                        geoDoc.RootElement.TryGetProperty("longitude", out var lonProp)) {
                        latitude = double.Parse(latProp.GetString() ?? "23.3441");
                        longitude = double.Parse(lonProp.GetString() ?? "85.3096");
                    }
                } catch { _logger.LogWarning("IP-based location detection failed for user {UserId}", user.UserId); }

                var weather = await weatherService.GetCurrentWeather(latitude, longitude);

                // 1. Get Actual Device Sync Time
                DateTime syncTimestamp = DateTime.UtcNow;
                try {
                    var devicesResponse = await _httpClient.GetStringAsync($"{_fitbitBaseUrl}/1/user/-/devices.json");
                    using var deviceDoc = JsonDocument.Parse(devicesResponse);
                    var deviceArr = deviceDoc.RootElement.EnumerateArray();
                    var latestDevice = deviceArr.OrderByDescending(d => d.TryGetProperty("lastSyncTime", out var lst) ? lst.GetDateTime() : DateTime.MinValue).FirstOrDefault();
                    if (latestDevice.ValueKind != JsonValueKind.Undefined && latestDevice.TryGetProperty("lastSyncTime", out var lastSync)) {
                        syncTimestamp = lastSync.GetDateTime();
                        _logger.LogInformation("Real Device Sync Time for {UserId}: {SyncTime}", user.UserId, syncTimestamp);
                    }
                } catch { _logger.LogWarning("Could not fetch device sync time for {UserId}", user.UserId); }

                // Create a single consolidated record
                var consolidatedRecord = new HumanVital
                {
                    UserId = user.UserId,
                    Timestamp = syncTimestamp, // Use actual device sync time!
                    Latitude = latitude,
                    Longitude = longitude,
                    AmbientTemperature = weather?.TemperatureCelsius,
                    WeatherCondition = weather?.Condition,
                    WeatherLocation = weather?.LocationName,
                    DeviceType = "Fitbit",
                    Source = "Fitbit"
                };

                // Fetch data into the consolidated record (with Retries for HR)
                int retries = 0;
                while (retries < 3) {
                    await PopulateConsolidatedData(consolidatedRecord, user.UserId.ToString());
                    
                    if (consolidatedRecord.HeartRate.HasValue && consolidatedRecord.HeartRate > 0) break; // We got the data!

                    _logger.LogWarning("Heart Rate is 0 for {UserId}, waiting 30s for device to sync (Retry {Retry}/3)", user.UserId, retries + 1);
                    retries++;
                    await Task.Delay(TimeSpan.FromSeconds(30), ct);
                }

                // Save the unified record once
                await vitalsService.SaveHumanVitalAsync(consolidatedRecord);

                // Recalculate User Baseline (REMOVED - baseline should only be formed after 15 mins by background service)
                // var result = await baselineService.CalculateAndSaveBaselineAsync(user.UserId, testMode: false);

                _logger.LogInformation("Successfully processed consolidated Fitbit data and baseline for user {UserId}", user.UserId);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                _logger.LogWarning("⚠️ Fitbit API Rate Limit (429) hit for user {UserId}. Sleeping for 60s...", user.UserId);
                await Task.Delay(TimeSpan.FromSeconds(60), ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Fitbit data for user {UserId}", user.UserId);
            }
        }

        private async Task PopulateConsolidatedData(HumanVital record, string userId)
        {
            var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");

            // 1. Fetch Daily Summary (Steps, Calories, Distance, Active Minutes)
            try {
                var url = $"{_fitbitBaseUrl}/1/user/-/activities/date/{dateStr}.json";
                var response = await _httpClient.GetStringAsync(url);
                _logger.LogInformation("[POLLING] RAW Fitbit Summary JSON: {Json}", response);
                using var doc = JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("summary", out var summary)) {
                    // Steps
                    if (summary.TryGetProperty("steps", out var s))
                        record.Steps = s.ValueKind == JsonValueKind.String ? (int.TryParse(s.GetString(), out var stepVal) ? stepVal : 0) : s.GetInt32();

                    // Calories (Resilient Parsing)
                    double calVal = 0;
                    if (summary.TryGetProperty("activityCalories", out var ac))
                        calVal = ac.ValueKind == JsonValueKind.Number ? ac.GetDouble() : (double.TryParse(ac.ToString(), out var dv) ? dv : 0);
                    
                    if (calVal == 0 && summary.TryGetProperty("caloriesOut", out var co))
                        calVal = co.ValueKind == JsonValueKind.Number ? co.GetDouble() : (double.TryParse(co.ToString(), out var dv) ? dv : 0);
                    
                    record.Calories = calVal;

                    // Active Minutes (Resilient Parsing)
                    int vvaMins = 0;
                    if (summary.TryGetProperty("veryActiveMinutes", out var va))
                        vvaMins = va.ValueKind == JsonValueKind.Number ? (int)va.GetDouble() : (int.TryParse(va.ToString(), out var iv) ? iv : 0);
                        
                    int ffaMins = 0;
                    if (summary.TryGetProperty("fairlyActiveMinutes", out var fa))
                        ffaMins = fa.ValueKind == JsonValueKind.Number ? (int)fa.GetDouble() : (int.TryParse(fa.ToString(), out var iv) ? iv : 0);
                        
                    record.ActiveMinutes = vvaMins + ffaMins;
                    
                    // Extract Best Distance
                    if (summary.TryGetProperty("distances", out var distances) && distances.ValueKind == JsonValueKind.Array) {
                        double maxDist = 0;
                        foreach (var dist in distances.EnumerateArray()) {
                            if (dist.TryGetProperty("distance", out var d)) {
                                double dVal = d.ValueKind == JsonValueKind.String ? (double.TryParse(d.GetString(), out var v) ? v : 0) : d.GetDouble();
                                if (dVal > maxDist) maxDist = dVal;
                            }
                        }
                        record.Distance = maxDist;
                    }

                    // Step Fallback: If summary steps are 0, check activities array for manual logs
                    if (record.Steps == 0 && doc.RootElement.TryGetProperty("activities", out var actList) && actList.ValueKind == JsonValueKind.Array) {
                        int totalActSteps = 0;
                        foreach (var act in actList.EnumerateArray()) {
                            if (act.TryGetProperty("steps", out var actS))
                                totalActSteps += actS.ValueKind == JsonValueKind.String ? (int.TryParse(actS.GetString(), out var av) ? av : 0) : actS.GetInt32();
                        }
                        record.Steps = totalActSteps;
                    }
                }
            } catch (Exception ex) { _logger.LogWarning("Summary fetch failed for {UserId}: {Msg}", userId, ex.Message); }

            // 2. Fetch Heart Rate
            try {
                var url = $"{_fitbitBaseUrl}/1/user/-/activities/heart/date/{dateStr}/1d.json";
                var response = await _httpClient.GetStringAsync(url);
                using var doc = JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("activities-heart", out var heartArr) && heartArr.GetArrayLength() > 0) {
                    var val = heartArr[0].GetProperty("value");
                    if (val.TryGetProperty("restingHeartRate", out var rhr)) {
                        record.HeartRate = rhr.GetInt32();
                    } else {
                        record.HeartRate = null; // FIX 1
                    }
                } else {
                    record.HeartRate = null; // FIX 1
                }
            } catch (Exception ex) { _logger.LogWarning("HR fetch failed for {UserId}: {Msg}", userId, ex.Message); }

            // 3. Fetch HRV
            try {
                var url = $"{_fitbitBaseUrl}/1/user/-/hrv/date/{dateStr}.json";
                var response = await _httpClient.GetStringAsync(url);
                using var doc = JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("hrv", out var hrvArr) && hrvArr.GetArrayLength() > 0) {
                    record.HRV = hrvArr[0].GetProperty("value").GetProperty("dailyRmssd").GetDouble();
                } else {
                    record.HRV = null; // FIX 1
                }
            } catch (Exception ex) { _logger.LogWarning("HRV fetch failed for {UserId}: {Msg}", userId, ex.Message); }

            // 4. Fetch Sleep
            try {
                var url = $"{_fitbitBaseUrl}/1.2/user/-/sleep/date/{dateStr}.json";
                var response = await _httpClient.GetStringAsync(url);
                using var doc = JsonDocument.Parse(response);
                if (doc.RootElement.TryGetProperty("sleep", out var sleepArr) && sleepArr.GetArrayLength() > 0) {
                    var mainSleep = sleepArr[0];
                    // SleepScore removed as per FIX 5
                    
                    if (mainSleep.TryGetProperty("duration", out var dur)) {
                        record.SleepMinutes = (int)(dur.GetInt64() / 60000);
                    }

                    // Extract Sleep Stages (Summary)
                    if (mainSleep.TryGetProperty("levels", out var levels) && 
                        levels.TryGetProperty("summary", out var summary)) {
                        
                        if (summary.TryGetProperty("deep", out var deep) && deep.TryGetProperty("minutes", out var dm))
                            record.DeepSleepMinutes = dm.GetInt32();
                        
                        if (summary.TryGetProperty("rem", out var rem) && rem.TryGetProperty("minutes", out var rm))
                            record.RemSleepMinutes = rm.GetInt32();
                            
                        if (summary.TryGetProperty("light", out var light) && light.TryGetProperty("minutes", out var lm))
                            record.LightSleepMinutes = lm.GetInt32();
                            
                        if (summary.TryGetProperty("wake", out var wake) && wake.TryGetProperty("minutes", out var wm))
                            record.AwakeSleepMinutes = wm.GetInt32();
                    }
                }
            } catch (Exception ex) { _logger.LogWarning("Sleep fetch failed for {UserId}: {Msg}", userId, ex.Message); }
        }

        private async Task<string?> EnsureValidToken(
            User user, 
            IUserRepository userRepository, 
            IFitbitTokenService fitbitTokenService)
        {
            try
            {
                // Check if token is expired (with 5-minute buffer)
                if (user.FitbitTokenExpiresAt.HasValue && 
                    DateTime.UtcNow >= user.FitbitTokenExpiresAt.Value.AddMinutes(-5))
                {
                    _logger.LogInformation("Refreshing expired token for user {UserId}", user.UserId);
                    
                    try
                    {
                        var newTokens = await fitbitTokenService.RefreshAccessTokenAsync(user.FitbitRefreshToken!);
                        var expiresAt = DateTime.UtcNow.AddSeconds(newTokens.ExpiresIn);
                        
                        await userRepository.SaveFitbitTokensAsync(
                            user.UserId.ToString(), 
                            newTokens.AccessToken, 
                            newTokens.RefreshToken, 
                            expiresAt);

                        _logger.LogInformation("Token refreshed successfully for user {UserId}", user.UserId);
                        return newTokens.AccessToken;
                    }
                    catch (HttpRequestException ex) when (ex.Message.Contains("401"))
                    {
                        _logger.LogWarning("Token refresh failed with 401 for user {UserId}, marking as disconnected", user.UserId);
                        
                        // Clear tokens to mark user as disconnected
                        await userRepository.SaveFitbitTokensAsync(
                            user.UserId.ToString(), 
                            null!, 
                            null!, 
                            DateTime.MinValue);
                        
                        return null;
                    }
                }

                return user.FitbitAccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring valid token for user {UserId}", user.UserId);
                return null;
            }
        }

    }
}
