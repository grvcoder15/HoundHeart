using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResearchSubmissionController : ControllerBase
    {
        private protected readonly AppDbContext _context;

        public ResearchSubmissionController(AppDbContext context)
        {
            _context = context;
        }

        private Guid? GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdStr, out var userId))
                return userId;
            return null;
        }

        // POST /api/ResearchSubmission
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Submit([FromBody] CreateResearchSubmissionDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submission = new ResearchSubmission
            {
                UserId = userId.Value,
                Title = dto.Title,
                Description = dto.Description,
                PhotoUrl = dto.PhotoUrl,
                Status = "PendingReview",
                CreatedAt = DateTime.UtcNow
            };

            _context.ResearchSubmissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(submission, "Research submission created successfully.", 201));
        }

        // GET /api/ResearchSubmission/live
        [HttpGet("live")]
        public async Task<IActionResult> GetLiveSubmissions()
        {
            var submissions = await _context.ResearchSubmissions
                .Where(s => s.Status == "Live")
                .Include(s => s.User)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    s.PhotoUrl,
                    s.Status,
                    s.CreatedAt,
                    UserFullName = s.User != null ? s.User.FullName : "Anonymous"
                })
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "Live research submissions retrieved successfully.", 200));
        }

        // GET /api/ResearchSubmission/user
        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserSubmissions()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submissions = await _context.ResearchSubmissions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "User's research submissions retrieved successfully.", 200));
        }

        // GET /api/ResearchSubmission/admin/pending
        [HttpGet("admin/pending")]
        [Authorize]
        public async Task<IActionResult> GetPendingSubmissions()
        {
            var submissions = await _context.ResearchSubmissions
                .Where(s => s.Status == "PendingReview")
                .Include(s => s.User)
                .OrderBy(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    s.PhotoUrl,
                    s.Status,
                    s.CreatedAt,
                    UserFullName = s.User != null ? s.User.FullName : "Anonymous"
                })
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "Pending research submissions retrieved successfully.", 200));
        }

        // PUT /api/ResearchSubmission/admin/{id}/status
        [HttpPut("admin/{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateResearchStatusDto dto)
        {
            var submission = await _context.ResearchSubmissions.FindAsync(id);
            if (submission == null)
                return NotFound(ResponseHelper.Fail<object>("Submission not found."));

            submission.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(submission, "Status updated successfully.", 200));
        }

        // DELETE /api/ResearchSubmission/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteSubmission(Guid id)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submission = await _context.ResearchSubmissions.FindAsync(id);
            if (submission == null)
                return NotFound(ResponseHelper.Fail<object>("Submission not found."));

            if (submission.UserId != userId)
                return Forbid();

            _context.ResearchSubmissions.Remove(submission);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success<object>(null, "Submission deleted successfully.", 200));
        }
    }
}
