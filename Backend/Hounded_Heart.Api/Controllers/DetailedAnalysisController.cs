using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DetailedAnalysisController : ControllerBase
    {
        private readonly IDetailedAnalysisService _analysisService;

        public DetailedAnalysisController(IDetailedAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId)) return userId;
            throw new UnauthorizedAccessException("User not found.");
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze()
        {
            try
            {
                var userId = GetUserId();
                var result = await _analysisService.CreateAsync(userId);
                return Ok(ResponseHelper.Success(result, "Detailed analysis complete.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> History()
        {
            try
            {
                var userId = GetUserId();
                var history = await _analysisService.GetHistoryAsync(userId);
                return Ok(ResponseHelper.Success(history, "Detailed analysis history retrieved.", 200));
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
                var result = await _analysisService.GetByIdAsync(userId, id);
                return Ok(ResponseHelper.Success(result, "Detailed analysis retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }
    }
}
