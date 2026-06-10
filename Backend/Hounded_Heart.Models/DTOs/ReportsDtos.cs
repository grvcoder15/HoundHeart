using System;
using System.Collections.Generic;

namespace Hounded_Heart.Models.Dtos
{
    public class ReportStatsDto
    {
        public int Pending { get; set; }
        public int HighPriority { get; set; }
        public int Resolved { get; set; }
        public int Dismissed { get; set; }
    }

    public class ReportListItemDto
    {
        public Guid ReportId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string ReportedUser { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string ReportedBy { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Guid? PostId { get; set; }
        public Guid? CommentId { get; set; }
    }

    public class ReportDetailDto : ReportListItemDto
    {
        public string Description { get; set; } = string.Empty;
        public string ContentSnippet { get; set; } = string.Empty;
    }

    public class UpdateReportStatusRequest
    {
        public string Status { get; set; } = string.Empty; // "resolved" or "dismissed"
    }
}
