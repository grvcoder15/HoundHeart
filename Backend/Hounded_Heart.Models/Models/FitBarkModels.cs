using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Hounded_Heart.Models.Models
{
    public class FitBarkDogProfile
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("slug")]
        public string Slug { get; set; }

        [JsonPropertyName("breed")]
        public string Breed { get; set; }

        [JsonPropertyName("birth_date")]
        public string BirthDate { get; set; }

        [JsonPropertyName("weight")]
        public double Weight { get; set; }

        [JsonPropertyName("gender")]
        public string Gender { get; set; }

        [JsonPropertyName("activity_goal")]
        public int ActivityGoal { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("zip")]
        public string Zip { get; set; }
    }

    public class FitBarkActivityRecord
    {
        [JsonPropertyName("date")]
        public string Date { get; set; }

        [JsonPropertyName("activity_value")]
        public int ActivityValue { get; set; }

        [JsonPropertyName("min_play")]
        public int MinPlay { get; set; }

        [JsonPropertyName("min_active")]
        public int MinActive { get; set; }

        [JsonPropertyName("min_rest")]
        public int MinRest { get; set; }

        [JsonPropertyName("nap_time")]
        public int NapTime { get; set; }
    }

    public class FitBarkDailyGoal
    {
        [JsonPropertyName("daily_goal")]
        public double DailyGoalPercentage { get; set; }

        [JsonPropertyName("current_activity_percentage")]
        public double CurrentActivityPercentage { get; set; }
    }

    public class FitBarkDogRelationResponse
    {
        [JsonPropertyName("dog_relations")]
        public List<FitBarkDogRelation> DogRelations { get; set; }
    }

    public class FitBarkDogRelation
    {
        [JsonPropertyName("dog")]
        public FitBarkDogProfile Dog { get; set; }
    }

    public class FitBarkActivitySeriesResponse
    {
        [JsonPropertyName("activity_series")]
        public FitBarkActivitySeries ActivitySeries { get; set; }
    }

    public class FitBarkActivitySeries
    {
        [JsonPropertyName("records")]
        public List<FitBarkActivityRecord> Records { get; set; }
    }

    public class FitBarkUserProfile
    {
        [JsonPropertyName("slug")]
        public string Slug { get; set; }

        [JsonPropertyName("username")]
        public string Username { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("first_name")]
        public string FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string LastName { get; set; }

        [JsonPropertyName("picture_hash")]
        public string PictureHash { get; set; }
    }

    public class FitBarkUserInfoResponse
    {
        [JsonPropertyName("user")]
        public FitBarkUserProfile User { get; set; }
    }

    public class FitBarkBreedInfo
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class FitBarkDogInfo
    {
        [JsonPropertyName("slug")]
        public string Slug { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("bluetooth_id")]
        public string BluetoothId { get; set; }

        [JsonPropertyName("activity_value")]
        public int? ActivityValue { get; set; }

        [JsonPropertyName("birth")]
        public string Birth { get; set; }

        [JsonPropertyName("breed1")]
        public FitBarkBreedInfo Breed1 { get; set; }

        [JsonPropertyName("breed2")]
        public FitBarkBreedInfo Breed2 { get; set; }

        [JsonPropertyName("gender")]
        public string Gender { get; set; }

        [JsonPropertyName("weight")]
        public double? Weight { get; set; }

        [JsonPropertyName("weight_unit")]
        public string WeightUnit { get; set; }

        [JsonPropertyName("country")]
        public string Country { get; set; }

        [JsonPropertyName("zip")]
        public string Zip { get; set; }

        [JsonPropertyName("tzoffset")]
        public int? TzOffset { get; set; }

        [JsonPropertyName("tzname")]
        public string TzName { get; set; }

        [JsonPropertyName("min_play")]
        public int? MinPlay { get; set; }

        [JsonPropertyName("min_active")]
        public int? MinActive { get; set; }

        [JsonPropertyName("min_rest")]
        public int? MinRest { get; set; }

        [JsonPropertyName("hourly_average")]
        public int? HourlyAverage { get; set; }

        [JsonPropertyName("picture_hash")]
        public string PictureHash { get; set; }

        [JsonPropertyName("neutered")]
        public bool? Neutered { get; set; }

        [JsonPropertyName("last_min_time")]
        public string LastMinuteTime { get; set; }

        [JsonPropertyName("last_min_activity")]
        public int? LastMinuteActivity { get; set; }

        [JsonPropertyName("daily_goal")]
        public int? DailyGoal { get; set; }

        [JsonPropertyName("battery_level")]
        public int? BatteryLevel { get; set; }

        [JsonPropertyName("last_sync")]
        public string LastSync { get; set; }
    }

    public class FitBarkDogInfoResponse
    {
        [JsonPropertyName("dog")]
        public FitBarkDogInfo Dog { get; set; }
    }

    public class FitBarkUserRelation
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("date")]
        public string Date { get; set; }

        [JsonPropertyName("dog_slug")]
        public string DogSlug { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("user")]
        public FitBarkUserProfile User { get; set; }
    }

    public class FitBarkUserRelationsResponse
    {
        [JsonPropertyName("user_relations")]
        public List<FitBarkUserRelation> UserRelations { get; set; }
    }

    public class FitBarkImagePayload
    {
        [JsonPropertyName("data")]
        public string Data { get; set; }
    }

    public class FitBarkImageResponse
    {
        [JsonPropertyName("image")]
        public FitBarkImagePayload Image { get; set; }
    }

    public class FitBarkDateRangeRequest
    {
        [JsonPropertyName("slug")]
        public string Slug { get; set; }

        [JsonPropertyName("from")]
        public string From { get; set; }

        [JsonPropertyName("to")]
        public string To { get; set; }
    }

    public class FitBarkResolutionRequest : FitBarkDateRangeRequest
    {
        [JsonPropertyName("resolution")]
        public string Resolution { get; set; } = "DAILY";
    }

    public class FitBarkRawJsonResponse
    {
        [JsonExtensionData]
        public Dictionary<string, JsonElement> Data { get; set; }
    }
}
