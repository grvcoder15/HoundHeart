using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/dashboard")]
    [ApiController]
    [Authorize]
    public class AdminDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDashboardController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/dashboard/stats?fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            try
            {
                // Default to all data if no dates provided
                var startDate = fromDate.HasValue ? fromDate.Value.Date : DateTime.MinValue;
                var endDate = toDate.HasValue ? toDate.Value.Date.AddDays(1) : DateTime.MaxValue;

                // Active Members: Count of active users created within date range
                var activeMembers = await _context.Users
                    .CountAsync(u => !u.IsDeleted && u.IsActive && u.CreatedOn >= startDate && u.CreatedOn < endDate);

                // Stories Shared: Count of published community posts within date range
                var storiesShared = await _context.CommunityPosts
                    .CountAsync(p => !p.IsDeleted && 
                        (p.ModerationStatus == "published" || p.ModerationStatus == null) &&
                        p.CreatedOn >= startDate && p.CreatedOn < endDate);

                // Healing Circles: Count of healing circles created within date range
                var healingCircles = await _context.HealingCircles
                    .CountAsync(hc => hc.CreatedOn >= startDate && hc.CreatedOn < endDate);

                // Avg Bond Growth: Calculate average engagement from posts within date range
                // (Total Likes + Total Comments) / Number of Posts * 2
                var posts = await _context.CommunityPosts
                    .Where(p => !p.IsDeleted && 
                        (p.ModerationStatus == "published" || p.ModerationStatus == null) &&
                        p.CreatedOn >= startDate && p.CreatedOn < endDate)
                    .Select(p => new { p.LikeCount, p.CommentCount })
                    .ToListAsync();

                double avgBondGrowth = 0;
                if (posts.Any())
                {
                    var totalEngagement = posts.Sum(p => p.LikeCount + p.CommentCount);
                    var averageEngagement = (double)totalEngagement / posts.Count;
                    avgBondGrowth = Math.Min(100, Math.Max(0, averageEngagement * 2));
                }

                var stats = new
                {
                    activeMembers = activeMembers,
                    storiesShared = storiesShared,
                    healingCircles = healingCircles,
                    avgBondGrowth = avgBondGrowth > 0 ? $"+{avgBondGrowth:F1}%" : "0%"
                };

                return Ok(ResponseHelper.Success(stats, "Dashboard stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/dashboard/community-growth?fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("community-growth")]
        public async Task<IActionResult> GetCommunityGrowthData(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            try
            {
                var startDate = DateTime.SpecifyKind(
                    fromDate.HasValue ? fromDate.Value.Date : DateTime.UtcNow.AddMonths(-6).Date,
                    DateTimeKind.Utc);
                var endDate = DateTime.SpecifyKind(
                    toDate.HasValue ? toDate.Value.Date.AddDays(1) : DateTime.UtcNow.AddDays(1).Date,
                    DateTimeKind.Utc);

                // Get monthly data: members and posts count by month
                var monthlyData = new System.Collections.Generic.List<dynamic>();
                var currentDate = DateTime.SpecifyKind(new DateTime(startDate.Year, startDate.Month, 1), DateTimeKind.Utc);

                while (currentDate < endDate)
                {
                    var nextMonth = currentDate.AddMonths(1);
                    
                    var memberCount = await _context.Users
                        .CountAsync(u => !u.IsDeleted && u.IsActive && u.CreatedOn >= currentDate && u.CreatedOn < nextMonth);
                    
                    var postCount = await _context.CommunityPosts
                        .CountAsync(p => !p.IsDeleted && (p.ModerationStatus == "published" || p.ModerationStatus == null) &&
                                   p.CreatedOn >= currentDate && p.CreatedOn < nextMonth);

                    monthlyData.Add(new
                    {
                        month = currentDate.ToString("MMM"),
                        members = memberCount,
                        posts = postCount
                    });

                    currentDate = nextMonth;
                }

                return Ok(ResponseHelper.Success(monthlyData, "Community growth data retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/dashboard/activity-by-time?fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("activity-by-time")]
        public async Task<IActionResult> GetActivityByTime(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            try
            {
                var startDate = DateTime.SpecifyKind(
                    fromDate.HasValue ? fromDate.Value.Date : DateTime.UtcNow.AddDays(-30).Date,
                    DateTimeKind.Utc);
                var endDate = DateTime.SpecifyKind(
                    toDate.HasValue ? toDate.Value.Date.AddDays(1) : DateTime.UtcNow.AddDays(1).Date,
                    DateTimeKind.Utc);

                // Aggregate activity by 4-hour buckets across the full selected date range.
                var postHourCounts = await _context.CommunityPosts
                    .Where(p => !p.IsDeleted && p.CreatedOn >= startDate && p.CreatedOn < endDate)
                    .GroupBy(p => p.CreatedOn.Hour)
                    .Select(g => new { Hour = g.Key, Count = g.Count() })
                    .ToListAsync();

                var commentHourCounts = await _context.CommunityComments
                    .Where(c => !c.IsDeleted && c.CreatedOn >= startDate && c.CreatedOn < endDate)
                    .GroupBy(c => c.CreatedOn.Hour)
                    .Select(g => new { Hour = g.Key, Count = g.Count() })
                    .ToListAsync();

                var hourlyTotals = new int[24];

                foreach (var item in postHourCounts)
                {
                    hourlyTotals[item.Hour] += item.Count;
                }

                foreach (var item in commentHourCounts)
                {
                    hourlyTotals[item.Hour] += item.Count;
                }

                var hourlyData = new System.Collections.Generic.List<dynamic>();

                for (int bucketStart = 0; bucketStart < 24; bucketStart += 4)
                {
                    var bucketTotal = 0;
                    for (int hour = bucketStart; hour < bucketStart + 4; hour++)
                    {
                        bucketTotal += hourlyTotals[hour];
                    }

                    hourlyData.Add(new
                    {
                        hour = $"{bucketStart:D2}:00",
                        activity = bucketTotal
                    });
                }

                return Ok(ResponseHelper.Success(hourlyData, "Activity by time data retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/dashboard/trending-topics?limit=4&fromDate=2024-01-01&toDate=2024-12-31
        [HttpGet("trending-topics")]
        public async Task<IActionResult> GetTrendingTopics(
            [FromQuery] int limit = 4,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var startDate = fromDate.HasValue ? fromDate.Value.Date : DateTime.MinValue;
                var endDate = toDate.HasValue ? toDate.Value.Date.AddDays(1) : DateTime.MaxValue;
                
                // 1. Chakra Alignment: count completed chakra sessions from ChakraLogs
                var chakraAlignmentCount = await _context.ChakraLogs
                    .Where(log => log.CreatedAt >= startDate && log.CreatedAt < endDate)
                    .CountAsync();

                // 2. Full Moon Rituals: count completed ritual sessions from RitualLogs
                var fullMoonRitualsCount = await _context.RitualLogs
                    .Where(log => log.CompletedAt >= startDate && log.CompletedAt < endDate)
                    .CountAsync();

                // 3. Healing Journey: count journal entries from JournalEntries
                var healingJourneyCount = await _context.JournalEntries
                    .Where(j => !j.IsDeleted && j.CreatedOn >= startDate && j.CreatedOn < endDate)
                    .CountAsync();

                // 4. Energy Sync: count sync score records from SyncScoreRecords
                var energySyncCount = await _context.SyncScoreRecords
                    .Where(s => s.CalculatedAt >= startDate && s.CalculatedAt < endDate)
                    .CountAsync();

                var top = new[]
                {
                    new { label = "Chakra Alignment", val = chakraAlignmentCount },
                    new { label = "Full Moon Rituals", val = fullMoonRitualsCount },
                    new { label = "Healing Journey",   val = healingJourneyCount },
                    new { label = "Energy Sync",       val = energySyncCount }
                }.Take(limit).ToList();

                return Ok(ResponseHelper.Success(top, "Trending topics retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/dashboard/recent-activity?limit=5
        [HttpGet("recent-activity")]
        public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 5)
        {
            try
            {
                var activities = new System.Collections.Generic.List<dynamic>();

                // Recent posts
                var recentPosts = await _context.CommunityPosts
                    .Include(p => p.User)
                    .Where(p => !p.IsDeleted && (p.ModerationStatus == "published" || p.ModerationStatus == null))
                    .OrderByDescending(p => p.CreatedOn)
                    .Take(limit)
                    .Select(p => new
                    {
                        type = "post",
                        userName = p.User.FullName ?? p.User.ProfileName ?? "User",
                        action = $"posted in community",
                        timestamp = p.CreatedOn,
                        color = "#f5f3ff",
                        iconColor = "#8b5cf6",
                        icon = "MessageCircle"
                    })
                    .ToListAsync();

                activities.AddRange(recentPosts);

                // Recent healing circles
                var recentCircles = await _context.HealingCircles
                    .OrderByDescending(hc => hc.CreatedOn)
                    .Take(limit / 2)
                    .Select(hc => new
                    {
                        type = "circle",
                        userName = "Member",
                        action = $"joined {hc.Title} Healing Circle",
                        timestamp = hc.CreatedOn,
                        color = "#fff7ed",
                        iconColor = "#f97316",
                        icon = "Calendar"
                    })
                    .ToListAsync();

                activities.AddRange(recentCircles);

                // Recent new users
                var recentUsers = await _context.Users
                    .Where(u => !u.IsDeleted && u.IsActive)
                    .OrderByDescending(u => u.CreatedOn)
                    .Take(limit / 2)
                    .Select(u => new
                    {
                        type = "user",
                        userName = u.FullName ?? u.ProfileName ?? "User",
                        action = "created new account",
                        timestamp = u.CreatedOn,
                        color = "#f0fdf4",
                        iconColor = "#22c55e",
                        icon = "Users"
                    })
                    .ToListAsync();

                activities.AddRange(recentUsers);

                // Sort by timestamp and take top
                var sortedActivities = activities
                    .OrderByDescending(a => (DateTime)a.timestamp)
                    .Take(limit)
                    .Select((a, idx) => new
                    {
                        id = idx + 1,
                        user = a.userName,
                        action = a.action,
                        time = FormatTimeAgo((DateTime)a.timestamp),
                        color = a.color,
                        iconColor = a.iconColor,
                        icon = a.icon
                    })
                    .ToList();

                return Ok(ResponseHelper.Success(sortedActivities, "Recent activity retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        private string FormatTimeAgo(DateTime timestamp)
        {
            var timeSpan = DateTime.UtcNow - timestamp;

            if (timeSpan.TotalMinutes < 1)
                return "just now";
            else if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes} minutes ago";
            else if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours} hour{((int)timeSpan.TotalHours != 1 ? "s" : "")} ago";
            else if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays} day{((int)timeSpan.TotalDays != 1 ? "s" : "")} ago";
            else
                return timestamp.ToString("MMM dd");
        }
    }
}
