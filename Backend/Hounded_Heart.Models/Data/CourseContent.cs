using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("CourseBookContents")]
    public class CourseBookContent
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? FileUrl { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }
    }

    [Table("CourseVideos")]
    public class CourseVideo
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? VideoUrl { get; set; }

        [MaxLength(1000)]
        public string? ThumbnailUrl { get; set; }

        public int? DurationSeconds { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }
    }

    [Table("CourseVisuals")]
    public class CourseVisual
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? ImageUrl { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }
    }

    [Table("CourseAudios")]
    public class CourseAudio
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? AudioUrl { get; set; }

        public int? DurationSeconds { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }
    }

    [Table("CourseResources")]
    public class CourseResource
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(1000)]
        public string? FileUrl { get; set; }

        [MaxLength(1000)]
        public string? ExternalUrl { get; set; }

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }
    }

    /// <summary>Quiz or MultipleChoiceTest — distinguished by AssessmentType.</summary>
    [Table("CourseAssessments")]
    public class CourseAssessment
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        [Required]
        [MaxLength(50)]
        public string AssessmentType { get; set; } = "Quiz"; // Quiz | MultipleChoiceTest

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public int PassingScorePercent { get; set; } = 70;

        public int DisplayOrder { get; set; }

        public bool IsPublished { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey(nameof(CourseId))]
        public Course? Course { get; set; }

        public ICollection<CourseAssessmentQuestion> Questions { get; set; } = new List<CourseAssessmentQuestion>();
    }

    [Table("CourseAssessmentQuestions")]
    public class CourseAssessmentQuestion
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid AssessmentId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string QuestionText { get; set; } = string.Empty;

        public int DisplayOrder { get; set; }

        [ForeignKey(nameof(AssessmentId))]
        public CourseAssessment? Assessment { get; set; }

        public ICollection<CourseAssessmentOption> Options { get; set; } = new List<CourseAssessmentOption>();
    }

    [Table("CourseAssessmentOptions")]
    public class CourseAssessmentOption
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid QuestionId { get; set; }

        [Required]
        [MaxLength(500)]
        public string OptionText { get; set; } = string.Empty;

        public bool IsCorrect { get; set; }

        [ForeignKey(nameof(QuestionId))]
        public CourseAssessmentQuestion? Question { get; set; }
    }
}
