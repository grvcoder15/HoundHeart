using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class UserBreathingPreference
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public Guid? PatternId { get; set; } // FK to BreathingPatterns
        public string PatternName { get; set; } // e.g., "4-7-8", "Box Breathing"

        public int TargetCycles { get; set; } = 10; // Default 10 cycles

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
