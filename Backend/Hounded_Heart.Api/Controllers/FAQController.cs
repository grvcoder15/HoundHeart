using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/faq")]
    [ApiController]
    public class FAQController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FAQController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/faq/stats (Admin only)
        [HttpGet("stats")]
        [Authorize]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalFAQs = await _context.FAQs.CountAsync(f => !f.IsDeleted);
                var publishedFAQs = await _context.FAQs.CountAsync(f => f.Status == "published" && !f.IsDeleted);
                var draftFAQs = await _context.FAQs.CountAsync(f => f.Status == "draft" && !f.IsDeleted);
                var categoriesCount = await _context.FAQs
                    .Where(f => !f.IsDeleted)
                    .Select(f => f.Category)
                    .Distinct()
                    .CountAsync();

                var stats = new FAQStatsDto
                {
                    TotalFAQs = totalFAQs,
                    PublishedFAQs = publishedFAQs,
                    DraftFAQs = draftFAQs,
                    CategoriesCount = categoriesCount
                };

                return Ok(ResponseHelper.Success(stats, "FAQ stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // GET: api/faq (Public - returns only published FAQs)
        [HttpGet]
        public async Task<IActionResult> GetAllFAQs([FromQuery] string category = "", [FromQuery] string search = "")
        {
            try
            {
                var query = _context.FAQs
                    .Where(f => !f.IsDeleted && f.Status == "published")
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(f => f.Category == category);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(f => f.Question.Contains(search) || f.Answer.Contains(search));
                }

                var faqs = await query
                    .OrderBy(f => f.DisplayOrder)
                    .ThenByDescending(f => f.CreatedAt)
                    .Select(f => new FAQDto
                    {
                        FAQId = f.FAQId,
                        Question = f.Question,
                        Answer = f.Answer,
                        Category = f.Category,
                        Status = f.Status,
                        DisplayOrder = f.DisplayOrder,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(faqs, "FAQs retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // GET: api/faq/admin (Admin only - returns all FAQs including drafts)
        [HttpGet("admin")]
        [Authorize]
        public async Task<IActionResult> GetAllFAQsAdmin([FromQuery] string category = "", [FromQuery] string search = "", [FromQuery] string status = "")
        {
            try
            {
                var query = _context.FAQs
                    .Where(f => !f.IsDeleted)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(category))
                {
                    query = query.Where(f => f.Category == category);
                }

                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(f => f.Status == status);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(f => f.Question.Contains(search) || f.Answer.Contains(search));
                }

                var faqs = await query
                    .OrderBy(f => f.DisplayOrder)
                    .ThenByDescending(f => f.CreatedAt)
                    .Select(f => new FAQDto
                    {
                        FAQId = f.FAQId,
                        Question = f.Question,
                        Answer = f.Answer,
                        Category = f.Category,
                        Status = f.Status,
                        DisplayOrder = f.DisplayOrder,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(faqs, "FAQs retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // GET: api/faq/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFAQById(Guid id)
        {
            try
            {
                var faq = await _context.FAQs
                    .Where(f => f.FAQId == id && !f.IsDeleted)
                    .Select(f => new FAQDto
                    {
                        FAQId = f.FAQId,
                        Question = f.Question,
                        Answer = f.Answer,
                        Category = f.Category,
                        Status = f.Status,
                        DisplayOrder = f.DisplayOrder,
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (faq == null)
                    return NotFound(ResponseHelper.Fail<object>("FAQ not found.", 404));

                return Ok(ResponseHelper.Success(faq, "FAQ retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // POST: api/faq (Admin only)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateFAQ([FromBody] CreateFAQDto createFAQDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(createFAQDto.Question) || string.IsNullOrWhiteSpace(createFAQDto.Answer))
                    return BadRequest(ResponseHelper.Fail<object>("Question and Answer are required.", 400));

                var faq = new FAQ
                {
                    FAQId = Guid.NewGuid(),
                    Question = createFAQDto.Question,
                    Answer = createFAQDto.Answer,
                    Category = createFAQDto.Category,
                    Status = createFAQDto.Status,
                    DisplayOrder = createFAQDto.DisplayOrder,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                _context.FAQs.Add(faq);
                await _context.SaveChangesAsync();

                var faqDto = new FAQDto
                {
                    FAQId = faq.FAQId,
                    Question = faq.Question,
                    Answer = faq.Answer,
                    Category = faq.Category,
                    Status = faq.Status,
                    DisplayOrder = faq.DisplayOrder,
                    CreatedAt = faq.CreatedAt,
                    UpdatedAt = faq.UpdatedAt
                };

                return Ok(ResponseHelper.Success(faqDto, "FAQ created successfully.", 201));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // PUT: api/faq/{id} (Admin only)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateFAQ(Guid id, [FromBody] UpdateFAQDto updateFAQDto)
        {
            try
            {
                var faq = await _context.FAQs.FirstOrDefaultAsync(f => f.FAQId == id && !f.IsDeleted);

                if (faq == null)
                    return NotFound(ResponseHelper.Fail<object>("FAQ not found.", 404));

                if (string.IsNullOrWhiteSpace(updateFAQDto.Question) || string.IsNullOrWhiteSpace(updateFAQDto.Answer))
                    return BadRequest(ResponseHelper.Fail<object>("Question and Answer are required.", 400));

                faq.Question = updateFAQDto.Question;
                faq.Answer = updateFAQDto.Answer;
                faq.Category = updateFAQDto.Category;
                faq.Status = updateFAQDto.Status;
                faq.DisplayOrder = updateFAQDto.DisplayOrder;
                faq.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var faqDto = new FAQDto
                {
                    FAQId = faq.FAQId,
                    Question = faq.Question,
                    Answer = faq.Answer,
                    Category = faq.Category,
                    Status = faq.Status,
                    DisplayOrder = faq.DisplayOrder,
                    CreatedAt = faq.CreatedAt,
                    UpdatedAt = faq.UpdatedAt
                };

                return Ok(ResponseHelper.Success(faqDto, "FAQ updated successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // DELETE: api/faq/{id} (Admin only - soft delete)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteFAQ(Guid id)
        {
            try
            {
                var faq = await _context.FAQs.FirstOrDefaultAsync(f => f.FAQId == id && !f.IsDeleted);

                if (faq == null)
                    return NotFound(ResponseHelper.Fail<object>("FAQ not found.", 404));

                faq.IsDeleted = true;
                faq.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>("FAQ deleted successfully.", "FAQ deleted successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        // GET: api/faq/categories (Public)
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.FAQs
                    .Where(f => !f.IsDeleted && f.Status == "published")
                    .Select(f => f.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(ResponseHelper.Success(categories, "FAQ categories retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }
    }
}
