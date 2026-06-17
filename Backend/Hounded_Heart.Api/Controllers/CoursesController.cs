using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrWhiteSpace(claim) && Guid.TryParse(claim, out var userId))
            {
                return userId;
            }

            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetCourses()
        {
            var courses = await _context.Courses
                .AsNoTracking()
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.Price,
                    c.IsFreeWithPlus,
                    c.DisplayOrder,
                    c.Status
                })
                .ToListAsync();

            return Ok(ResponseHelper.Success(courses, "Courses retrieved successfully.", 200));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCourseById(Guid id)
        {
            var course = await _context.Courses
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Description,
                    c.Price,
                    c.IsFreeWithPlus,
                    c.DisplayOrder,
                    c.Status
                })
                .FirstOrDefaultAsync();

            if (course == null)
            {
                return NotFound(ResponseHelper.Fail<object>("Course not found.", 404));
            }

            return Ok(ResponseHelper.Success(course, "Course retrieved successfully.", 200));
        }

        [Authorize]
        [HttpPost("{id}/waitlist/join")]
        public async Task<IActionResult> JoinWaitlist(Guid id)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token.", 401));
            }

            var courseExists = await _context.Courses.AsNoTracking().AnyAsync(c => c.Id == id);
            if (!courseExists)
            {
                return NotFound(ResponseHelper.Fail<object>("Course not found.", 404));
            }

            var alreadyJoined = await _context.CourseWaitlists
                .AsNoTracking()
                .AnyAsync(w => w.UserId == userId.Value && w.CourseId == id);

            if (alreadyJoined)
            {
                return Ok(ResponseHelper.Success(new { joined = true }, "You are already on the waitlist.", 200));
            }

            var row = new CourseWaitlist
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                CourseId = id,
                JoinedAt = DateTime.UtcNow
            };

            _context.CourseWaitlists.Add(row);
            await _context.SaveChangesAsync();

            return Ok(ResponseHelper.Success(new { joined = true }, "Successfully joined the waitlist.", 200));
        }

        [Authorize]
        [HttpGet("{id}/waitlist/status")]
        public async Task<IActionResult> WaitlistStatus(Guid id)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(ResponseHelper.Fail<object>("User ID not found in token.", 401));
            }

            var joined = await _context.CourseWaitlists
                .AsNoTracking()
                .AnyAsync(w => w.UserId == userId.Value && w.CourseId == id);

            return Ok(ResponseHelper.Success(new { joined }, "Waitlist status retrieved.", 200));
        }
    }
}
