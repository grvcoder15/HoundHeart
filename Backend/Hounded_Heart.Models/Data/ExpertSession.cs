using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("ExpertSessionRequests")]
    public class ExpertSessionRequest
    {
        [Key]
        [Column("RequestId")]
        public Guid RequestId { get; set; } = Guid.NewGuid();

        [Required]
        [Column("UserId")]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [Column("UserName")]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [Column("UserEmail")]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        [Column("ProblemDescription")]
        public string ProblemDescription { get; set; } = string.Empty;

        [Required]
        [Column("PreferredTiming")]
        public string PreferredTiming { get; set; } = string.Empty;

        [Column("Status")]
        public string Status { get; set; } = "Pending";

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("CancellationReason")]
        public string? CancellationReason { get; set; }

        // Navigation properties
        public ICollection<ExpertSessionSlot> Slots { get; set; } = new List<ExpertSessionSlot>();
        public ExpertSessionConfirmed? ConfirmedSession { get; set; }
    }

    [Table("ExpertSessionSlots")]
    public class ExpertSessionSlot
    {
        [Key]
        [Column("SlotId")]
        public Guid SlotId { get; set; } = Guid.NewGuid();

        [Column("RequestId")]
        public Guid RequestId { get; set; }

        [Column("ProposedDateTime")]
        public DateTime ProposedDateTime { get; set; }

        [Column("IsSelected")]
        public bool IsSelected { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(RequestId))]
        public ExpertSessionRequest Request { get; set; } = null!;
    }

    [Table("ExpertSessionConfirmed")]
    public class ExpertSessionConfirmed
    {
        [Key]
        [Column("SessionId")]
        public Guid SessionId { get; set; } = Guid.NewGuid();

        [Column("RequestId")]
        public Guid RequestId { get; set; }

        [Required]
        [Column("UserId")]
        public string UserId { get; set; } = string.Empty;

        [Column("SelectedSlotId")]
        public Guid SelectedSlotId { get; set; }

        [Column("ScheduledDateTime")]
        public DateTime ScheduledDateTime { get; set; }

        [Required, MaxLength(500)]
        [Column("MeetingLink")]
        public string MeetingLink { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("RoomName")]
        public string RoomName { get; set; } = string.Empty;

        [MaxLength(255)]
        [Column("StripePaymentIntentId")]
        public string? StripePaymentIntentId { get; set; }

        [Column("AmountPaid", TypeName = "decimal(10,2)")]
        public decimal AmountPaid { get; set; } = 30.00m;

        [Column("Status")]
        public string Status { get; set; } = "Scheduled";

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("AdminReminderSent")]
        public bool AdminReminderSent { get; set; } = false;

        [Column("UserReminderSent")]
        public bool UserReminderSent { get; set; } = false;

        [MaxLength(255)]
        [Column("EndedBy")]
        public string? EndedBy { get; set; }

        [MaxLength(255)]
        [Column("EndedByUserId")]
        public string? EndedByUserId { get; set; }

        [Column("EndedAt")]
        public DateTime? EndedAt { get; set; }

        [ForeignKey(nameof(RequestId))]
        public ExpertSessionRequest Request { get; set; } = null!;

        [ForeignKey(nameof(SelectedSlotId))]
        public ExpertSessionSlot SelectedSlot { get; set; } = null!;
    }

    [Table("ExpertSessionNotifications")]
    public class ExpertSessionNotification
    {
        [Key]
        [Column("NotificationId")]
        public Guid NotificationId { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Null implies Admin notification.
        /// </summary>
        [Column("UserId")]
        public string? UserId { get; set; }

        [Column("IsAdminNotification")]
        public bool IsAdminNotification { get; set; } = false;

        [Required]
        [Column("Message")]
        public string Message { get; set; } = string.Empty;

        [Column("RequestId")]
        public Guid RequestId { get; set; }

        [Column("IsRead")]
        public bool IsRead { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(RequestId))]
        public ExpertSessionRequest Request { get; set; } = null!;
    }
}
