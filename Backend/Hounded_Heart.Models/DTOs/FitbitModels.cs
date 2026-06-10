using System.Text.Json.Serialization;

namespace Hounded_Heart.Models.DTOs
{
    // ======================
    // Authentication Models
    // ======================

    /// <summary>
    /// Response model for Fitbit OAuth 2.0 token endpoint
    /// Maps to: POST https://api.fitbit.com/oauth2/token
    /// </summary>
    public class FitbitTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("user_id")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("token_type")]
        public string TokenType { get; set; } = "Bearer";

        [JsonPropertyName("scope")]
        public string Scope { get; set; } = string.Empty;

        // Additional property to track when the token was issued
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        // Helper property to check if token is expired
        public bool IsExpired => DateTime.UtcNow >= IssuedAt.AddSeconds(ExpiresIn - 300); // 5 minute buffer
    }

    // ======================
    // Heart Rate Models
    // ======================

    /// <summary>
    /// Response model for Fitbit heart rate data with intraday details
    /// Maps to: GET https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d.json
    /// </summary>
    public class FitbitHeartRateResponse
    {
        [JsonPropertyName("activities-heart")]
        public List<FitbitHeartRateDay> ActivitiesHeart { get; set; } = new();

        [JsonPropertyName("activities-heart-intraday")]
        public FitbitIntradayData ActivitiesHeartIntraday { get; set; } = new();
    }

    /// <summary>
    /// Daily heart rate summary data from Fitbit
    /// </summary>
    public class FitbitHeartRateDay
    {
        [JsonPropertyName("dateTime")]
        public DateTime DateTime { get; set; }

        [JsonPropertyName("value")]
        public HeartRateValue Value { get; set; } = new();
    }

    /// <summary>
    /// Heart rate value containing resting HR and zones
    /// </summary>
    public class HeartRateValue
    {
        [JsonPropertyName("restingHeartRate")]
        public int RestingHeartRate { get; set; }

        [JsonPropertyName("heartRateZones")]
        public List<HeartRateZone> HeartRateZones { get; set; } = new();
    }

    /// <summary>
    /// Heart rate zone information
    /// </summary>
    public class HeartRateZone
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("min")]
        public int Min { get; set; }

        [JsonPropertyName("max")]
        public int Max { get; set; }

        [JsonPropertyName("minutes")]
        public int Minutes { get; set; }

        [JsonPropertyName("caloriesOut")]
        public double CaloriesOut { get; set; }
    }

    /// <summary>
    /// Intraday heart rate data with detailed time-series points
    /// </summary>
    public class FitbitIntradayData
    {
        [JsonPropertyName("dataset")]
        public List<HeartRateDataPoint> Dataset { get; set; } = new();

        [JsonPropertyName("datasetInterval")]
        public int DatasetInterval { get; set; }
    }

    /// <summary>
    /// Individual heart rate measurement point
    /// </summary>
    public class HeartRateDataPoint
    {
        [JsonPropertyName("time")]
        public string Time { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public int Value { get; set; }
    }

    // ======================
    // HRV Models
    // ======================

    /// <summary>
    /// Response model for Fitbit Heart Rate Variability (HRV) data
    /// Maps to: GET https://api.fitbit.com/1/user/-/hrv/date/{date}.json
    /// </summary>
    public class FitbitHrvResponse
    {
        [JsonPropertyName("hrv")]
        public List<FitbitHrvDay> Hrv { get; set; } = new();
    }

    /// <summary>
    /// Daily HRV data from Fitbit
    /// </summary>
    public class FitbitHrvDay
    {
        [JsonPropertyName("dateTime")]
        public string DateTime { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public FitbitHrvValue HrvValue { get; set; } = new();
    }

    /// <summary>
    /// HRV measurement values including daily and deep sleep RMSSD
    /// </summary>
    public class FitbitHrvValue
    {
        [JsonPropertyName("dailyRmssd")]
        public double DailyRmssd { get; set; }

        [JsonPropertyName("deepRmssd")]
        public double? DeepRmssd { get; set; }
    }

    // ======================
    // Sleep Models
    // ======================

    /// <summary>
    /// Response model for Fitbit sleep data
    /// Maps to: GET https://api.fitbit.com/1.2/user/-/sleep/date/{date}.json
    /// </summary>
    public class FitbitSleepResponse
    {
        [JsonPropertyName("sleep")]
        public List<FitbitSleepSession> Sleep { get; set; } = new();

        [JsonPropertyName("summary")]
        public FitbitSleepSummary Summary { get; set; } = new();
    }

    /// <summary>
    /// Individual sleep session data
    /// </summary>
    public class FitbitSleepSession
    {
        [JsonPropertyName("dateOfSleep")]
        public string DateOfSleep { get; set; } = string.Empty;

        [JsonPropertyName("startTime")]
        public DateTime StartTime { get; set; }

        [JsonPropertyName("endTime")]
        public DateTime EndTime { get; set; }

        [JsonPropertyName("duration")]
        public long Duration { get; set; }

        [JsonPropertyName("efficiency")]
        public double Efficiency { get; set; }

        [JsonPropertyName("isMainSleep")]
        public bool IsMainSleep { get; set; }

        [JsonPropertyName("levels")]
        public FitbitSleepLevels Levels { get; set; } = new();

        [JsonPropertyName("minutesAsleep")]
        public int MinutesAsleep { get; set; }

        [JsonPropertyName("minutesAwake")]
        public int MinutesAwake { get; set; }

        [JsonPropertyName("minutesToFallAsleep")]
        public int MinutesToFallAsleep { get; set; }

        [JsonPropertyName("minutesAfterWakeup")]
        public int MinutesAfterWakeup { get; set; }
    }

    /// <summary>
    /// Sleep levels data with summary and detailed breakdown
    /// </summary>
    public class FitbitSleepLevels
    {
        [JsonPropertyName("summary")]
        public FitbitSleepStages Summary { get; set; } = new();

        [JsonPropertyName("data")]
        public List<FitbitSleepLevelData> Data { get; set; } = new();
    }

    /// <summary>
    /// Sleep level data point
    /// </summary>
    public class FitbitSleepLevelData
    {
        [JsonPropertyName("dateTime")]
        public DateTime DateTime { get; set; }

        [JsonPropertyName("level")]
        public string Level { get; set; } = string.Empty;

        [JsonPropertyName("seconds")]
        public int Seconds { get; set; }
    }

    /// <summary>
    /// Sleep summary with total time and stage breakdown
    /// </summary>
    public class FitbitSleepSummary
    {
        [JsonPropertyName("totalMinutesAsleep")]
        public int TotalMinutesAsleep { get; set; }

        [JsonPropertyName("totalTimeInBed")]
        public int TotalTimeInBed { get; set; }

        [JsonPropertyName("stages")]
        public FitbitSleepStages Stages { get; set; } = new();
    }

    /// <summary>
    /// Sleep stages breakdown (REM, Light, Deep, Wake)
    /// </summary>
    public class FitbitSleepStages
    {
        [JsonPropertyName("deep")]
        public int Deep { get; set; }

        [JsonPropertyName("light")]
        public int Light { get; set; }

        [JsonPropertyName("rem")]
        public int Rem { get; set; }

        [JsonPropertyName("wake")]
        public int Wake { get; set; }
    }

    // ======================
    // Activity Models
    // ======================

    /// <summary>
    /// Response model for Fitbit daily activity summary
    /// Maps to: GET https://api.fitbit.com/1/user/-/activities/date/{date}.json
    /// </summary>
    public class FitbitActivityResponse
    {
        [JsonPropertyName("summary")]
        public FitbitActivitySummary Summary { get; set; } = new();

        [JsonPropertyName("activities")]
        public List<FitbitActivity> Activities { get; set; } = new();

        [JsonPropertyName("goals")]
        public FitbitActivityGoals Goals { get; set; } = new();
    }

    /// <summary>
    /// Daily activity summary including steps, calories, and active minutes
    /// </summary>
    public class FitbitActivitySummary
    {
        [JsonPropertyName("steps")]
        public int Steps { get; set; }

        [JsonPropertyName("caloriesOut")]
        public int CaloriesOut { get; set; }

        [JsonPropertyName("activeScore")]
        public int ActiveScore { get; set; }

        [JsonPropertyName("veryActiveMinutes")]
        public int VeryActiveMinutes { get; set; }

        [JsonPropertyName("fairlyActiveMinutes")]
        public int FairlyActiveMinutes { get; set; }

        [JsonPropertyName("lightlyActiveMinutes")]
        public int LightlyActiveMinutes { get; set; }

        [JsonPropertyName("sedentaryMinutes")]
        public int SedentaryMinutes { get; set; }

        [JsonPropertyName("distances")]
        public List<FitbitDistance> Distances { get; set; } = new();

        /// <summary>
        /// Helper property to get total active minutes (very + fairly active)
        /// </summary>
        public int ActiveMinutes => VeryActiveMinutes + FairlyActiveMinutes;
    }

    /// <summary>
    /// Individual activity logged in Fitbit
    /// </summary>
    public class FitbitActivity
    {
        [JsonPropertyName("activityId")]
        public long ActivityId { get; set; }

        [JsonPropertyName("activityName")]
        public string ActivityName { get; set; } = string.Empty;

        [JsonPropertyName("calories")]
        public int Calories { get; set; }

        [JsonPropertyName("duration")]
        public long Duration { get; set; }

        [JsonPropertyName("startTime")]
        public string StartTime { get; set; } = string.Empty;
    }

    /// <summary>
    /// Distance information for different activity types
    /// </summary>
    public class FitbitDistance
    {
        [JsonPropertyName("activity")]
        public string Activity { get; set; } = string.Empty;

        [JsonPropertyName("distance")]
        public double Distance { get; set; }
    }

    /// <summary>
    /// Daily activity goals set in Fitbit
    /// </summary>
    public class FitbitActivityGoals
    {
        [JsonPropertyName("steps")]
        public int Steps { get; set; }

        [JsonPropertyName("caloriesOut")]
        public int CaloriesOut { get; set; }

        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        [JsonPropertyName("activeMinutes")]
        public int ActiveMinutes { get; set; }
    }

    /// <summary>
    /// Consolidated snapshot of real-time vitals fetched from Fitbit API
    /// </summary>
    public class RealTimeVitalsSnapshot
    {
        public int? HeartRate { get; set; }
        public double? HRV { get; set; }
        public int? Steps { get; set; }
        public int? SleepMinutes { get; set; }
        public int? DeepSleepMinutes { get; set; }
        public int? RemSleepMinutes { get; set; }
        public int? LightSleepMinutes { get; set; }
        public int? AwakeSleepMinutes { get; set; }
        public int? StressScore { get; set; }
        public double? Calories { get; set; }
        public double? Distance { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }
}