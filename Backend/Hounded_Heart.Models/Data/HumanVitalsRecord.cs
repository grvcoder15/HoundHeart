using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("HumanVitals")]
    public class HumanVitalsRecord
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public int? HeartRate { get; set; }

        public double? HRV { get; set; }

        public int? Steps { get; set; }
        public double Calories { get; set; }
        public double? Distance { get; set; }
        public int? ActiveMinutes { get; set; }

        // SleepScore removed as per FIX 5
        public int? SleepMinutes { get; set; }
        public int? DeepSleepMinutes { get; set; }
        public int? RemSleepMinutes { get; set; }
        public int? LightSleepMinutes { get; set; }
        public int? AwakeSleepMinutes { get; set; }

        public int? StressScore { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        [MaxLength(50)]
        public string? Source { get; set; }

        public DateTime TimestampUtc { get; set; }

        public double? AmbientTemperature { get; set; }

        [MaxLength(100)]
        public string? WeatherCondition { get; set; }

        [MaxLength(200)]
        public string? WeatherLocation { get; set; }
    }
}