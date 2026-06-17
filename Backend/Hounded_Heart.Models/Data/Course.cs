using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("Courses")]
    public class Course
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        public bool IsFreeWithPlus { get; set; }

        public int DisplayOrder { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "ComingSoon";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
