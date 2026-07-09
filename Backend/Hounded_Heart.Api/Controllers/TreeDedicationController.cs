using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TreeDedicationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BlobStorageService _blobStorage;

        public TreeDedicationController(AppDbContext context, BlobStorageService blobStorage)
        {
            _context = context;
            _blobStorage = blobStorage;
        }

        private Guid? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("UserId")?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (Guid.TryParse(userIdClaim, out var userId))
                return userId;

            return null;
        }

        // POST /api/TreeDedication
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateDedication([FromBody] CreateTreeDedicationDto dto)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            try
            {
                var fileName = $"TreeDedication_{Guid.NewGuid()}.jpg";
                var photoUrl = await _blobStorage.UploadBase64ImageAsync(dto.Base64Image, fileName);

                var dedication = new TreeDedication
                {
                    UserId = userId.Value,
                    DogName = dto.DogName,
                    TributeMessage = dto.TributeMessage,
                    PhotoUrl = photoUrl,
                    DedicationType = dto.DedicationType,
                    Status = "PendingReview",
                    GrowthStage = "🌱 Sapling",
                    CreatedAt = DateTime.UtcNow
                };

                _context.TreeDedications.Add(dedication);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(dedication, "Tree dedication submitted successfully.", 201));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Failed to submit dedication: {ex.Message}", 500));
            }
        }

        // GET /api/TreeDedication/live
        [HttpGet("live")]
        [Authorize]
        public async Task<IActionResult> GetLiveDedications()
        {
            var rawDedications = await _context.TreeDedications
                .Where(t => t.Status == "Live")
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.DogName,
                    t.TributeMessage,
                    t.PhotoUrl,
                    t.DedicationType,
                    t.GrowthStage,
                    t.CreatedAt,
                    UserFullName = t.User != null ? t.User.FullName : "Anonymous"
                })
                .ToListAsync();

            var dedications = rawDedications.Select(t => new
            {
                t.Id,
                t.DogName,
                t.TributeMessage,
                PhotoUrl = !string.IsNullOrEmpty(t.PhotoUrl) ? _blobStorage.GetPresignedUrl(t.PhotoUrl) : null,
                t.DedicationType,
                t.GrowthStage,
                t.CreatedAt,
                t.UserFullName
            }).ToList();

            return Ok(ResponseHelper.Success(dedications, "Live dedications retrieved successfully.", 200));
        }

        // GET /api/TreeDedication/user
        [HttpGet("user")]
        [Authorize]
        public async Task<IActionResult> GetUserDedications()
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var rawDedications = await _context.TreeDedications
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var dedications = rawDedications.Select(t => new
            {
                t.Id,
                t.DogName,
                t.TributeMessage,
                PhotoUrl = !string.IsNullOrEmpty(t.PhotoUrl) ? _blobStorage.GetPresignedUrl(t.PhotoUrl) : null,
                t.DedicationType,
                t.GrowthStage,
                t.Status,
                t.CreatedAt
            }).ToList();

            return Ok(ResponseHelper.Success(dedications, "User dedications retrieved successfully.", 200));
        }

        // GET /api/TreeDedication/admin/pending
        [HttpGet("admin/pending")]
        [Authorize] // Should ideally check if admin, but keeping consistent with existing patterns
        public async Task<IActionResult> GetPendingDedications()
        {
            var rawDedications = await _context.TreeDedications
                .Where(t => t.Status == "PendingReview")
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.DogName,
                    t.TributeMessage,
                    t.PhotoUrl,
                    t.DedicationType,
                    t.CreatedAt,
                    UserFullName = t.User != null ? t.User.FullName : "Anonymous"
                })
                .ToListAsync();

            var dedications = rawDedications.Select(t => new
            {
                t.Id,
                t.DogName,
                t.TributeMessage,
                PhotoUrl = !string.IsNullOrEmpty(t.PhotoUrl) ? _blobStorage.GetPresignedUrl(t.PhotoUrl) : null,
                t.DedicationType,
                t.CreatedAt,
                t.UserFullName
            }).ToList();

            return Ok(ResponseHelper.Success(dedications, "Pending dedications retrieved.", 200));
        }

        // GET /api/TreeDedication/admin/live
        [HttpGet("admin/live")]
        [Authorize]
        public async Task<IActionResult> GetAdminLiveDedications()
        {
            var rawDedications = await _context.TreeDedications
                .Where(t => t.Status == "Live")
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.DogName,
                    t.TributeMessage,
                    t.PhotoUrl,
                    t.DedicationType,
                    t.GrowthStage,
                    t.CreatedAt,
                    UserFullName = t.User != null ? t.User.FullName : "Anonymous"
                })
                .ToListAsync();

            var dedications = rawDedications.Select(t => new
            {
                t.Id,
                t.DogName,
                t.TributeMessage,
                PhotoUrl = !string.IsNullOrEmpty(t.PhotoUrl) ? _blobStorage.GetPresignedUrl(t.PhotoUrl) : null,
                t.DedicationType,
                t.GrowthStage,
                t.CreatedAt,
                t.UserFullName
            }).ToList();

            return Ok(ResponseHelper.Success(dedications, "Live dedications retrieved.", 200));
        }

        // PUT /api/TreeDedication/admin/{id}/status
        [HttpPut("admin/{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTreeDedicationStatusDto dto)
        {
            var dedication = await _context.TreeDedications.FindAsync(id);
            if (dedication == null)
                return NotFound(ResponseHelper.Fail<object>("Dedication not found."));

            dedication.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(dedication, "Status updated successfully.", 200));
        }

        // PUT /api/TreeDedication/admin/{id}/stage
        [HttpPut("admin/{id}/stage")]
        [Authorize]
        public async Task<IActionResult> UpdateStage(Guid id, [FromBody] UpdateTreeDedicationStageDto dto)
        {
            var dedication = await _context.TreeDedications.FindAsync(id);
            if (dedication == null)
                return NotFound(ResponseHelper.Fail<object>("Dedication not found."));

            dedication.GrowthStage = dto.GrowthStage;
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(dedication, "Stage updated successfully.", 200));
        }

        // DELETE /api/TreeDedication/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteDedication(Guid id)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("Unauthorized."));

            var dedication = await _context.TreeDedications.FindAsync(id);
            if (dedication == null)
                return NotFound(ResponseHelper.Fail<object>("Dedication not found."));

            // Ensure the user owns this dedication
            if (dedication.UserId != userId)
                return Forbid();

            _context.TreeDedications.Remove(dedication);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success<object>(null, "Dedication deleted successfully.", 200));
        }
    }
}
