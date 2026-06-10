using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/fitbark")]
    [ApiController]
    public class FitBarkController : ControllerBase
    {
        private readonly IFitBarkService _fitBarkService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FitBarkController> _logger;

        public FitBarkController(IFitBarkService fitBarkService, AppDbContext context, IConfiguration configuration, ILogger<FitBarkController> logger)
        {
            _fitBarkService = fitBarkService;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("auth/authorize")]
        public async Task<IActionResult> Authorize()
        {
            try
            {
                var authUrl = await _fitBarkService.GetAuthorizationUrlAsync();
                var redirectUri = _configuration["FitBark:RedirectUri"] ?? string.Empty;
                var requiresManualCode = string.Equals(redirectUri.Trim(), "urn:ietf:wg:oauth:2.0:oob", StringComparison.OrdinalIgnoreCase);

                return Ok(new
                {
                    success = true,
                    data = new { authUrl, requiresManualCode, redirectUri },
                    message = "FitBark authorization URL generated."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate FitBark authorization URL.");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("callback")]
        public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest("Missing OAuth code.");
            }

            var connected = await _fitBarkService.ExchangeCodeForTokensAsync(code, state);
            if (!connected)
            {
                return Content("<html><body><h3>FitBark authorization failed.</h3></body></html>", "text/html");
            }

            // Auto-fetch and save dog details after successful token exchange
            try
            {
                var dogs = await _fitBarkService.GetDogProfilesAsync();
                if (dogs != null && dogs.Count > 0)
                {
                    foreach (var dog in dogs)
                    {
                        var existingDog = await _context.FitBarkDogs.FirstOrDefaultAsync(d => d.DogSlug == dog.Slug);
                        if (existingDog == null)
                        {
                            var newDog = new FitBarkDog
                            {
                                Id = Guid.NewGuid(),
                                Name = dog.Name,
                                DogSlug = dog.Slug,
                                Breed = dog.Breed,
                                BirthDate = dog.BirthDate,
                                Weight = dog.Weight,
                                Gender = dog.Gender,
                                ActivityGoal = dog.ActivityGoal,
                                Country = dog.Country,
                                Zip = dog.Zip,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _context.FitBarkDogs.Add(newDog);
                        }
                        else
                        {
                            existingDog.Name = dog.Name;
                            existingDog.Weight = dog.Weight;
                            existingDog.ActivityGoal = dog.ActivityGoal;
                            existingDog.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("✅ Auto-synced {DogCount} dog(s) from FitBark after OAuth.", dogs.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Failed to auto-sync dogs after OAuth, but tokens saved successfully.");
                // Don't fail the request - token exchange succeeded, dog sync is bonus
            }

            return Content("<html><body><script>window.close();</script><h3>FitBark connected and dogs synced. You can close this window.</h3></body></html>", "text/html");
        }

        [HttpPost("auth/exchange-code")]
        public async Task<IActionResult> ExchangeCode([FromBody] FitBarkCodeExchangeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Code))
            {
                return BadRequest(new { success = false, message = "Authorization code is required." });
            }

            var connected = await _fitBarkService.ExchangeCodeForTokensAsync(request.Code, request.State);
            if (!connected)
            {
                return BadRequest(new { success = false, message = "Failed to exchange FitBark authorization code." });
            }

            // Auto-fetch and save dog details after successful token exchange
            try
            {
                var dogs = await _fitBarkService.GetDogProfilesAsync();
                if (dogs != null && dogs.Count > 0)
                {
                    foreach (var dog in dogs)
                    {
                        var existingDog = await _context.FitBarkDogs.FirstOrDefaultAsync(d => d.DogSlug == dog.Slug);
                        if (existingDog == null)
                        {
                            var newDog = new FitBarkDog
                            {
                                Id = Guid.NewGuid(),
                                Name = dog.Name,
                                DogSlug = dog.Slug,
                                Breed = dog.Breed,
                                BirthDate = dog.BirthDate,
                                Weight = dog.Weight,
                                Gender = dog.Gender,
                                ActivityGoal = dog.ActivityGoal,
                                Country = dog.Country,
                                Zip = dog.Zip,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            _context.FitBarkDogs.Add(newDog);
                        }
                        else
                        {
                            existingDog.Name = dog.Name;
                            existingDog.Weight = dog.Weight;
                            existingDog.ActivityGoal = dog.ActivityGoal;
                            existingDog.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("✅ Auto-synced {DogCount} dog(s) from FitBark after OAuth.", dogs.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Failed to auto-sync dogs after OAuth, but tokens saved successfully.");
                // Don't fail the request - token exchange succeeded, dog sync is bonus
            }

            return Ok(new { success = true, message = "FitBark authorization code exchanged successfully. Dogs synced." });
        }

        [HttpGet("auth/status")]
        public IActionResult Status()
        {
            var connected = _fitBarkService.IsConnected();
            return Ok(new
            {
                success = connected,
                data = new { connected },
                message = connected ? "FitBark is connected." : "FitBark is not connected."
            });
        }

        [HttpGet("sync/status")]
        public async Task<IActionResult> GetSyncStatus()
        {
            var connected = _fitBarkService.IsConnected();
            var intervalMinutes = _configuration.GetValue<int>("FitBark:SyncIntervalMinutes", 30);
            var nowUtc = DateTime.UtcNow;

            var dogCount = await _context.FitBarkDogs
                .CountAsync(d => !string.IsNullOrWhiteSpace(d.DogSlug));

            var latestVital = await _context.DogVitals
                .AsNoTracking()
                .Where(v => v.Source == "fitbark")
                .OrderByDescending(v => v.TimestampUtc)
                .Select(v => new
                {
                    v.Id,
                    v.DogId,
                    v.TimestampUtc,
                    v.ActivityValue,
                    v.MinActive,
                    v.MinRest,
                    v.State
                })
                .FirstOrDefaultAsync();

            var lookbackMinutes = Math.Max(intervalMinutes * 2, 8);
            var recentCount = await _context.DogVitals
                .AsNoTracking()
                .CountAsync(v =>
                    v.Source == "fitbark" &&
                    v.TimestampUtc >= nowUtc.AddMinutes(-lookbackMinutes));

            var reason = dogCount == 0
                ? "No FitBark dogs available for polling."
                : latestVital == null
                    ? "Dogs are linked but no FitBark vitals have been stored yet."
                    : "FitBark vitals found.";

            return Ok(new
            {
                success = true,
                data = new
                {
                    connected,
                    syncIntervalMinutes = intervalMinutes,
                    dogCount,
                    recentVitalsCount = recentCount,
                    lastSyncDataUtc = latestVital?.TimestampUtc,
                    latestVital,
                    reason
                },
                message = reason
            });
        }

        [HttpPost("auth/disconnect")]
        public IActionResult Disconnect()
        {
            _fitBarkService.Disconnect();
            return Ok(new
            {
                success = true,
                message = "FitBark disconnected successfully."
            });
        }

        /// <summary>
        /// Fetches all linked dog profiles from FitBark and saves new ones to the database.
        /// Call this first to populate your dog list.
        /// </summary>
        [HttpGet("dogs")]
        public async Task<IActionResult> GetDogs()
        {
            var dogs = await _fitBarkService.GetDogProfilesAsync();
            if (dogs == null)
            {
                return StatusCode(500, "Failed to fetch dogs from FitBark API. Please connect FitBark first from Profile Settings.");
            }

            foreach (var dog in dogs)
            {
                var existingDog = await _context.FitBarkDogs.FirstOrDefaultAsync(d => d.DogSlug == dog.Slug);
                if (existingDog == null)
                {
                    var newDog = new FitBarkDog
                    {
                        Id = Guid.NewGuid(),
                        Name = dog.Name,
                        DogSlug = dog.Slug,
                        Breed = dog.Breed,
                        BirthDate = dog.BirthDate,
                        Weight = dog.Weight,
                        Gender = dog.Gender,
                        ActivityGoal = dog.ActivityGoal,
                        Country = dog.Country,
                        Zip = dog.Zip
                    };
                    _context.FitBarkDogs.Add(newDog);
                }
                else
                {
                    // Update existing dog details if needed
                    existingDog.Name = dog.Name;
                    existingDog.Weight = dog.Weight;
                    existingDog.ActivityGoal = dog.ActivityGoal;
                    existingDog.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(dogs);
        }

        /// <summary>
        /// Fetches activity logs for a specific dog and date range, saving/updating them in the DB.
        /// </summary>
        /// <param name="dogSlug">The FitBark slug for the dog</param>
        /// <param name="from">Format: YYYY-MM-DD</param>
        /// <param name="to">Format: YYYY-MM-DD</param>
        [HttpGet("activity/{dogSlug}")]
        public async Task<IActionResult> GetActivity(string dogSlug, [FromQuery] string from, [FromQuery] string to)
        {
            var activities = await _fitBarkService.GetDailyActivityAsync(dogSlug, from, to);
            if (activities == null) return StatusCode(500, "Failed to fetch activity from FitBark API");

            foreach (var activity in activities)
            {
                if (DateTime.TryParse(activity.Date, out DateTime actDate))
                {
                    var existingLog = await _context.FitBarkActivityLogs
                        .FirstOrDefaultAsync(a => a.DogSlug == dogSlug && a.ActivityDate.Date == actDate.Date);

                    if (existingLog == null)
                    {
                        var newLog = new FitBarkActivityLog
                        {
                            Id = Guid.NewGuid(),
                            DogSlug = dogSlug,
                            ActivityDate = actDate,
                            ActivityValue = activity.ActivityValue,
                            MinPlay = activity.MinPlay,
                            MinActive = activity.MinActive,
                            MinRest = activity.MinRest,
                            NapTime = activity.NapTime,
                            FetchedAt = DateTime.UtcNow
                        };
                        _context.FitBarkActivityLogs.Add(newLog);
                    }
                    else
                    {
                        existingLog.ActivityValue = activity.ActivityValue;
                        existingLog.MinPlay = activity.MinPlay;
                        existingLog.MinActive = activity.MinActive;
                        existingLog.MinRest = activity.MinRest;
                        existingLog.NapTime = activity.NapTime;
                        existingLog.FetchedAt = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Also save to DogVitals table for baseline calculation
            await SaveToDogVitals(dogSlug, activities);

            return Ok(activities);
        }

        /// <summary>
        /// Returns real-time goal progress for a specific dog.
        /// </summary>
        [HttpGet("goal/{dogSlug}")]
        public async Task<IActionResult> GetGoal(string dogSlug)
        {
            var goal = await _fitBarkService.GetDailyGoalAsync(dogSlug);
            if (goal == null) return StatusCode(500, "Failed to fetch goal from FitBark API");

            return Ok(goal);
        }

        /// <summary>
        /// Combined dashboard view for a dog, including profile, today's goal, and last 7 days of activity.
        /// </summary>
        [HttpGet("dashboard/{dogSlug}")]
        public async Task<IActionResult> GetDashboard(string dogSlug)
        {
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var lastWeek = DateTime.UtcNow.AddDays(-7).ToString("yyyy-MM-dd");

            var dogTask = _fitBarkService.GetDogProfilesAsync();
            var goalTask = _fitBarkService.GetDailyGoalAsync(dogSlug);
            var activityTask = _fitBarkService.GetDailyActivityAsync(dogSlug, lastWeek, today);

            await Task.WhenAll(dogTask, goalTask, activityTask);

            var dogProfile = dogTask.Result?.FirstOrDefault(d => d.Slug == dogSlug)!;
            var todayGoal = goalTask.Result;
            var activityLast7Days = activityTask.Result;

            if (dogProfile == null) return NotFound($"Dog with slug {dogSlug} not found in your FitBark account.");

            return Ok(new
            {
                dog = dogProfile,
                todayGoal = todayGoal,
                activityLast7Days = activityLast7Days,
                dataSource = "FitBark Real API",
                fetchedAt = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Helper method to save FitBark activity data to DogVitals table for baseline calculation
        /// </summary>
        private async Task SaveToDogVitals(string dogSlug, List<FitBarkActivityRecord> activities)
        {
            try
            {
                // Find the matching DogId from FitBarkDogs table
                var fitBarkDog = await _context.FitBarkDogs.FirstOrDefaultAsync(d => d.DogSlug == dogSlug);
                if (fitBarkDog == null)
                {
                    // No matching dog found, skip DogVitals insert but don't throw error
                    return;
                }

                foreach (var activity in activities)
                {
                    if (DateTime.TryParse(activity.Date, out DateTime actDate))
                    {
                        var existingVital = await _context.DogVitals
                            .FirstOrDefaultAsync(v => v.DogId == fitBarkDog.Id && v.TimestampUtc.Date == actDate.Date && v.Source == "fitbark");

                        if (existingVital == null)
                        {
                            var newVital = new DogVitalsRecord
                            {
                                Id = Guid.NewGuid(),
                                DogId = fitBarkDog.Id,
                                ActivityValue = activity.ActivityValue,
                                MinPlay = activity.MinPlay,
                                MinActive = activity.MinActive,
                                MinRest = activity.MinRest,
                                NapTime = activity.NapTime,
                                Source = "fitbark",
                                TimestampUtc = actDate
                            };
                            _context.DogVitals.Add(newVital);
                        }
                        else
                        {
                            // Update existing record
                            existingVital.ActivityValue = activity.ActivityValue;
                            existingVital.MinPlay = activity.MinPlay;
                            existingVital.MinActive = activity.MinActive;
                            existingVital.MinRest = activity.MinRest;
                            existingVital.NapTime = activity.NapTime;
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error but don't fail the main operation
                Console.WriteLine($"Error saving to DogVitals: {ex.Message}");
            }
        }

        /// <summary>
        /// Generates baseline for a specific dog using FitBark data from DogVitals table
        /// </summary>
        [HttpPost("generate-baseline/{dogSlug}")]
        public async Task<IActionResult> GenerateBaseline(string dogSlug)
        {
            try
            {
                // Find the matching DogId from FitBarkDogs table
                var fitBarkDog = await _context.FitBarkDogs.FirstOrDefaultAsync(d => d.DogSlug == dogSlug);
                if (fitBarkDog == null)
                {
                    return NotFound($"Dog with slug {dogSlug} not found in FitBark dogs.");
                }

                var dogId = fitBarkDog.Id;

                // Read DogVitals for this dog where Source = 'fitbark'
                var fitbarkVitals = await _context.DogVitals
                    .Where(d => d.DogId == dogId && d.Source == "fitbark")
                    .ToListAsync();

                if (!fitbarkVitals.Any())
                {
                    return BadRequest("No FitBark data found for this dog.");
                }

                // Calculate averages only for non-null fields
                var avgActivityValue = fitbarkVitals.Any(v => v.ActivityValue.HasValue)
                    ? fitbarkVitals.Where(v => v.ActivityValue.HasValue).Average(v => v.ActivityValue!.Value)
                    : (double?)null;

                var avgMinPlay = fitbarkVitals.Any(v => v.MinPlay.HasValue)
                    ? fitbarkVitals.Where(v => v.MinPlay.HasValue).Average(v => v.MinPlay!.Value)
                    : (double?)null;

                var avgMinActive = fitbarkVitals.Any(v => v.MinActive.HasValue)
                    ? fitbarkVitals.Where(v => v.MinActive.HasValue).Average(v => v.MinActive!.Value)
                    : (double?)null;

                var avgMinRest = fitbarkVitals.Any(v => v.MinRest.HasValue)
                    ? fitbarkVitals.Where(v => v.MinRest.HasValue).Average(v => v.MinRest!.Value)
                    : (double?)null;

                var avgNapTime = fitbarkVitals.Any(v => v.NapTime.HasValue)
                    ? fitbarkVitals.Where(v => v.NapTime.HasValue).Average(v => v.NapTime!.Value)
                    : (double?)null;

                // Count distinct days
                var daysOfDataCollected = fitbarkVitals
                    .Select(v => v.TimestampUtc.Date)
                    .Distinct()
                    .Count();

                // Find or create DogBaselines record
                var existingBaseline = await _context.DogBaselines
                    .FirstOrDefaultAsync(b => b.DogId == dogId);

                if (existingBaseline != null)
                {
                    // Update existing record with FitBark data
                    existingBaseline.AvgActivityScore = avgActivityValue ?? existingBaseline.AvgActivityScore;
                    existingBaseline.AvgRestScore = avgMinRest ?? existingBaseline.AvgRestScore;
                    existingBaseline.DaysOfDataCollected = Math.Max(existingBaseline.DaysOfDataCollected, daysOfDataCollected);
                    existingBaseline.LastUpdatedUtc = DateTime.UtcNow;
                    existingBaseline.DogBaselineEstablished = existingBaseline.DaysOfDataCollected >= 6;

                    _context.DogBaselines.Update(existingBaseline);
                }
                else
                {
                    // Create new baseline record
                    var newBaseline = new DogBaseline
                    {
                        Id = Guid.NewGuid(),
                        DogId = dogId,
                        AvgActivityScore = avgActivityValue ?? 0,
                        AvgRestScore = avgMinRest ?? 0,
                        DaysOfDataCollected = daysOfDataCollected,
                        LastUpdatedUtc = DateTime.UtcNow,
                        DogBaselineEstablished = daysOfDataCollected >= 6
                    };

                    _context.DogBaselines.Add(newBaseline);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    dogSlug = dogSlug,
                    dogId = dogId,
                    daysCollected = daysOfDataCollected,
                    dogBaselineEstablished = daysOfDataCollected >= 6,
                    averages = new
                    {
                        activityValue = avgActivityValue,
                        minPlay = avgMinPlay,
                        minActive = avgMinActive,
                        minRest = avgMinRest,
                        napTime = avgNapTime
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error generating baseline: {ex.Message}");
            }
        }

        public class FitBarkCodeExchangeRequest
        {
            public string? Code { get; set; }
            public string? State { get; set; }
        }
    }
}
