using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Dtos
{
    public class HealingCircleRegistration
    {
        [Key]
        public Guid RegistrationId { get; set; }

        [Required]
        public Guid CircleId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public DateTime RegisteredOn { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CircleId))]
        public HealingCircle Circle { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; }
    }
}
