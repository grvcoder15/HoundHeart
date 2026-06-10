using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaselineController : ControllerBase
    {
        private readonly IBaselineService _baselineService;

        public BaselineController(IBaselineService baselineService)
        {
            _baselineService = baselineService;
        }

        [HttpGet("progress/{userId}/{dogId}")]
        public async Task<IActionResult> GetProgress(Guid userId, Guid dogId)
        {
            var result = await _baselineService.GetBaselineProgressAsync(userId, dogId);
            return Ok(ResponseHelper.Success(result, "Baseline calibration progress retrieved (Sandbox).", 200));
        }

        [HttpGet("history/{userId}/{dogId}")]
        public async Task<IActionResult> GetHistory(Guid userId, Guid dogId)
        {
            var history = await _baselineService.GetBaselineHistoryAsync(userId, dogId);
            return Ok(ResponseHelper.Success(history, "Baseline calibration history retrieved (Sandbox).", 200));
        }

        [HttpPost("calculate/{userId}")]
        public async Task<IActionResult> CalculateBaseline(Guid userId, [FromQuery] string? mode = null)
        {
            bool testMode = mode?.ToLower() == "test";
            
            var result = await _baselineService.CalculateAndSaveBaselineAsync(userId, testMode: testMode);
            
            return Ok(ResponseHelper.Success(result, "Baseline calculation completed.", 200));
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetBaseline(Guid userId)
        {
            var result = await _baselineService.GetBaseline(userId);
            
            if (result == null)
            {
                return NotFound(ResponseHelper.Fail<object>("No baseline found for this user.", 404));
            }
            
            return Ok(ResponseHelper.Success(result, "Baseline retrieved successfully.", 200));
        }

        [HttpPost("reset/{userId}")]
        public async Task<IActionResult> ResetBaseline(Guid userId)
        {
            var result = await _baselineService.ResetBaselineAsync(userId);
            
            if (!result)
            {
                return NotFound(ResponseHelper.Fail<object>("No baseline found for this user.", 404));
            }
            
            return Ok(new { message = "Baseline reset. Data collection will restart." });
        }
    }
}
