using System;
using System.Collections.Generic;

namespace Hounded_Heart.Models.DTOs
{
    public class BillingHistoryDto
    {
        public Guid SubscriptionId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string TransactionId { get; set; } = string.Empty; // Stripe Subscription ID
    }

    public class BillingSummaryDto
    {
        public decimal TotalSpent { get; set; }
        public string Currency { get; set; } = "USD";
        public DateTime? NextPaymentDate { get; set; }
        public decimal NextPaymentAmount { get; set; }
        public List<BillingHistoryDto> History { get; set; } = new List<BillingHistoryDto>();
    }
}
