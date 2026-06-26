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
    public class SeniorDogSubmissionController : ControllerBase
    {
        private protected readonly AppDbContext _context;

        public SeniorDogSubmissionController(AppDbContext context)
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

        // POST /api/SeniorDogSubmission
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Submit([FromBody] CreateSeniorDogSubmissionDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submission = new SeniorDogSubmission
            {
                UserId = userId.Value,
                DogName = dto.DogName,
                Story = dto.Story,
                PhotoUrl = dto.PhotoUrl,
                Status = "PendingReview",
                CreatedAt = DateTime.UtcNow
            };

            _context.SeniorDogSubmissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(submission, "Senior Dog submission created successfully.", 201));
        }

        // GET /api/SeniorDogSubmission/live
        [HttpGet("live")]
        public async Task<IActionResult> GetLiveSubmissions()
        {
            var submissions = await _context.SeniorDogSubmissions
                .Where(s => s.Status == "Live")
                .Include(s => s.User)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.DogName,
                    s.Story,
                    s.PhotoUrl,
                    s.Status,
                    s.CreatedAt,
                    UserFullName = s.User != null ? s.User.FullName : "Anonymous"
                })
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "Live senior dog submissions retrieved successfully.", 200));
        }

        // GET /api/SeniorDogSubmission/user
        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserSubmissions()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submissions = await _context.SeniorDogSubmissions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "User's senior dog submissions retrieved successfully.", 200));
        }

        // GET /api/SeniorDogSubmission/admin/pending
        [HttpGet("admin/pending")]
        [Authorize] // Should ideally check for Admin role here
        public async Task<IActionResult> GetPendingSubmissions()
        {
            var submissions = await _context.SeniorDogSubmissions
                .Where(s => s.Status == "PendingReview")
                .Include(s => s.User)
                .OrderBy(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.DogName,
                    s.Story,
                    s.PhotoUrl,
                    s.Status,
                    s.CreatedAt,
                    UserFullName = s.User != null ? s.User.FullName : "Anonymous"
                })
                .ToListAsync();

            return Ok(ResponseHelper.Success(submissions, "Pending senior dog submissions retrieved successfully.", 200));
        }

        // PUT /api/SeniorDogSubmission/admin/{id}/status
        [HttpPut("admin/{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateSeniorDogStatusDto dto)
        {
            var submission = await _context.SeniorDogSubmissions.FindAsync(id);
            if (submission == null)
                return NotFound(ResponseHelper.Fail<object>("Submission not found."));

            submission.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(submission, "Status updated successfully.", 200));
        }

        // DELETE /api/SeniorDogSubmission/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteSubmission(Guid id)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var submission = await _context.SeniorDogSubmissions.FindAsync(id);
            if (submission == null)
                return NotFound(ResponseHelper.Fail<object>("Submission not found."));

            if (submission.UserId != userId)
                return Forbid();

            _context.SeniorDogSubmissions.Remove(submission);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success<object>(null, "Submission deleted successfully.", 200));
        }
    }
}
