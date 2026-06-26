using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    public class SeniorDogSubmission
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string DogName { get; set; } = string.Empty;

        [Required]
        public string Story { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        public string Status { get; set; } = "PendingReview"; // PendingReview, Approved, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
