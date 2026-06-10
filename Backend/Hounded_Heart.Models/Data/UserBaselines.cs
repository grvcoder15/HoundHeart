using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("UserBaselines")]
    public class UserBaselines
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        // Core vitals — calculated from HumanVitals
        public double? AvgHeartRate { get; set; }
        public double? AvgHRV { get; set; }
        public double? HRVStdDev { get; set; }
        public double? AvgSleepScore { get; set; } // Now stores Avg Sleep Minutes
        public double? AvgSteps { get; set; }
        public double? AvgAmbientTemperature { get; set; }

        // New Fitbit breakdown fields (matching the query in logs)
        public double? AvgDeepSleepMinutes { get; set; }
        public double? AvgRemSleepMinutes { get; set; }
        public double? AvgLightSleepMinutes { get; set; }
        public double? AvgAwakeSleepMinutes { get; set; }
        public double? AvgStressScore { get; set; }
        public double? AvgCalories { get; set; }
        public double? AvgDistance { get; set; }

        public DateTime? LastUpdatedUtc { get; set; }
        public DateTime? BaselineCreatedAt { get; set; }
        public DateTime? BaselineUpdatedAt { get; set; }

        public int? DaysOfDataCollected { get; set; }
        public bool? HumanBaselineEstablished { get; set; }
        public bool? IsComplete { get; set; }
        public bool? IsTestMode { get; set; }
    }
}