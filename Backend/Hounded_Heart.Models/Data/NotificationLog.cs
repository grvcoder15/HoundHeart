using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class NotificationLog
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
        public bool IsDelivered { get; set; } = false; // Will be true when APNs connected
        public string Type { get; set; } // "stress_alert", "recovery", "BondUpdate", "System"
    }
}
