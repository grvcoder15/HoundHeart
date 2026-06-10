using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("WellnessAlerts")]
    public class WellnessAlert
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid DogId { get; set; }

        [MaxLength(50)]
        public string AlertType { get; set; }

        [MaxLength(500)]
        public string Suggestion { get; set; }

        [MaxLength(50)]
        public string? DogStateAtAlert { get; set; }

        public double HRVAtAlert { get; set; }

        public int HRAtAlert { get; set; }

        public bool? IsDogNearby { get; set; }

        public double? DistanceMetres { get; set; }

        public bool IsActedOn { get; set; } = false;

        [MaxLength(50)]
        public string? Outcome { get; set; }

        [MaxLength(500)]
        public string? RecoveryMessage { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? ResolvedAt { get; set; }
    }
}