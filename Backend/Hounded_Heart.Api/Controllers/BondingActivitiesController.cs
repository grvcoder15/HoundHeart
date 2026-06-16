using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BondingActivitiesController : ControllerBase
    {

        private readonly AppDbContext _context;
        public BondingActivitiesController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("GetAllBondingActivities")]
        public async Task<IActionResult> GetAllBondingActivities([FromQuery] Guid? userId)
        {
            try
            {
                var activities = await _context.BondingActivities
                    .OrderBy(a => a.ActivityName)
                    .ToListAsync();

                if (activities == null || activities.Count == 0)
                    return Ok(ResponseHelper.Success(new List<object>(), "No bonding activities found.", 200));

                var resultList = new List<object>();

                if (userId.HasValue && userId.Value != Guid.Empty)
                {
                    var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
                    var tomorrow = today.AddDays(1);
                    
                    var completedRituals = await _context.RitualLogs
                        .Include(r => r.Ritual)
                        .AsNoTracking()
                        .Where(r => r.UserId == userId.Value && r.CompletedAt >= today && r.CompletedAt < tomorrow)
                        .Select(r => r.Ritual.Title.ToLower().Trim())
                        .ToListAsync();
                        
                    var completedBonding = await _context.UserBondingActivities
                        .AsNoTracking()
                        .Where(u => u.UserId == userId.Value && u.ActivityDate == today)
                        .Select(u => u.ActivityId)
                        .ToListAsync();

                    var completedUserActivityScores = await _context.UserActivitiesScores
                        .AsNoTracking()
                        .Where(u => u.UserId == userId.Value && u.CreatedAt >= today && u.CreatedAt < tomorrow)
                        .Select(u => u.ActivityId)
                        .ToListAsync();

                    var hasCheckInToday = await _context.UserCheckIns
                        .AsNoTracking()
                        .AnyAsync(c => c.UserId == userId.Value && c.CreatedOn >= today && c.CreatedOn < tomorrow);
                        
                    var hasChakraSyncToday = await _context.ChakraLogs
                        .AsNoTracking()
                        .AnyAsync(c => c.UserId == userId.Value && c.CreatedAt >= today && c.CreatedAt < tomorrow);

                    foreach(var a in activities)
                    {
                        bool isCompleted = completedBonding.Contains(a.ActivityId) || 
                                           completedUserActivityScores.Contains(a.ActivityId) ||
                                           completedRituals.Contains(a.ActivityName.ToLower().Trim());
                                           
                        if (a.ActivityName == "Energy Check-in" && hasCheckInToday)
                            isCompleted = true;
                            
                        if (a.ActivityName == "Chakra Sync" && hasChakraSyncToday)
                            isCompleted = true;

                        resultList.Add(new {
                            a.ActivityId,
                            a.ActivityName,
                            a.Points,
                            a.Category,
                            a.InteractionType,
                            Completed = isCompleted
                        });
                    }
                }
                else
                {
                    foreach(var a in activities)
                    {
                        resultList.Add(new {
                            a.ActivityId,
                            a.ActivityName,
                            a.Points,
                            a.Category,
                            a.InteractionType,
                            Completed = false
                        });
                    }
                }

                return Ok(ResponseHelper.Success(resultList, "Bonding activities retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching bonding activities: {ex.Message}", 500));
            }
        }

        [HttpGet("GetTodayActivities/{userId}")]
        public async Task<IActionResult> GetTodayActivities(Guid userId)
        {
            try
            {
                var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);

                var activities = await _context.UserBondingActivities
                    .Where(x => x.UserId == userId && x.ActivityDate == today)
                    .Include(x => x.Activity)
                    .ToListAsync();

                if (activities == null || activities.Count == 0)
                    return Ok(ResponseHelper.Success(new List<object>(), "No activities done today.", 200));

                return Ok(ResponseHelper.Success(activities, "Today's activities retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching today's activities: {ex.Message}", 500));
            }
        }


    }
}
