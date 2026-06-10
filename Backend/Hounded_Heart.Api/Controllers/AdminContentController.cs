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
    [Route("api/admin/content")]
    [ApiController]
    [Authorize]
    public class AdminContentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminContentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var today = DateTime.UtcNow.Date;

                var totalPosts = await _context.CommunityPosts.CountAsync(p => !p.IsDeleted);
                // "published" could just simply mean not flagged and not deleted.
                // Assuming "flagged" means ModerationStatus == "flagged"
                // Assuming pending could be newly created posts within today or specific logic. 
                // Let's implement based on ModerationStatus: published, flagged
                var flaggedPosts = await _context.CommunityPosts.CountAsync(p => p.ModerationStatus == "flagged" && !p.IsDeleted);
                
                // For pending review, we can simply infer a ModerationStatus requirement or posts created today that haven't been approved.
                // Or maybe posts with more than x reports. Let's return 0 or derive from flagged for now.
                var pendingReview = await _context.CommunityPosts.CountAsync(p => p.ModerationStatus == "pending" && !p.IsDeleted);

                var postsToday = await _context.CommunityPosts.CountAsync(p => p.CreatedOn >= today && !p.IsDeleted);

                var stats = new ContentStatsDto
                {
                    TotalPosts = totalPosts,
                    FlaggedPosts = flaggedPosts,
                    PendingReview = pendingReview,
                    PostsToday = postsToday
                };

                return Ok(ResponseHelper.Success(stats, "Stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet("posts")]
        public async Task<IActionResult> GetPosts([FromQuery] string search = "", [FromQuery] string statusFilter = "All Posts", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.CommunityPosts
                    .Join(_context.Users, 
                        post => post.UserId, 
                        user => user.UserId, 
                        (post, user) => new { post, user })
                    .AsQueryable();

                // Base filter - don't show hard deleted stuff, but maybe show Soft deleted if filtering for 'Removed'
                if (statusFilter != "Removed")
                {
                   query = query.Where(q => !q.post.IsDeleted);
                }
                else
                {
                    // If asking for removed, specifically show soft-deleted posts
                    query = query.Where(q => q.post.IsDeleted);
                }

                if (!string.IsNullOrEmpty(statusFilter) && statusFilter != "All Posts" && statusFilter != "Removed")
                {
                    var status = statusFilter.ToLower();
                    if (status == "published")
                        query = query.Where(q => q.post.ModerationStatus == "published" || q.post.ModerationStatus == null);
                    else
                        query = query.Where(q => q.post.ModerationStatus == status);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(q => 
                        q.user.FullName.Contains(search) || 
                        q.user.Email.Contains(search) || 
                        q.post.Content.Contains(search)
                    );
                }

                var totalCount = await query.CountAsync();

                var posts = await query
                    .OrderByDescending(q => q.post.CreatedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(q => new ContentPostDto
                    {
                        PostId = q.post.PostId,
                        User = q.user.FullName ?? "Unknown User",
                        Handle = "@" + (q.user.FullName ?? "user").Replace(" ", "").ToLower(),
                        Avatar = (q.user.FullName ?? "U").Substring(0, 1).ToUpper(),
                        Content = q.post.Content ?? "",
                        Tags = !string.IsNullOrEmpty(q.post.Hashtags) ? q.post.Hashtags.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() : new System.Collections.Generic.List<string>(),
                        Time = q.post.CreatedOn.ToString("o"), // ISO string, client parses 'time ago'
                        Status = q.post.IsDeleted ? "removed" : (q.post.ModerationStatus ?? "published"),
                        Reason = "Violates guidelines", // Hardcoded reason for now, or null if preferred
                        LikeCount = q.post.LikeCount,
                        CommentCount = q.post.CommentCount
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new { totalCount, posts }, "Posts retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpPut("posts/{id}/status")]
        public async Task<IActionResult> UpdatePostStatus(Guid id, [FromBody] UpdatePostStatusRequest request)
        {
            try
            {
                var post = await _context.CommunityPosts.FindAsync(id);
                if (post == null)
                    return NotFound(ResponseHelper.Fail<object>("Post not found.", 404));

                if (request.Action == "approve")
                {
                    post.ModerationStatus = "published";
                    post.IsDeleted = false;
                }
                else if (request.Action == "reject")
                {
                    post.ModerationStatus = "rejected";
                    post.IsDeleted = false;
                }
                else if (request.Action == "remove")
                {
                    post.IsDeleted = true;
                }
                else
                {
                    return BadRequest(ResponseHelper.Fail<object>("Invalid action. Use 'approve', 'reject', or 'remove'.", 400));
                }

                await _context.SaveChangesAsync();
                return Ok(ResponseHelper.Success<object>($"Post successfully {request.Action}d.", $"Post successfully {request.Action}d.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet("posts/{id}/reports")]
        public async Task<IActionResult> GetPostReports(Guid id)
        {
            try
            {
                var reasons = await _context.PostReports
                    .Where(r => r.PostId == id)
                    .Select(r => r.Reason)
                    .Distinct()
                    .ToListAsync();
                
                return Ok(ResponseHelper.Success(reasons, "Post reports retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Internal server error: {ex.Message}", 500));
            }
        }
    }

    public class UpdatePostStatusRequest
    {
        public string Action { get; set; } = string.Empty; // "approve" or "remove"
    }
}
