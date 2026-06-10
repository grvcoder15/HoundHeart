using System;

namespace Hounded_Heart.Models.Models
{
    public class HeartRateMetric
    {
        public int Bpm { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class HRVMetric
    {
        public double Ms { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class ActivityMetric
    {
        public string Intensity { get; set; } // "Low", "Medium", "High"
        public int Steps { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class DogVitals
    {
        public Guid DogId { get; set; }
        public DateTime Timestamp { get; set; }
        public HeartRateMetric HeartRate { get; set; } = new();
        public HRVMetric HRV { get; set; } = new();
        public ActivityMetric Activity { get; set; } = new();
        public double Temperature { get; set; }
        public string Status { get; set; } // "Resting", "Active", "Stressed"
    }

    public class HumanVitals
    {
        public Guid UserId { get; set; }
        public DateTime Timestamp { get; set; }
        public HeartRateMetric HeartRate { get; set; } = new();
        public HRVMetric HRV { get; set; } = new();
        public ActivityMetric Activity { get; set; } = new();
        public double SleepHours { get; set; }
        public double? AmbientTemperature { get; set; }
        public string? WeatherCondition { get; set; }
        public string? WeatherLocation { get; set; }
    }
}
