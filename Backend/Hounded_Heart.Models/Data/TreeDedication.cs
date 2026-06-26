using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    public class TreeDedication
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DogName { get; set; } = string.Empty;

        [Required]
        [MaxLength(300)]
        public string TributeMessage { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string DedicationType { get; set; } = "Honor"; // "Honor" or "Memory"

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "PendingReview"; // "PendingReview", "Live", "Rejected"

        [Required]
        [MaxLength(50)]
        public string GrowthStage { get; set; } = "🌱 Sapling"; // "🌱 Sapling", "🌿 Young Tree", "🌳 Established"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
