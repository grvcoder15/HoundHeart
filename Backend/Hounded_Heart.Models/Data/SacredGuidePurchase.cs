using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("SacredGuidePurchase")]
    public class SacredGuidePurchase
    {
        [Key]
        public Guid PurchaseId { get; set; }

        public Guid SacredGuideId { get; set; }

        public Guid UserId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal AmountPaid { get; set; } = 12.95m;

        public DateTime PurchasedOn { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Completed";
    }
}
