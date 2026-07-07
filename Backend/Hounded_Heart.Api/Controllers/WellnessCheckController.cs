using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WellnessCheckController : ControllerBase
    {
        private readonly IWellnessCheckService _wellnessService;
        private readonly AppDbContext _context;

        public WellnessCheckController(IWellnessCheckService wellnessService, AppDbContext context)
        {
            _wellnessService = wellnessService;
            _context = context;
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId)) return userId;
            throw new UnauthorizedAccessException("User not found.");
        }

        private async Task<bool> HasPremiumOrPlusAccessAsync(Guid userId)
        {
            var hasActiveSub = await _context.Subscriptions
                .AnyAsync(s => s.UserId == userId
                            && s.Status == "active"
                            && s.PlanName != null
                            && (s.PlanName.ToLower().Contains("premium") || s.PlanName.ToLower().Contains("plus")));
            return hasActiveSub;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] WellnessCheckCreateDto dto)
        {
            try
            {
                var userId = GetUserId();
                bool isSubscribed = await HasPremiumOrPlusAccessAsync(userId);

                // Free-tier users: hard block on the server side
                if (!isSubscribed)
                {
                    return StatusCode(403, ResponseHelper.Fail<object>(
                        "Wellness Check is available for Plus and Premium members only. Please upgrade your subscription."));
                }

                // Pass subscription status so the service can unlock FitBark enrichment
                var result = await _wellnessService.SubmitAsync(userId, dto, isSubscribed: true);
                return Ok(ResponseHelper.Success(result, result.Message ?? "Analysis successful.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                var userId = GetUserId();
                if (!await HasPremiumOrPlusAccessAsync(userId))
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Access Denied."));
                }

                var history = await _wellnessService.GetHistoryAsync(userId);
                return Ok(ResponseHelper.Success(history, "History retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (!await HasPremiumOrPlusAccessAsync(userId))
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Access Denied."));
                }

                var result = await _wellnessService.GetByIdAsync(userId, id);
                return Ok(ResponseHelper.Success(result, "Result retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (!await HasPremiumOrPlusAccessAsync(userId))
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Access Denied."));
                }

                await _wellnessService.DeleteAsync(userId, id);
                return Ok(ResponseHelper.Success<object>(null, "Wellness check deleted successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }
    }
}
