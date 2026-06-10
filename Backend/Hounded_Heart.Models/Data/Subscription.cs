using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("Subscriptions")]
    public class Subscription
    {
        [Key]
        public Guid SubscriptionId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [MaxLength(255)]
        public string? StripeCustomerId { get; set; }

        [Required]
        [MaxLength(255)]
        public string StripeSubscriptionId { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? StripePriceId { get; set; }

        [MaxLength(100)]
        public string? PlanName { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public DateTime? CurrentPeriodStart { get; set; }

        public DateTime? CurrentPeriodEnd { get; set; }

        public bool CancelAtPeriodEnd { get; set; } = false;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Amount { get; set; }

        [MaxLength(10)]
        public string Currency { get; set; } = "USD";

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedOn { get; set; }

        // Navigation property
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}
