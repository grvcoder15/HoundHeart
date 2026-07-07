using System;

namespace Hounded_Heart.Models.DTOs
{
    public class DetailedAnalysisReportDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? DogId { get; set; }
        public Guid? LatestDogCheckinId { get; set; }
        public Guid? LatestEnvironmentCheckinId { get; set; }
        public string? BaselineSnapshotJson { get; set; }
        public string? LatestVitalsSnapshotJson { get; set; }
        public string? PhotoUrlsJson { get; set; }
        public string? ReportJson { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
