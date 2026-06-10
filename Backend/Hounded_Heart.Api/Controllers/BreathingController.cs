using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BreathingController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BreathingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("patterns")]
        public async Task<IActionResult> GetPatterns()
        {
            try
            {
                var patterns = await _context.BreathingPatterns
                    .Where(p => p.IsActive && !p.IsDeleted)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Description,
                        Timings = new
                        {
                            Inhale = p.InhaleDuration,
                            Exhale = p.ExhaleDuration,
                            Hold = p.HoldDuration,
                            HoldAfterExhale = p.HoldAfterExhaleDuration
                        }
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(patterns, "Breathing patterns retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet("cycles")]
        public async Task<IActionResult> GetTargetCycles()
        {
            try
            {
                var cycles = await _context.TargetCycles
                    .Where(c => c.IsActive && !c.IsDeleted)
                    .OrderBy(c => c.Cycles)
                    .Select(c => new
                    {
                        c.Id,
                        c.Cycles,
                        c.DurationDescription
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(cycles, "Target cycles retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        public class CompleteBreathingSessionRequest
        {
            public Guid PatternId { get; set; }
            public string PatternName { get; set; }
            public int TargetCycles { get; set; }
            public int CompletedCycles { get; set; }
            public int DurationSeconds { get; set; }
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteSession([FromBody] CompleteBreathingSessionRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token.", 401));

                // Award points logic
                var today = DateTime.UtcNow.Date;
                var activityName = "Synchronized Breathing";
                
                var activity = await _context.BondingActivities.FirstOrDefaultAsync(a => a.ActivityName == activityName);
                if (activity == null)
                {
                    return Ok(ResponseHelper.Success<object>("Session completed. (Activity configuration missing)", "Session completed.", 200));
                }

                // Check for daily limit (2 points max)
                bool alreadyCompleted = await _context.UserActivitiesScores
                    .AnyAsync(uas => uas.UserId == userId && uas.ActivityId == activity.ActivityId && uas.CreatedAt.Date == today);

                if (!alreadyCompleted)
                {
                    var activityDetailsJson = System.Text.Json.JsonSerializer.Serialize(request);

                    var score = new UserActivitiesScore
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        ActivityId = activity.ActivityId,
                        Score = activity.Points,
                        ActivityDetails = activityDetailsJson,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserActivitiesScores.Add(score);
                    await _context.SaveChangesAsync();
                    
                    return Ok(ResponseHelper.Success(new { points = activity.Points }, "Session completed.", 200));
                }

                return Ok(ResponseHelper.Success(new { points = 0 }, "Session completed. Daily limit reached.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // ===== NEW: Breathing Preferences API =====

        public class SaveBreathingPreferenceRequest
        {
            public Guid? PatternId { get; set; }
            public string PatternName { get; set; }
            public int TargetCycles { get; set; } = 10;
        }

        /// <summary>
        /// GET /api/Breathing/preferences — Fetch user's saved breathing preferences
        /// </summary>
        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferences()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token.", 401));

                var pref = await _context.UserBreathingPreferences
                    .AsNoTracking()
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (pref == null)
                {
                    // Return defaults for new users
                    return Ok(ResponseHelper.Success(new
                    {
                        patternId = (Guid?)null,
                        patternName = "4-7-8",
                        targetCycles = 10,
                        isDefault = true
                    }, "Default preferences returned.", 200));
                }

                return Ok(ResponseHelper.Success(new
                {
                    patternId = pref.PatternId,
                    patternName = pref.PatternName,
                    targetCycles = pref.TargetCycles,
                    isDefault = false
                }, "Preferences retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        /// <summary>
        /// POST /api/Breathing/preferences — Save or update user's breathing preferences
        /// </summary>
        [HttpPost("preferences")]
        public async Task<IActionResult> SavePreferences([FromBody] SaveBreathingPreferenceRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token.", 401));

                // Find existing preference (upsert logic)
                var existing = await _context.UserBreathingPreferences
                    .FirstOrDefaultAsync(p => p.UserId == userId);

                if (existing != null)
                {
                    // Update existing
                    existing.PatternId = request.PatternId;
                    existing.PatternName = request.PatternName;
                    existing.TargetCycles = request.TargetCycles;
                    existing.UpdatedAt = DateTime.UtcNow;
                    _context.UserBreathingPreferences.Update(existing);
                }
                else
                {
                    // Create new
                    var newPref = new UserBreathingPreference
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        PatternId = request.PatternId,
                        PatternName = request.PatternName,
                        TargetCycles = request.TargetCycles,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserBreathingPreferences.Add(newPref);
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    patternName = request.PatternName,
                    targetCycles = request.TargetCycles
                }, "Breathing preferences saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }
    }
}
