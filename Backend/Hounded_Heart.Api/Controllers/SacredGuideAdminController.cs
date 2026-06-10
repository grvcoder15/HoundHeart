using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/sacredguides")]
    [ApiController]
    [Authorize]
    public class SacredGuideAdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public SacredGuideAdminController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // ──────────────────────────────────────────────────
        // GET /api/admin/sacredguides/dashboard
        // ──────────────────────────────────────────────────
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var premiumUsers = await _context.Users.CountAsync(u => u.RoleId == 2);
                var totalWaitlist = await _context.SacredGuideWaitlists.CountAsync();
                var totalQueries = await _context.ExpertQueries.CountAsync(q => !q.IsDeleted);
                var pendingQueries = await _context.ExpertQueries.CountAsync(q => q.Status == "Pending" && !q.IsDeleted);

                var notifiedCount = await _context.SacredGuideWaitlists.CountAsync(w => w.IsNotified);
                var waitlistStatus = totalWaitlist > 0
                    ? $"{notifiedCount}/{totalWaitlist} notified"
                    : "No waitlist entries";

                // Get active guide price for revenue calculation (no hardcoding)
                var activeGuide = await _context.SacredGuides
                    .AsNoTracking()
                    .Where(g => g.IsActive)
                    .OrderByDescending(g => g.CreatedOn)
                    .FirstOrDefaultAsync();

                var guidePrice = activeGuide?.Price ?? 0;
                var totalPurchases = await _context.SacredGuidePurchases
                    .CountAsync(p => p.PaymentStatus == "Completed");
                var purchaseRevenue = totalPurchases * guidePrice;

                return Ok(ResponseHelper.Success(new
                {
                    monthlyRevenue = purchaseRevenue,
                    premiumUsers,
                    totalQueries,
                    pendingQueries,
                    totalWaitlist,
                    waitlistStatus,
                    guidePrice
                }, "Dashboard data retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // GET /api/admin/sacredguides/list
        // ──────────────────────────────────────────────────
        [HttpGet("list")]
        public async Task<IActionResult> GetAllGuides()
        {
            try
            {
                var guides = await _context.SacredGuides
                    .AsNoTracking()
                    .OrderByDescending(g => g.CreatedOn)
                    .Select(g => new
                    {
                        g.SacredGuideId, g.Title, g.Description, g.PdfUrl,
                        g.Price, g.Status, g.TotalPages, g.Chapters, g.Distribution, g.IsActive, g.CreatedOn
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(guides, "Guides retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // POST /api/admin/sacredguides/create
        // Creates a Draft guide (no file needed)
        // ──────────────────────────────────────────────────
        public class CreateGuideDto
        {
            public string Title { get; set; }
            public string? Description { get; set; }
            public decimal Price { get; set; }
            public int? TotalPages { get; set; }
            public string? Chapters { get; set; }
            public string? Distribution { get; set; }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateGuide([FromBody] CreateGuideDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(ResponseHelper.Fail<object>("Title is required."));

                if (dto.Title.Trim().Length < 3 || dto.Title.Length > 200)
                    return BadRequest(ResponseHelper.Fail<object>("Title must be 3–200 characters."));

                if (dto.Price < 0 || dto.Price > 99999)
                    return BadRequest(ResponseHelper.Fail<object>("Price must be between 0 and 99999."));

                // Sanitize
                var safeTitle = System.Text.RegularExpressions.Regex.Replace(dto.Title.Trim(), "<.*?>", string.Empty);
                var safeDesc = dto.Description != null
                    ? System.Text.RegularExpressions.Regex.Replace(dto.Description.Trim(), "<.*?>", string.Empty)
                    : null;

                // Deactivate any existing active guide
                var existingGuides = await _context.SacredGuides.Where(g => g.IsActive).ToListAsync();
                foreach (var g in existingGuides) g.IsActive = false;

                var guide = new SacredGuide
                {
                    SacredGuideId = Guid.NewGuid(),
                    Title = safeTitle,
                    Description = safeDesc,
                    Price = dto.Price,
                    TotalPages = dto.TotalPages,
                    Chapters = dto.Chapters,
                    Distribution = dto.Distribution ?? "Exclusive",
                    Status = "Draft",
                    IsActive = true,
                    CreatedOn = DateTime.UtcNow
                };
                _context.SacredGuides.Add(guide);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    guide.SacredGuideId,
                    guide.Title,
                    guide.Price,
                    guide.Status
                }, "Guide created as Draft.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // GET /api/admin/sacredguides/{id}/status
        // ──────────────────────────────────────────────────
        [HttpGet("{id}/status")]
        public async Task<IActionResult> GetGuideStatus(Guid id)
        {
            try
            {
                var guide = await _context.SacredGuides
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.SacredGuideId == id);

                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Guide not found."));

                var totalWaitlist = await _context.SacredGuideWaitlists
                    .CountAsync(w => w.SacredGuideId == id);

                var premiumUsers = await _context.Users.CountAsync(u => u.RoleId == 2);
                var freeUsers = await _context.Users.CountAsync(u => u.RoleId != 2 || u.RoleId == null);

                return Ok(ResponseHelper.Success(new
                {
                    guide.SacredGuideId,
                    guide.Title,
                    guide.Description,
                    guide.Status,
                    guide.PdfUrl,
                    guide.Price,
                    guide.TotalPages,
                    guide.Chapters,
                    guide.Distribution,
                    totalWaitlist,
                    premiumUsers,
                    freeUsers
                }, "Status retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // PUT /api/admin/sacredguides/{id}
        // Updates a guide's details (Title, Desc, Price, etc)
        // ──────────────────────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGuide(Guid id, [FromBody] CreateGuideDto dto)
        {
            try
            {
                var guide = await _context.SacredGuides.FirstOrDefaultAsync(g => g.SacredGuideId == id);
                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Guide not found."));

                if (string.IsNullOrWhiteSpace(dto.Title))
                    return BadRequest(ResponseHelper.Fail<object>("Title is required."));

                if (dto.Title.Trim().Length < 3 || dto.Title.Length > 200)
                    return BadRequest(ResponseHelper.Fail<object>("Title must be 3–200 characters."));

                if (dto.Price < 0 || dto.Price > 99999)
                    return BadRequest(ResponseHelper.Fail<object>("Price must be between 0 and 99999."));

                guide.Title = System.Text.RegularExpressions.Regex.Replace(dto.Title.Trim(), "<.*?>", string.Empty);
                guide.Description = dto.Description != null
                    ? System.Text.RegularExpressions.Regex.Replace(dto.Description.Trim(), "<.*?>", string.Empty)
                    : null;
                guide.Price = dto.Price;
                guide.TotalPages = dto.TotalPages;
                guide.Chapters = dto.Chapters;
                guide.Distribution = dto.Distribution ?? "Exclusive";
                guide.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new { guide.SacredGuideId, guide.Title }, "Guide updated successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // DELETE /api/admin/sacredguides/{id}
        // Soft deletes a guide
        // ──────────────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGuide(Guid id)
        {
            try
            {
                var guide = await _context.SacredGuides.FirstOrDefaultAsync(g => g.SacredGuideId == id);
                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Guide not found."));

                // Hard delete: remove waitlist first to avoid FK constraint errors, then remove guide
                var waitlistItems = await _context.SacredGuideWaitlists.Where(w => w.SacredGuideId == id).ToListAsync();
                if (waitlistItems.Any())
                {
                    _context.SacredGuideWaitlists.RemoveRange(waitlistItems);
                }

                _context.SacredGuides.Remove(guide);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>(null, "Guide completely removed.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // GET /api/admin/sacredguides/{id}/waitlist
        // ──────────────────────────────────────────────────
        [HttpGet("{id}/waitlist")]
        public async Task<IActionResult> GetWaitlist(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.SacredGuideWaitlists
                    .Where(w => w.SacredGuideId == id)
                    .Join(_context.Users,
                        w => w.UserId,
                        u => u.UserId,
                        (w, u) => new
                        {
                            w.WaitlistId,
                            name = u.FullName ?? u.Email,
                            email = u.Email,
                            tier = u.RoleId == 2 ? "Premium" : "Free",
                            joinDate = w.JoinedOn,
                            w.IsNotified
                        });

                var total = await query.CountAsync();
                var items = await query
                    .OrderByDescending(x => x.joinDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new { items, total }, "Waitlist retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // POST /api/admin/sacredguides/{id}/launch
        // ──────────────────────────────────────────────────
        [HttpPost("{id}/launch")]
        public async Task<IActionResult> LaunchGuide(Guid id)
        {
            try
            {
                var guide = await _context.SacredGuides.FirstOrDefaultAsync(g => g.SacredGuideId == id);
                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Guide not found."));

                guide.Status = "Live";
                guide.UpdatedOn = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>(new { guide.SacredGuideId, guide.Status }, "Sacred Guide launched!", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // POST /api/admin/sacredguides/{id}/notify-waitlist
        // ──────────────────────────────────────────────────
        [HttpPost("{id}/notify-waitlist")]
        public async Task<IActionResult> NotifyWaitlist(Guid id)
        {
            try
            {
                var entries = await _context.SacredGuideWaitlists
                    .Where(w => w.SacredGuideId == id && !w.IsNotified)
                    .ToListAsync();

                if (entries.Count == 0)
                    return Ok(ResponseHelper.Success<object>(new { notified = 0 }, "All users already notified.", 200));

                foreach (var e in entries) e.IsNotified = true;
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>(
                    new { notified = entries.Count },
                    $"{entries.Count} users notified successfully!", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ──────────────────────────────────────────────────
        // POST /api/admin/sacredguides/upload
        // ──────────────────────────────────────────────────
        [HttpPost("upload")]
        [RequestSizeLimit(52_428_800)] // 50 MB
        public async Task<IActionResult> UploadPdf(
            IFormFile docxFile,
            [FromForm] string? title,
            [FromForm] string? description,
            [FromForm] decimal? price,
            [FromForm] int? totalPages,
            [FromForm] string? chapters,
            [FromForm] string? distribution)
        {
            try
            {
                // ─── 1. Required Field Re-Validation ───
                if (string.IsNullOrWhiteSpace(title))
                    return BadRequest(ResponseHelper.Fail<object>("Title is required."));

                if (title.Trim().Length < 3 || title.Length > 200)
                    return BadRequest(ResponseHelper.Fail<object>("Title must be 3–200 characters."));

                if (!price.HasValue)
                    return BadRequest(ResponseHelper.Fail<object>("Price is required."));

                if (price.Value < 0 || price.Value > 99999)
                    return BadRequest(ResponseHelper.Fail<object>("Price must be between 0 and 99999."));

                if (description != null && description.Length > 1000)
                    return BadRequest(ResponseHelper.Fail<object>("Description must be under 1000 characters."));

                // ─── 2. File Validation ───
                if (docxFile == null || docxFile.Length == 0)
                    return BadRequest(ResponseHelper.Fail<object>("Please upload a DOCX file."));

                if (docxFile.Length > 52_428_800)
                    return BadRequest(ResponseHelper.Fail<object>("File size must be under 50 MB."));

                // Extension check
                var ext = Path.GetExtension(docxFile.FileName)?.ToLowerInvariant();
                if (ext != ".docx" && ext != ".pdf")
                    return BadRequest(ResponseHelper.Fail<object>("Only DOCX or PDF files are accepted."));

                // Magic bytes check (DOCX is a ZIP — starts with PK 0x50 0x4B, PDF starts with %PDF 0x25 0x50 0x44 0x46)
                using var ms = new MemoryStream();
                await docxFile.CopyToAsync(ms);
                ms.Position = 0;
                var header = new byte[4];
                await ms.ReadAsync(header, 0, 4);
                
                bool isDocx = header[0] == 0x50 && header[1] == 0x4B;
                bool isPdf = header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
                
                if (!isDocx && !isPdf)
                    return BadRequest(ResponseHelper.Fail<object>("File is not a valid DOCX or PDF document."));

                // ─── 3. Sanitize Text Inputs ───
                var safeTitle = System.Text.RegularExpressions.Regex.Replace(title.Trim(), "<.*?>", string.Empty);
                var safeDesc = description != null
                    ? System.Text.RegularExpressions.Regex.Replace(description.Trim(), "<.*?>", string.Empty)
                    : null;

                // ─── 4. Save File with Unique Name ───
                var uploadsDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads", "sacred-guides");
                Directory.CreateDirectory(uploadsDir);

                var fileName = $"sacred-guide-{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadsDir, fileName);

                ms.Position = 0;
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await ms.CopyToAsync(fileStream);
                }

                var pdfUrl = $"/uploads/sacred-guides/{fileName}";

                // ─── 5. Update or Create Guide ───
                var guide = await _context.SacredGuides
                    .Where(g => g.IsActive)
                    .OrderByDescending(g => g.CreatedOn)
                    .FirstOrDefaultAsync();

                if (guide != null)
                {
                    guide.Title = safeTitle;
                    guide.Description = safeDesc;
                    guide.PdfUrl = pdfUrl;
                    guide.Price = price.Value;
                    guide.TotalPages = totalPages;
                    guide.Chapters = chapters;
                    guide.Distribution = distribution ?? "Exclusive";
                    guide.Status = "Ready";
                    guide.UpdatedOn = DateTime.UtcNow;
                }
                else
                {
                    guide = new SacredGuide
                    {
                        SacredGuideId = Guid.NewGuid(),
                        Title = safeTitle,
                        Description = safeDesc,
                        PdfUrl = pdfUrl,
                        Price = price.Value,
                        TotalPages = totalPages,
                        Chapters = chapters,
                        Distribution = distribution ?? "Exclusive",
                        Status = "Ready",
                        IsActive = true,
                        CreatedOn = DateTime.UtcNow
                    };
                    _context.SacredGuides.Add(guide);
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    guide.SacredGuideId,
                    guide.PdfUrl,
                    guide.Status,
                    guide.Title,
                    guide.Price,
                    fileSize = docxFile.Length
                }, "Sacred Guide published successfully!", 200));
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {msg}"));
            }
        }
    }
}
