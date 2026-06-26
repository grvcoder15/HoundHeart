using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CreateSeniorDogSubmissionDto
    {
        [Required]
        public string DogName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Story { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;
    }

    public class UpdateSeniorDogStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
