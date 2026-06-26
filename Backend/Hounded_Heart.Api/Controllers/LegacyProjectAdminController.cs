using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Hounded_Heart.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LegacyProjectAdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LegacyProjectAdminController(AppDbContext context)
        {
            _context = context;
        }

        private async Task<bool> IsAuthorizedAsync()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out Guid userId)) return false;
            
            // Admins (RoleId=1) always have access
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return false;
            if (user.RoleId == 1) return true;

            // Premium users: verify via live Subscriptions table (RoleId alone can be stale)
            var hasPremiumSub = await _context.Subscriptions
                .AnyAsync(s => s.UserId == userId
                            && s.Status == "active"
                            && s.PlanName != null
                            && s.PlanName.ToLower().Contains("premium"));
            return hasPremiumSub;
        }
        
        private async Task<bool> IsAdminAsync()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out Guid userId)) return false;
            
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
            return user != null && user.RoleId == 1;
        }

        // --- CONTENT (Descriptions & Stats) ---

        [HttpGet("content")]
        public async Task<IActionResult> GetContent([FromQuery] string sectionKey)
        {
            if (!await IsAuthorizedAsync()) 
                return StatusCode(403, ResponseHelper.Fail<object>("Premium subscription required to access the Legacy Project."));

            var content = await _context.LegacyProjectContents.FirstOrDefaultAsync(c => c.SectionKey == sectionKey);
            if (content == null)
            {
                // Return empty default
                return Ok(ResponseHelper.Success(new LegacyProjectContent { SectionKey = sectionKey, Description = "", ImpactStatsJson = "{}" }));
            }
            return Ok(ResponseHelper.Success(content));
        }

        [HttpPut("content")]
        public async Task<IActionResult> UpdateContent([FromBody] LegacyProjectContentDto dto)
        {
            if (!await IsAdminAsync()) return StatusCode(403, ResponseHelper.Fail<object>("Admin access required."));

            var content = await _context.LegacyProjectContents.FirstOrDefaultAsync(c => c.SectionKey == dto.SectionKey);
            if (content == null)
            {
                content = new LegacyProjectContent
                {
                    SectionKey = dto.SectionKey,
                    Description = dto.Description,
                    ImpactStatsJson = dto.ImpactStatsJson
                };
                _context.LegacyProjectContents.Add(content);
            }
            else
            {
                content.Description = dto.Description;
                content.ImpactStatsJson = dto.ImpactStatsJson;
                content.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(content, "Content updated successfully"));
        }

        // --- UPDATES FEED ---

        [HttpGet("updates")]
        public async Task<IActionResult> GetUpdates([FromQuery] string sectionKey)
        {
            if (!await IsAuthorizedAsync()) 
                return StatusCode(403, ResponseHelper.Fail<object>("Premium subscription required to access the Legacy Project."));

            var updates = await _context.LegacyProjectUpdates
                .Where(u => string.IsNullOrEmpty(sectionKey) || u.SectionKey == sectionKey)
                .OrderByDescending(u => u.Date)
                .ToListAsync();
            return Ok(ResponseHelper.Success(updates));
        }

        [HttpPost("updates")]
        public async Task<IActionResult> CreateUpdate([FromBody] LegacyProjectUpdateDto dto)
        {
            if (!await IsAdminAsync()) return StatusCode(403, ResponseHelper.Fail<object>("Admin access required."));

            var update = new LegacyProjectUpdate
            {
                SectionKey = dto.SectionKey,
                Content = dto.Content,
                Date = dto.Date == default ? DateTime.UtcNow : dto.Date
            };
            _context.LegacyProjectUpdates.Add(update);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(update, "Update posted successfully"));
        }

        [HttpDelete("updates/{id}")]
        public async Task<IActionResult> DeleteUpdate(Guid id)
        {
            if (!await IsAdminAsync()) return StatusCode(403, ResponseHelper.Fail<object>("Admin access required."));

            var update = await _context.LegacyProjectUpdates.FindAsync(id);
            if (update == null) return NotFound(ResponseHelper.Fail<object>("Update not found"));

            _context.LegacyProjectUpdates.Remove(update);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success("Update deleted successfully"));
        }

        // --- ADMIN PHOTOS ---

        [HttpGet("photos")]
        public async Task<IActionResult> GetPhotos([FromQuery] string sectionKey)
        {
            if (!await IsAuthorizedAsync()) 
                return StatusCode(403, ResponseHelper.Fail<object>("Premium subscription required to access the Legacy Project."));

            var photos = await _context.LegacyProjectAdminPhotos
                .Where(p => string.IsNullOrEmpty(sectionKey) || p.SectionKey == sectionKey)
                .OrderBy(p => p.DisplayOrder)
                .ThenByDescending(p => p.UploadedAt)
                .ToListAsync();
            return Ok(ResponseHelper.Success(photos));
        }

        [HttpPost("photos")]
        public async Task<IActionResult> UploadPhoto([FromBody] LegacyProjectAdminPhotoDto dto)
        {
            if (!await IsAdminAsync()) return StatusCode(403, ResponseHelper.Fail<object>("Admin access required."));

            var photo = new LegacyProjectAdminPhoto
            {
                SectionKey = dto.SectionKey,
                PhotoUrl = dto.PhotoUrl,
                DisplayOrder = dto.DisplayOrder
            };
            _context.LegacyProjectAdminPhotos.Add(photo);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(photo, "Photo uploaded successfully"));
        }

        [HttpDelete("photos/{id}")]
        public async Task<IActionResult> DeletePhoto(Guid id)
        {
            if (!await IsAdminAsync()) return StatusCode(403, ResponseHelper.Fail<object>("Admin access required."));

            var photo = await _context.LegacyProjectAdminPhotos.FindAsync(id);
            if (photo == null) return NotFound(ResponseHelper.Fail<object>("Photo not found"));

            _context.LegacyProjectAdminPhotos.Remove(photo);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success("Photo deleted successfully"));
        }
    }
}
