using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("SubscriptionLogs")]
    public class SubscriptionLog
    {
        [Key]
        public Guid LogId { get; set; }

        public Guid? SubscriptionId { get; set; }

        public Guid? UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string EventType { get; set; } = string.Empty;

        public string? EventData { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SubscriptionId")]
        public Subscription? Subscription { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
