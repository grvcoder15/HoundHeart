using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("SacredGuides")]
    public class SacredGuide
    {
        [Key]
        public Guid SacredGuideId { get; set; }

        [MaxLength(300)]
        public string? Title { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? PdfUrl { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; } = 12.95m;

        [MaxLength(50)]
        public string Status { get; set; } = "Draft";

        public int? TotalPages { get; set; }

        public string? Chapters { get; set; }

        [MaxLength(100)]
        public string? Distribution { get; set; } = "Exclusive";

        public int PreviewPercentage { get; set; } = 10;
        public bool AllowFreeUserDownload { get; set; } = false;
        public bool RequiresPremium { get; set; } = true;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedOn { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
