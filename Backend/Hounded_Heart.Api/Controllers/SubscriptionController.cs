using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
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
    public class SubscriptionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly StripeService _stripeService;

        public SubscriptionController(AppDbContext context, StripeService stripeService)
        {
            _context = context;
            _stripeService = stripeService;
        }

        // Helper: Get User ID from JWT token
        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(claim) && Guid.TryParse(claim, out Guid id))
                return id;
            return null;
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/Subscription/plans
        // Get all active subscription plans (public endpoint)
        // ═══════════════════════════════════════════════════════════════════
        [AllowAnonymous]
        [HttpGet("plans")]
        public async Task<IActionResult> GetSubscriptionPlans()
        {
            try
            {
                var plansDbResults = await _context.SubscriptionPlans
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .ToListAsync();

                var plans = plansDbResults.Select(p => new SubscriptionPlanDto
                {
                    PlanId = p.PlanId,
                    PlanName = p.PlanName,
                    Description = p.Description,
                    Price = p.Price,
                    Currency = p.Currency,
                    BillingPeriod = p.BillingPeriod,
                    Features = string.IsNullOrEmpty(p.Features) 
                        ? new List<string>() 
                        : System.Text.Json.JsonSerializer.Deserialize<List<string>>(p.Features) ?? new List<string>(),
                    Badge = p.Badge,
                    SavingsText = p.SavingsText,
                    DisplayOrder = p.DisplayOrder
                }).ToList();

                return Ok(ResponseHelper.Success(plans, "Subscription plans retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get plans error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving plans: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST /api/Subscription/create-checkout-session
        // Create Stripe Checkout session for subscription
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var user = await _context.Users.FindAsync(userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found"));

                // Check if user already has an active subscription
                var existingSubscription = await _stripeService.GetUserActiveSubscriptionAsync(userId.Value);
                if (existingSubscription != null)
                {
                    return BadRequest(ResponseHelper.Fail<object>("You already have an active subscription. Please manage your billing through the Customer Portal."));
                }

                // PriceId can be either a Stripe Price ID (string like "price_xxx") or database GUID
                // We'll use the Stripe Price ID directly for checkout
                var session = await _stripeService.CreateCheckoutSessionAsync(
                    userId.Value,
                    user.Email,
                    user.FullName,
                    dto.PriceId
                );

                return Ok(ResponseHelper.Success(new CheckoutSessionResponseDto
                {
                    SessionUrl = session.Url,
                    SessionId = session.Id
                }, "Checkout session created successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Create checkout session error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error creating checkout session: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST /api/Subscription/create-portal-session
        // Create Stripe Customer Portal session for subscription management
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpPost("create-portal-session")]
        public async Task<IActionResult> CreatePortalSession()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var user = await _context.Users.FindAsync(userId.Value);
                if (user == null || string.IsNullOrEmpty(user.StripeCustomerId))
                {
                    return BadRequest(ResponseHelper.Fail<object>("No subscription found. Please subscribe first."));
                }

                // Create portal session
                var portalSession = await _stripeService.CreatePortalSessionAsync(userId.Value);

                return Ok(ResponseHelper.Success(new PortalSessionResponseDto
                {
                    PortalUrl = portalSession.Url
                }, "Portal session created successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Create portal session error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error creating portal session: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/Subscription/current
        // Get user's current subscription
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentSubscription()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var subscription = await _context.Subscriptions
                    .Where(s => s.UserId == userId.Value)
                    .OrderByDescending(s => s.CreatedOn)
                    .FirstOrDefaultAsync();

                if (subscription == null)
                {
                    return Ok(ResponseHelper.Success<SubscriptionResponseDto>(null, "No subscription found", 200));
                }

                var response = new SubscriptionResponseDto
                {
                    SubscriptionId = subscription.SubscriptionId,
                    PlanName = subscription.PlanName,
                    Status = subscription.Status,
                    CurrentPeriodStart = subscription.CurrentPeriodStart,
                    CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                    CancelAtPeriodEnd = subscription.CancelAtPeriodEnd,
                    Amount = subscription.Amount,
                    Currency = subscription.Currency,
                    CreatedOn = subscription.CreatedOn
                };

                return Ok(ResponseHelper.Success(response, "Subscription retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get subscription error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving subscription: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST /api/Subscription/sync-from-stripe
        // Pull latest Stripe subscription details for the logged-in user
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpPost("sync-from-stripe")]
        public async Task<IActionResult> SyncFromStripe()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var existingSubscription = await _context.Subscriptions
                    .Where(s => s.UserId == userId.Value)
                    .OrderByDescending(s => s.CreatedOn)
                    .FirstOrDefaultAsync();

                if (existingSubscription == null)
                {
                    return BadRequest(ResponseHelper.Fail<object>("No subscription found to sync."));
                }

                if (string.IsNullOrEmpty(existingSubscription.StripeSubscriptionId))
                {
                    return BadRequest(ResponseHelper.Fail<object>("This subscription is not linked to Stripe yet."));
                }

                var subscription = await _stripeService.SyncLatestUserSubscriptionFromStripeAsync(userId.Value);
                if (subscription == null)
                {
                    return StatusCode(500, ResponseHelper.Fail<object>("Failed to sync subscription from Stripe."));
                }

                var response = new SubscriptionResponseDto
                {
                    SubscriptionId = subscription.SubscriptionId,
                    PlanName = subscription.PlanName,
                    Status = subscription.Status,
                    CurrentPeriodStart = subscription.CurrentPeriodStart,
                    CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                    CancelAtPeriodEnd = subscription.CancelAtPeriodEnd,
                    Amount = subscription.Amount,
                    Currency = subscription.Currency,
                    CreatedOn = subscription.CreatedOn
                };

                return Ok(ResponseHelper.Success(response, "Subscription synced successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Sync subscription error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error syncing subscription: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/Subscription/check-access
        // Check if user has premium access
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpGet("check-access")]
        public async Task<IActionResult> CheckAccess()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var user = await _context.Users.FindAsync(userId.Value);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found"));

                var activeSubscription = await _stripeService.GetUserActiveSubscriptionAsync(userId.Value);
                var hasActiveSubscription = activeSubscription != null;

                // Resolve tier from active paid plan. No active plan => Free member.
                var tierLevel = "free";
                if (activeSubscription != null)
                {
                    var mappedPlan = await _context.SubscriptionPlans
                        .Where(p => p.IsActive)
                        .FirstOrDefaultAsync(p =>
                            (!string.IsNullOrEmpty(activeSubscription.StripePriceId) && p.StripePriceId == activeSubscription.StripePriceId) ||
                            (!string.IsNullOrEmpty(activeSubscription.PlanName) && p.PlanName == activeSubscription.PlanName));

                    if (!string.IsNullOrWhiteSpace(mappedPlan?.TierLevel))
                    {
                        var normalized = mappedPlan.TierLevel.Trim().ToLower();
                        tierLevel = normalized is "plus" or "premium" ? normalized : "free";
                    }
                    else if (!string.IsNullOrWhiteSpace(activeSubscription.PlanName))
                    {
                        var planName = activeSubscription.PlanName.ToLower();
                        if (planName.Contains("premium"))
                        {
                            tierLevel = "premium";
                        }
                        else if (planName.Contains("plus"))
                        {
                            tierLevel = "plus";
                        }
                    }
                }

                return Ok(ResponseHelper.Success(new
                {
                    IsPremium = user.IsPremium,
                    HasActiveSubscription = hasActiveSubscription,
                    RoleId = user.RoleId,
                    TierLevel = tierLevel
                }, "Access checked successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Check access error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error checking access: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/Subscription/history
        // Get user's billing and subscription history
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpGet("history")]
        public async Task<IActionResult> GetBillingHistory()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("User not authenticated"));

                var subscriptions = await _context.Subscriptions
                    .Where(s => s.UserId == userId.Value)
                    .OrderByDescending(s => s.CreatedOn)
                    .ToListAsync();

                var history = subscriptions.Select(s => new BillingHistoryDto
                {
                    SubscriptionId = s.SubscriptionId,
                    PlanName = s.PlanName ?? "Premium Plan",
                    Amount = s.Amount ?? 0,
                    Currency = s.Currency,
                    Status = s.Status ?? "Unknown",
                    Date = s.CreatedOn,
                    TransactionId = s.StripeSubscriptionId
                }).ToList();

                var summary = new BillingSummaryDto
                {
                    TotalSpent = subscriptions.Where(s => s.Status == "active" || s.Status == "succeeded").Sum(s => s.Amount ?? 0),
                    Currency = subscriptions.FirstOrDefault()?.Currency ?? "USD",
                    History = history
                };

                // Add next payment info if active
                var activeSub = subscriptions.FirstOrDefault(s => s.Status == "active");
                if (activeSub != null)
                {
                    summary.NextPaymentDate = activeSub.CurrentPeriodEnd;
                    summary.NextPaymentAmount = activeSub.Amount ?? 0;
                }

                return Ok(ResponseHelper.Success(summary, "Billing history retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Get billing history error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving billing history: {ex.Message}"));
            }
        }

        // Verify checkout session status directly with Stripe (Real-time confirmation)
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpGet("verify-session/{sessionId}")]
        public async Task<IActionResult> VerifySession(string sessionId)
        {
            try
            {
                if (string.IsNullOrEmpty(sessionId))
                    return BadRequest(ResponseHelper.Fail<object>("Session ID is required"));

                var success = await _stripeService.VerifySessionAsync(sessionId);

                if (success)
                {
                    var userId = GetUserId();
                    var user = await _context.Users.FindAsync(userId);
                    
                    return Ok(ResponseHelper.Success(new 
                    { 
                        verified = true,
                        isPremium = user?.IsPremium ?? false,
                        roleId = user?.RoleId
                    }, "Payment verified successfully", 200));
                }
                else
                {
                    return BadRequest(ResponseHelper.Fail<object>("Payment verification failed or pending"));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Verify session error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error verifying payment: {ex.Message}"));
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST /api/Subscription/webhook
        // Stripe webhook endpoint (public, no auth required)
        // ═══════════════════════════════════════════════════════════════════
        [AllowAnonymous]
        [HttpPost("webhook")]
        [HttpPost("/api/StripeWebhook/events")]
        public async Task<IActionResult> Webhook()
        {
            try
            {
                Console.WriteLine("📨 ===== WEBHOOK RECEIVED =====");
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                Console.WriteLine($"📦 Webhook JSON length: {json.Length} bytes");
                
                var stripeSignature = Request.Headers["Stripe-Signature"].ToString();
                Console.WriteLine($"🔐 Stripe-Signature: {(string.IsNullOrEmpty(stripeSignature) ? "MISSING!" : "Present")}");

                if (string.IsNullOrEmpty(stripeSignature))
                {
                    Console.WriteLine("⚠️ No Stripe signature found in webhook request");
                    return BadRequest("No Stripe signature found");
                }

                var success = await _stripeService.HandleWebhookAsync(json, stripeSignature);

                if (success)
                {
                    Console.WriteLine("✅ Webhook processed successfully");
                    return Ok(new { received = true });
                }
                else
                {
                    Console.WriteLine("❌ Webhook processing returned false");
                    return BadRequest(new { error = "Webhook processing failed" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Webhook error: {ex.Message}");
                Console.WriteLine($"   Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET /api/Subscription/usage-analytics
        // Returns live Usage Analytics data for the Current Plan tab
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpGet("usage-analytics")]
        public async Task<IActionResult> GetUsageAnalytics()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

                var now = DateTime.UtcNow;
                var sevenDaysAgo = now.AddDays(-7);

                // 1. Weekly Progress — count non-missed check-ins in last 7 days
                var checkInsThisWeek = await _context.UserCheckIns
                    .Where(c => c.UserId == userId.Value
                             && c.IsMissed == false
                             && c.ActivityDate.HasValue
                             && c.ActivityDate.Value >= sevenDaysAgo)
                    .CountAsync();

                // Unique days checked in (max 7)
                var uniqueDays = await _context.UserCheckIns
                    .Where(c => c.UserId == userId.Value
                             && c.IsMissed == false
                             && c.ActivityDate.HasValue
                             && c.ActivityDate.Value >= sevenDaysAgo)
                    .Select(c => c.ActivityDate!.Value.Date)
                    .Distinct()
                    .CountAsync();

                int weeklyPercent = (int)Math.Round((uniqueDays / 7.0) * 100);

                // 2. Dog Synchronizations — Chakra Logs in current billing cycle
                var activeSub = await _context.Subscriptions
                    .Where(s => s.UserId == userId.Value && s.Status == "active")
                    .OrderByDescending(s => s.CreatedOn)
                    .FirstOrDefaultAsync();

                var cycleStart = activeSub?.CurrentPeriodStart ?? now.AddDays(-30);
                var cycleEnd = activeSub?.CurrentPeriodEnd ?? now;

                var dogSyncCount = await _context.ChakraLogs
                    .Where(c => c.UserId == userId.Value
                             && c.CreatedAt >= cycleStart
                             && c.CreatedAt <= cycleEnd)
                    .CountAsync();

                // 3. Intuitive Readings — from UserCredits (auto-create if missing)
                var credit = await _context.UserCredits
                    .Where(c => c.UserId == userId.Value
                             && c.CreditType == "IntuitiveReading"
                             && c.IsDeleted == false
                             && c.BillingCycleStart <= now
                             && c.BillingCycleEnd >= now)
                    .FirstOrDefaultAsync();

                if (credit == null && activeSub != null)
                {
                    // Auto-create credits for current billing cycle
                    credit = new Hounded_Heart.Models.Data.UserCredit
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId.Value,
                        CreditType = "IntuitiveReading",
                        CreditsTotal = 5,
                        CreditsUsed = 0,
                        BillingCycleStart = cycleStart,
                        BillingCycleEnd = cycleEnd,
                        CreatedOn = DateTime.UtcNow
                    };
                    _context.UserCredits.Add(credit);
                    await _context.SaveChangesAsync();
                }

                int readingsUsed = credit?.CreditsUsed ?? 0;
                int readingsTotal = credit?.CreditsTotal ?? 5;

                // 4. Monthly Coaching — tier-dependent
                string coachingDisplay = "N/A";
                if (activeSub != null && activeSub.Amount.HasValue && activeSub.Amount.Value >= 19.99m)
                {
                    coachingDisplay = "0 / 1 Session";
                }

                var result = new
                {
                    weeklyProgressPercent = weeklyPercent,
                    dogSyncCount = dogSyncCount,
                    readingsUsed = readingsUsed,
                    readingsTotal = readingsTotal,
                    coachingDisplay = coachingDisplay
                };

                return Ok(ResponseHelper.Success(result, "Usage analytics retrieved successfully", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Usage analytics error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving usage analytics: {ex.Message}"));
            }
        }
        // ═══════════════════════════════════════════════════════════════════
        // POST /api/Subscription/use-reading
        // Decrements the Intuitive Reading credit
        // ═══════════════════════════════════════════════════════════════════
        [Authorize]
        [HttpPost("use-reading")]
        public async Task<IActionResult> UseReadingCredit()
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

                var now = DateTime.UtcNow;

                var credit = await _context.UserCredits
                    .Where(c => c.UserId == userId.Value
                             && c.CreditType == "IntuitiveReading"
                             && c.IsDeleted == false
                             && c.BillingCycleStart <= now
                             && c.BillingCycleEnd >= now)
                    .FirstOrDefaultAsync();

                if (credit == null)
                {
                    return BadRequest(ResponseHelper.Fail<object>("No active credits found for this billing cycle."));
                }

                if (credit.CreditsUsed >= credit.CreditsTotal)
                {
                    return BadRequest(ResponseHelper.Fail<object>("You have used all your Intuitive Readings for this billing cycle. Upgrade to Elite to unlock unlimited access."));
                }

                credit.CreditsUsed += 1;
                credit.UpdatedOn = now;

                _context.UserCredits.Update(credit);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new { remaining = credit.CreditsTotal - credit.CreditsUsed }, "Reading credit consumed successfully.", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ API error consuming credit: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message}"));
            }
        }
    }
}
