using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CreateResearchSubmissionDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;
    }

    public class UpdateResearchStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
