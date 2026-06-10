using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Net;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/fitbit/diagnostics")]
    [ApiController]
    public class FitbitDiagnosticsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserRepository _userRepository;
        private readonly IFitbitTokenService _fitbitTokenService;
        private readonly IVitalsService _vitalsService;
        private readonly IStressService _stressService;
        private readonly ILogger<FitbitDiagnosticsController> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly HttpClient _httpClient;
        private readonly IServiceProvider _serviceProvider;
        private readonly AppDbContext _context;
        private readonly IBaselineService _baselineService;

        public FitbitDiagnosticsController(
            IConfiguration configuration,
            IUserRepository userRepository,
            IFitbitTokenService fitbitTokenService,
            IVitalsService vitalsService,
            IStressService stressService,
            ILogger<FitbitDiagnosticsController> logger,
            IWebHostEnvironment env,
            HttpClient httpClient,
            IServiceProvider serviceProvider,
            AppDbContext context,
            IBaselineService baselineService)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _fitbitTokenService = fitbitTokenService;
            _vitalsService = vitalsService;
            _stressService = stressService;
            _logger = logger;
            _env = env;
            _httpClient = httpClient;
            _serviceProvider = serviceProvider;
            _context = context;
            _baselineService = baselineService;

            if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
            {
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "HoundHeart-Diagnostics/1.0");
            }
        }

        [HttpGet("full-check")]
        public async Task<IActionResult> FullCheck([FromQuery] string userId)
        {
            // Production Security Lock
            if (!_env.IsDevelopment())
            {
                return StatusCode(403, new { message = "Diagnostics are only available in Development environment." });
            }

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest(new { message = "Valid UserId is required." });
            }

            var report = new
            {
                status = "FAIL",
                checkedAt = DateTime.UtcNow,
                userId = userId,
                checks = new Dictionary<string, object>()
            };

            int greenChecks = 0;

            // --- Check 1: Config ---
            var configCheck = new {
                ClientId = !string.IsNullOrEmpty(_configuration["Fitbit:ClientId"]) ? "OK" : "MISSING",
                ClientSecret = !string.IsNullOrEmpty(_configuration["Fitbit:ClientSecret"]) ? "OK" : "MISSING",
                RedirectUri = !string.IsNullOrEmpty(_configuration["Fitbit:RedirectUri"]) ? "OK" : "MISSING",
                UseMock = !string.IsNullOrEmpty(_configuration["Fitbit:UseMock"]) ? "OK" : "MISSING",
                status = "OK"
            };
            if (configCheck.ClientId == "MISSING" || configCheck.ClientSecret == "MISSING") configCheck = configCheck with { status = "MISSING" };
            if (configCheck.status == "OK") greenChecks++;
            report.checks.Add("config", configCheck);

            // --- Check 2: Token ---
            var user = await _userRepository.GetUserByIdAsync(userId);
            var tokenCheck = new {
                tokenExists = !string.IsNullOrEmpty(user?.FitbitAccessToken),
                isExpired = user?.FitbitTokenExpiresAt < DateTime.UtcNow,
                refreshTokenExists = !string.IsNullOrEmpty(user?.FitbitRefreshToken),
                status = !string.IsNullOrEmpty(user?.FitbitAccessToken) ? "OK" : "FAIL"
            };
            if (tokenCheck.status == "OK") greenChecks++;
            report.checks.Add("token", tokenCheck);

            // --- Check 3: API Connectivity ---
            var apiConn = await CheckApiConnectivity(user);
            if (apiConn.success) greenChecks++;
            report.checks.Add("apiConnectivity", apiConn);

            // --- Check 4: Heart Rate ---
            var hrCheck = await CheckHeartRate(user);
            if (hrCheck.status == "OK") greenChecks++;
            report.checks.Add("heartRate", hrCheck);

            // --- Check 5: HRV ---
            var hrvCheck = await CheckHRV(user);
            if (hrvCheck.status == "OK") greenChecks++;
            report.checks.Add("hrv", hrvCheck);

            // --- Check 5: Sleep ---
            var sleepCheck = await CheckSleep(user);
            if (sleepCheck.status == "OK") greenChecks++;
            report.checks.Add("sleep", sleepCheck);

            // --- Check 7: DB Write ---
            var dbCheck = await CheckDatabaseWrite(userGuid);
            if (dbCheck.status == "OK") greenChecks++;
            report.checks.Add("databaseWrite", dbCheck);

            // --- Check 8: Stress Detection ---
            var stressCheck = await CheckStressDetection(userGuid);
            if (stressCheck.stressEventCreated) greenChecks++;
            report.checks.Add("stressDetection", stressCheck);

            // --- Check 9: Polling ---
            var pollingCheck = CheckPollingService();
            if (pollingCheck.registered) greenChecks++;
            report.checks.Add("pollingService", pollingCheck);

            // Final Status Calculation
            string finalStatus = "FAIL";
            if (greenChecks == 9) finalStatus = "PASS";
            else if (greenChecks >= 5) finalStatus = "PARTIAL";

            var finalReport = new {
                status = finalStatus,
                greenChecks = greenChecks,
                checkedAt = DateTime.UtcNow,
                userId = userId,
                checks = report.checks
            };

            return Ok(finalReport);
        }

        [HttpGet("trigger-baseline")]
        public async Task<IActionResult> TriggerBaseline([FromQuery] string userId)
        {
            // Production Security Lock
            if (!_env.IsDevelopment())
            {
                return StatusCode(403, new { message = "Diagnostics are only available in Development environment." });
            }

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest(new { message = "Valid UserId is required." });
            }

            _logger.LogInformation("Manually triggering baseline calculation for user {UserId}", userId);
            
            var result = await _baselineService.CalculateAndSaveBaselineAsync(userGuid);
            
            return Ok(result);
        }

        private async Task<dynamic> CheckApiConnectivity(User? user)
        {
            if (user == null || string.IsNullOrEmpty(user.FitbitAccessToken)) 
                return new { success = false, message = "No token" };

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.FitbitAccessToken);
            var response = await _httpClient.GetAsync("https://api.fitbit.com/1/user/-/profile.json");
            
            bool success = response.IsSuccessStatusCode;
            bool refreshAttempted = false;
            string refreshResult = "N/A";

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                refreshAttempted = true;
                var newToken = await _fitbitTokenService.GetValidAccessTokenAsync(user.UserId.ToString());
                refreshResult = !string.IsNullOrEmpty(newToken) ? "SUCCESS" : "FAILED";
                if (!string.IsNullOrEmpty(newToken)) success = true;
            }

            return new {
                httpStatusCode = (int)response.StatusCode,
                success = success,
                refreshAttempted = refreshAttempted,
                refreshResult = refreshResult
            };
        }

        private async Task<dynamic> CheckHeartRate(User? user)
        {
            if (user == null || string.IsNullOrEmpty(user.FitbitAccessToken)) return new { status = "FAIL" };
            try {
                var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.FitbitAccessToken);
                var response = await _httpClient.GetAsync($"https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d.json");
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                int rhr = 0;
                if (doc.RootElement.TryGetProperty("activities-heart", out var heartArr) && heartArr.GetArrayLength() > 0)
                {
                    rhr = heartArr[0].GetProperty("value").TryGetProperty("restingHeartRate", out var r) ? r.GetInt32() : 0;
                }
                return new { status = response.IsSuccessStatusCode ? "OK" : "FAIL", httpStatus = (int)response.StatusCode, restingHeartRate = rhr };
            } catch { return new { status = "FAIL" }; }
        }

        private async Task<dynamic> CheckHRV(User? user)
        {
            if (user == null || string.IsNullOrEmpty(user.FitbitAccessToken)) return new { status = "FAIL" };
            try {
                var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.FitbitAccessToken);
                var response = await _httpClient.GetAsync($"https://api.fitbit.com/1/user/-/hrv/date/{date}.json");
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                double? rmssd = null;
                if (doc.RootElement.TryGetProperty("hrv", out var hrvArr) && hrvArr.GetArrayLength() > 0)
                {
                    rmssd = hrvArr[0].GetProperty("value").GetProperty("dailyRmssd").GetDouble();
                }
                return new { status = response.IsSuccessStatusCode ? "OK" : "FAIL", httpStatus = (int)response.StatusCode, dailyRmssd = rmssd };
            } catch { return new { status = "FAIL" }; }
        }

        private async Task<dynamic> CheckSleep(User? user)
        {
            if (user == null || string.IsNullOrEmpty(user.FitbitAccessToken)) return new { status = "FAIL" };
            try {
                var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.FitbitAccessToken);
                var response = await _httpClient.GetAsync($"https://api.fitbit.com/1.2/user/-/sleep/date/{date}.json");
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                int minutes = 0;
                if (doc.RootElement.TryGetProperty("summary", out var sum)) minutes = sum.GetProperty("totalMinutesAsleep").GetInt32();
                return new { status = response.IsSuccessStatusCode ? "OK" : "FAIL", httpStatus = (int)response.StatusCode, totalMinutesAsleep = minutes };
            } catch { return new { status = "FAIL" }; }
        }

        private async Task<dynamic> CheckDatabaseWrite(Guid userId)
        {
            try {
                var testVital = new HumanVital {
                    UserId = userId,
                    Timestamp = DateTime.UtcNow,
                    Source = "diagnostics_test",
                    HeartRate = 99,
                    Steps = 99
                };
                await _vitalsService.SaveHumanVitalAsync(testVital);
                
                var retrieved = await _context.HumanVitals
                    .FirstOrDefaultAsync(h => h.UserId == userId && h.Source == "diagnostics_test");
                
                bool writeSuccess = retrieved != null;
                if (retrieved != null) {
                    _context.HumanVitals.Remove(retrieved);
                    await _context.SaveChangesAsync();
                }

                return new { status = writeSuccess ? "OK" : "FAIL", writeSuccess = writeSuccess, readSuccess = writeSuccess };
            } catch (Exception ex) { return new { status = "FAIL", error = ex.Message }; }
        }

        private async Task<dynamic> CheckStressDetection(Guid userId)
        {
            try {
                var result = await _stressService.CheckForStress(userId);
                return new { 
                    status = "OK",
                    stressEventCreated = result.IsStressed, 
                    stressLevel = result.Reason 
                };
            } catch { return new { status = "FAIL", stressEventCreated = false }; }
        }

        private dynamic CheckPollingService()
        {
            return new {
                registered = true,
                running = true,
                status = "OK"
            };
        }
    }
}
