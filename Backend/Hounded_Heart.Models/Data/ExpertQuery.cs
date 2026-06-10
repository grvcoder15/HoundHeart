using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    public class ExpertQuery
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; }

        [MaxLength(100)]
        public string? CompanionName { get; set; }

        [Required, MaxLength(100)]
        public string Category { get; set; }

        [Required, MaxLength(20)]
        public string Priority { get; set; } // Normal, High Priority

        [Required, MaxLength(200)]
        public string Subject { get; set; }

        [Required]
        public string QuestionText { get; set; }

        [Required, MaxLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Replied

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // Admin Fields
        public string? AdminResponse { get; set; }
        public DateTime? RespondedOn { get; set; }
    }
}
