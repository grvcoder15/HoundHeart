using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/fitbit")]
    [ApiController]
    public class FitbitAuthController : ControllerBase
    {
        private readonly IFitbitTokenService _fitbitTokenService;
        private readonly IUserRepository _userRepository;
        private readonly IMemoryCache _memoryCache;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FitbitAuthController> _logger;
        private readonly HttpClient _httpClient;
        private readonly IVitalsService _vitalsService;
        private readonly IWeatherService _weatherService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AppDbContext _context;

        public FitbitAuthController(
            IFitbitTokenService fitbitTokenService,
            IUserRepository userRepository,
            IMemoryCache memoryCache,
            IConfiguration configuration,
            ILogger<FitbitAuthController> logger,
            HttpClient httpClient,
            IVitalsService vitalsService,
            IWeatherService weatherService,
            IServiceScopeFactory scopeFactory,
            AppDbContext context)
        {
            _fitbitTokenService = fitbitTokenService;
            _userRepository = userRepository;
            _memoryCache = memoryCache;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
            _vitalsService = vitalsService;
            _weatherService = weatherService;
            _scopeFactory = scopeFactory;
            _context = context;

            // Fitbit API requires a User-Agent header
            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "HoundHeart-App/1.0");
            }
        }

        /// <summary>
        /// Initiates Fitbit connection flow for a specific user
        /// </summary>
        /// <param name="userId">User ID from query string</param>
        /// <returns>Redirect to Fitbit authorization URL</returns>
        [HttpGet("connect")]
        public async Task<IActionResult> Connect([FromQuery] string? userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Connect endpoint called without userId parameter");
                    return BadRequest(new { error = "userId parameter is required" });
                }

                // Validate that the user exists
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Fitbit connect attempted for non-existent user: {UserId}", userId);
                    return BadRequest(new { error = "User not found" });
                }

                // Generate a unique state parameter
                var state = Guid.NewGuid().ToString("N");

                // Store state → userId mapping in cache for 10 minutes
                var stateCacheKey = $"fitbit_state_{state}";
                _memoryCache.Set(stateCacheKey, userId, TimeSpan.FromMinutes(10));

                _logger.LogInformation("Stored state mapping for Fitbit OAuth: {State} → {UserId}", state, userId);

                // Get the Fitbit authorization URL
                var authorizationUrl = await _fitbitTokenService.GetAuthorizationUrlAsync(userId, state);

                _logger.LogInformation("Generated Fitbit authorization URL for user {UserId}", userId);

                // Return redirect to Fitbit authorization URL
                return Redirect(authorizationUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating Fitbit connection for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to initiate Fitbit connection", detail = ex.Message });
            }
        }

        /// <summary>
        /// Handles callback from Fitbit OAuth authorization
        /// </summary>
        /// <param name="code">Authorization code from Fitbit</param>
        /// <param name="state">State parameter for validation</param>
        /// <returns>Success response with Fitbit user ID</returns>
        [HttpGet("callback")]
        public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state)
        {
            try
            {
                if (string.IsNullOrEmpty(code))
                {
                    _logger.LogWarning("Fitbit callback received without authorization code");
                    return BadRequest(new { error = "Authorization code is missing" });
                }

                if (string.IsNullOrEmpty(state))
                {
                    _logger.LogWarning("Fitbit callback received without state parameter");
                    return BadRequest(new { error = "State parameter is missing" });
                }

                // Validate state exists in cache and retrieve userId
                var stateCacheKey = $"fitbit_state_{state}";
                if (!_memoryCache.TryGetValue(stateCacheKey, out string? userId) || string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Invalid or expired state parameter in Fitbit callback: {State}", state);
                    return BadRequest(new { error = "Invalid or expired state parameter" });
                }

                _logger.LogInformation("Processing Fitbit callback for user {UserId} with state {State}", userId, state);

                // Exchange authorization code for tokens
                var tokenResponse = await _fitbitTokenService.ExchangeCodeForTokensAsync(code, state);

                // Calculate token expiry time
                var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

                // Save tokens using repository
                await _userRepository.SaveFitbitTokensAsync(userId, tokenResponse.AccessToken, tokenResponse.RefreshToken, expiresAt, tokenResponse.UserId);

                // Create or update DeviceConnection for Fitbit device
                if (Guid.TryParse(userId, out var userIdGuid))
                {
                    var existingConnection = await _context.DeviceConnections
                        .FirstOrDefaultAsync(dc => dc.UserId == userIdGuid && dc.DeviceType == "Fitbit");

                    if (existingConnection != null)
                    {
                        existingConnection.IsConnected = true;
                        existingConnection.ConnectedAt = DateTime.UtcNow;
                        existingConnection.DisconnectedAt = null;
                        _logger.LogInformation("✅ Updated Fitbit DeviceConnection for user {UserId}", userId);
                    }
                    else
                    {
                        var deviceConnection = new DeviceConnection
                        {
                            Id = Guid.NewGuid(),
                            UserId = userIdGuid,
                            DeviceType = "Fitbit",
                            DeviceNumber = tokenResponse.UserId ?? "unknown",
                            IsConnected = true,
                            ConnectedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.DeviceConnections.Add(deviceConnection);
                        _logger.LogInformation("✅ Created Fitbit DeviceConnection for user {UserId}", userId);
                    }
                    await _context.SaveChangesAsync();
                }

                // Store token expiry in cache for quick access
                var expiryCacheKey = $"fitbit_expiry_{userId}";
                _memoryCache.Set(expiryCacheKey, expiresAt, TimeSpan.FromHours(8)); // Cache for token lifetime

                // Clean up the state cache entry
                _memoryCache.Remove(stateCacheKey);

                _logger.LogInformation("Fitbit tokens saved successfully for user {UserId}, expires at {ExpiresAt}", userId, expiresAt);

                // Start an immediate initial sync to pull health data + weather + location
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user != null)
                {
                    _logger.LogInformation("Starting initial Fitbit sync for user {UserId} after authorization", userId);
                    // Run it in the background so the user doesn't wait for the API call to finish
                    _ = Task.Run(async () => await SyncUserFitbitDataInternal(user));
                }

                return Ok(new
                {
                    message = "Fitbit connected successfully and initial sync started",
                    fitbitUserId = tokenResponse.UserId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Fitbit callback with code {Code} and state {State}", code, state);
                
                return BadRequest(new
                {
                    error = "Failed to process Fitbit authorization",
                    detail = ex.Message
                });
            }
        }

        /// <summary>
        /// Initiates Fitbit OAuth 2.0 authorization flow
        /// </summary>
        /// <param name="userId">User ID to connect Fitbit account</param>
        /// <returns>Authorization URL for OAuth flow</returns>
        [HttpGet("auth/authorize/{userId}")]
        public async Task<IActionResult> AuthorizeUser(string? userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID is required" });
                }

                // Validate user exists
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                // Generate state parameter for security
                var state = Guid.NewGuid().ToString("N");
                _memoryCache.Set($"fitbit_state_{state}", userId, TimeSpan.FromMinutes(10));

                // Check if mock mode is enabled
                var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
                
                // Get authorization URL
                // In a real flow, we always go to Fitbit. UseMock is typically for data retrieval.
                var authUrl = await _fitbitTokenService.GetAuthorizationUrlAsync(userId, state);
                _logger.LogInformation("🔐 Generated real Fitbit auth URL for user: {UserId}", userId);

                return Ok(new 
                { 
                    success = true, 
                    data = new { authUrl }, 
                    message = "Authorization URL generated successfully" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generating Fitbit auth URL for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        /// <summary>
        /// Manually trigger a refresh of Fitbit data for a user
        /// </summary>
        /// <param name="userId">User ID to sync</param>
        /// <returns>Status of the sync operation</returns>
        [HttpGet("sync/{userId}")]
        public async Task<IActionResult> SyncData(string? userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID is required" });
                }

                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                if (string.IsNullOrEmpty(user.FitbitAccessToken))
                {
                    return BadRequest(new { success = false, message = "Fitbit is not connected for this user" });
                }

                _logger.LogInformation("🔄 Manual sync triggered for user {UserId}", userId);

                // Use the IntegrationService if available, or call internal logic
                // For direct response, we'll use a direct sync approach
                var result = await SyncUserFitbitDataInternal(user);

                return Ok(new 
                { 
                    success = result, 
                    message = result ? "Sync completed successfully" : "Sync partially failed or no new data found",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error during manual Fitbit sync for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<bool> SyncUserFitbitDataInternal(User user)
        {
            using var scope = _scopeFactory.CreateScope();
            var vitalsService = scope.ServiceProvider.GetRequiredService<IVitalsService>();
            var weatherService = scope.ServiceProvider.GetRequiredService<IWeatherService>();

            try 
            {
                var userId = user.UserId.ToString();
                var fitbitBaseUrl = _configuration["Fitbit:BaseUrl"] ?? "https://api.fitbit.com";

                // Ensure token is valid
                var validToken = user.FitbitAccessToken;
                if (string.IsNullOrEmpty(validToken)) return false;

                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", validToken);

                // Detect Location via IP (matches frontend logic)
                double latitude = 23.3441; // Default fallback
                double longitude = 85.3096;
                try {
                    var geoResponse = await _httpClient.GetStringAsync("https://get.geojs.io/v1/ip/geo.json");
                    using var geoDoc = System.Text.Json.JsonDocument.Parse(geoResponse);
                    if (geoDoc.RootElement.TryGetProperty("latitude", out var latProp) && 
                        geoDoc.RootElement.TryGetProperty("longitude", out var lonProp)) {
                        latitude = double.Parse(latProp.GetString() ?? "23.3441");
                        longitude = double.Parse(lonProp.GetString() ?? "85.3096");
                    }
                } catch { _logger.LogWarning("IP-based location detection failed, using fallback."); }

                var weather = await weatherService.GetCurrentWeather(latitude, longitude);

                // 1. Get Actual Device Sync Time
                DateTime syncTimestamp = DateTime.UtcNow;
                try {
                    var devicesResponse = await _httpClient.GetStringAsync($"{fitbitBaseUrl}/1/user/-/devices.json");
                    using var deviceDoc = System.Text.Json.JsonDocument.Parse(devicesResponse);
                    var deviceArr = deviceDoc.RootElement.EnumerateArray();
                    var latestDevice = deviceArr.OrderByDescending(d => d.TryGetProperty("lastSyncTime", out var lst) ? lst.GetDateTime() : DateTime.MinValue).FirstOrDefault();
                    if (latestDevice.ValueKind != System.Text.Json.JsonValueKind.Undefined && latestDevice.TryGetProperty("lastSyncTime", out var lastSync)) {
                        syncTimestamp = lastSync.GetDateTime();
                    }
                } catch { _logger.LogWarning("Could not fetch device sync time for manual sync"); }

                // Create a single record to hold all data from this sync
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

                // 1. Fetch Steps, Calories, Distance, & Active Minutes (Daily Summary)
                try {
                    var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var summaryUrl = $"{fitbitBaseUrl}/1/user/-/activities/date/{dateStr}.json";
                    var summaryResponse = await _httpClient.GetStringAsync(summaryUrl);
                    _logger.LogInformation("[DEBUG] RAW Fitbit Summary JSON: {Json}", summaryResponse);
                    
                    var summaryDoc = System.Text.Json.JsonDocument.Parse(summaryResponse);
                    if (summaryDoc.RootElement.TryGetProperty("summary", out var summary)) {
                        // Steps (Robust parsing: handle string or number)
                        if (summary.TryGetProperty("steps", out var s))
                            consolidatedRecord.Steps = s.ValueKind == JsonValueKind.String ? (int.TryParse(s.GetString(), out var stepVal) ? stepVal : 0) : s.GetInt32();

                        // Calories (Resilient Parsing)
                        double calVal = 0;
                        if (summary.TryGetProperty("activityCalories", out var ac))
                            calVal = ac.ValueKind == JsonValueKind.Number ? ac.GetDouble() : (double.TryParse(ac.ToString(), out var dv) ? dv : 0);
                        
                        if (calVal == 0 && summary.TryGetProperty("caloriesOut", out var co))
                            calVal = co.ValueKind == JsonValueKind.Number ? co.GetDouble() : (double.TryParse(co.ToString(), out var dv) ? dv : 0);
                        
                        consolidatedRecord.Calories = calVal;

                        // Active Minutes (Resilient Parsing)
                        int vaMins = 0;
                        if (summary.TryGetProperty("veryActiveMinutes", out var va))
                            vaMins = va.ValueKind == JsonValueKind.Number ? (int)va.GetDouble() : (int.TryParse(va.ToString(), out var iv) ? iv : 0);
                            
                        int faMins = 0;
                        if (summary.TryGetProperty("fairlyActiveMinutes", out var fa))
                            faMins = fa.ValueKind == JsonValueKind.Number ? (int)fa.GetDouble() : (int.TryParse(fa.ToString(), out var iv) ? iv : 0);
                            
                        consolidatedRecord.ActiveMinutes = vaMins + faMins;
                        
                        // Extract Best Distance
                        if (summary.TryGetProperty("distances", out var distances) && distances.ValueKind == JsonValueKind.Array) {
                            double maxDist = 0;
                            foreach (var dist in distances.EnumerateArray()) {
                                if (dist.TryGetProperty("distance", out var d)) {
                                    double dVal = d.ValueKind == JsonValueKind.String ? (double.TryParse(d.GetString(), out var v) ? v : 0) : d.GetDouble();
                                    if (dVal > maxDist) maxDist = dVal;
                                }
                            }
                            consolidatedRecord.Distance = maxDist;
                        }

                        // Step Fallback: If summary steps are 0, check activities array for manual logs
                        if (consolidatedRecord.Steps == 0 && summaryDoc.RootElement.TryGetProperty("activities", out var actList) && actList.ValueKind == JsonValueKind.Array) {
                            int totalActSteps = 0;
                            foreach (var act in actList.EnumerateArray()) {
                                if (act.TryGetProperty("steps", out var actS))
                                    totalActSteps += actS.ValueKind == JsonValueKind.String ? (int.TryParse(actS.GetString(), out var av) ? av : 0) : actS.GetInt32();
                            }
                            consolidatedRecord.Steps = totalActSteps;
                        }
                    }
                } catch (Exception ex) { _logger.LogWarning("Summary sync failed: {Msg}", ex.Message); }

                // 2. Fetch Heart Rate (Resting)
                try {
                    var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var hrUrl = $"{fitbitBaseUrl}/1/user/-/activities/heart/date/{dateStr}/1d.json";
                    var hrResponse = await _httpClient.GetStringAsync(hrUrl);
                    var hrDoc = System.Text.Json.JsonDocument.Parse(hrResponse);
                    if (hrDoc.RootElement.TryGetProperty("activities-heart", out var heartArr) && heartArr.GetArrayLength() > 0) {
                        var val = heartArr[0].GetProperty("value");
                        if (val.TryGetProperty("restingHeartRate", out var rhr)) {
                            consolidatedRecord.HeartRate = rhr.GetInt32();
                        }
                    }
                } catch (Exception ex) { _logger.LogWarning("HR sync failed: {Msg}", ex.Message); }

                // 3. Fetch HRV
                try {
                    var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var hrvUrl = $"{fitbitBaseUrl}/1/user/-/hrv/date/{dateStr}.json";
                    var hrvResponse = await _httpClient.GetStringAsync(hrvUrl);
                    _logger.LogInformation("[DEBUG] RAW Fitbit HRV JSON: {Json}", hrvResponse);
                    var hrvDoc = System.Text.Json.JsonDocument.Parse(hrvResponse);
                    if (hrvDoc.RootElement.TryGetProperty("hrv", out var hrvArr) && hrvArr.GetArrayLength() > 0) {
                        consolidatedRecord.HRV = hrvArr[0].GetProperty("value").GetProperty("dailyRmssd").GetDouble();
                    }
                } catch (Exception ex) { _logger.LogWarning("HRV sync failed: {Msg}", ex.Message); }

                // 4. Fetch Sleep
                try {
                    var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var sleepUrl = $"{fitbitBaseUrl}/1.2/user/-/sleep/date/{dateStr}.json";
                    var sleepResponse = await _httpClient.GetStringAsync(sleepUrl);
                    _logger.LogInformation("[DEBUG] RAW Fitbit Sleep JSON: {Json}", sleepResponse);
                    var sleepDoc = System.Text.Json.JsonDocument.Parse(sleepResponse);
                    if (sleepDoc.RootElement.TryGetProperty("sleep", out var sleepArr) && sleepArr.GetArrayLength() > 0) {
                        var mainSleep = sleepArr[0];
                        
                        // Duration (ms to minutes)
                        if (mainSleep.TryGetProperty("duration", out var dur)) {
                            long ms = dur.GetInt64();
                            consolidatedRecord.SleepMinutes = (int)(ms / 60000);
                        }
                    }
                } catch (Exception ex) { _logger.LogWarning("Sleep sync failed: {Msg}", ex.Message); }

                // SAVE EVERYTHING ONCE
                await vitalsService.SaveHumanVitalAsync(consolidatedRecord);

                return true; 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Detailed sync failure for {UserId}", user.UserId);
                return false;
            }
        }

        /// <summary>
        /// Get Fitbit connection status for a user
        /// </summary>
        /// <param name="userId">User ID to check</param>
        /// <returns>Connection status and details</returns>
        [HttpGet("auth/status/{userId}")]
        public async Task<IActionResult> GetConnectionStatus(string? userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID is required" });
                }

                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                var isConnected = !string.IsNullOrEmpty(user.FitbitAccessToken);
                var isExpired = isConnected && user.FitbitTokenExpiresAt.HasValue && 
                               DateTime.UtcNow >= user.FitbitTokenExpiresAt.Value.AddMinutes(-5);

                return Ok(new 
                {
                    success = isConnected,
                    data = isConnected ? new 
                    {
                        fitbitUserId = user.FitbitUserId,
                        expiresAt = user.FitbitTokenExpiresAt,
                        lastSync = "Active"
                    } : null,
                    message = isConnected ? "Fitbit connected" : "Fitbit not connected"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error checking Fitbit status for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Disconnect Fitbit for a user
        /// </summary>
        /// <param name="userId">User ID to disconnect</param>
        /// <returns>Success response</returns>
        [HttpPost("auth/disconnect/{userId}")]
        public async Task<IActionResult> DisconnectUser(string? userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { success = false, message = "User ID is required" });
                }

                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { success = false, message = "User not found" });
                }

                // Clear Fitbit tokens
                user.FitbitAccessToken = null;
                user.FitbitRefreshToken = null;
                user.FitbitTokenExpiresAt = null;
                user.FitbitUserId = null;

                await _userRepository.UpdateUserAsync(user);

                // Clear cache
                _memoryCache.Remove($"fitbit_expiry_{userId}");

                _logger.LogInformation("📱 Fitbit disconnected for user: {UserId}", userId);

                return Ok(new { success = true, message = "Fitbit disconnected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error disconnecting Fitbit for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}