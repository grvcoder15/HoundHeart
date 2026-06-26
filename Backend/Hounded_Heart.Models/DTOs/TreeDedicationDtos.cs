using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CreateTreeDedicationDto
    {
        [Required]
        public string DogName { get; set; } = string.Empty;

        [Required]
        public string TributeMessage { get; set; } = string.Empty;

        [Required]
        public string Base64Image { get; set; } = string.Empty;

        [Required]
        public string DedicationType { get; set; } = "Honor";
    }

    public class UpdateTreeDedicationStatusDto
    {
        [Required]
        public string Status { get; set; } = "Live"; // "Live" or "Rejected"
    }

    public class UpdateTreeDedicationStageDto
    {
        [Required]
        public string GrowthStage { get; set; } = "🌱 Sapling";
    }
}
