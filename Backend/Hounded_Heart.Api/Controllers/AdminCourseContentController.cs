using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/courses")]
    [ApiController]
    [Authorize]
    public class AdminCourseContentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BlobStorageService _blobService;
        private readonly IWebHostEnvironment _env;

        public AdminCourseContentController(AppDbContext context, BlobStorageService blobService, IWebHostEnvironment env)
        {
            _context = context;
            _blobService = blobService;
            _env = env;
        }

        // ─── Course list & summary ───────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            var courses = await _context.Courses
                .AsNoTracking()
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            var courseIds = courses.Select(c => c.Id).ToList();

            var bookCounts = await _context.CourseBookContents
                .Where(x => courseIds.Contains(x.CourseId))
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var videoCounts = await _context.CourseVideos
                .Where(x => courseIds.Contains(x.CourseId))
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var visualCounts = await _context.CourseVisuals
                .Where(x => courseIds.Contains(x.CourseId))
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var quizCounts = await _context.CourseAssessments
                .Where(x => courseIds.Contains(x.CourseId) && x.AssessmentType == "Quiz")
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var testCounts = await _context.CourseAssessments
                .Where(x => courseIds.Contains(x.CourseId) && x.AssessmentType == "MultipleChoiceTest")
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var audioCounts = await _context.CourseAudios
                .Where(x => courseIds.Contains(x.CourseId))
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var resourceCounts = await _context.CourseResources
                .Where(x => courseIds.Contains(x.CourseId))
                .GroupBy(x => x.CourseId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            int CountFor(Guid id, Dictionary<Guid, int> dict) =>
                dict.TryGetValue(id, out var count) ? count : 0;

            var result = courses.Select(c => new AdminCourseListItemDto
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                Price = c.Price,
                IsFreeWithPlus = c.IsFreeWithPlus,
                DisplayOrder = c.DisplayOrder,
                Status = c.Status,
                ContentSummary = new CourseContentSummaryDto
                {
                    BookCount = CountFor(c.Id, bookCounts),
                    VideoCount = CountFor(c.Id, videoCounts),
                    VisualCount = CountFor(c.Id, visualCounts),
                    QuizCount = CountFor(c.Id, quizCounts),
                    TestCount = CountFor(c.Id, testCounts),
                    AudioCount = CountFor(c.Id, audioCounts),
                    ResourceCount = CountFor(c.Id, resourceCounts)
                }
            }).ToList();

            return Ok(ResponseHelper.Success(result, "Courses retrieved.", 200));
        }

        [HttpGet("{courseId}")]
        public async Task<IActionResult> GetCourse(Guid courseId)
        {
            var course = await _context.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null)
                return NotFound(ResponseHelper.Fail<object>("Course not found.", 404));

            var summary = await BuildSummaryAsync(courseId);
            return Ok(ResponseHelper.Success(new
            {
                course.Id,
                course.Title,
                course.Description,
                course.Price,
                course.IsFreeWithPlus,
                course.DisplayOrder,
                course.Status,
                ContentSummary = summary
            }, "Course retrieved.", 200));
        }

        // ─── File upload helper ──────────────────────────────────────────

        [HttpPost("{courseId}/upload")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> UploadFile(Guid courseId, IFormFile file, [FromForm] string folder = "general")
        {
            if (!await _context.Courses.AnyAsync(c => c.Id == courseId))
                return NotFound(ResponseHelper.Fail<object>("Course not found.", 404));

            if (file == null || file.Length == 0)
                return BadRequest(ResponseHelper.Fail<object>("No file uploaded."));

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var bytes = ms.ToArray();
            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? "";
            var safeFolder = string.IsNullOrWhiteSpace(folder) ? "general" : folder.Trim().ToLowerInvariant();
            var fileName = $"course_{courseId}_{safeFolder}_{Guid.NewGuid()}{ext}";

            string? url;
            var audioExts = new[] { ".mp3", ".wav", ".m4a", ".ogg" };
            var imageExts = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };

            if (imageExts.Contains(ext))
            {
                url = await _blobService.UploadImageFileAsync(bytes, fileName);
            }
            else if (audioExts.Contains(ext))
            {
                url = await _blobService.UploadAudioFileAsync(bytes, fileName);
            }
            else
            {
                url = await SaveLocalCourseFileAsync(bytes, fileName);
            }

            return Ok(ResponseHelper.Success(new { url, fileName }, "File uploaded.", 200));
        }

        // ─── Books ───────────────────────────────────────────────────────

        [HttpGet("{courseId}/books")]
        public async Task<IActionResult> GetBooks(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetBookItemsAsync(courseId), "Book content retrieved.", 200));

        [HttpPost("{courseId}/books")]
        public async Task<IActionResult> CreateBook(Guid courseId, [FromBody] CourseContentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            var item = new CourseBookContent
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                FileUrl = dto.FileUrl,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };
            _context.CourseBookContents.Add(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapBook(item), "Book content created.", 200));
        }

        [HttpPut("{courseId}/books/{id}")]
        public async Task<IActionResult> UpdateBook(Guid courseId, Guid id, [FromBody] CourseContentUpsertDto dto)
        {
            var item = await _context.CourseBookContents.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Book content not found.", 404));
            ApplyContentFields(item, dto);
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapBook(item), "Book content updated.", 200));
        }

        [HttpDelete("{courseId}/books/{id}")]
        public async Task<IActionResult> DeleteBook(Guid courseId, Guid id)
        {
            var item = await _context.CourseBookContents.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Book content not found.", 404));
            _context.CourseBookContents.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, "Book content deleted.", 200));
        }

        // ─── Videos ──────────────────────────────────────────────────────

        [HttpGet("{courseId}/videos")]
        public async Task<IActionResult> GetVideos(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetVideoItemsAsync(courseId), "Videos retrieved.", 200));

        [HttpPost("{courseId}/videos")]
        public async Task<IActionResult> CreateVideo(Guid courseId, [FromBody] CourseContentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            var item = new CourseVideo
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                VideoUrl = dto.VideoUrl,
                ThumbnailUrl = dto.ThumbnailUrl,
                DurationSeconds = dto.DurationSeconds,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };
            _context.CourseVideos.Add(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapVideo(item), "Video created.", 200));
        }

        [HttpPut("{courseId}/videos/{id}")]
        public async Task<IActionResult> UpdateVideo(Guid courseId, Guid id, [FromBody] CourseContentUpsertDto dto)
        {
            var item = await _context.CourseVideos.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Video not found.", 404));
            item.Title = dto.Title.Trim();
            item.Description = dto.Description;
            item.VideoUrl = dto.VideoUrl;
            item.ThumbnailUrl = dto.ThumbnailUrl;
            item.DurationSeconds = dto.DurationSeconds;
            item.DisplayOrder = dto.DisplayOrder;
            item.IsPublished = dto.IsPublished;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapVideo(item), "Video updated.", 200));
        }

        [HttpDelete("{courseId}/videos/{id}")]
        public async Task<IActionResult> DeleteVideo(Guid courseId, Guid id)
        {
            var item = await _context.CourseVideos.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Video not found.", 404));
            _context.CourseVideos.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, "Video deleted.", 200));
        }

        // ─── Visuals ─────────────────────────────────────────────────────

        [HttpGet("{courseId}/visuals")]
        public async Task<IActionResult> GetVisuals(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetVisualItemsAsync(courseId), "Visuals retrieved.", 200));

        [HttpPost("{courseId}/visuals")]
        public async Task<IActionResult> CreateVisual(Guid courseId, [FromBody] CourseContentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            var item = new CourseVisual
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };
            _context.CourseVisuals.Add(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapVisual(item), "Visual created.", 200));
        }

        [HttpPut("{courseId}/visuals/{id}")]
        public async Task<IActionResult> UpdateVisual(Guid courseId, Guid id, [FromBody] CourseContentUpsertDto dto)
        {
            var item = await _context.CourseVisuals.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Visual not found.", 404));
            item.Title = dto.Title.Trim();
            item.Description = dto.Description;
            item.ImageUrl = dto.ImageUrl;
            item.DisplayOrder = dto.DisplayOrder;
            item.IsPublished = dto.IsPublished;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapVisual(item), "Visual updated.", 200));
        }

        [HttpDelete("{courseId}/visuals/{id}")]
        public async Task<IActionResult> DeleteVisual(Guid courseId, Guid id)
        {
            var item = await _context.CourseVisuals.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Visual not found.", 404));
            _context.CourseVisuals.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, "Visual deleted.", 200));
        }

        // ─── Audio (guided lessons) ──────────────────────────────────────

        [HttpGet("{courseId}/audios")]
        public async Task<IActionResult> GetAudios(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetAudioItemsAsync(courseId), "Audio content retrieved.", 200));

        [HttpPost("{courseId}/audios")]
        public async Task<IActionResult> CreateAudio(Guid courseId, [FromBody] CourseContentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            var item = new CourseAudio
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                AudioUrl = dto.AudioUrl,
                DurationSeconds = dto.DurationSeconds,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };
            _context.CourseAudios.Add(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapAudio(item), "Audio created.", 200));
        }

        [HttpPut("{courseId}/audios/{id}")]
        public async Task<IActionResult> UpdateAudio(Guid courseId, Guid id, [FromBody] CourseContentUpsertDto dto)
        {
            var item = await _context.CourseAudios.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Audio not found.", 404));
            item.Title = dto.Title.Trim();
            item.Description = dto.Description;
            item.AudioUrl = dto.AudioUrl;
            item.DurationSeconds = dto.DurationSeconds;
            item.DisplayOrder = dto.DisplayOrder;
            item.IsPublished = dto.IsPublished;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapAudio(item), "Audio updated.", 200));
        }

        [HttpDelete("{courseId}/audios/{id}")]
        public async Task<IActionResult> DeleteAudio(Guid courseId, Guid id)
        {
            var item = await _context.CourseAudios.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Audio not found.", 404));
            _context.CourseAudios.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, "Audio deleted.", 200));
        }

        // ─── Resources (downloads / links) ───────────────────────────────

        [HttpGet("{courseId}/resources")]
        public async Task<IActionResult> GetResources(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetResourceItemsAsync(courseId), "Resources retrieved.", 200));

        [HttpPost("{courseId}/resources")]
        public async Task<IActionResult> CreateResource(Guid courseId, [FromBody] CourseContentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            var item = new CourseResource
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                FileUrl = dto.FileUrl,
                ExternalUrl = dto.ExternalUrl,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };
            _context.CourseResources.Add(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapResource(item), "Resource created.", 200));
        }

        [HttpPut("{courseId}/resources/{id}")]
        public async Task<IActionResult> UpdateResource(Guid courseId, Guid id, [FromBody] CourseContentUpsertDto dto)
        {
            var item = await _context.CourseResources.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Resource not found.", 404));
            item.Title = dto.Title.Trim();
            item.Description = dto.Description;
            item.FileUrl = dto.FileUrl;
            item.ExternalUrl = dto.ExternalUrl;
            item.DisplayOrder = dto.DisplayOrder;
            item.IsPublished = dto.IsPublished;
            item.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success(MapResource(item), "Resource updated.", 200));
        }

        [HttpDelete("{courseId}/resources/{id}")]
        public async Task<IActionResult> DeleteResource(Guid courseId, Guid id)
        {
            var item = await _context.CourseResources.FirstOrDefaultAsync(x => x.Id == id && x.CourseId == courseId);
            if (item == null) return NotFound(ResponseHelper.Fail<object>("Resource not found.", 404));
            _context.CourseResources.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, "Resource deleted.", 200));
        }

        // ─── Quizzes ─────────────────────────────────────────────────────

        [HttpGet("{courseId}/quizzes")]
        public async Task<IActionResult> GetQuizzes(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetAssessmentsAsync(courseId, "Quiz"), "Quizzes retrieved.", 200));

        [HttpPost("{courseId}/quizzes")]
        public async Task<IActionResult> CreateQuiz(Guid courseId, [FromBody] CourseAssessmentUpsertDto dto) =>
            await CreateAssessmentAsync(courseId, "Quiz", dto);

        [HttpPut("{courseId}/quizzes/{id}")]
        public async Task<IActionResult> UpdateQuiz(Guid courseId, Guid id, [FromBody] CourseAssessmentUpsertDto dto) =>
            await UpdateAssessmentAsync(courseId, id, "Quiz", dto);

        [HttpDelete("{courseId}/quizzes/{id}")]
        public async Task<IActionResult> DeleteQuiz(Guid courseId, Guid id) =>
            await DeleteAssessmentAsync(courseId, id, "Quiz");

        // ─── Multiple-choice tests ───────────────────────────────────────

        [HttpGet("{courseId}/tests")]
        public async Task<IActionResult> GetTests(Guid courseId) =>
            Ok(ResponseHelper.Success(await GetAssessmentsAsync(courseId, "MultipleChoiceTest"), "Tests retrieved.", 200));

        [HttpPost("{courseId}/tests")]
        public async Task<IActionResult> CreateTest(Guid courseId, [FromBody] CourseAssessmentUpsertDto dto) =>
            await CreateAssessmentAsync(courseId, "MultipleChoiceTest", dto);

        [HttpPut("{courseId}/tests/{id}")]
        public async Task<IActionResult> UpdateTest(Guid courseId, Guid id, [FromBody] CourseAssessmentUpsertDto dto) =>
            await UpdateAssessmentAsync(courseId, id, "MultipleChoiceTest", dto);

        [HttpDelete("{courseId}/tests/{id}")]
        public async Task<IActionResult> DeleteTest(Guid courseId, Guid id) =>
            await DeleteAssessmentAsync(courseId, id, "MultipleChoiceTest");

        // ─── Private helpers ─────────────────────────────────────────────

        private async Task<bool> CourseExistsAsync(Guid courseId) =>
            await _context.Courses.AnyAsync(c => c.Id == courseId);

        private IActionResult CourseNotFound() =>
            NotFound(ResponseHelper.Fail<object>("Course not found.", 404));

        private async Task<CourseContentSummaryDto> BuildSummaryAsync(Guid courseId) => new()
        {
            BookCount = await _context.CourseBookContents.CountAsync(x => x.CourseId == courseId),
            VideoCount = await _context.CourseVideos.CountAsync(x => x.CourseId == courseId),
            VisualCount = await _context.CourseVisuals.CountAsync(x => x.CourseId == courseId),
            QuizCount = await _context.CourseAssessments.CountAsync(x => x.CourseId == courseId && x.AssessmentType == "Quiz"),
            TestCount = await _context.CourseAssessments.CountAsync(x => x.CourseId == courseId && x.AssessmentType == "MultipleChoiceTest"),
            AudioCount = await _context.CourseAudios.CountAsync(x => x.CourseId == courseId),
            ResourceCount = await _context.CourseResources.CountAsync(x => x.CourseId == courseId)
        };

        private async Task<string> SaveLocalCourseFileAsync(byte[] bytes, string fileName)
        {
            var uploadsDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads", "course-content");
            Directory.CreateDirectory(uploadsDir);
            var filePath = Path.Combine(uploadsDir, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            return $"/uploads/course-content/{fileName}";
        }

        private static void ApplyContentFields(CourseBookContent item, CourseContentUpsertDto dto)
        {
            item.Title = dto.Title.Trim();
            item.Description = dto.Description;
            item.FileUrl = dto.FileUrl;
            item.DisplayOrder = dto.DisplayOrder;
            item.IsPublished = dto.IsPublished;
        }

        private async Task<List<CourseContentItemDto>> GetBookItemsAsync(Guid courseId) =>
            (await _context.CourseBookContents.Where(x => x.CourseId == courseId).OrderBy(x => x.DisplayOrder).ToListAsync())
            .Select(MapBook).ToList();

        private async Task<List<CourseContentItemDto>> GetVideoItemsAsync(Guid courseId) =>
            (await _context.CourseVideos.Where(x => x.CourseId == courseId).OrderBy(x => x.DisplayOrder).ToListAsync())
            .Select(MapVideo).ToList();

        private async Task<List<CourseContentItemDto>> GetVisualItemsAsync(Guid courseId) =>
            (await _context.CourseVisuals.Where(x => x.CourseId == courseId).OrderBy(x => x.DisplayOrder).ToListAsync())
            .Select(MapVisual).ToList();

        private async Task<List<CourseContentItemDto>> GetAudioItemsAsync(Guid courseId) =>
            (await _context.CourseAudios.Where(x => x.CourseId == courseId).OrderBy(x => x.DisplayOrder).ToListAsync())
            .Select(MapAudio).ToList();

        private async Task<List<CourseContentItemDto>> GetResourceItemsAsync(Guid courseId) =>
            (await _context.CourseResources.Where(x => x.CourseId == courseId).OrderBy(x => x.DisplayOrder).ToListAsync())
            .Select(MapResource).ToList();

        private static CourseContentItemDto MapBook(CourseBookContent x) => new()
        {
            Id = x.Id, CourseId = x.CourseId, Title = x.Title, Description = x.Description,
            FileUrl = x.FileUrl, DisplayOrder = x.DisplayOrder, IsPublished = x.IsPublished,
            CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt
        };

        private static CourseContentItemDto MapVideo(CourseVideo x) => new()
        {
            Id = x.Id, CourseId = x.CourseId, Title = x.Title, Description = x.Description,
            VideoUrl = x.VideoUrl, ThumbnailUrl = x.ThumbnailUrl, DurationSeconds = x.DurationSeconds,
            DisplayOrder = x.DisplayOrder, IsPublished = x.IsPublished, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt
        };

        private static CourseContentItemDto MapVisual(CourseVisual x) => new()
        {
            Id = x.Id, CourseId = x.CourseId, Title = x.Title, Description = x.Description,
            ImageUrl = x.ImageUrl, DisplayOrder = x.DisplayOrder, IsPublished = x.IsPublished,
            CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt
        };

        private static CourseContentItemDto MapAudio(CourseAudio x) => new()
        {
            Id = x.Id, CourseId = x.CourseId, Title = x.Title, Description = x.Description,
            AudioUrl = x.AudioUrl, DurationSeconds = x.DurationSeconds,
            DisplayOrder = x.DisplayOrder, IsPublished = x.IsPublished, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt
        };

        private static CourseContentItemDto MapResource(CourseResource x) => new()
        {
            Id = x.Id, CourseId = x.CourseId, Title = x.Title, Description = x.Description,
            FileUrl = x.FileUrl, ExternalUrl = x.ExternalUrl,
            DisplayOrder = x.DisplayOrder, IsPublished = x.IsPublished, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt
        };

        private async Task<List<CourseAssessmentDto>> GetAssessmentsAsync(Guid courseId, string type)
        {
            var items = await _context.CourseAssessments
                .AsNoTracking()
                .Include(a => a.Questions)
                .ThenInclude(q => q.Options)
                .Where(a => a.CourseId == courseId && a.AssessmentType == type)
                .OrderBy(a => a.DisplayOrder)
                .ToListAsync();

            return items.Select(MapAssessment).ToList();
        }

        private static CourseAssessmentDto MapAssessment(CourseAssessment a) => new()
        {
            Id = a.Id,
            CourseId = a.CourseId,
            AssessmentType = a.AssessmentType,
            Title = a.Title,
            Description = a.Description,
            PassingScorePercent = a.PassingScorePercent,
            DisplayOrder = a.DisplayOrder,
            IsPublished = a.IsPublished,
            Questions = a.Questions.OrderBy(q => q.DisplayOrder).Select(q => new CourseAssessmentQuestionDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                DisplayOrder = q.DisplayOrder,
                Options = q.Options.Select(o => new CourseAssessmentOptionDto
                {
                    Id = o.Id,
                    OptionText = o.OptionText,
                    IsCorrect = o.IsCorrect
                }).ToList()
            }).ToList()
        };

        private async Task<IActionResult> CreateAssessmentAsync(Guid courseId, string type, CourseAssessmentUpsertDto dto)
        {
            if (!await CourseExistsAsync(courseId)) return CourseNotFound();
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(ResponseHelper.Fail<object>("Title is required."));

            var assessment = new CourseAssessment
            {
                Id = Guid.NewGuid(),
                CourseId = courseId,
                AssessmentType = type,
                Title = dto.Title.Trim(),
                Description = dto.Description,
                PassingScorePercent = dto.PassingScorePercent,
                DisplayOrder = dto.DisplayOrder,
                IsPublished = dto.IsPublished,
                CreatedAt = DateTime.UtcNow
            };

            ApplyQuestions(assessment, dto.Questions);
            _context.CourseAssessments.Add(assessment);
            await _context.SaveChangesAsync();

            var loaded = await LoadAssessmentAsync(assessment.Id);
            return Ok(ResponseHelper.Success(MapAssessment(loaded!), $"{type} created.", 200));
        }

        private async Task<IActionResult> UpdateAssessmentAsync(Guid courseId, Guid id, string type, CourseAssessmentUpsertDto dto)
        {
            var assessment = await _context.CourseAssessments
                .Include(a => a.Questions)
                .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.Id == id && a.CourseId == courseId && a.AssessmentType == type);

            if (assessment == null)
                return NotFound(ResponseHelper.Fail<object>($"{type} not found.", 404));

            assessment.Title = dto.Title.Trim();
            assessment.Description = dto.Description;
            assessment.PassingScorePercent = dto.PassingScorePercent;
            assessment.DisplayOrder = dto.DisplayOrder;
            assessment.IsPublished = dto.IsPublished;
            assessment.UpdatedAt = DateTime.UtcNow;

            _context.CourseAssessmentOptions.RemoveRange(assessment.Questions.SelectMany(q => q.Options));
            _context.CourseAssessmentQuestions.RemoveRange(assessment.Questions);
            assessment.Questions.Clear();
            ApplyQuestions(assessment, dto.Questions);

            await _context.SaveChangesAsync();
            var loaded = await LoadAssessmentAsync(assessment.Id);
            return Ok(ResponseHelper.Success(MapAssessment(loaded!), $"{type} updated.", 200));
        }

        private async Task<IActionResult> DeleteAssessmentAsync(Guid courseId, Guid id, string type)
        {
            var assessment = await _context.CourseAssessments
                .FirstOrDefaultAsync(a => a.Id == id && a.CourseId == courseId && a.AssessmentType == type);

            if (assessment == null)
                return NotFound(ResponseHelper.Fail<object>($"{type} not found.", 404));

            _context.CourseAssessments.Remove(assessment);
            await _context.SaveChangesAsync();
            return Ok(ResponseHelper.Success<object>(null, $"{type} deleted.", 200));
        }

        private static void ApplyQuestions(CourseAssessment assessment, List<CourseAssessmentQuestionDto>? questions)
        {
            if (questions == null) return;
            var order = 0;
            foreach (var qDto in questions.Where(q => !string.IsNullOrWhiteSpace(q.QuestionText)))
            {
                var question = new CourseAssessmentQuestion
                {
                    Id = Guid.NewGuid(),
                    AssessmentId = assessment.Id,
                    QuestionText = qDto.QuestionText.Trim(),
                    DisplayOrder = qDto.DisplayOrder > 0 ? qDto.DisplayOrder : order++
                };

                if (qDto.Options != null)
                {
                    foreach (var oDto in qDto.Options.Where(o => !string.IsNullOrWhiteSpace(o.OptionText)))
                    {
                        question.Options.Add(new CourseAssessmentOption
                        {
                            Id = Guid.NewGuid(),
                            QuestionId = question.Id,
                            OptionText = oDto.OptionText.Trim(),
                            IsCorrect = oDto.IsCorrect
                        });
                    }
                }

                assessment.Questions.Add(question);
            }
        }

        private async Task<CourseAssessment?> LoadAssessmentAsync(Guid id) =>
            await _context.CourseAssessments
                .AsNoTracking()
                .Include(a => a.Questions)
                .ThenInclude(q => q.Options)
                .FirstOrDefaultAsync(a => a.Id == id);
    }
}
