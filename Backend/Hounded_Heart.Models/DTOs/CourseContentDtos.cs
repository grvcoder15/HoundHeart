using System;
using System.Collections.Generic;

namespace Hounded_Heart.Models.DTOs
{
    public class CourseContentSummaryDto
    {
        public int BookCount { get; set; }
        public int VideoCount { get; set; }
        public int VisualCount { get; set; }
        public int QuizCount { get; set; }
        public int TestCount { get; set; }
        public int AudioCount { get; set; }
        public int ResourceCount { get; set; }
    }

    public class AdminCourseListItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsFreeWithPlus { get; set; }
        public int DisplayOrder { get; set; }
        public string Status { get; set; } = string.Empty;
        public CourseContentSummaryDto ContentSummary { get; set; } = new();
    }

    public class CourseContentItemDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? FileUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? AudioUrl { get; set; }
        public string? ExternalUrl { get; set; }
        public int? DurationSeconds { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CourseContentUpsertDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? FileUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? AudioUrl { get; set; }
        public string? ExternalUrl { get; set; }
        public int? DurationSeconds { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsPublished { get; set; }
    }

    public class CourseAssessmentDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public string AssessmentType { get; set; } = "Quiz";
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int PassingScorePercent { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsPublished { get; set; }
        public List<CourseAssessmentQuestionDto> Questions { get; set; } = new();
    }

    public class CourseAssessmentQuestionDto
    {
        public Guid? Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public List<CourseAssessmentOptionDto> Options { get; set; } = new();
    }

    public class CourseAssessmentOptionDto
    {
        public Guid? Id { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }

    public class CourseAssessmentUpsertDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int PassingScorePercent { get; set; } = 70;
        public int DisplayOrder { get; set; }
        public bool IsPublished { get; set; }
        public List<CourseAssessmentQuestionDto> Questions { get; set; } = new();
    }
}
