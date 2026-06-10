using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChakraController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ChakraService _chakraService;
        private readonly ChakraRitualProgressService _progressService;

        public ChakraController(AppDbContext context, ChakraService chakraService, ChakraRitualProgressService progressService)
        {
            _context = context;
            _chakraService = chakraService;
            _progressService = progressService;
        }

        [HttpGet("chakrasList")]
        public async Task<IActionResult> GetChakrasList()
        {
            try
            {
                var chakras = await _context.Chakras
                    .AsNoTracking()
                    .OrderBy(c => c.ChakraName)
                    .Select(c => new
                    {
                        chakraId = c.ChakraId,
                        chakraName = c.ChakraName,
                        audioUrl = c.AudioUrl
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(chakras, "Chakras retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving chakras: {ex.Message}", 500));
            }
        }

        [HttpGet("get-progress")]
        public async Task<IActionResult> GetProgress([FromQuery] Guid userId, [FromQuery] Guid chakraId)
        {
            try 
            {
                var progress = await _progressService.GetProgress(userId, chakraId);
                return Ok(ResponseHelper.Success(progress, "Progress retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}", 500));
            }
        }

        [HttpGet("get-all-progress")]
        public async Task<IActionResult> GetAllProgress([FromQuery] Guid userId)
        {
            try
            {
                var list = await _progressService.GetAllUserProgress(userId);
                return Ok(ResponseHelper.Success(list, "All progress retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}", 500));
            }
        }

        [HttpPost("save-progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveChakraProgressDto request)
        {
            if (request == null || request.UserId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<object>("Invalid request.", 400));

            try
            {
                // Map frontend names to service DTO
                var serviceRequest = new Hounded_Heart.Models.Models.SaveChakraProgressRequest
                {
                    UserId = request.UserId,
                    ChakraId = request.ChakraId,
                    CurrentPosition = request.PauseTimeInSeconds,
                    IsCompleted = request.IsCompleted,
                    TotalDuration = 90 // Default for these rituals if not provided
                };

                await _progressService.SaveProgress(serviceRequest);
                return Ok(ResponseHelper.Success<object>("Progress saved successfully.", "Progress saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}", 500));
            }
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncChakra([FromBody] ChakraSyncRequest request)
        {
            if (request == null || request.UserId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<object>("Invalid request. UserId is required.", 400));

            try
            {
                // 1. Calculate Harmony Score using ChakraService
                float harmonyScore = _chakraService.CalculateHarmonyScore(
                    request.RootScore, request.SacralScore, request.SolarPlexusScore,
                    request.HeartScore, request.ThroatScore, request.ThirdEyeScore, request.CrownScore
                );

                // 2. Identify Dominant Blockage (weakest chakra) using ChakraService
                string dominantBlockage = _chakraService.GetDominantBlockage(
                    request.RootScore, request.SacralScore, request.SolarPlexusScore,
                    request.HeartScore, request.ThroatScore, request.ThirdEyeScore, request.CrownScore
                );

                // 3. Get Audio URL for the weakest chakra from database
                string audioUrl = await _chakraService.GetChakraAudioUrlAsync(dominantBlockage);

                // NOTE: ChakraLog is NOT saved here anymore.
                // It is saved only in CompleteChakraRitual after the user finishes the audio.

                // 4. Return Response (calculation only, no DB write)
                return Ok(ResponseHelper.Success(new
                {
                    message = "Chakra Sync successful.",
                    harmonyScore = Math.Round(harmonyScore, 1),
                    dominantBlockage = dominantBlockage,
                    audioUrl = audioUrl ?? "Audio not available for this chakra yet.",
                    syncedAt = DateTime.UtcNow,
                    adjustedScores = new { 
                         request.RootScore, request.SacralScore, request.SolarPlexusScore, 
                         request.HeartScore, request.ThroatScore, request.ThirdEyeScore, request.CrownScore 
                    }
                }, "Chakra Sync successful.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error syncing chakra: {ex.Message}", 500));
            }
        }

        [HttpPost("complete-ritual")]
        public async Task<IActionResult> CompleteChakraRitual([FromBody] RitualCompletionRequest request)
        {
            if (request == null || request.UserId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<object>("Invalid request. UserId is required.", 400));

            try
            {
                var today = DateTime.UtcNow.Date;

                // 1. Get Activity for "Chakra Sync"
                var activity = await _context.BondingActivities
                    .FirstOrDefaultAsync(a => a.ActivityName == "Chakra Sync" || a.ActivityName == "Chakra Ritual");

                Guid activityId = activity?.ActivityId ?? Guid.Empty;
                if (activity == null)
                {
                    var newActivity = new BondingActivity
                    {
                        ActivityId = Guid.NewGuid(),
                        ActivityName = "Chakra Sync",
                        Points = 2 
                    };
                    _context.BondingActivities.Add(newActivity);
                    await _context.SaveChangesAsync();
                    activityId = newActivity.ActivityId;
                }

                // 2. Check if THIS specific ritual already completed today
                bool alreadyDone = await _context.UserActivitiesScores
                    .AnyAsync(x => x.UserId == request.UserId && x.ActivityId == activityId && x.CreatedAt >= today && x.CreatedAt < today.AddDays(1));

                if (alreadyDone)
                {
                    return Ok(ResponseHelper.Success<object>("Chakra Ritual already completed today.", "Chakra Ritual already completed today.", 200));
                }

                // 3. Save ChakraLog NOW (only on completion, not on sync)
                if (request.DominantBlockage != null)
                {
                    var log = new ChakraLog
                    {
                        Id = Guid.NewGuid(),
                        UserId = request.UserId,
                        RootScore = request.RootScore,
                        SacralScore = request.SacralScore,
                        SolarPlexusScore = request.SolarPlexusScore,
                        HeartScore = request.HeartScore,
                        ThroatScore = request.ThroatScore,
                        ThirdEyeScore = request.ThirdEyeScore,
                        CrownScore = request.CrownScore,
                        HarmonyScore = request.HarmonyScore,
                        DominantBlockage = request.DominantBlockage,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ChakraLogs.Add(log);
                }

                // 4. Save Completion to UserActivitiesScores
                var bonusRule = await _context.ScoringRules
                    .FirstOrDefaultAsync(r => r.RuleName == "Ritual_Bonus");
                int points = (int)(bonusRule?.Points ?? 2.0m);

                var scoreLog = new UserActivitiesScore
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    ActivityId = activityId,
                    Score = points, 
                    CreatedAt = DateTime.UtcNow
                };

                _context.UserActivitiesScores.Add(scoreLog);

                // 5. PERSIST to Dog's Total Score
                var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == request.UserId);
                double newScore = 0;
                if (dog != null)
                {
                    dog.CurrentScore = Math.Min(100, dog.CurrentScore + (double)points);
                    dog.UpdatedOn = DateTime.UtcNow;
                    _context.Dogs.Update(dog);
                    newScore = dog.CurrentScore;
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new { 
                    message = "Chakra Ritual completed successfully.", 
                    bonusAwarded = true,
                    points = points,
                    newScore = newScore
                }, "Chakra Ritual completed successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error completing ritual: {ex.Message}", 500));
            }
        }

        public class SaveChakraProgressDto
        {
            public Guid UserId { get; set; }
            public Guid ChakraId { get; set; }
            public decimal PauseTimeInSeconds { get; set; }
            public bool IsCompleted { get; set; }
        }

        public class RitualCompletionRequest
        {
            public Guid UserId { get; set; }
            // Chakra scores sent from frontend (saved to ChakraLog only on completion)
            public int RootScore { get; set; }
            public int SacralScore { get; set; }
            public int SolarPlexusScore { get; set; }
            public int HeartScore { get; set; }
            public int ThroatScore { get; set; }
            public int ThirdEyeScore { get; set; }
            public int CrownScore { get; set; }
            public float HarmonyScore { get; set; }
            public string? DominantBlockage { get; set; }
        }

        public class ChakraSyncRequest
        {
            public Guid UserId { get; set; }
            public Guid? PetId { get; set; } // Optional: Pet/Dog ID for tracking shared energy state
            public int RootScore { get; set; }
            public int SacralScore { get; set; }
            public int SolarPlexusScore { get; set; }
            public int HeartScore { get; set; }
            public int ThroatScore { get; set; }
            public int ThirdEyeScore { get; set; }
            public int CrownScore { get; set; }
            
            // New: Behavioral inputs (Source 8)
            public List<string>? Behaviors { get; set; }
        }
    }
}
