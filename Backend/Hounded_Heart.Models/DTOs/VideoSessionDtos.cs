using System;

namespace Hounded_Heart.Models.DTOs
{
    // ─── Request DTOs ─────────────────────────────────────────────────────────

    /// <summary>
    /// Request body for creating a Stripe PaymentIntent for a video session.
    /// </summary>
    public class CreateVideoPaymentIntentRequest
    {
        /// <summary>
        /// Optional: target expert ID. Nullable until expert management is built.
        /// </summary>
        public string? ExpertId { get; set; }
    }

    /// <summary>
    /// Request body for creating/starting a video session after payment.
    /// </summary>
    public class CreateVideoSessionRequest
    {
        /// <summary>
        /// Stripe PaymentIntent ID — used to verify the payment succeeded.
        /// </summary>
        public string PaymentIntentId { get; set; } = string.Empty;

        /// <summary>
        /// Optional: target expert ID.
        /// </summary>
        public string? ExpertId { get; set; }
    }

    /// <summary>
    /// Request body for ending a session.
    /// </summary>
    public class EndVideoSessionRequest
    {
        public Guid SessionId { get; set; }
    }

    // ─── Response DTOs ────────────────────────────────────────────────────────

    /// <summary>
    /// Returned after creating a video session — contains room access info.
    /// </summary>
    public class VideoSessionResponse
    {
        public Guid SessionId { get; set; }
        public string RoomUrl { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public decimal AmountPaid { get; set; }

        /// <summary>
        /// Duration of the session in minutes.
        /// </summary>
        public int DurationMinutes { get; set; } = 15;
    }

    /// <summary>
    /// Returned by the status endpoint.
    /// </summary>
    public class SessionStatusResponse
    {
        public Guid SessionId { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? EndTime { get; set; }

        /// <summary>
        /// Remaining seconds in the session. 0 if expired.
        /// </summary>
        public int RemainingSeconds { get; set; }
    }

    /// <summary>
    /// Returned when creating a Stripe PaymentIntent.
    /// </summary>
    public class VideoPaymentIntentResponse
    {
        public string ClientSecret { get; set; } = string.Empty;
        public string PaymentIntentId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "usd";
    }
}
