using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RitualsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RitualsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions([FromQuery] Guid userId)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("UserId is required.", 400));

            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);

            // Get all rituals
            var rituals = await _context.Rituals.AsNoTracking().ToListAsync();

            // Get today's logs for this user
            var todayLogs = await _context.RitualLogs
                .AsNoTracking()
                .Where(l => l.UserId == userId && l.CompletedAt >= today && l.CompletedAt < today.AddDays(1))
                .ToListAsync();

            // Check if user already got the +2 bonus today
            var bonusEarned = todayLogs.Any(l => l.BonusAwarded);

            var result = rituals.Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                r.Duration,
                r.Category,
                r.IconType,
                IsCompleted = todayLogs.Any(l => l.RitualId == r.Id)
            });

            return Ok(ResponseHelper.Success(new
            {
                dailyBonusEarned = bonusEarned,
                rituals = result
            }, "Ritual suggestions retrieved successfully.", 200));
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteRitual([FromBody] CompleteRitualRequest request)
        {
            if (request == null || request.UserId == Guid.Empty || request.RitualId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<object>("Invalid request.", 400));

            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);

            // 1. Check if already completed today
            var existingLog = await _context.RitualLogs
                .FirstOrDefaultAsync(l => l.UserId == request.UserId 
                                       && l.RitualId == request.RitualId 
                                       && l.CompletedAt >= today 
                                       && l.CompletedAt < today.AddDays(1));

            if (existingLog != null)
                return Ok(ResponseHelper.Success<object>("Ritual already completed today.", "Ritual already completed today.", 200));

            // 2. Check global bonus status
            bool bonusEarnedToday = await _context.RitualLogs
                .AnyAsync(l => l.UserId == request.UserId 
                            && l.BonusAwarded 
                            && l.CompletedAt >= today 
                            && l.CompletedAt < today.AddDays(1));

            bool awardBonus = !bonusEarnedToday;

            // 3. Create Log
            var newLog = new RitualLog
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                RitualId = request.RitualId,
                CompletedAt = DateTime.UtcNow,
                BonusAwarded = awardBonus
            };
            _context.RitualLogs.Add(newLog);

            // 4. Award Points if eligible
            double newScore = 0;
            if (awardBonus)
            {
                var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == request.UserId);
                if (dog != null)
                {
                    dog.CurrentScore = Math.Min(100, dog.CurrentScore + 2.0);
                    dog.UpdatedOn = DateTime.UtcNow;
                    _context.Dogs.Update(dog);
                    newScore = dog.CurrentScore;
                }
            }
            else
            {
                // Retrieve current score strictly for return value
                var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == request.UserId);
                newScore = dog?.CurrentScore ?? 0;
            }

            await _context.SaveChangesAsync();

            // 5. Automatic completion of Nerve Center Sync & New Trick Practice based on Guided Practice count
            var guidedPracticeIds = new[] { MorningEnergySyncId, GratitudeFlowId, DeepBondingMeditationId, HealingCirclePracticeId };
            
            int completedGuidedCount = await _context.RitualLogs
                .CountAsync(l => l.UserId == request.UserId 
                              && guidedPracticeIds.Contains(l.RitualId)
                              && l.CompletedAt >= today 
                              && l.CompletedAt < today.AddDays(1));

            if (completedGuidedCount >= 2)
            {
                var nerveCenterActivity = await _context.BondingActivities.FirstOrDefaultAsync(a => a.ActivityName == "Nerve Center Sync");
                if (nerveCenterActivity != null)
                {
                    bool nerveCenterDone = await _context.UserBondingActivities.AnyAsync(a => a.UserId == request.UserId && a.ActivityId == nerveCenterActivity.ActivityId && a.ActivityDate >= today && a.ActivityDate < today.AddDays(1));
                    if (!nerveCenterDone)
                    {
                        _context.UserBondingActivities.Add(new Hounded_Heart.Models.Data.UserBondingActivity
                        {
                            UserId = request.UserId,
                            ActivityId = nerveCenterActivity.ActivityId,
                            ActivityDate = DateTime.UtcNow
                        });
                    }
                }
            }

            if (completedGuidedCount >= 4)
            {
                var newTrickActivity = await _context.BondingActivities.FirstOrDefaultAsync(a => a.ActivityName == "New Trick Practice");
                if (newTrickActivity != null)
                {
                    bool newTrickDone = await _context.UserBondingActivities.AnyAsync(a => a.UserId == request.UserId && a.ActivityId == newTrickActivity.ActivityId && a.ActivityDate >= today && a.ActivityDate < today.AddDays(1));
                    if (!newTrickDone)
                    {
                        _context.UserBondingActivities.Add(new Hounded_Heart.Models.Data.UserBondingActivity
                        {
                            UserId = request.UserId,
                            ActivityId = newTrickActivity.ActivityId,
                            ActivityDate = DateTime.UtcNow
                        });
                    }
                }
            }
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(new
            {
                message = "Ritual completed.",
                bonusAwarded = awardBonus,
                newScore = newScore
            }, "Ritual completed successfully.", 200));
        }

        public class CompleteRitualRequest
        {
            public Guid UserId { get; set; }
            public Guid RitualId { get; set; }
        }

        // Stable GUIDs for the Guided Practice rituals — never change these
        public static readonly Guid MorningEnergySyncId = new Guid("a1b2c3d4-e5f6-7890-abcd-111111111111");
        public static readonly Guid GratitudeFlowId     = new Guid("a1b2c3d4-e5f6-7890-abcd-222222222222");
        public static readonly Guid DeepBondingMeditationId = new Guid("a1b2c3d4-e5f6-7890-abcd-333333333333");
        public static readonly Guid HealingCirclePracticeId = new Guid("a1b2c3d4-e5f6-7890-abcd-444444444444");

        /// <summary>
        /// Seeds "Morning Energy Sync" and "Gratitude Flow" into the Rituals table.
        /// Safe to call multiple times — uses upsert logic.
        /// </summary>
        [HttpPost("seed-guided-practices")]
        public async Task<IActionResult> SeedGuidedPractices()
        {
            var toSeed = new[]
            {
                new Ritual
                {
                    Id          = MorningEnergySyncId,
                    Title       = "Morning Energy Sync",
                    Description = "Start your day aligned with your dog's energy.",
                    Duration    = "8 min",
                    Category    = "Guided Practice",
                    IconType    = "Sun"
                },
                new Ritual
                {
                    Id          = GratitudeFlowId,
                    Title       = "Gratitude Flow",
                    Description = "Appreciate the gift of your bond.",
                    Duration    = "10 min",
                    Category    = "Guided Practice",
                    IconType    = "Heart"
                },
                new Ritual
                {
                    Id          = DeepBondingMeditationId,
                    Title       = "Deep Bonding Meditation",
                    Description = "Strengthen your spiritual connection.",
                    Duration    = "15 min",
                    Category    = "Guided Practice",
                    IconType    = "Meditation"
                },
                new Ritual
                {
                    Id          = HealingCirclePracticeId,
                    Title       = "Healing Circle Practice",
                    Description = "Send healing energy to your dog.",
                    Duration    = "12 min",
                    Category    = "Guided Practice",
                    IconType    = "Sparkle"
                }
            };

            int added = 0;
            foreach (var ritual in toSeed)
            {
                var existing = await _context.Rituals.FindAsync(ritual.Id);
                if (existing == null)
                {
                    _context.Rituals.Add(ritual);
                    added++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(new
            {
                message        = $"{added} guided practice ritual(s) seeded.",
                morningEnergySyncId = MorningEnergySyncId,
                gratitudeFlowId     = GratitudeFlowId,
                deepBondingMeditationId = DeepBondingMeditationId,
                healingCirclePracticeId = HealingCirclePracticeId
            }, "Guided practices seeded.", 200));
        }

        /// <summary>
        /// Returns the stable GUIDs for the two guided-practice rituals.
        /// Frontend calls this once on mount so it knows which IDs to pass to /complete.
        /// </summary>
        [HttpGet("guided-practice-ids")]
        public IActionResult GetGuidedPracticeIds()
        {
            return Ok(ResponseHelper.Success(new
            {
                morningEnergySyncId = MorningEnergySyncId,
                gratitudeFlowId     = GratitudeFlowId,
                deepBondingMeditationId = DeepBondingMeditationId,
                healingCirclePracticeId = HealingCirclePracticeId
            }, "Guided practice IDs retrieved.", 200));
        }
    }
}
