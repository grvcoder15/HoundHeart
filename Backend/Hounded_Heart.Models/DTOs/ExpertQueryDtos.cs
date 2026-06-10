using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class ExpertQueryCreateDto
    {
        [MaxLength(100)]
        public string? CompanionName { get; set; }

        [Required]
        [MaxLength(100)]
        public string Category { get; set; }

        [Required]
        public string Priority { get; set; } // "Normal" or "High Priority"

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; }

        [Required(ErrorMessage = "Question is required.")]
        [MinLength(50, ErrorMessage = "The Your Question field MUST have a minimum of 50 characters.")]
        public string QuestionText { get; set; }
    }

    public class ExpertQueryResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? CompanionName { get; set; }
        public string Category { get; set; }
        public string Priority { get; set; }
        public string Subject { get; set; }
        public string QuestionText { get; set; }
        public string Status { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? AdminResponse { get; set; }
        public DateTime? RespondedOn { get; set; }
    }

    // Used by Admin section
    public class ExpertQueryAdminUpdateDto
    {
        [Required]
        public string AdminResponse { get; set; }
    }

    public class ExpertQueryCategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
    }
}
