using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    public class RitualLog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid RitualId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

        public bool BonusAwarded { get; set; } = false;

        [ForeignKey("RitualId")]
        public virtual Ritual Ritual { get; set; }
    }
}
