using Hounded_Heart.Models.Data;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    /// <summary>
    /// Service for managing vitals data storage to InfluxDB/SQL Server
    /// For now, this is a basic implementation that can be extended later for InfluxDB
    /// </summary>
    public class VitalsService : IVitalsService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<VitalsService> _logger;

        public VitalsService(AppDbContext context, ILogger<VitalsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Saves human vital data to SQL Server (can be extended for InfluxDB later)
        /// </summary>
        /// <param name="vital">Human vital data</param>
        public async Task SaveHumanVitalAsync(HumanVital vital)
        {
            try
            {
                // Convert to HumanVitalsRecord for SQL Server storage
                var record = new HumanVitalsRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = vital.UserId,
                    HeartRate = (vital.HeartRate > 0) ? vital.HeartRate : null, // Preserve NULL/ignore 0
                    Steps = vital.Steps ?? 0,
                    Calories = vital.Calories ?? 0,
                    Latitude = vital.Latitude,
                    Longitude = vital.Longitude,
                    AmbientTemperature = vital.AmbientTemperature,
                    WeatherCondition = vital.WeatherCondition,
                    WeatherLocation = vital.WeatherLocation,
                    Distance = vital.Distance,
                    ActiveMinutes = vital.ActiveMinutes,
                    HRV = (vital.HRV > 0) ? vital.HRV : null, // Preserve NULL/ignore 0
                    SleepMinutes = vital.SleepMinutes,
                    DeepSleepMinutes = vital.DeepSleepMinutes,
                    RemSleepMinutes = vital.RemSleepMinutes,
                    LightSleepMinutes = vital.LightSleepMinutes,
                    AwakeSleepMinutes = vital.AwakeSleepMinutes,
                    TimestampUtc = vital.Timestamp,
                    Source = vital.Source ?? vital.DeviceType ?? "Fitbit"
                };

                _context.HumanVitals.Add(record);
                await _context.SaveChangesAsync();

                _logger.LogInformation("💓 Saved human vital data for user {UserId}: HR={HeartRate}, Steps={Steps}",
                    vital.UserId, vital.HeartRate, vital.Steps);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to save human vital data for user {UserId}", vital.UserId);
                throw;
            }
        }

        /// <summary>
        /// Saves HRV record to SQL Server (can be extended for InfluxDB later)
        /// </summary>
        /// <param name="record">HRV data record</param>
        public async Task SaveHrvAsync(HrvRecord record)
        {
            try
            {
                // Convert to HumanVitalsRecord with HRV data
                var hrv = new HumanVitalsRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = record.UserId,
                    HRV = record.DailyRmssd,
                    Latitude = record.Latitude,
                    Longitude = record.Longitude,
                    AmbientTemperature = record.AmbientTemperature,
                    WeatherCondition = record.WeatherCondition,
                    WeatherLocation = record.WeatherLocation,
                    TimestampUtc = record.Timestamp,
                    Source = record.DeviceType ?? "Fitbit"
                };

                _context.HumanVitals.Add(hrv);
                await _context.SaveChangesAsync();

                _logger.LogInformation("📊 Saved HRV data for user {UserId}: RMSSD={DailyRmssd}",
                    record.UserId, record.DailyRmssd);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to save HRV data for user {UserId}", record.UserId);
                throw;
            }
        }

        /// <summary>
        /// Saves sleep record to SQL Server (can be extended for InfluxDB later)
        /// </summary>
        /// <param name="record">Sleep data record</param>
        public async Task SaveSleepAsync(SleepRecord record)
        {
            try
            {
                var sleep = new HumanVitalsRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = record.UserId,
                    SleepMinutes = record.TotalMinutesAsleep,
                    DeepSleepMinutes = record.DeepMinutes,
                    RemSleepMinutes = record.RemMinutes,
                    LightSleepMinutes = record.LightMinutes,
                    AwakeSleepMinutes = record.MinutesAwake,
                    Latitude = record.Latitude,
                    Longitude = record.Longitude,
                    AmbientTemperature = record.AmbientTemperature,
                    WeatherCondition = record.WeatherCondition,
                    WeatherLocation = record.WeatherLocation,
                    TimestampUtc = record.StartTime ?? record.Date,
                    Source = record.DeviceType ?? "Fitbit"
                };

                _context.HumanVitals.Add(sleep);
                await _context.SaveChangesAsync();

                _logger.LogInformation("😴 Saved sleep data for user {UserId}: Duration={TotalMinutes}min",
                    record.UserId, record.TotalMinutesAsleep);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to save sleep data for user {UserId}", record.UserId);
                throw;
            }
        }

    }
}