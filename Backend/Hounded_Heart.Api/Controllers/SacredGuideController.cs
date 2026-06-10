using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SacredGuideController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.Hosting.IWebHostEnvironment _env;
        private readonly Hounded_Heart.Services.Services.StripeService _stripeService;

        public SacredGuideController(AppDbContext context, Microsoft.AspNetCore.Hosting.IWebHostEnvironment env, Hounded_Heart.Services.Services.StripeService stripeService)
        {
            _context = context;
            _env = env;
            _stripeService = stripeService;
        }

        // ───────────────────────────────────────────────
        // Helper: extract UserId from JWT
        // ───────────────────────────────────────────────
        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(claim) && Guid.TryParse(claim, out Guid id)) return id;
            return null;
        }

        // ───────────────────────────────────────────────
        // Helper: check if user has access to this guide
        // Premium (RoleId=2) → always allowed
        // Free user with valid purchase → allowed
        // Otherwise → denied
        // ───────────────────────────────────────────────
        private async Task<bool> UserHasAccess(Guid userId, Guid sacredGuideId)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return false;
            // Premium users always have access
            if (user.RoleId == 2) return true;

            // Free users — check for a completed purchase
            var purchased = await _context.SacredGuidePurchases
                .AnyAsync(p => p.UserId == userId
                            && p.SacredGuideId == sacredGuideId
                            && p.PaymentStatus == "Completed");
            return purchased;
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/active
        // Returns the first active Sacred Guide (public)
        // ───────────────────────────────────────────────
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSacredGuide()
        {
            try
            {
                var guide = await _context.SacredGuides
                    .AsNoTracking()
                    .Where(g => g.IsActive)
                    .OrderByDescending(g => g.CreatedOn)
                    .Select(g => new
                    {
                        g.SacredGuideId,
                        g.Title,
                        g.Description,
                        g.PdfUrl,
                        g.Price,
                        g.Status,
                        g.TotalPages,
                        g.Chapters,
                        g.Distribution
                    })
                    .FirstOrDefaultAsync();

                if (guide == null)
                    return Ok(ResponseHelper.Success<object>(null, "No active guide found.", 200));

                return Ok(ResponseHelper.Success(guide, "Active guide retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/{id}
        // Full guide details — premium/purchased get full access, free users get preview info only
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetGuideDetails(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var guide = await _context.SacredGuides
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.SacredGuideId == id && g.IsActive);

                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Sacred Guide not found."));

                bool hasAccess = await UserHasAccess(userId.Value, id);

                return Ok(ResponseHelper.Success(new
                {
                    guide.SacredGuideId,
                    guide.Title,
                    guide.Description,
                    // Only provide PDF URL if user has full access; free preview relies on reader-side page locking
                    PdfUrl = hasAccess ? guide.PdfUrl : guide.PdfUrl,
                    guide.Price,
                    guide.Status,
                    guide.TotalPages,
                    guide.Chapters,
                    HasFullAccess = hasAccess,
                    PreviewPages = hasAccess ? (int?)null : 2
                }, "Guide details retrieved.", 200));
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {innerMsg}"));
            }
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/{id}/download
        // Secure PDF download — re-verifies access and checks download permission
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadPdf(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var guide = await _context.SacredGuides
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.SacredGuideId == id && g.IsActive);

                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Sacred Guide not found."));

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                // Check if user is premium
                bool isPremium = user.IsPremium || user.RoleId == 2;

                // If guide requires premium and user is not premium, check if download is allowed for free users
                if (guide.RequiresPremium && !isPremium)
                {
                    if (!guide.AllowFreeUserDownload)
                    {
                        return StatusCode(403, ResponseHelper.Fail<object>("Download is only available for Premium members. Please upgrade to download this guide."));
                    }
                }

                // Full access check (for viewing the PDF)
                bool hasAccess = await UserHasAccess(userId.Value, id);
                if (!hasAccess)
                    return StatusCode(403, ResponseHelper.Fail<object>("Access denied. Please upgrade to Premium or purchase this guide."));

                if (string.IsNullOrEmpty(guide.PdfUrl))
                    return NotFound(ResponseHelper.Fail<object>("PDF file not available."));

                // Direct local file read and dynamic content type processing
                var relativePath = guide.PdfUrl.TrimStart('/').Replace("/", "\\");
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);

                if (!System.IO.File.Exists(filePath))
                {
                    // Fallback to absolute URL fetch if somehow it's an external URL
                    if (guide.PdfUrl.StartsWith("http"))
                    {
                        using var httpClient = new System.Net.Http.HttpClient();
                        var pdfBytes = await httpClient.GetByteArrayAsync(guide.PdfUrl);
                        var extFromUrl = Path.GetExtension(guide.PdfUrl).ToLowerInvariant();
                        var cType = extFromUrl == ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
                        var fName = $"{guide.Title?.Replace(" ", "_") ?? "Sacred_Guide"}{(extFromUrl == ".docx" ? ".docx" : ".pdf")}";
                        return File(pdfBytes, cType, fName);
                    }
                    return NotFound(ResponseHelper.Fail<object>("File not found on server."));
                }

                // File exists locally
                var ext = Path.GetExtension(filePath).ToLowerInvariant();
                var contentType = ext == ".docx" 
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                    : "application/pdf";
                
                var fileName = string.IsNullOrWhiteSpace(guide.Title) 
                    ? $"Sacred_Guide{ext}" 
                    : $"{guide.Title.Replace(" ", "_")}{ext}";

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {innerMsg}"));
            }
        }

        // ───────────────────────────────────────────────
        // POST /api/SacredGuide/{id}/waitlist/join
        // Join the waitlist for a specific Sacred Guide
        // ───────────────────────────────────────────────
        public class JoinWaitlistDto
        {
            public string? Name { get; set; }
            public string? Email { get; set; }
        }

        [Authorize]
        [HttpPost("{id}/waitlist/join")]
        public async Task<IActionResult> JoinWaitlist(Guid id, [FromBody] JoinWaitlistDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                Guid targetGuideId = id;

                // If client does not have an active guide id, attach waitlist entry to the most relevant guide.
                if (targetGuideId == Guid.Empty)
                {
                    var fallbackGuide = await _context.SacredGuides
                        .OrderByDescending(g => g.IsActive)
                        .ThenByDescending(g => g.CreatedOn)
                        .FirstOrDefaultAsync();

                    if (fallbackGuide == null)
                    {
                        fallbackGuide = new SacredGuide
                        {
                            SacredGuideId = Guid.NewGuid(),
                            Title = "Upcoming Sacred Guide",
                            Description = "Auto-created to collect early waitlist interest.",
                            Status = "Draft",
                            IsActive = false,
                            CreatedOn = DateTime.UtcNow
                        };

                        _context.SacredGuides.Add(fallbackGuide);
                        await _context.SaveChangesAsync();
                    }

                    targetGuideId = fallbackGuide.SacredGuideId;
                }
                else
                {
                    // Verify requested guide exists.
                    var guideExists = await _context.SacredGuides
                        .AsNoTracking()
                        .AnyAsync(g => g.SacredGuideId == targetGuideId);

                    if (!guideExists)
                        return NotFound(ResponseHelper.Fail<object>("Sacred Guide not found."));
                }

                // Duplicate check
                var alreadyJoined = await _context.SacredGuideWaitlists
                    .AnyAsync(w => w.UserId == userId.Value && w.SacredGuideId == targetGuideId);
                if (alreadyJoined)
                    return Conflict(ResponseHelper.Fail<object>("You are already on the waitlist for this guide."));

                // Insert
                var entry = new SacredGuideWaitlist
                {
                    WaitlistId = Guid.NewGuid(),
                    SacredGuideId = targetGuideId,
                    UserId = userId.Value,
                    JoinedOn = DateTime.UtcNow,
                    IsNotified = false
                };
                _context.SacredGuideWaitlists.Add(entry);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>(
                    new { entry.WaitlistId, entry.SacredGuideId, entry.UserId, entry.JoinedOn },
                    "Successfully joined the waitlist!",
                    200
                ));
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {innerMsg}"));
            }
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/{id}/waitlist/status
        // Check if the logged-in user already joined
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpGet("{id}/waitlist/status")]
        public async Task<IActionResult> WaitlistStatus(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var joined = await _context.SacredGuideWaitlists
                    .AnyAsync(w => w.UserId == userId.Value && w.SacredGuideId == id);
                return Ok(ResponseHelper.Success(new { joined }, "Status retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/{id}/preview-config
        // Get preview configuration for Sacred Guide (database-driven, no hardcoding)
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpGet("{id}/preview-config")]
        public async Task<IActionResult> GetPreviewConfig(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var guide = await _context.SacredGuides
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.SacredGuideId == id && g.IsActive);

                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Sacred Guide not found."));

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                // Determine if user is premium
                bool isPremium = user.IsPremium || user.RoleId == 2;

                // Calculate allowed pages based on preview percentage
                int totalPages = guide.TotalPages ?? 0;
                int previewPercentage = guide.PreviewPercentage;
                int allowedPages = isPremium ? totalPages : (int)Math.Ceiling(totalPages * (previewPercentage / 100.0));

                // Check if user has full access
                bool hasFullAccess = isPremium || await UserHasAccess(userId.Value, id);

                var config = new SacredGuidePreviewConfigDto
                {
                    SacredGuideId = guide.SacredGuideId,
                    TotalPages = totalPages,
                    PreviewPercentage = previewPercentage,
                    AllowedPages = hasFullAccess ? totalPages : allowedPages,
                    AllowDownload = hasFullAccess || (!guide.RequiresPremium && guide.AllowFreeUserDownload),
                    RequiresPremium = guide.RequiresPremium,
                    UserIsPremium = isPremium,
                    HasFullAccess = hasFullAccess
                };

                return Ok(ResponseHelper.Success(config, "Preview configuration retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {innerMsg}"));
            }
        }

        // ───────────────────────────────────────────────
        // GET /api/SacredGuide/{id}/check-access
        // Check if user has access to Sacred Guide
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpGet("{id}/check-access")]
        public async Task<IActionResult> CheckAccess(Guid id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                bool isPremium = user.IsPremium || user.RoleId == 2;
                bool hasPurchased = await _context.SacredGuidePurchases
                    .AnyAsync(p => p.UserId == userId.Value && p.SacredGuideId == id && p.PaymentStatus == "Completed");

                bool hasAccess = isPremium || hasPurchased;

                var accessDto = new SacredGuideAccessDto
                {
                    HasAccess = hasAccess,
                    IsPremium = isPremium,
                    HasPurchased = hasPurchased,
                    Reason = hasAccess ? "Access granted" : "Premium subscription or purchase required"
                };

                return Ok(ResponseHelper.Success(accessDto, "Access check completed.", 200));
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {innerMsg}"));
            }
        }
        // ───────────────────────────────────────────────
        // POST /api/SacredGuide/{id}/create-checkout-session
        // Create a Stripe checkout session for a one-time guide purchase
        // ───────────────────────────────────────────────
        [Authorize]
        [HttpPost("{id}/create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession(Guid id)
        {
            try
            {
                // Check if sacred guide sales are enabled
                var guideSalesEnabledSetting = await _context.SiteSettings
                    .Where(s => s.SettingKey == "Platform_EnableSacredGuideSales")
                    .Select(s => s.SettingValue)
                    .FirstOrDefaultAsync();

                if (guideSalesEnabledSetting == "False")
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Sacred Guide sales are currently disabled.", 403));
                }

                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token."));

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                var guide = await _context.SacredGuides.FindAsync(id);
                if (guide == null)
                    return NotFound(ResponseHelper.Fail<object>("Sacred Guide not found."));

                // Check if already has access
                if (await UserHasAccess(userId.Value, id))
                {
                    return BadRequest(ResponseHelper.Fail<object>("You already have access to this guide."));
                }

                var session = await _stripeService.CreateGuideCheckoutSessionAsync(
                    userId.Value, 
                    user.Email, 
                    user.FullName, 
                    id
                );

                return Ok(ResponseHelper.Success(new { sessionId = session.Id, checkoutUrl = session.Url }, "Checkout session created.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }
    }
}
