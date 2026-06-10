using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class Ritual
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string Description { get; set; }

        [MaxLength(50)]
        public string Duration { get; set; } // e.g., "5 min"

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } // Morning, Afternoon, Evening

        [MaxLength(50)]
        public string IconType { get; set; }
    }
}
