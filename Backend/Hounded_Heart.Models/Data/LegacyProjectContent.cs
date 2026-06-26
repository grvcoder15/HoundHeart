using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class LegacyProjectContent
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string SectionKey { get; set; } = string.Empty; // "forest", "senior", "research"

        public string Description { get; set; } = string.Empty;

        // JSON string to hold Senior Dog impact stats, e.g., {"beds": 150, "dogs": 300, "medical": 80, "adopted": 120}
        public string ImpactStatsJson { get; set; } = string.Empty;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
