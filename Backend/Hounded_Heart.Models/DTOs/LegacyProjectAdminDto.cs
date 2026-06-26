namespace Hounded_Heart.Models.DTOs
{
    public class LegacyProjectContentDto
    {
        public string SectionKey { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImpactStatsJson { get; set; } = string.Empty;
    }

    public class LegacyProjectUpdateDto
    {
        public string SectionKey { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }

    public class LegacyProjectAdminPhotoDto
    {
        public string SectionKey { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
