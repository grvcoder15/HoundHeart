using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard-summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] Guid userId, [FromQuery] DateTime? clientDate = null)
        {
            try
            {
                if (userId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<object>("UserId is required.", 400));

                // Use client date if provided, else UTC
                var today = clientDate?.Date ?? DateTime.UtcNow.Date;

                // 1. Activities Today (Distinct Bonding Activities + Daily Check-in cap of 1)
                var tomorrow = today.AddDays(1);

                // Distinct count by ActivityId — prevents duplicate saves from inflating the count
                var activitiesCount = await _context.UserActivitiesScores
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && ((x.ActivityDate >= today && x.ActivityDate < tomorrow) || (x.ActivityDate == null && x.CreatedAt >= today && x.CreatedAt < tomorrow)))
                    .Select(x => x.ActivityId)
                    .Distinct()
                    .CountAsync();

                // Check-in cap: +1 only once per day, even if user updates ratings later
                var hasCheckInToday = await _context.UserCheckIns
                    .AsNoTracking()
                    .AnyAsync(x => x.UserId == userId && ((x.ActivityDate >= today && x.ActivityDate < tomorrow) || (x.ActivityDate == null && x.CreatedOn >= today && x.CreatedOn < tomorrow)));

                int totalActivities = activitiesCount + (hasCheckInToday ? 1 : 0);

                // 2. Time Together (from CheckIn "hours")
                var timeCheckIn = await _context.UserCheckIns
                    .AsNoTracking()
                    .Include(x => x.CheckIn)
                    .Where(x => x.UserId == userId && ((x.ActivityDate >= today && x.ActivityDate < tomorrow) || (x.ActivityDate == null && x.CreatedOn >= today && x.CreatedOn < tomorrow)) && x.CheckIn != null && 
                           (x.CheckIn.Questions.ToLower().Contains("hour") || x.CheckIn.Questions.ToLower().Contains("time together") || x.CheckIn.Questions.ToLower().Contains("(hours)")))
                    .OrderByDescending(x => x.CreatedOn)
                    .FirstOrDefaultAsync();

                string timeDisplay = "0h";
                if (timeCheckIn != null && timeCheckIn.Rating.HasValue)
                {
                    timeDisplay = $"{timeCheckIn.Rating.Value}h";
                }

                // 3. Chakra Harmony (Distinct chakras synced today — max 7)
                var harmonyCount = await _context.ChakraLogs
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && ((x.LogDate >= today && x.LogDate < tomorrow) || (x.LogDate == null && x.CreatedAt >= today && x.CreatedAt < tomorrow)))
                    .Select(x => x.DominantBlockage)
                    .Where(db => db != null)
                    .Distinct()
                    .CountAsync();

                // 4. Bonded Score (Current Score)
                var dog = await _context.Dogs
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.UserId == userId);
                
                double currentScore = dog?.CurrentScore ?? 50;

                return Ok(ResponseHelper.Success(new
                {
                    activitiesToday = totalActivities,
                    timeTogether = timeDisplay,
                    chakraHarmony = harmonyCount,
                    bondedScore = currentScore
                }, "Dashboard summary retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred fetching dashboard summary: {ex.Message}", 500));
            }
        }
    }
}
