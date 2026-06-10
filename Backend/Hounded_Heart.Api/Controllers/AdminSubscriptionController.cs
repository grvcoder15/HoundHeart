using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize] // Admin authorization should be added
    public class AdminSubscriptionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly StripeService _stripeService;
        private readonly IConfiguration _configuration;

        public AdminSubscriptionController(AppDbContext context, StripeService stripeService, IConfiguration configuration)
        {
            _context = context;
            _stripeService = stripeService;
            _configuration = configuration;
        }


        [HttpGet("plans")]
        public IActionResult GetPlans()
        {
            try
            {
                var service = new PriceService();

                var options = new PriceListOptions
                {
                    Active = true,
                    Type = "recurring",
                    Expand = new List<string> { "data.product" }
                };

                var prices = service.List(options);

                var result = prices.Data.Select(p => new
                {
                    PriceId = p.Id,
                    ProductName = ((Product)p.Product).Name,
                    Amount = p.UnitAmount / 100,
                    Currency = p.Currency,
                    Interval = p.Recurring?.Interval
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error fetching plans from Stripe: {ex.Message}");
                // Return an empty list or a meaningful error instead of crashing
                return Ok(new List<object>()); 
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/membership-plans
        // Get membership plans from SubscriptionPlans table
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("membership-plans")]
        public async Task<IActionResult> GetMembershipPlans()
        {
            try
            {
                // Read real Stripe price IDs from appsettings — DB may still have old placeholder values
                var configMonthly = _configuration["Stripe:MonthlyPriceId"];
                var configYearly  = _configuration["Stripe:YearlyPriceId"];
                var configPremium = _configuration["Stripe:PremiumYearlyPriceId"];

                var rawPlans = await _context.SubscriptionPlans
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Price)
                    .ToListAsync();

                var plans = rawPlans.Select(p =>
                {
                    string? stripePriceId;
                    var billing = (p.BillingPeriod ?? string.Empty).ToLower();

                    if (p.Price <= 0)
                        stripePriceId = null;                                       // Free — no Stripe ID
                    else if (billing == "monthly" && !string.IsNullOrEmpty(configMonthly))
                        stripePriceId = configMonthly;                              // Plus Monthly
                    else if (billing == "yearly" && p.Price <= 80 && !string.IsNullOrEmpty(configYearly))
                        stripePriceId = configYearly;                               // Plus Yearly
                    else if (billing == "yearly" && p.Price > 80 && !string.IsNullOrEmpty(configPremium))
                        stripePriceId = configPremium;                              // Premium Yearly
                    else
                        stripePriceId = p.StripePriceId;                            // Fallback to DB value

                    return new
                    {
                        p.PlanId,
                        p.PlanName,
                        p.TierLevel,
                        p.BillingPeriod,
                        p.Price,
                        p.Currency,
                        StripePriceId = stripePriceId,
                        p.Description,
                        p.IsActive,
                        p.DisplayOrder
                    };
                }).ToList();

                return Ok(ResponseHelper.Success(plans, "Membership plans retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get membership plans error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving membership plans: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PUT /api/AdminSubscription/membership-plans/{planId}/price
        // Update subscription plan price in local table
        // ═══════════════════════════════════════════════════════════════════
        [HttpPut("membership-plans/{planId}/price")]
        public async Task<IActionResult> UpdateMembershipPlanPrice(Guid planId, [FromBody] UpdateMembershipPlanPriceRequest dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(ResponseHelper.Fail<object>("Request body is required", 400));

                if (dto.Price < 0)
                    return BadRequest(ResponseHelper.Fail<object>("Price cannot be negative", 400));

                var plan = await _context.SubscriptionPlans.FirstOrDefaultAsync(p => p.PlanId == planId);
                if (plan == null)
                    return NotFound(ResponseHelper.Fail<object>("Plan not found", 404));

                plan.Price = dto.Price;
                plan.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    plan.PlanId,
                    plan.PlanName,
                    plan.Price,
                    plan.Currency,
                    plan.BillingPeriod,
                    plan.TierLevel
                }, "Plan price updated successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Update membership plan price error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error updating membership plan price: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/tier-counts
        // Get user counts by tier
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("tier-counts")]
        public async Task<IActionResult> GetTierCounts()
        {
            try
            {
                var users = await _context.Users
                    .Where(u => !u.IsDeleted)
                    .Select(u => new { u.TierLevel })
                    .ToListAsync();

                var freeCount = users.Count(u => string.IsNullOrWhiteSpace(u.TierLevel) || u.TierLevel.ToLower() == "free");
                var plusCount = users.Count(u => !string.IsNullOrWhiteSpace(u.TierLevel) && u.TierLevel.ToLower() == "plus");
                var premiumCount = users.Count(u => !string.IsNullOrWhiteSpace(u.TierLevel) && u.TierLevel.ToLower() == "premium");

                return Ok(ResponseHelper.Success(new
                {
                    free = freeCount,
                    plus = plusCount,
                    premium = premiumCount,
                    total = freeCount + plusCount + premiumCount
                }, "Tier counts retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get tier counts error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving tier counts: {ex.Message}"));
            }
        }
        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/all
        // Get all subscriptions with user details
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSubscriptions(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = _context.Subscriptions
                    .Include(s => s.User)
                    .AsQueryable();

                // Filter by status if provided
                if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
                {
                    var normalizedStatus = status.ToLower();

                    // Stripe can keep status as "active" while cancellation is scheduled at period end.
                    // In admin, treat those rows as canceled for clarity.
                    if (normalizedStatus == "active")
                    {
                        query = query.Where(s => (s.Status ?? "").ToLower() == "active" && !s.CancelAtPeriodEnd);
                    }
                    else if (normalizedStatus == "canceled")
                    {
                        query = query.Where(s => (s.Status ?? "").ToLower() == "canceled" || s.CancelAtPeriodEnd);
                    }
                    else
                    {
                        query = query.Where(s => (s.Status ?? "").ToLower() == normalizedStatus);
                    }
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Pagination
                var subscriptions = await query
                    .OrderByDescending(s => s.CreatedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(s => new AdminSubscriptionDto
                    {
                        SubscriptionId = s.SubscriptionId,
                        UserId = s.UserId,
                        UserEmail = s.User.Email,
                        UserName = s.User.FullName,
                        PlanName = s.PlanName,
                        TierLevel = !string.IsNullOrWhiteSpace(s.User.TierLevel) ? s.User.TierLevel : (s.User.IsPremium ? "plus" : "free"),
                        Status = s.CancelAtPeriodEnd && (s.Status ?? "").ToLower() == "active" ? "canceled" : s.Status,
                        CurrentPeriodStart = s.CurrentPeriodStart,
                        CurrentPeriodEnd = s.CurrentPeriodEnd,
                        Amount = s.Amount,
                        Currency = s.Currency,
                        CreatedOn = s.CreatedOn,
                        CancelAtPeriodEnd = s.CancelAtPeriodEnd,
                        StripeCustomerId = s.StripeCustomerId,
                        StripeSubscriptionId = s.StripeSubscriptionId
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new
                {
                    subscriptions,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }, "Subscriptions retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get all subscriptions error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving subscriptions: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/user/{userId}
        // Get specific user's subscriptions
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserSubscriptions(Guid userId)
        {
            try
            {
                var subscriptions = await _context.Subscriptions
                    .Include(s => s.User)
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.CreatedOn)
                    .Select(s => new AdminSubscriptionDto
                    {
                        SubscriptionId = s.SubscriptionId,
                        UserId = s.UserId,
                        UserEmail = s.User.Email,
                        UserName = s.User.FullName,
                        PlanName = s.PlanName,
                        TierLevel = !string.IsNullOrWhiteSpace(s.User.TierLevel) ? s.User.TierLevel : (s.User.IsPremium ? "plus" : "free"),
                        Status = s.CancelAtPeriodEnd && (s.Status ?? "").ToLower() == "active" ? "canceled" : s.Status,
                        CurrentPeriodStart = s.CurrentPeriodStart,
                        CurrentPeriodEnd = s.CurrentPeriodEnd,
                        Amount = s.Amount,
                        Currency = s.Currency,
                        CreatedOn = s.CreatedOn,
                        CancelAtPeriodEnd = s.CancelAtPeriodEnd,
                        StripeCustomerId = s.StripeCustomerId,
                        StripeSubscriptionId = s.StripeSubscriptionId
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(subscriptions, "User subscriptions retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get user subscriptions error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving user subscriptions: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/stats
        // Get subscription statistics and revenue
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalSubscriptions = await _context.Subscriptions.CountAsync();
                var activeSubscriptions = await _context.Subscriptions.CountAsync(s => (s.Status ?? "") == "active" && !s.CancelAtPeriodEnd);
                var canceledSubscriptions = await _context.Subscriptions.CountAsync(s => (s.Status ?? "") == "canceled" || s.CancelAtPeriodEnd);
                var pastDueSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == "past_due");
                var trialingSubscriptions = await _context.Subscriptions.CountAsync(s => s.Status == "trialing");

                // Calculate MRR (Monthly Recurring Revenue)
                // Strategy: determine billing cadence from period length (yearly > 60 days, else monthly)
                var activeSubscriptionAmounts = await _context.Subscriptions
                    .Where(s => (s.Status ?? "") == "active" && !s.CancelAtPeriodEnd)
                    .Select(s => new {
                        s.Amount,
                        s.CurrentPeriodStart,
                        s.CurrentPeriodEnd,
                        s.PlanName
                    })
                    .ToListAsync();

                decimal monthlyRecurringRevenue = 0;
                foreach (var sub in activeSubscriptionAmounts)
                {
                    var amount = sub.Amount ?? 0;
                    if (amount == 0) continue;

                    // Determine if yearly by period duration OR by plan name hint
                    bool isYearly = false;
                    if (sub.CurrentPeriodStart.HasValue && sub.CurrentPeriodEnd.HasValue)
                    {
                        var days = (sub.CurrentPeriodEnd.Value - sub.CurrentPeriodStart.Value).TotalDays;
                        isYearly = days > 60; // yearly periods are ~365 days, monthly ~30 days
                    }
                    else
                    {
                        // Fallback: check plan name
                        isYearly = sub.PlanName != null &&
                                   (sub.PlanName.Contains("Year", StringComparison.OrdinalIgnoreCase) ||
                                    sub.PlanName.Contains("Annual", StringComparison.OrdinalIgnoreCase));
                    }

                    monthlyRecurringRevenue += isYearly ? amount / 12 : amount;
                }

                // Calculate total revenue from all completed subscriptions
                var totalRevenue = await _context.Subscriptions
                    .Where(s => s.Status == "active" || s.Status == "canceled")
                    .SumAsync(s => s.Amount ?? 0);

                var stats = new SubscriptionStatsDto
                {
                    TotalSubscriptions = totalSubscriptions,
                    ActiveSubscriptions = activeSubscriptions,
                    CanceledSubscriptions = canceledSubscriptions,
                    PastDueSubscriptions = pastDueSubscriptions,
                    TrialingSubscriptions = trialingSubscriptions,
                    MonthlyRecurringRevenue = Math.Round(monthlyRecurringRevenue, 2),
                    YearlyRecurringRevenue = Math.Round(monthlyRecurringRevenue * 12, 2),
                    TotalRevenue = Math.Round(totalRevenue, 2)
                };

                return Ok(ResponseHelper.Success(stats, "Statistics retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get stats error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving statistics: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/logs
        // Get subscription event logs
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? eventType = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var query = _context.SubscriptionLogs
                    .Include(l => l.User)
                    .AsQueryable();

                // Filter by event type if provided
                if (!string.IsNullOrEmpty(eventType))
                {
                    query = query.Where(l => l.EventType.ToLower() == eventType.ToLower());
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Pagination
                var logs = await query
                    .OrderByDescending(l => l.CreatedOn)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(l => new
                    {
                        l.LogId,
                        l.SubscriptionId,
                        l.UserId,
                        UserEmail = l.User != null ? l.User.Email : null,
                        l.EventType,
                        l.CreatedOn
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(new
                {
                    logs,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }, "Logs retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get logs error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving logs: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/AdminSubscription/search
        // Search subscriptions by email or name
        // ═══════════════════════════════════════════════════════════════════
        [HttpGet("search")]
        public async Task<IActionResult> SearchSubscriptions([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(ResponseHelper.Fail<object>("Search query is required"));
                }

                var searchTerm = query.ToLower();

                var subscriptions = await _context.Subscriptions
                    .Include(s => s.User)
                    .Where(s => s.User.Email.ToLower().Contains(searchTerm) ||
                                s.User.FullName.ToLower().Contains(searchTerm))
                    .OrderByDescending(s => s.CreatedOn)
                    .Take(50)
                    .Select(s => new AdminSubscriptionDto
                    {
                        SubscriptionId = s.SubscriptionId,
                        UserId = s.UserId,
                        UserEmail = s.User.Email,
                        UserName = s.User.FullName,
                        PlanName = s.PlanName,
                        TierLevel = !string.IsNullOrWhiteSpace(s.User.TierLevel) ? s.User.TierLevel : (s.User.IsPremium ? "plus" : "free"),
                        Status = s.CancelAtPeriodEnd && (s.Status ?? "").ToLower() == "active" ? "canceled" : s.Status,
                        CurrentPeriodStart = s.CurrentPeriodStart,
                        CurrentPeriodEnd = s.CurrentPeriodEnd,
                        Amount = s.Amount,
                        Currency = s.Currency,
                        CreatedOn = s.CreatedOn,
                        CancelAtPeriodEnd = s.CancelAtPeriodEnd,
                        StripeCustomerId = s.StripeCustomerId,
                        StripeSubscriptionId = s.StripeSubscriptionId
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(subscriptions, $"Found {subscriptions.Count} subscriptions", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Search subscriptions error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error searching subscriptions: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST /api/AdminSubscription/sync-from-stripe
        // Pull latest status for every subscription directly from Stripe API
        // and update the local DB — bypasses the need for webhooks in dev.
        // ═══════════════════════════════════════════════════════════════════
        [HttpPost("sync-from-stripe")]
        public async Task<IActionResult> SyncFromStripe()
        {
            try
            {
                var subscriptions = await _context.Subscriptions
                    .Where(s => !string.IsNullOrEmpty(s.StripeSubscriptionId))
                    .ToListAsync();

                if (subscriptions.Count == 0)
                    return Ok(ResponseHelper.Success(new { synced = 0 }, "No subscriptions to sync.", 200));

                var stripeSubService = new SubscriptionService();
                int synced = 0;

                foreach (var sub in subscriptions)
                {
                    try
                    {
                        var stripeSub = await stripeSubService.GetAsync(sub.StripeSubscriptionId);
                        if (stripeSub == null) continue;

                        sub.Status = stripeSub.Status;
                        sub.CancelAtPeriodEnd = stripeSub.CancelAtPeriodEnd;
                        sub.CurrentPeriodStart = stripeSub.CurrentPeriodStart;
                        sub.CurrentPeriodEnd = stripeSub.CurrentPeriodEnd;
                        sub.UpdatedOn = DateTime.UtcNow;

                        // ✅ Update plan details if they changed (upgrade/downgrade)
                        if (stripeSub.Items?.Data?.Count > 0)
                        {
                            var priceItem = stripeSub.Items.Data[0];
                            
                            // Update price ID if changed
                            if (!string.IsNullOrEmpty(priceItem.Price?.Id))
                            {
                                sub.StripePriceId = priceItem.Price.Id;
                            }

                            // ✅ Update amount from Stripe (this was missing!)
                            if (priceItem.Price?.UnitAmount.HasValue == true)
                            {
                                sub.Amount = priceItem.Price.UnitAmount.Value / 100m;
                            }

                            // Update plan name if we can resolve it from database
                            string priceId = priceItem.Price?.Id;
                            if (!string.IsNullOrEmpty(priceId))
                            {
                                var matchingPlan = await _context.SubscriptionPlans
                                    .FirstOrDefaultAsync(p => p.StripePriceId == priceId && p.IsActive);
                                if (matchingPlan != null)
                                {
                                    sub.PlanName = matchingPlan.PlanName;
                                }
                            }
                        }

                        // Update user premium flag based on real Stripe status
                        bool isPremium = stripeSub.Status == "active" && !stripeSub.CancelAtPeriodEnd;
                        var user = await _context.Users.FindAsync(sub.UserId);
                        if (user != null)
                        {
                            user.IsPremium = isPremium;
                            user.UpdatedOn = DateTime.UtcNow;
                        }

                        synced++;
                    }
                    catch (Exception subEx)
                    {
                        Console.WriteLine($"⚠️ Could not sync sub {sub.StripeSubscriptionId}: {subEx.Message}");
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Synced {synced}/{subscriptions.Count} subscriptions from Stripe");

                return Ok(ResponseHelper.Success(new { synced, total = subscriptions.Count }, $"Synced {synced} subscriptions from Stripe.", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Sync from Stripe error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error syncing from Stripe: {ex.Message}"));
            }
        }
        public class UpdateMembershipPlanPriceRequest
        {
            public decimal Price { get; set; }
        }
    }
}
