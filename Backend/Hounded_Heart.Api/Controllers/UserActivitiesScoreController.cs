using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserActivitiesScoreController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserActivitiesScoreController(AppDbContext context) => _context = context;

        [HttpPost("save")]
        public async Task<IActionResult> SaveUserActivitiesScore([FromBody] SaveUserActivitiesScoreRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(ResponseHelper.Fail<object>("Request is null.", 400));

                if (request.UserId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<object>("Invalid UserId.", 400));

                if (request.Activities == null || !request.Activities.Any())
                    return BadRequest(ResponseHelper.Fail<object>("No activities provided.", 400));

                // Use provided local date or fallback to UTC Today
                var activityDate = DateTime.SpecifyKind(request.Date?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);
                var now = DateTime.UtcNow;
                
                List<UserActivitiesScore> scoreEntities = new();
                List<UserBondingActivity> bondingEntities = new();
                int skippedCount = 0;

                foreach (var item in request.Activities)
                {
                    // Check if already completed today (using UserBondingActivity as daily log)
                    bool exists = await _context.UserBondingActivities
                        .AnyAsync(x => x.UserId == request.UserId 
                                    && x.ActivityId == item.ActivityId 
                                    && x.ActivityDate == activityDate);

                    if (exists)
                    {
                        skippedCount++;
                        continue;
                    }

                    // 1. Add to Score Log (for points calculation)
                    scoreEntities.Add(new UserActivitiesScore
                    {
                        UserId = request.UserId,
                        ActivityId = item.ActivityId,
                        Score = item.Score,     // INDIVIDUAL SCORE
                        CreatedAt = now,
                        ActivityDate = activityDate,
                        ActivityDetails = "Daily Activity"
                    });

                    // 2. Add to Daily Log (to prevent double dipping)
                    bondingEntities.Add(new UserBondingActivity
                    {
                        UserId = request.UserId,
                        ActivityId = item.ActivityId,
                        ActivityDate = activityDate,
                        CreatedAt = now
                    });
                }

                if (scoreEntities.Any())
                {
                    await _context.UserActivitiesScores.AddRangeAsync(scoreEntities);
                    await _context.UserBondingActivities.AddRangeAsync(bondingEntities);

                    var pointsEarned = scoreEntities.Sum(x => x.Score ?? 0);
                    if (pointsEarned > 0)
                    {
                        var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == request.UserId);
                        if (dog != null)
                        {
                            dog.CurrentScore = Math.Min(100, Math.Max(0, dog.CurrentScore + pointsEarned));
                            dog.UpdatedOn = now;
                            _context.Dogs.Update(dog);
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                var msg = skippedCount > 0
                    ? $"Saved {scoreEntities.Count} activities. Skipped {skippedCount} duplicates."
                    : "Activities saved successfully!";
                return Ok(ResponseHelper.Success(new { totalSaved = scoreEntities.Count, skipped = skippedCount }, msg, 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}", 500));
            }
        }


        [HttpGet("get-all-by-user")]
        public async Task<IActionResult> GetAllByUser([FromQuery] Guid userId)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

            var list = await _context.UserActivitiesScores
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(ResponseHelper.Success(list, "Activities retrieved successfully.", 200));
        }

        [HttpGet("total-score")]
        public async Task<IActionResult> GetTotalScore([FromQuery] Guid userId)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

            var total = await _context.UserActivitiesScores
                .Where(x => x.UserId == userId)
                .SumAsync(x => x.Score ?? 0);

            return Ok(ResponseHelper.Success(new { total }, "Total score retrieved successfully.", 200));
        }

        [HttpGet("daily-score")]
        public async Task<IActionResult> GetDailyScore([FromQuery] Guid userId, [FromQuery] DateTime date)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

            var start = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var end = start.AddDays(1);

            var total = await _context.UserActivitiesScores
                .Where(x => x.UserId == userId && x.CreatedAt >= start && x.CreatedAt < end)
                .SumAsync(x => x.Score ?? 0);

            return Ok(ResponseHelper.Success(new { date = start, total }, "Daily score retrieved successfully.", 200));
        }

        [HttpGet("weekly-score")]
        public async Task<IActionResult> GetWeeklyScore([FromQuery] Guid userId)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

            // Consider week start as Monday
            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            var diff = (int)today.DayOfWeek;
            var startOfWeek = diff == 0 ? today.AddDays(-6) : today.AddDays(-(diff - 1));

            var total = await _context.UserActivitiesScores
                .Where(x => x.UserId == userId && x.CreatedAt >= startOfWeek)
                .SumAsync(x => x.Score ?? 0);

            return Ok(ResponseHelper.Success(new { weekStart = startOfWeek, total }, "Weekly score retrieved successfully.", 200));
        }

        [HttpGet("check-done-today")]
        public async Task<IActionResult> CheckDoneToday([FromQuery] Guid userId, [FromQuery] Guid activityId)
        {
            if (userId == Guid.Empty || activityId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid IDs.", 400));

            var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
            var exists = await _context.UserActivitiesScores
                .AnyAsync(x => x.UserId == userId
                            && x.ActivityId == activityId
                            && x.CreatedAt >= today
                            && x.CreatedAt < today.AddDays(1));

            return Ok(ResponseHelper.Success(new { done = exists }, "Check done status retrieved.", 200));
        }

        [HttpGet("user/{userId}/today")]
        public async Task<IActionResult> GetUserActivitiesToday(Guid userId, [FromQuery] DateTime? clientDate = null)
        {
            if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

            var today = DateTime.SpecifyKind(clientDate?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);
            var tomorrow = today.AddDays(1);

            var activities = await _context.UserActivitiesScores
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.CreatedAt >= today && x.CreatedAt < tomorrow)
                .ToListAsync();

            var totalScore = activities.Sum(x => x.Score ?? 0);

            return Ok(ResponseHelper.Success(new
            {
                activities = activities,
                totalScore = totalScore,
                count = activities.Count
            }, "Today's activities fetched successfully.", 200));
        }
    }
}
