using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class BreathingPattern
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(250)]
        public string Description { get; set; }

        public int InhaleDuration { get; set; } // In seconds
        public int ExhaleDuration { get; set; } // In seconds
        public int HoldDuration { get; set; } = 0; // In seconds
        public int HoldAfterExhaleDuration { get; set; } = 0; // In seconds

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }
    }
}
