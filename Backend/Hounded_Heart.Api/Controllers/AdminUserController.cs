using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/users")]
    [ApiController]
    [Authorize] // Ideally restrict to Admin role if available
    public class AdminUserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminUserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/users/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
                var premiumMembers = await _context.Users.CountAsync(u => !u.IsDeleted && u.RoleId == 2 && u.IsPremium);
                var suspended = await _context.Users.CountAsync(u => !u.IsDeleted && u.Status == "Suspended");

                // Active Today: Unique users with activity records created today (UTC)
                var today = DateTime.UtcNow.Date;
                
                var checkInUsers = _context.UserCheckIns.Where(c => c.CreatedOn.Date == today).Select(c => c.UserId);
                var ritualUsers = _context.RitualLogs.Where(r => r.CompletedAt.Date == today).Select(r => r.UserId);
                var bondingUsers = _context.UserBondingActivities.Where(b => b.ActivityDate.Date == today).Select(b => b.UserId);

                var activeTodayIds = await checkInUsers
                    .Union(ritualUsers)
                    .Union(bondingUsers)
                    .Distinct()
                    .ToListAsync();

                var activeTodayCount = activeTodayIds.Count;

                var stats = new UserManagementStatsDto
                {
                    TotalUsers = totalUsers,
                    PremiumMembers = premiumMembers,
                    ActiveToday = activeTodayCount,
                    Suspended = suspended
                };

                return Ok(ResponseHelper.Success(stats, "User stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/users
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search, 
            [FromQuery] string? status, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Users
                    .Where(u => !u.IsDeleted)
                    .AsNoTracking();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    search = search.Trim().ToLower();
                    query = query.Where(u => u.FullName.ToLower().Contains(search) || u.Email.ToLower().Contains(search));
                }

                if (!string.IsNullOrWhiteSpace(status) && status != "All")
                {
                    query = query.Where(u => u.Status == status);
                }

                var totalCount = await query.CountAsync();

                var users = await query
                    .OrderByDescending(u => u.CreatedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserManagementListItemDto
                    {
                        UserId = u.UserId,
                        Name = u.FullName,
                        Email = u.Email,
                        Status = u.Status,
                        TierLevel = string.IsNullOrWhiteSpace(u.TierLevel) ? "free" : u.TierLevel,
                        Role = (!string.IsNullOrWhiteSpace(u.TierLevel) && u.TierLevel.ToLower() != "free") || u.IsPremium ? "Premium" : "Free",
                        JoinedDate = u.CreatedOn,
                        ProfilePhoto = u.ProfilePhoto,
                        BondedScore = _context.Dogs.Where(d => d.UserId == u.UserId).Select(d => d.CurrentScore).FirstOrDefault(),
                        CommunityPosts = _context.CommunityPosts.Count(cp => cp.UserId == u.UserId && !cp.IsDeleted)
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new { items = users, total = totalCount }, "Users retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // GET: api/admin/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserDetails(Guid id)
        {
            try
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == id && !u.IsDeleted);

                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                var dog = await _context.Dogs
                    .AsNoTracking()
                    .Include(d => d.SelectedTraits)
                        .ThenInclude(st => st.Trait)
                    .FirstOrDefaultAsync(d => d.UserId == id && !d.IsDeleted);

                var details = new UserManagementDetailsDto
                {
                    UserId = user.UserId,
                    Name = user.FullName,
                    Email = user.Email,
                    Status = user.Status,
                    IsPremium = user.IsPremium,
                    TierLevel = string.IsNullOrWhiteSpace(user.TierLevel) ? "free" : user.TierLevel,
                    Role = (!string.IsNullOrWhiteSpace(user.TierLevel) && user.TierLevel.ToLower() != "free") || user.IsPremium ? "Premium" : "Free",
                    JoinedDate = user.CreatedOn,
                    ProfilePhoto = user.ProfilePhoto,
                    BondedScore = dog?.CurrentScore ?? 0,
                    CommunityPosts = await _context.CommunityPosts.CountAsync(cp => cp.UserId == id && !cp.IsDeleted),
                    DogName = dog?.DogName ?? "Not Set",
                    DogTraits = dog?.SelectedTraits?.Select(st => st.Trait.TraitName).ToList() ?? new List<string>()
                };

                return Ok(ResponseHelper.Success(details, "User details retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // PUT: api/admin/users/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] StatusUpdateDto dto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                user.Status = dto.Status;
                user.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new { user.UserId, user.Status }, $"User status updated to {dto.Status}.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        // PUT: api/admin/users/{id}/tier-level
        [HttpPut("{id}/tier-level")]
        public async Task<IActionResult> UpdateTierLevel(Guid id, [FromBody] TierLevelUpdateDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.TierLevel))
                    return BadRequest(ResponseHelper.Fail<object>("TierLevel is required."));

                var normalizedTier = dto.TierLevel.Trim().ToLower();
                if (normalizedTier != "free" && normalizedTier != "plus" && normalizedTier != "premium")
                    return BadRequest(ResponseHelper.Fail<object>("TierLevel must be one of: free, plus, premium."));

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found."));

                user.TierLevel = normalizedTier;
                user.IsPremium = normalizedTier != "free";
                user.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    user.UserId,
                    user.TierLevel,
                    user.IsPremium
                }, $"User tier level updated to {normalizedTier}.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }

        public class StatusUpdateDto
        {
            public string Status { get; set; } = string.Empty;
        }

        public class TierLevelUpdateDto
        {
            public string TierLevel { get; set; } = string.Empty;
        }
    }
}
