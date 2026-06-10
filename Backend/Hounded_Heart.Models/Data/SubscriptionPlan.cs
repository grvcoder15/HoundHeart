using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("SubscriptionPlans")]
    public class SubscriptionPlan
    {
        [Key]
        public Guid PlanId { get; set; }

        [Required]
        [MaxLength(100)]
        public string PlanName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [MaxLength(10)]
        public string Currency { get; set; } = "USD";

        [Required]
        [MaxLength(50)]
        public string BillingPeriod { get; set; } = string.Empty; // 'monthly', 'yearly'

        [Required]
        [MaxLength(20)]
        public string TierLevel { get; set; } = "plus"; // free, plus, premium

        [MaxLength(255)]
        public string? StripePriceId { get; set; }

        public string? Features { get; set; } // JSON array

        [MaxLength(50)]
        public string? Badge { get; set; }

        [MaxLength(100)]
        public string? SavingsText { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedOn { get; set; }
    }
}
