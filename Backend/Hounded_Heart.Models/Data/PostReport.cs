using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Dtos
{
    [Table("PostReports")]
    public class PostReport
    {
        [Key]
        public Guid ReportId { get; set; }

        public Guid? PostId { get; set; }

        public Guid? CommentId { get; set; }

        [Required]
        public Guid ReporterUserId { get; set; }

        public Guid? ReportedUserId { get; set; }

        [Required, MaxLength(50)]
        public string ReportType { get; set; } = "Content"; // Content, User, Behavior

        [Required, MaxLength(20)]
        public string Priority { get; set; } = "Medium"; // High, Medium, Low

        [Required, MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Resolved, Dismissed

        [Required, MaxLength(255)]
        public string Reason { get; set; }

        public string? Description { get; set; }

        public DateTime ReportedOn { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("PostId")]
        public CommunityPost? Post { get; set; }

        [ForeignKey("CommentId")]
        public CommunityComment? Comment { get; set; }

        [ForeignKey("ReporterUserId")]
        public User ReporterUser { get; set; }

        [ForeignKey("ReportedUserId")]
        public User? ReportedUser { get; set; }
    }
}
