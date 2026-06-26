using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class LegacyProjectUpdate
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string SectionKey { get; set; } = string.Empty; // "forest", "senior", "research"

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}
