using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class ScoringRule
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string RuleName { get; set; } = string.Empty;
        
        public decimal Points { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
