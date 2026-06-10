using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("FitBarkDogs")]
    public class FitBarkDog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [Required]
        [MaxLength(100)]
        public string DogSlug { get; set; }

        [MaxLength(100)]
        public string? Breed { get; set; }

        public string? BirthDate { get; set; }

        public double? Weight { get; set; }

        [MaxLength(20)]
        public string? Gender { get; set; }

        public int? ActivityGoal { get; set; }

        [MaxLength(50)]
        public string? Country { get; set; }

        [MaxLength(20)]
        public string? Zip { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    [Table("FitBarkActivityLogs")]
    public class FitBarkActivityLog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string DogSlug { get; set; }

        [Required]
        public DateTime ActivityDate { get; set; }

        public int ActivityValue { get; set; }
        public int MinPlay { get; set; }
        public int MinActive { get; set; }
        public int MinRest { get; set; }
        public int NapTime { get; set; }

        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }
}
