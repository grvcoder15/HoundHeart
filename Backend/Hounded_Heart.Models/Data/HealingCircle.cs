using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class HealingCircle
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; }

        [Required, MaxLength(100)]
        public string Time { get; set; }

        [MaxLength(1000)]
        public string Description { get; set; }

        public int ParticipantsCount { get; set; } = 0;
        public int MaxParticipants { get; set; } = 100;

        public bool IsPremium { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}
