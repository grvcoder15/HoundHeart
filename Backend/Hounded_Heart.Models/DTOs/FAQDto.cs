using System;

namespace Hounded_Heart.Models.Dtos
{
    public class FAQDto
    {
        public Guid FAQId { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateFAQDto
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = "published";
        public int DisplayOrder { get; set; } = 0;
    }

    public class UpdateFAQDto
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }

    public class FAQStatsDto
    {
        public int TotalFAQs { get; set; }
        public int PublishedFAQs { get; set; }
        public int DraftFAQs { get; set; }
        public int CategoriesCount { get; set; }
    }
}
