using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    public class ChakraLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        public Guid? PetId { get; set; } // Foreign Key to Dog/Pet

        public int RootScore { get; set; }
        public int SacralScore { get; set; }
        public int SolarPlexusScore { get; set; }
        public int HeartScore { get; set; }
        public int ThroatScore { get; set; }
        public int ThirdEyeScore { get; set; }
        public int CrownScore { get; set; }

        public float? HarmonyScore { get; set; } // Average of all 7 chakra scores
        public string? DominantBlockage { get; set; } // Name of the weakest chakra (e.g., "Root")

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LogDate { get; set; } // Localized date from client
    }
}
