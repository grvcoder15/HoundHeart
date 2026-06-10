using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;
using System;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Hounded_Heart.Services.Services
{
    public class StripeService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly string _secretKey;
        private readonly string _webhookSecret;

        public StripeService(IConfiguration configuration, AppDbContext context, IEmailService emailService)
        {
            _configuration = configuration;
            _context = context;
            _emailService = emailService;
            _secretKey = _configuration["Stripe:SecretKey"];
            _webhookSecret = _configuration["Stripe:WebhookSecret"];
            StripeConfiguration.ApiKey = _secretKey;
        }

        // Create or get Stripe customer
        public async Task<string> CreateOrGetCustomerAsync(Guid userId, string userEmail, string userName)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            var customerService = new CustomerService();

            // Return existing customer if already created and still exists in Stripe
            if (!string.IsNullOrEmpty(user.StripeCustomerId))
            {
                try
                {
                    var existing = await customerService.GetAsync(user.StripeCustomerId);
                    if (existing != null)
                    {
                        return user.StripeCustomerId;
                    }
                }
                catch (StripeException ex) when (IsMissingCustomerError(ex))
                {
                    // Stale customer id (e.g. from old test account/key). Recreate below.
                    user.StripeCustomerId = null;
                    await _context.SaveChangesAsync();
                }
            }

            // Create new Stripe customer
            var customerOptions = new CustomerCreateOptions
            {
                Email = userEmail,
                Name = userName,
                Metadata = new Dictionary<string, string>
                {
                    { "user_id", userId.ToString() }
                }
            };

            var customer = await customerService.CreateAsync(customerOptions);

            // Save customer ID to user record
            user.StripeCustomerId = customer.Id;
            await _context.SaveChangesAsync();

            return customer.Id;
        }

        // Create Stripe Checkout Session
        public async Task<Session> CreateCheckoutSessionAsync(Guid userId, string userEmail, string userName, string priceId)
        {
            // Get or create Stripe customer
            var customerId = await CreateOrGetCustomerAsync(userId, userEmail, userName);

            // Validate that we have a Stripe Price ID
            if (string.IsNullOrEmpty(priceId))
            {
                throw new Exception("Price ID is required");
            }

            // Try to look up subscription plan from database by StripePriceId (optional)
            var plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(p => p.StripePriceId == priceId && p.IsActive);
            
            string planName = plan?.PlanName ?? "Subscription Plan";

            // Create checkout session using the Stripe Price ID directly
            var sessionService = new SessionService();
            var options = new SessionCreateOptions
            {
                Customer = customerId,
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,  // Use Stripe Price ID directly
                        Quantity = 1,
                    }
                },
                Mode = "subscription",
                SuccessUrl = _configuration["Stripe:SuccessUrl"] ?? "http://localhost:5173/subscription/success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = _configuration["Stripe:CancelUrl"] ?? "http://localhost:5173/subscription/cancel",
                Metadata = new Dictionary<string, string>
                {
                    { "type", "subscription" },
                    { "user_id", userId.ToString() },
                    { "price_id", priceId },
                    { "plan_name", planName }
                }
            };

            try
            {
                var session = await sessionService.CreateAsync(options);
                return session;
            }
            catch (StripeException ex) when (IsMissingCustomerError(ex))
            {
                // Customer was deleted in Stripe after being stored locally; recreate and retry once.
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.StripeCustomerId = null;
                    await _context.SaveChangesAsync();
                }

                var refreshedCustomerId = await CreateOrGetCustomerAsync(userId, userEmail, userName);
                options.Customer = refreshedCustomerId;

                var retrySession = await sessionService.CreateAsync(options);
                return retrySession;
            }
        }

        private static bool IsMissingCustomerError(StripeException ex)
        {
            if (ex?.StripeError == null)
            {
                return false;
            }

            return ex.StripeError.Code == "resource_missing"
                && ex.StripeError.Message?.Contains("No such customer", StringComparison.OrdinalIgnoreCase) == true;
        }

        // Create Checkout Session for a Sacred Guide (One-time payment)
        public async Task<Session> CreateGuideCheckoutSessionAsync(Guid userId, string userEmail, string userName, Guid guideId)
        {
            var guide = await _context.SacredGuides.FindAsync(guideId);
            if (guide == null) throw new Exception("Sacred Guide not found");

            var customerId = await CreateOrGetCustomerAsync(userId, userEmail, userName);

            var sessionService = new SessionService();
            var options = new SessionCreateOptions
            {
                Customer = customerId,
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(guide.Price * 100),
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = guide.Title,
                                Description = guide.Description,
                            },
                        },
                        Quantity = 1,
                    }
                },
                Mode = "payment",
                SuccessUrl = _configuration["Stripe:SuccessUrl"] ?? "http://localhost:5173/subscription/success?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = _configuration["Stripe:CancelUrl"] ?? "http://localhost:5173/subscription/cancel",
                Metadata = new Dictionary<string, string>
                {
                    { "type", "sacred_guide" },
                    { "user_id", userId.ToString() },
                    { "sacred_guide_id", guideId.ToString() }
                }
            };

            var session = await sessionService.CreateAsync(options);
            return session;
        }

        // Create portal session
        public async Task<Stripe.BillingPortal.Session> CreatePortalSessionAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.StripeCustomerId))
                throw new Exception("User has no Stripe customer ID");

            var portalService = new Stripe.BillingPortal.SessionService();
            var options = new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer = user.StripeCustomerId,
                ReturnUrl = _configuration["Stripe:PortalReturnUrl"] ?? "http://localhost:5173/subscription/portal-return",
            };

            var session = await portalService.CreateAsync(options);
            return session;
        }

        // Verify Stripe Session directly (Real-time fallback — no Stripe CLI needed)
        public async Task<bool> VerifySessionAsync(string sessionId)
        {
            try
            {
                var sessionService = new SessionService();
                var session = await sessionService.GetAsync(sessionId);

                if (session == null || session.PaymentStatus != "paid")
                    return false;

                var userIdStr = session.Metadata.GetValueOrDefault("user_id");
                if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                    return false;

                // Check if webhook already created the subscription record
                var existing = await _context.Subscriptions
                    .FirstOrDefaultAsync(s => s.StripeSubscriptionId == session.SubscriptionId);

                if (existing == null && !string.IsNullOrEmpty(session.SubscriptionId))
                {
                    // Webhook hasn't fired yet (e.g. demo without Stripe CLI).
                    // Fetch Stripe subscription details and create the record ourselves.
                    try
                    {
                        var stripeSubService = new SubscriptionService();
                        var stripeSubscription = await stripeSubService.GetAsync(session.SubscriptionId);

                        var planName = session.Metadata.GetValueOrDefault("plan_name", "Premium");

                        var newSubscription = new Models.Data.Subscription
                        {
                            SubscriptionId = Guid.NewGuid(),
                            UserId = userId,
                            StripeCustomerId = session.CustomerId,
                            StripeSubscriptionId = session.SubscriptionId,
                            StripePriceId = stripeSubscription.Items.Data[0].Price.Id,
                            PlanName = planName,
                            Status = stripeSubscription.Status,
                            CurrentPeriodStart = stripeSubscription.CurrentPeriodStart,
                            CurrentPeriodEnd = stripeSubscription.CurrentPeriodEnd,
                            CancelAtPeriodEnd = stripeSubscription.CancelAtPeriodEnd,
                            Amount = stripeSubscription.Items.Data[0].Price.UnitAmount / 100m,
                            Currency = stripeSubscription.Items.Data[0].Price.Currency.ToUpper(),
                            CreatedOn = DateTime.UtcNow
                        };

                        _context.Subscriptions.Add(newSubscription);
                        await _context.SaveChangesAsync();
                        await SendSubscriptionPurchaseEmailAsync(newSubscription);
                        Console.WriteLine($"✅ [VerifySession Fallback] Subscription record created for user {userId}");
                    }
                    catch (Exception subEx)
                    {
                        // If fetching Stripe sub fails, we still mark the user as premium
                        Console.WriteLine($"⚠️ [VerifySession Fallback] Could not create subscription record: {subEx.Message}");
                    }
                }

                // Always ensure the user is marked as Premium
                await UpdateUserPremiumStatusAsync(userId, true);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Verify session error: {ex.Message}");
                return false;
            }
        }

        // Get user's active subscription
        public async Task<Models.Data.Subscription?> GetUserActiveSubscriptionAsync(Guid userId)
        {
            return await _context.Subscriptions
                .Where(s => s.UserId == userId && s.Status == "active")
                .OrderByDescending(s => s.CreatedOn)
                .FirstOrDefaultAsync();
        }

        // Get all user subscriptions
        public async Task<List<Models.Data.Subscription>> GetUserSubscriptionsAsync(Guid userId)
        {
            return await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedOn)
                .ToListAsync();
        }

        public async Task<Models.Data.Subscription?> SyncLatestUserSubscriptionFromStripeAsync(Guid userId)
        {
            var subscription = await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedOn)
                .FirstOrDefaultAsync();

            if (subscription == null || string.IsNullOrEmpty(subscription.StripeSubscriptionId))
            {
                return subscription;
            }

            var stripeSubService = new SubscriptionService();
            var stripeSubscription = await stripeSubService.GetAsync(subscription.StripeSubscriptionId);

            await ApplyStripeSubscriptionStateAsync(subscription, stripeSubscription, "subscription_synced");

            return subscription;
        }

        private async Task ApplyStripeSubscriptionStateAsync(Models.Data.Subscription subscription, Stripe.Subscription stripeSubscription, string eventType)
        {
            subscription.Status = stripeSubscription.Status;
            subscription.CurrentPeriodStart = stripeSubscription.CurrentPeriodStart;
            subscription.CurrentPeriodEnd = stripeSubscription.CurrentPeriodEnd;
            subscription.CancelAtPeriodEnd = stripeSubscription.CancelAtPeriodEnd;
            subscription.UpdatedOn = DateTime.UtcNow;

            if (stripeSubscription.Items?.Data?.Count > 0)
            {
                var newPriceItem = stripeSubscription.Items.Data[0];
                var newPriceId = newPriceItem.Price?.Id;
                var newAmount = newPriceItem.Price?.UnitAmount / 100m;
                var newCurrency = newPriceItem.Price?.Currency?.ToUpper();

                if (!string.IsNullOrEmpty(newPriceId))
                {
                    subscription.StripePriceId = newPriceId;
                }
                if (newAmount.HasValue)
                {
                    subscription.Amount = newAmount;
                }
                if (!string.IsNullOrEmpty(newCurrency))
                {
                    subscription.Currency = newCurrency;
                }

                if (!string.IsNullOrEmpty(newPriceId))
                {
                    var matchingPlan = await _context.SubscriptionPlans
                        .FirstOrDefaultAsync(p => p.StripePriceId == newPriceId && p.IsActive);
                    if (matchingPlan != null)
                    {
                        subscription.PlanName = matchingPlan.PlanName;
                    }
                    else
                    {
                        try
                        {
                            var priceService = new PriceService();
                            var price = await priceService.GetAsync(newPriceId, new PriceGetOptions { Expand = new List<string> { "product" } });
                            var productName = (price.Product as Product)?.Name;
                            if (!string.IsNullOrEmpty(productName))
                            {
                                subscription.PlanName = productName;
                            }
                        }
                        catch
                        {
                            // Keep the existing plan name if Stripe product lookup fails.
                        }
                    }
                }
            }

            var isPremium = stripeSubscription.Status == "active" || stripeSubscription.Status == "trialing";
            await UpdateUserPremiumStatusAsync(subscription.UserId, isPremium);

            await LogSubscriptionEventAsync(subscription.SubscriptionId, subscription.UserId, eventType, JsonConvert.SerializeObject(stripeSubscription));
            await _context.SaveChangesAsync();
        }

        // Handle Stripe webhooks
        public async Task<bool> HandleWebhookAsync(string json, string stripeSignature)
        {
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    _webhookSecret
                );

                Console.WriteLine($"🔔 Stripe Webhook Received: {stripeEvent.Type}");

                // Handle different event types
                switch (stripeEvent.Type)
                {
                    case Events.CheckoutSessionCompleted:
                        await HandleCheckoutSessionCompletedAsync(stripeEvent);
                        break;

                    case Events.CustomerSubscriptionUpdated:
                        await HandleSubscriptionUpdatedAsync(stripeEvent);
                        break;

                    case Events.CustomerSubscriptionDeleted:
                        await HandleSubscriptionDeletedAsync(stripeEvent);
                        break;

                    case Events.InvoicePaymentSucceeded:
                        await HandleInvoicePaymentSucceededAsync(stripeEvent);
                        break;

                    case Events.InvoicePaymentFailed:
                        await HandleInvoicePaymentFailedAsync(stripeEvent);
                        break;

                    default:
                        Console.WriteLine($"⚠️ Unhandled event type: {stripeEvent.Type}");
                        break;
                }

                return true;
            }
            catch (StripeException e)
            {
                Console.WriteLine($"❌ Stripe webhook error: {e.Message}");
                return false;
            }
        }

        // Handle checkout.session.completed
        private async Task HandleCheckoutSessionCompletedAsync(Event stripeEvent)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            var type = session.Metadata.GetValueOrDefault("type", "subscription");

            if (type == "sacred_guide")
            {
                await HandleGuidePurchaseCompletedAsync(session);
                return;
            }

            var userId = Guid.Parse(session.Metadata["user_id"]);
            var planName = session.Metadata.GetValueOrDefault("plan_name", "Premium");

            var existingSubscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == session.SubscriptionId);

            if (existingSubscription != null)
            {
                Console.WriteLine($"ℹ️ Subscription already exists for StripeSubscriptionId {session.SubscriptionId}, skipping duplicate create.");
                return;
            }

            // Get the subscription
            var subscriptionService = new SubscriptionService();
            var stripeSubscription = await subscriptionService.GetAsync(session.SubscriptionId);

            // Create subscription record
            var subscription = new Models.Data.Subscription
            {
                SubscriptionId = Guid.NewGuid(),
                UserId = userId,
                StripeCustomerId = session.CustomerId,
                StripeSubscriptionId = session.SubscriptionId,
                StripePriceId = stripeSubscription.Items.Data[0].Price.Id,
                PlanName = planName,
                Status = stripeSubscription.Status,
                CurrentPeriodStart = stripeSubscription.CurrentPeriodStart,
                CurrentPeriodEnd = stripeSubscription.CurrentPeriodEnd,
                CancelAtPeriodEnd = stripeSubscription.CancelAtPeriodEnd,
                Amount = stripeSubscription.Items.Data[0].Price.UnitAmount / 100m,
                Currency = stripeSubscription.Items.Data[0].Price.Currency.ToUpper(),
                CreatedOn = DateTime.UtcNow
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();
            await SendSubscriptionPurchaseEmailAsync(subscription);

            // Update user premium status
            await UpdateUserPremiumStatusAsync(userId, true);

            // Log the event
            await LogSubscriptionEventAsync(subscription.SubscriptionId, userId, "checkout_completed", JsonConvert.SerializeObject(session));

            Console.WriteLine($"✅ Subscription created for user {userId}");
        }

        private async Task HandleGuidePurchaseCompletedAsync(Session session)
        {
            var userId = Guid.Parse(session.Metadata["user_id"]);
            var guideId = Guid.Parse(session.Metadata["sacred_guide_id"]);
            var amount = session.AmountTotal / 100m ?? 0;

            var purchase = new SacredGuidePurchase
            {
                PurchaseId = Guid.NewGuid(),
                UserId = userId,
                SacredGuideId = guideId,
                AmountPaid = amount,
                PaymentStatus = "Completed",
                PurchasedOn = DateTime.UtcNow
            };

            _context.SacredGuidePurchases.Add(purchase);
            await _context.SaveChangesAsync();

            Console.WriteLine($"✅ Sacred Guide purchase completed for user {userId}, guide {guideId}");
        }

        // Handle customer.subscription.updated
        private async Task HandleSubscriptionUpdatedAsync(Event stripeEvent)
        {
            var stripeSubscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (stripeSubscription == null) 
            {
                Console.WriteLine("❌ HandleSubscriptionUpdatedAsync: stripeSubscription is NULL");
                return;
            }

            Console.WriteLine($"🔍 Looking for subscription with StripeSubscriptionId: {stripeSubscription.Id}");

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscription.Id);

            if (subscription == null)
            {
                Console.WriteLine($"⚠️ Subscription {stripeSubscription.Id} NOT FOUND in database!");
                Console.WriteLine($"   Available StripeSubscriptionIds in DB:");
                var allSubs = await _context.Subscriptions.Select(s => new { s.SubscriptionId, s.StripeSubscriptionId, s.UserId }).ToListAsync();
                foreach (var sub in allSubs)
                {
                    Console.WriteLine($"   - {sub.StripeSubscriptionId} (User: {sub.UserId})");
                }
                return;
            }

            Console.WriteLine($"✅ Found subscription in DB, updating...");

            await ApplyStripeSubscriptionStateAsync(subscription, stripeSubscription, "subscription_updated");

            Console.WriteLine($"✅ Subscription updated: {stripeSubscription.Id} - Status: {stripeSubscription.Status} - Plan: {subscription.PlanName}");
        }

        // Handle customer.subscription.deleted
        private async Task HandleSubscriptionDeletedAsync(Event stripeEvent)
        {
            var stripeSubscription = stripeEvent.Data.Object as Stripe.Subscription;
            if (stripeSubscription == null) return;

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscription.Id);

            if (subscription != null)
            {
                subscription.Status = "canceled";
                subscription.UpdatedOn = DateTime.UtcNow;

                // Revoke premium access
                await UpdateUserPremiumStatusAsync(subscription.UserId, false);

                // Log the event
                await LogSubscriptionEventAsync(subscription.SubscriptionId, subscription.UserId, "subscription_canceled", JsonConvert.SerializeObject(stripeSubscription));

                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Subscription canceled: {stripeSubscription.Id}");
            }
        }

        // Handle invoice.payment_succeeded
        private async Task HandleInvoicePaymentSucceededAsync(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            if (invoice == null) return;

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == invoice.SubscriptionId);

            if (subscription != null)
            {
                // Log successful payment
                await LogSubscriptionEventAsync(subscription.SubscriptionId, subscription.UserId, "payment_succeeded", JsonConvert.SerializeObject(invoice));
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Payment succeeded for subscription: {invoice.SubscriptionId}");
            }
        }

        // Handle invoice.payment_failed
        private async Task HandleInvoicePaymentFailedAsync(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            if (invoice == null) return;

            var subscription = await _context.Subscriptions
                .FirstOrDefaultAsync(s => s.StripeSubscriptionId == invoice.SubscriptionId);

            if (subscription != null)
            {
                subscription.Status = "past_due";
                subscription.UpdatedOn = DateTime.UtcNow;

                // Log failed payment
                await LogSubscriptionEventAsync(subscription.SubscriptionId, subscription.UserId, "payment_failed", JsonConvert.SerializeObject(invoice));

                await _context.SaveChangesAsync();

                Console.WriteLine($"⚠️ Payment failed for subscription: {invoice.SubscriptionId}");
            }
        }

        private async Task SendSubscriptionPurchaseEmailAsync(Models.Data.Subscription subscription)
        {
            var user = await _context.Users.FindAsync(subscription.UserId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
            {
                return;
            }

            var planName = string.IsNullOrWhiteSpace(subscription.PlanName)
                ? "HoundHeart Plan"
                : subscription.PlanName;

            var startDate = subscription.CurrentPeriodStart?.ToLocalTime().ToString("dd MMM yyyy") ?? "N/A";
            var endDate = subscription.CurrentPeriodEnd?.ToLocalTime().ToString("dd MMM yyyy") ?? "N/A";
            var amountText = subscription.Amount.HasValue
                ? $"{subscription.Amount.Value:0.00} {subscription.Currency}"
                : $"N/A {subscription.Currency}";

            var body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>Plan Purchase Confirmed</h2>
  <p>Hi {System.Net.WebUtility.HtmlEncode(user.FullName ?? "there")},</p>
  <p>Your subscription purchase was successful.</p>
  <p><strong>Plan:</strong> {System.Net.WebUtility.HtmlEncode(planName)}</p>
  <p><strong>Start date:</strong> {startDate}</p>
  <p><strong>End date:</strong> {endDate}</p>
  <p><strong>Amount:</strong> {amountText}</p>
  <p>Thank you for choosing HoundHeart.</p>
  <p>Best regards,<br/>The Hound Heart Team</p>
</body>
</html>";

            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    $"Your {planName} plan is active",
                    body,
                    user.FullName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Subscription purchase email failed for user {subscription.UserId}: {ex.Message}");
            }
        }

        // Update user premium status
        private async Task UpdateUserPremiumStatusAsync(Guid userId, bool isPremium)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.IsPremium = isPremium;
                // Assuming RoleId 2 is "Standard User" and 3 is "Premium" (Reviewing earlier code, 2 was used for both)
                // If it was hardcoded to 2, we keep it consistent. 
                user.RoleId = 2; 
                user.UpdatedOn = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
            }
        }

        // Log subscription event
        private async Task LogSubscriptionEventAsync(Guid subscriptionId, Guid userId, string eventType, string eventData)
        {
            var log = new SubscriptionLog
            {
                LogId = Guid.NewGuid(),
                SubscriptionId = subscriptionId,
                UserId = userId,
                EventType = eventType,
                EventData = eventData,
                CreatedOn = DateTime.UtcNow
            };

            _context.SubscriptionLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
