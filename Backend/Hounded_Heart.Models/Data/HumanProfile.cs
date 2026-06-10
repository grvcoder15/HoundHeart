using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("HumanProfiles")]
    public class HumanProfile
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        public int? Age { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Baseline tracking fields
        public DateTime? BaselineStartTime { get; set; }
        public bool HumanBaselineEstablished { get; set; } = false;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }
    }
}
