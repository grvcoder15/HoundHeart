using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("DetailedAnalysisReports")]
    public class DetailedAnalysisReport
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        public Guid? DogId { get; set; }
        public Guid? LatestDogCheckinId { get; set; }
        public Guid? LatestEnvironmentCheckinId { get; set; }

        public string? BaselineSnapshotJson { get; set; }
        public string? LatestVitalsSnapshotJson { get; set; }
        public string? PhotoUrlsJson { get; set; }
        public string? ReportJson { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
