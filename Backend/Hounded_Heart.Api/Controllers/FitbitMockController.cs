using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/fitbit/mock")]
    [ApiController]
    public class FitbitMockController : ControllerBase
    {
        private readonly IFitbitMockService _fitbitMockService;
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FitbitMockController> _logger;

        public FitbitMockController(
            IFitbitMockService fitbitMockService,
            IUserRepository userRepository,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<FitbitMockController> logger)
        {
            _fitbitMockService = fitbitMockService;
            _userRepository = userRepository;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Triggers full mock data poll and saves to vitals service
        /// </summary>
        /// <param name="userId">User ID to generate mock data for</param>
        /// <returns>Summary of saved data</returns>
        [HttpPost("trigger")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public async Task<IActionResult> TriggerMockPoll([FromQuery] string userId)
        {
            // Hide from Swagger in production
            if (_environment.IsProduction())
            {
                return NotFound();
            }

            // Check if mock mode is enabled
            var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
            if (!useMock)
            {
                _logger.LogWarning("Mock endpoint accessed but Fitbit:UseMock is disabled");
                return StatusCode(403, new { error = "Mock endpoints are disabled" });
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "userId parameter is required" });
            }

            try
            {
                _logger.LogInformation("Triggering mock poll for user {UserId}", userId);
                
                var summary = await _fitbitMockService.BuildFullMockPoll(userId);
                
                _logger.LogInformation("Mock poll completed for user {UserId}, Success: {Success}", userId, summary.Success);
                
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering mock poll for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to process mock poll", detail = ex.Message });
            }
        }

        /// <summary>
        /// Preview all mock responses without saving data
        /// </summary>
        /// <param name="userId">User ID to generate mock data for</param>
        /// <returns>All mock Fitbit responses for inspection</returns>
        [HttpGet("preview")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public IActionResult PreviewMockData([FromQuery] string userId)
        {
            // Hide from Swagger in production
            if (_environment.IsProduction())
            {
                return NotFound();
            }

            // Check if mock mode is enabled
            var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
            if (!useMock)
            {
                _logger.LogWarning("Mock endpoint accessed but Fitbit:UseMock is disabled");
                return StatusCode(403, new { error = "Mock endpoints are disabled" });
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "userId parameter is required" });
            }

            try
            {
                _logger.LogInformation("Generating mock preview for user {UserId}", userId);
                
                var heartRate = _fitbitMockService.GetMockHeartRateResponse(userId);
                var hrv = _fitbitMockService.GetMockHrvResponse(userId);
                var sleep = _fitbitMockService.GetMockSleepResponse(userId);
                var activity = _fitbitMockService.GetMockActivityResponse(userId);

                var preview = new
                {
                    UserId = userId,
                    GeneratedAt = DateTime.UtcNow,
                    HeartRate = heartRate,
                    Hrv = hrv,
                    Sleep = sleep,
                    Activity = activity
                };

                return Ok(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating mock preview for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to generate mock preview", detail = ex.Message });
            }
        }

        /// <summary>
        /// Generates mock stress event data for testing alert pipeline
        /// </summary>
        /// <param name="userId">User ID to generate stress event for</param>
        /// <returns>Mock data showing stress indicators (elevated HR, reduced HRV)</returns>
        [HttpGet("stress-event")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public async Task<IActionResult> GenerateStressEvent([FromQuery] string userId)
        {
            // Hide from Swagger in production
            if (_environment.IsProduction())
            {
                return NotFound();
            }

            // Check if mock mode is enabled
            var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
            if (!useMock)
            {
                _logger.LogWarning("Mock endpoint accessed but Fitbit:UseMock is disabled");
                return StatusCode(403, new { error = "Mock endpoints are disabled" });
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "userId parameter is required" });
            }

            try
            {
                _logger.LogInformation("Generating mock stress event for user {UserId}", userId);
                
                var (heartRate, hrv) = _fitbitMockService.GetMockStressEventResponse(userId);

                var response = new
                {
                    UserId = userId,
                    EventType = "Stress Event",
                    GeneratedAt = DateTime.UtcNow,
                    Description = "Mock data showing stress indicators: elevated heart rate (+20%) and reduced HRV (-25%)",
                    Note = "Use POST /trigger endpoint to save data and trigger stress detection pipeline",
                    HeartRate = heartRate,
                    Hrv = hrv,
                    ExpectedAlerts = new[]
                    {
                        "Elevated heart rate detected",
                        "HRV below baseline threshold",
                        "Potential stress event identified"
                    }
                };

                _logger.LogInformation("Mock stress event generated for user {UserId}", userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating mock stress event for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to generate stress event", detail = ex.Message });
            }
        }

        /// <summary>
        /// Gets mock configuration status
        /// </summary>
        /// <returns>Current mock configuration and environment info</returns>
        [HttpGet("status")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public IActionResult GetMockStatus()
        {
            // Hide from Swagger in production
            if (_environment.IsProduction())
            {
                return NotFound();
            }

            try
            {
                var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
                var environment = _configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") ?? "Production";
                
                var status = new
                {
                    MockEnabled = useMock,
                    Environment = environment,
                    Endpoints = new
                    {
                        Trigger = "/api/fitbit/mock/trigger?userId={userId}",
                        Preview = "/api/fitbit/mock/preview?userId={userId}",
                        StressEvent = "/api/fitbit/mock/stress-event?userId={userId}",
                        Status = "/api/fitbit/mock/status"
                    },
                    Description = "Mock service for testing Fitbit integration without real devices",
                    LastChecked = DateTime.UtcNow
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting mock status");
                return StatusCode(500, new { error = "Failed to get mock status", detail = ex.Message });
            }
        }

        /// <summary>
        /// Generates a complete day's worth of mock data with realistic progression
        /// </summary>
        /// <param name="userId">User ID to generate data for</param>
        /// <returns>Full day mock data simulation</returns>
        [HttpPost("simulate-day")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public async Task<IActionResult> SimulateFullDay([FromQuery] string userId)
        {
            // Hide from Swagger in production
            if (_environment.IsProduction())
            {
                return NotFound();
            }

            // Check if mock mode is enabled
            var useMock = _configuration.GetValue<bool>("Fitbit:UseMock");
            if (!useMock)
            {
                return StatusCode(403, new { error = "Mock endpoints are disabled" });
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "userId parameter is required" });
            }

            try
            {
                _logger.LogInformation("Simulating full day data for user {UserId}", userId);

                var dailyData = new List<object>();
                
                // Simulate data points throughout the day (every 2 hours)
                for (int hour = 6; hour <= 22; hour += 2)
                {
                    var mockTime = DateTime.Today.AddHours(hour);
                    var summary = await _fitbitMockService.BuildFullMockPoll(userId);
                    
                    dailyData.Add(new
                    {
                        SimulatedTime = mockTime,
                        DataPoint = summary
                    });
                    
                    // Small delay to simulate realistic data collection
                    await Task.Delay(100);
                }

                var response = new
                {
                    UserId = userId,
                    SimulationType = "Full Day Simulation",
                    DataPoints = dailyData.Count,
                    DateRange = new
                    {
                        Start = DateTime.Today.AddHours(6),
                        End = DateTime.Today.AddHours(22)
                    },
                    DailyData = dailyData,
                    CompletedAt = DateTime.UtcNow
                };

                _logger.LogInformation("Full day simulation completed for user {UserId} with {DataPoints} data points", 
                    userId, dailyData.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error simulating full day for user {UserId}", userId);
                return StatusCode(500, new { error = "Failed to simulate full day", detail = ex.Message });
            }
        }

        /// <summary>
        /// Simulation completion for mock OAuth flow. Sets tokens for the user.
        /// </summary>
        /// <param name="userId">User ID from mock page</param>
        /// <returns>Success status</returns>
        [HttpPost("authorize-success")]
        [ApiExplorerSettings(IgnoreApi = false)]
        public async Task<IActionResult> MockAuthorizeSuccess([FromQuery] string userId)
        {
            if (string.IsNullOrEmpty(userId)) return BadRequest(new { error = "userId required" });

            try
            {
                // Generate mock tokens
                var mockAccessToken = "mock_access_token_" + Guid.NewGuid().ToString("N");
                var mockRefreshToken = "mock_refresh_token_" + Guid.NewGuid().ToString("N");
                var expiresAt = DateTime.UtcNow.AddHours(8);
                var mockFitbitUserId = "MOCK_USER_" + (userId.Length >= 8 ? userId.Substring(0, 8) : userId);

                await _userRepository.SaveFitbitTokensAsync(userId, mockAccessToken, mockRefreshToken, expiresAt, mockFitbitUserId);
                
                _logger.LogInformation("✅ Mock connection successful for user {UserId} (MockFitbitID: {MockId})", userId, mockFitbitUserId);
                return Ok(new { success = true, message = "Mock tokens saved" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finishing mock authorization for user {UserId}", userId);
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}