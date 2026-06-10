using Hounded_Heart.Api.Response;
using Microsoft.AspNetCore.Mvc;
using Hounded_Heart.Services.Services;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExpertQueryController : ControllerBase
    {
        private readonly IExpertQueryService _service;

        public ExpertQueryController(IExpertQueryService service)
        {
            _service = service;
        }

        private Guid GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId)) return userId;
            throw new UnauthorizedAccessException("User not found.");
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitQuery([FromBody] ExpertQueryCreateDto dto)
        {
            try
            {
                var userId = GetUserId();
                var result = await _service.SubmitQueryAsync(userId, dto);
                return Ok(ResponseHelper.Success(result, "Query submitted successfully.", 200));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ResponseHelper.Fail<object>(ex.Message, 400));
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? "No inner exception.";
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message} {innerMsg}", 500));
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                var userId = GetUserId();
                var queries = await _service.GetUserQueriesAsync(userId);
                return Ok(ResponseHelper.Success(queries, "Query history retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message}", 500));
            }
        }

        [HttpGet("categories")]
        [AllowAnonymous] // Allow fetching categories without auth if needed, or keep authorized
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _service.GetCategoriesAsync();
                return Ok(ResponseHelper.Success(categories, "Categories retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message}", 500));
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuery(Guid id)
        {
            var userId = GetUserId();
            var success = await _service.DeleteUserQueryAsync(userId, id);
            if (success) return Ok(ResponseHelper.Success<object>("Query removed successfully.", "Query removed successfully.", 200));
            return NotFound(ResponseHelper.Fail<object>("Query not found or already deleted.", 404));
        }
    }
}
