using System;
using System.Collections.Generic;

namespace Hounded_Heart.Models.DTOs
{
    // Request DTOs
    public class CreateExpertSessionRequest
    {
        public string ProblemDescription { get; set; } = string.Empty;
        public string PreferredTiming { get; set; } = string.Empty;
    }

    public class SendSlotsRequest
    {
        public Guid RequestId { get; set; }
        public List<DateTime> ProposedSlots { get; set; } = new List<DateTime>();
    }

    public class ConfirmSlotRequest
    {
        public Guid RequestId { get; set; }
        public Guid SlotId { get; set; }
    }

    public class PaymentSuccessRequest
    {
        public Guid RequestId { get; set; }
        public string PaymentIntentId { get; set; } = string.Empty;
    }

    public class CancelSessionRequest
    {
        public Guid RequestId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    // Response DTOs
    public class ExpertSessionRequestDto
    {
        public Guid RequestId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string ProblemDescription { get; set; } = string.Empty;
        public string PreferredTiming { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<ExpertSessionSlotDto> Slots { get; set; } = new List<ExpertSessionSlotDto>();
        // Populated when status is Scheduled
        public DateTime? ScheduledDateTime { get; set; }
        public string? MeetingLink { get; set; }
        
        // Populated when status is Cancelled
        public string? CancellationReason { get; set; }
    }

    public class ExpertSessionSlotDto
    {
        public Guid SlotId { get; set; }
        public DateTime ProposedDateTime { get; set; }
        public bool IsSelected { get; set; }
    }

    public class ExpertSessionConfirmedDto
    {
        public Guid SessionId { get; set; }
        public Guid RequestId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public DateTime ScheduledDateTime { get; set; }
        public string MeetingLink { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ExpertSessionNotificationDto
    {
        public Guid NotificationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid RequestId { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
