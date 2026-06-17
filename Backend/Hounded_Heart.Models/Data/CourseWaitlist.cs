using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("CourseWaitlists")]
    public class CourseWaitlist
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid CourseId { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
}
