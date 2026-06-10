using System;

namespace Hounded_Heart.Models.DTOs
{
    // Request to create checkout session
    public class CreateCheckoutSessionDto
    {
        public string PriceId { get; set; }  // Stripe Price ID (e.g., "price_1234") - can also accept database GUID for backward compatibility
    }

    // Response with subscription details
    public class SubscriptionResponseDto
    {
        public Guid SubscriptionId { get; set; }
        public string? PlanName { get; set; }
        public string TierLevel { get; set; } = "free"; // free, plus, premium
        public string? Status { get; set; }
        public DateTime? CurrentPeriodStart { get; set; }
        public DateTime? CurrentPeriodEnd { get; set; }
        public bool CancelAtPeriodEnd { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public DateTime CreatedOn { get; set; }
    }

    // Admin view with user details
    public class AdminSubscriptionDto
    {
        public Guid SubscriptionId { get; set; }
        public Guid UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? UserName { get; set; }
        public string? PlanName { get; set; }
        public string TierLevel { get; set; } = "free"; // free, plus, premium
        public string? Status { get; set; }
        public DateTime? CurrentPeriodStart { get; set; }
        public DateTime? CurrentPeriodEnd { get; set; }
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public DateTime CreatedOn { get; set; }
        public bool CancelAtPeriodEnd { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
    }

    // Admin statistics
    public class SubscriptionStatsDto
    {
        public int TotalSubscriptions { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int CanceledSubscriptions { get; set; }
        public int PastDueSubscriptions { get; set; }
        public int TrialingSubscriptions { get; set; }
        public decimal MonthlyRecurringRevenue { get; set; }
        public decimal YearlyRecurringRevenue { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    // Checkout session response
    public class CheckoutSessionResponseDto
    {
        public string SessionUrl { get; set; }
        public string SessionId { get; set; }
    }

    // Portal session response
    public class PortalSessionResponseDto
    {
        public string PortalUrl { get; set; }
    }

    // Sacred Guide access check response
    public class SacredGuideAccessDto
    {
        public bool HasAccess { get; set; }
        public bool IsPremium { get; set; }
        public string TierLevel { get; set; } = "free"; // free, plus, premium
        public bool HasPurchased { get; set; }
        public string? Reason { get; set; }
    }

    // Sacred Guide preview configuration
    public class SacredGuidePreviewConfigDto
    {
        public Guid SacredGuideId { get; set; }
        public int TotalPages { get; set; }
        public int PreviewPercentage { get; set; }
        public int AllowedPages { get; set; }
        public bool AllowDownload { get; set; }
        public bool RequiresPremium { get; set; }
        public bool UserIsPremium { get; set; }
        public string TierLevel { get; set; } = "free"; // free, plus, premium
        public bool HasFullAccess { get; set; }
    }

    // Subscription Plan DTO (for displaying pricing plans to users)
    public class SubscriptionPlanDto
    {
        public Guid PlanId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public string TierLevel { get; set; } = "free"; // free, plus, premium
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string Currency { get; set; } = "USD";
        public string BillingPeriod { get; set; } = string.Empty;
        public List<string> Features { get; set; } = new List<string>();
        public string? Badge { get; set; }
        public string? SavingsText { get; set; }
        public int DisplayOrder { get; set; }
    }
}
