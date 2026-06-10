using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JournalEntryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Hounded_Heart.Services.Services.BlobStorageService _blobService;

        public JournalEntryController(AppDbContext context, Hounded_Heart.Services.Services.BlobStorageService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        [HttpGet("GetAlltags")]
        public async Task<IActionResult> GetAlltags()
        {
            try
            {
                var tags = await _context.Tags
                    .ToListAsync();

                if (tags == null || !tags.Any())
                    return Ok(ResponseHelper.Success(new List<object>(), "No tags found.", 200));

                return Ok(ResponseHelper.Success(tags, "Tags retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while fetching tags: {ex.Message}", 500));
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddJournalEntry([FromForm] JournalEntryDto dto, IFormFile? audioFile, IFormFile? imageFile)
        {
            if (dto == null || dto.UserId == Guid.Empty || string.IsNullOrWhiteSpace(dto.EntryType))
                return BadRequest(ResponseHelper.Fail<object>("Invalid data provided.", 400));

            string? mediaUrl = null;
            string mediaType = dto.MediaType ?? "Text";
            string? imageUrl = null;

            // Handle Audio Upload
            if (audioFile != null && audioFile.Length > 0)
            {
                try 
                {
                    // Convert stream to byte array
                    using var memoryStream = new MemoryStream();
                    await audioFile.CopyToAsync(memoryStream);
                    var audioBytes = memoryStream.ToArray();
                    var fileName = $"journal_{dto.UserId}_{Guid.NewGuid()}.wav";
                    
                    mediaUrl = await _blobService.UploadAudioFileAsync(audioBytes, fileName);
                    mediaType = "Audio";
                }
                catch (Exception ex)
                {
                     return StatusCode(500, ResponseHelper.Fail<object>($"Audio upload failed: {ex.Message}", 500));
                }
            }

            // Handle Image Upload
            if (imageFile != null && imageFile.Length > 0)
            {
                try
                {
                    using var memoryStream = new MemoryStream();
                    await imageFile.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();
                    var extension = Path.GetExtension(imageFile.FileName) ?? ".jpg";
                    var fileName = $"journal_{dto.UserId}_{Guid.NewGuid()}{extension}";

                    imageUrl = await _blobService.UploadImageFileAsync(imageBytes, fileName);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, ResponseHelper.Fail<object>($"Image upload failed: {ex.Message}", 500));
                }
            }

            var entry = new JournalEntry
            {
                EntryId = Guid.NewGuid(),
                UserId = dto.UserId,
                EntryType = dto.EntryType,
                Content = dto.Content,
                Tags = dto.Tags,
                CreatedOn = DateTime.UtcNow,
                IsDeleted = false,
                IsArchive = dto.IsArchive ?? false,
                LettrTo = dto.LettrTo,
                MediaType = mediaType,
                MediaUrl = mediaUrl,
                ImageUrl = imageUrl
            };

            try
            {
                _context.JournalEntries.Add(entry);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(entry, "Journal entry saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while saving the journal entry: {ex.Message}", 500));
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetEntriesByUser(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? entryType = null)
        {
            if (userId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<object>("Invalid user ID.", 400));

            try
            {
                var query = _context.JournalEntries
                    .Where(e => e.UserId == userId && !e.IsDeleted);

                if (!string.IsNullOrEmpty(entryType))
                {
                    query = query.Where(e => e.EntryType == entryType);
                }

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var entries = await query
                    .OrderByDescending(e => e.CreatedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                if (entries == null || entries.Count == 0)
                    return Ok(ResponseHelper.Success(new
                    {
                        Entries = new List<JournalEntry>(),
                        TotalCount = totalCount,
                        TotalPages = totalPages,
                        CurrentPage = page
                    }, "No journal entries found.", 200));

                return Ok(ResponseHelper.Success(new
                {
                    Entries = entries,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    CurrentPage = page
                }, "Journal entries fetched successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching journal entries: {ex.Message}", 500));
            }
        }

        // Proxy endpoint to bypass browser CORS restrictions when loading Azure Blob images into jsPDF
        [HttpGet("proxy-image")]
        public async Task<IActionResult> ProxyImage([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest("URL is required.");

            // Only allow Azure Blob Storage URLs from our own account
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                !uri.Host.Equals("houndheartsa.blob.core.windows.net", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only HoundHeart Azure Blob Storage URLs are allowed.");

            try
            {
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);
                var bytes = await httpClient.GetByteArrayAsync(url);
                var extension = Path.GetExtension(uri.AbsolutePath).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".webp" => "image/webp",
                    _ => "image/jpeg"
                };
                return File(bytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(502, $"Failed to fetch image: {ex.Message}");
            }
        }

    }
}
