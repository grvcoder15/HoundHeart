using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("MessageLogs")]
    public class MessageLog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string MessageType { get; set; }

        [Required]
        [MaxLength(20)]
        public string Channel { get; set; }

        [Required]
        [MaxLength(100)]
        public string RecipientContact { get; set; }

        [MaxLength(200)]
        public string? Title { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Body { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending";

        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        public Guid? RelatedAlertId { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public DateTime? DeliveredAt { get; set; }
    }
}
