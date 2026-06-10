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
        public async Task<IActionResult> GetAllBondingActivities()
        {
            try
            {
                var activities = await _context.BondingActivities
                    .OrderBy(a => a.ActivityName)
                    .ToListAsync();

                if (activities == null || activities.Count == 0)
                    return Ok(ResponseHelper.Success(new List<object>(), "No bonding activities found.", 200));

                return Ok(ResponseHelper.Success(activities, "Bonding activities retrieved successfully.", 200));
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
                var today = DateTime.UtcNow.Date;

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
