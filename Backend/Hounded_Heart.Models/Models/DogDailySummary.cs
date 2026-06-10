using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("DogDailySummaries")]
    public class DogDailySummary
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid DogId { get; set; }
        
        [Required]
        public Guid UserId { get; set; } // For easy querying
        
        [Required]
        public DateTime Date { get; set; } // Just the date (no time)
        
        // Daily Averages
        public double AvgHeartRate { get; set; }
        public double AvgTemperature { get; set; }
        public double AvgActivityScore { get; set; }
        public double AvgRestScore { get; set; }
        public double AvgRespirationRate { get; set; }
        
        // Daily Ranges  
        public double MinHeartRate { get; set; }
        public double MaxHeartRate { get; set; }
        public double MinTemperature { get; set; }
        public double MaxTemperature { get; set; }
        
        // State Distribution (percentage of time in each state)
        public double RestPercentage { get; set; }
        public double ActivePercentage { get; set; }
        public double PlayPercentage { get; set; }
        public double SleepPercentage { get; set; }
        
        // Meta Data
        public int DataPointsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation
        [ForeignKey("DogId")]
        public DogProfile DogProfile { get; set; }
        
        [ForeignKey("UserId")]
        public HumanProfile HumanProfile { get; set; }
    }
}