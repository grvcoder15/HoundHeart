using System;

namespace Hounded_Heart.Models.DTOs
{
    /// <summary>Sent from frontend to start an analysis</summary>
    public class WellnessCheckCreateDto
    {
        /// <summary>EnvironmentFlow | DogCheckIn</summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>Wizard answers as key-value pairs</summary>
        public System.Collections.Generic.Dictionary<string, string> Answers { get; set; } = new();

        /// <summary>Optional Base64 or data-URL of the uploaded photo</summary>
        public string? PhotoBase64 { get; set; }

        /// <summary>Map of question ID to Base64 or data-URL of uploaded photos</summary>
        public System.Collections.Generic.Dictionary<string, string>? PhotosBase64 { get; set; }
    }

    public class WellnessCheckResponseDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? PhotoUrl { get; set; }
        public string? PhotoUrlsJson { get; set; }
        public string? AnswersJson { get; set; }
        public string? AiResponseJson { get; set; }
        public string? DetailedOverviewJson { get; set; }
        public Guid? EnvironmentCheckReferenceId { get; set; }
        public DateTime? EnvironmentReferenceCreatedAt { get; set; }
        public string? ProgressInsightJson { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsAsync { get; set; }   // true = queued for background processing
        public string? Message { get; set; } // friendly status message
    }
}
