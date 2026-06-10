using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("HumanDailySummaries")]
    public class HumanDailySummary
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        public DateTime Date { get; set; } // Just the date (no time)
        
        // Daily Averages
        public double? AvgHeartRate { get; set; }
        public double? AvgHRV { get; set; }
        public int? TotalSteps { get; set; }
        public double? AvgCalories { get; set; }
        public double? AvgDistance { get; set; }
        public double? AvgActiveMinutes { get; set; }
        public double? AvgSleepMinutes { get; set; }
        [NotMapped]
        public double? AvgSleepScore { get; set; } // Kept for backward compatibility
        public double? AvgStressScore { get; set; }
        public double? AvgAmbientTemperature { get; set; }
        
        // Daily Ranges
        [NotMapped]
        public double? MinHeartRate { get; set; }
        [NotMapped]
        public double? MaxHeartRate { get; set; }
        [NotMapped]
        public double? MinHRV { get; set; }
        [NotMapped]
        public double? MaxHRV { get; set; }
        
        // Sync Score System
        public int? SyncScore { get; set; } // 0-100 sync score
        public string? SyncTrend { get; set; } // "improving", "declining", "stable"
        [NotMapped]
        public int? Score { get; set; } // Legacy property for backward compatibility
        [NotMapped]
        public string? Trend { get; set; } // Legacy property for backward compatibility
        [NotMapped]
        public string? ScoreTitle { get; set; } // e.g., "Critical Disconnect", "Full Alignment"
        [NotMapped]
        public string? ScoreDescription { get; set; } // Detailed description of the state
        [NotMapped]
        public string? ScoreAction { get; set; } // Recommended action
        [NotMapped]
        public string? Disclaimer { get; set; } // Health disclaimer
        
        // Meta Data
        public int? DataPointsCount { get; set; } // How many raw records were aggregated
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation
        [ForeignKey("UserId")]
        public HumanProfile? HumanProfile { get; set; }
    }
}