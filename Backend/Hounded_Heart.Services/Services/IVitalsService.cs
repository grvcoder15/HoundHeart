using Hounded_Heart.Models.DTOs;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class HumanVital
    {
        public Guid UserId { get; set; }
        public DateTime Timestamp { get; set; }
        public int? HeartRate { get; set; }
        public int? Steps { get; set; }
        public double? Calories { get; set; }
        public double? Distance { get; set; }
        public int? ActiveMinutes { get; set; }
        public double? HRV { get; set; }
        public int? SleepMinutes { get; set; }
        public int? DeepSleepMinutes { get; set; }
        public int? RemSleepMinutes { get; set; }
        public int? LightSleepMinutes { get; set; }
        public int? AwakeSleepMinutes { get; set; }
        public string? Source { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? AmbientTemperature { get; set; }
        public string? WeatherCondition { get; set; }
        public string? WeatherLocation { get; set; }
        public string DeviceType { get; set; } = "Fitbit";
    }

    public class HrvRecord
    {
        public Guid UserId { get; set; }
        public DateTime Timestamp { get; set; }
        public double DailyRmssd { get; set; }
        public double? DeepRmssd { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? AmbientTemperature { get; set; }
        public string? WeatherCondition { get; set; }
        public string? WeatherLocation { get; set; }
        public string DeviceType { get; set; } = "Fitbit";
    }

    public class SleepRecord
    {
        public Guid UserId { get; set; }
        public DateTime Date { get; set; }
        public int TotalMinutesAsleep { get; set; }
        public int DeepMinutes { get; set; }
        public int RemMinutes { get; set; }
        public int LightMinutes { get; set; }
        public int MinutesAwake { get; set; }
        public int MinutesToFallAsleep { get; set; }
        public int MinutesAfterWakeup { get; set; }
        public double Efficiency { get; set; }
        public string DeviceType { get; set; } = "Fitbit";
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? AmbientTemperature { get; set; }
        public string? WeatherCondition { get; set; }
        public string? WeatherLocation { get; set; }
    }

    public interface IVitalsService
    {
        /// <summary>
        /// Saves human vital data to InfluxDB
        /// </summary>
        /// <param name="vital">Human vital data</param>
        Task SaveHumanVitalAsync(HumanVital vital);

        /// <summary>
        /// Saves HRV record to InfluxDB
        /// </summary>
        /// <param name="record">HRV data record</param>
        Task SaveHrvAsync(HrvRecord record);

        /// <summary>
        /// Saves sleep record to InfluxDB
        /// </summary>
        /// <param name="record">Sleep data record</param>
        Task SaveSleepAsync(SleepRecord record);
    }
}