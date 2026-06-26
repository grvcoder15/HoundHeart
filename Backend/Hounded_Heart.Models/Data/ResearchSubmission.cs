using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    public class ResearchSubmission
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        public string Status { get; set; } = "PendingReview"; // PendingReview, Approved, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
