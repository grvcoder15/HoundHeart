using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CreateHumanProfileDto
    {
        [Required]
        public Guid UserId { get; set; }

        [MaxLength(100)]
        public string? Name { get; set; }

        public int? Age { get; set; }
    }

    public class CreateDogProfileDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(100)]
        public string? Breed { get; set; }

        public int? Age { get; set; }

        public decimal? Weight { get; set; }
    }
}
