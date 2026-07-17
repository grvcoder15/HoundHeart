using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    /// <summary>
    /// Represents a paid 15-minute video consultation session.
    /// </summary>
    [Table("VideoSessions")]
    public class VideoSession
    {
        [Key]
        [Column("SessionId")]
        public Guid SessionId { get; set; } = Guid.NewGuid();

        [Required]
        [Column("UserId")]
        public string UserId { get; set; } = string.Empty;

        [Column("ExpertId")]
        public string? ExpertId { get; set; }

        [Required, MaxLength(500)]
        [Column("RoomUrl")]
        public string RoomUrl { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("RoomName")]
        public string RoomName { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("StripePaymentIntentId")]
        public string? StripePaymentIntentId { get; set; }

        [Column("StartTime")]
        public DateTime StartTime { get; set; } = DateTime.UtcNow;

        [Column("EndTime")]
        public DateTime? EndTime { get; set; }

        [Column("ExpiresAt")]
        public DateTime ExpiresAt { get; set; }

        [Column("DurationMinutes")]
        public int DurationMinutes { get; set; } = 15;

        [Column("AmountPaid", TypeName = "decimal(10,2)")]
        public decimal AmountPaid { get; set; } = 30.00m;

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Note: Removed navigation property to User because UserId is now a string 
        // in this specific table definition.
    }
}
