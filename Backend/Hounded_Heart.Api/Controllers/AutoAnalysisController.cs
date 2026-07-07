using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AutoAnalysisController : ControllerBase
    {
        private readonly IAutoAnalysisService _autoAnalysisService;
        private readonly AppDbContext _context;

        public AutoAnalysisController(IAutoAnalysisService autoAnalysisService, AppDbContext context)
        {
            _autoAnalysisService = autoAnalysisService;
            _context = context;
        }

        [HttpGet("GetSuggestions")]
        public async Task<IActionResult> GetSuggestions([FromQuery] Guid userId, [FromQuery] Guid dogId, [FromQuery] DateTime? date)
        {
            try
            {
                if (userId == Guid.Empty || dogId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<object>("UserId and DogId are required.", 400));

                var parsedDate = date?.Date ?? DateTime.UtcNow.Date;
                var targetDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);

                // Check premium status
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && !u.IsDeleted);
                if (user == null || !user.IsPremium)
                {
                    return Ok(ResponseHelper.Success(new
                    {
                        checkInSuggestions = new object[] { },
                        ritualSuggestions = new object[] { },
                        activitySuggestions = new object[] { }
                    }, "Manual mode (Free tier). Auto-analysis skipped.", 200));
                }

                // 1. Get raw suggestions
                var rawSuggestions = await _autoAnalysisService.GetAutoSuggestionsAsync(userId, dogId, targetDate);

                // Return all suggestions — the frontend tracks userOverrides to avoid
                // overwriting sliders the user has manually touched.
                // (Do NOT strip already-saved IDs here — auto-save runs immediately
                //  after suggestions are applied, which would make all arrays empty.)

                return Ok(ResponseHelper.Success(new
                {
                    checkInSuggestions = rawSuggestions.CheckInSuggestions,
                    ritualSuggestions = rawSuggestions.RitualSuggestions,
                    activitySuggestions = rawSuggestions.ActivitySuggestions
                }, "Auto-suggestions generated successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while getting auto suggestions: {ex.Message}", 500));
            }
        }
    }
}
