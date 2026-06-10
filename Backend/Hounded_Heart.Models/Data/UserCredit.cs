using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("UserCredits")]
    public class UserCredit
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [MaxLength(50)]
        public string CreditType { get; set; } = "IntuitiveReading";

        public int CreditsTotal { get; set; } = 5;

        public int CreditsUsed { get; set; } = 0;

        public DateTime BillingCycleStart { get; set; }

        public DateTime BillingCycleEnd { get; set; }

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedOn { get; set; }

        // Navigation
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}
