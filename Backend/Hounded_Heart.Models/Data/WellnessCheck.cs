using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("WellnessChecks")]
    public class WellnessCheck
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        /// <summary>Environment | DogCheckIn | Progress</summary>
        [Required, MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        /// <summary>Primary uploaded photo URL (Azure Blob or local)</summary>
        [MaxLength(1000)]
        public string? PhotoUrl { get; set; }

        /// <summary>JSON array of uploaded photo URLs for multiple images</summary>
        public string? PhotoUrlsJson { get; set; }

        /// <summary>Raw JSON string of wizard answers</summary>
        public string? AnswersJson { get; set; }

        /// <summary>Raw JSON string returned from Gemini for the main insight</summary>
        public string? AiResponseJson { get; set; }

        /// <summary>Raw JSON string returned from Gemini for the combined dog+environment overview</summary>
        public string? DetailedOverviewJson { get; set; }

        /// <summary>Reference to the Environment &amp; Flow check-in used for the detailed overview</summary>
        public Guid? EnvironmentCheckReferenceId { get; set; }

        /// <summary>Raw JSON string returned from Gemini for the progress comparison</summary>
        public string? ProgressInsightJson { get; set; }

        /// <summary>Snapshot of FitBark activity data injected into the prompt</summary>
        public string? FitBarkDataSnapshotJson { get; set; }

        /// <summary>Pending | Complete | Failed</summary>
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
