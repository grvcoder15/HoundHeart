using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/reports")]
    [ApiController]
    [Authorize]
    public class AdminReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var pending = await _context.PostReports.CountAsync(r => r.Status.ToLower() == "pending");
                var highPriority = await _context.PostReports.CountAsync(r => r.Priority.ToLower() == "high" && r.Status.ToLower() == "pending");
                var resolved = await _context.PostReports.CountAsync(r => r.Status.ToLower() == "resolved");
                var dismissed = await _context.PostReports.CountAsync(r => r.Status.ToLower() == "dismissed");

                return Ok(ResponseHelper.Success(new ReportStatsDto
                {
                    Pending = pending,
                    HighPriority = highPriority,
                    Resolved = resolved,
                    Dismissed = dismissed
                }, "Report stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetReports([FromQuery] string type = "All", [FromQuery] string status = "All", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.PostReports
                    .Include(r => r.Post)
                    .ThenInclude(p => p.User)
                    .Include(r => r.Comment)
                    .ThenInclude(c => c.User)
                    .Include(r => r.ReporterUser)
                    .Include(r => r.ReportedUser)
                    .AsQueryable();

                if (type != "All")
                {
                    query = query.Where(r => r.ReportType == type);
                }

                if (status != "All")
                {
                    query = query.Where(r => r.Status == status);
                }

                var totalCount = await query.CountAsync();

                var reports = await query
                    .OrderByDescending(r => r.ReportedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(r => new ReportListItemDto
                    {
                        ReportId = r.ReportId,
                        Type = r.ReportType,
                        // Show ReportedUser FullName if available, else fallback to Post/Comment owner
                        ReportedUser = r.ReportedUser != null ? r.ReportedUser.FullName : 
                                      (r.CommentId != null ? (r.Comment.User.FullName ?? "Unknown") : (r.Post.User.FullName ?? "Unknown")),
                        Reason = r.Reason,
                        ReportedBy = r.ReporterUser.FullName ?? "Anonymous",
                        Date = r.ReportedOn.ToString("yyyy-MM-dd"),
                        Priority = r.Priority,
                        Status = r.Status,
                        PostId = r.PostId,
                        CommentId = r.CommentId
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new { totalCount, reports }, "Reports retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReportDetails(Guid id)
        {
            try
            {
                var report = await _context.PostReports
                    .Include(r => r.Post)
                    .ThenInclude(p => p.User)
                    .Include(r => r.Comment)
                    .ThenInclude(c => c.User)
                    .Include(r => r.ReporterUser)
                    .Include(r => r.ReportedUser)
                    .FirstOrDefaultAsync(r => r.ReportId == id);

                if (report == null)
                    return NotFound(ResponseHelper.Fail<object>("Report not found.", 404));

                var detail = new ReportDetailDto
                {
                    ReportId = report.ReportId,
                    Type = report.ReportType,
                    ReportedUser = report.ReportedUser != null ? report.ReportedUser.FullName : 
                                  (report.CommentId != null ? (report.Comment?.User?.FullName ?? "Unknown") : (report.Post?.User?.FullName ?? "Unknown")),
                    Reason = report.Reason,
                    Description = report.Description ?? "",
                    ReportedBy = report.ReporterUser?.FullName ?? "Anonymous",
                    Date = report.ReportedOn.ToString("yyyy-MM-dd"),
                    Priority = report.Priority,
                    Status = report.Status,
                    ContentSnippet = report.CommentId != null 
                        ? (report.Comment?.Content ?? "")
                        : (report.Post?.Content ?? ""),
                    PostId = report.PostId,
                    CommentId = report.CommentId
                };

                return Ok(ResponseHelper.Success(detail, "Report details retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateReportStatus(Guid id, [FromBody] UpdateReportStatusRequest request)
        {
            try
            {
                var report = await _context.PostReports.FindAsync(id);
                if (report == null)
                    return NotFound(ResponseHelper.Fail<object>("Report not found.", 404));

                var newStatus = char.ToUpper(request.Status[0]) + request.Status.Substring(1).ToLower();
                
                if (newStatus != "Resolved" && newStatus != "Dismissed" && newStatus != "Pending")
                    return BadRequest(ResponseHelper.Fail<object>("Invalid status. Use 'Resolved', 'Dismissed' or 'Pending'.", 400));

                report.Status = newStatus;

                if (newStatus == "Resolved" && report.ReportType == "Content" && report.PostId != null)
                {
                    var post = await _context.CommunityPosts.FindAsync(report.PostId);
                    if (post != null)
                    {
                        post.IsDeleted = true;
                        post.UpdatedOn = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>($"Report marked as {newStatus}.", $"Report marked as {newStatus}.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }
    }
}
