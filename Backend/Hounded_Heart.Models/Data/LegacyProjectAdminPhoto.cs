using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class LegacyProjectAdminPhoto
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string SectionKey { get; set; } = string.Empty; // "forest", "senior", "research"

        [Required]
        public string PhotoUrl { get; set; } = string.Empty;

        public int DisplayOrder { get; set; } = 0;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
