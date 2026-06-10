using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Hounded_Heart.Models.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public class FitbitService : IFitbitService
    {
        private readonly HttpClient _httpClient;
        private readonly IFitbitTokenService _tokenService;
        private readonly ILogger<FitbitService> _logger;

        public FitbitService(
            HttpClient httpClient,
            IFitbitTokenService tokenService,
            ILogger<FitbitService> logger)
        {
            _httpClient = httpClient;
            _tokenService = tokenService;
            _logger = logger;
            
            if (_httpClient.BaseAddress == null)
            {
                _httpClient.BaseAddress = new Uri("https://api.fitbit.com/");
            }
        }

        public async Task<RealTimeVitalsSnapshot> GetRealTimeVitalsAsync(string userId)
        {
            var snapshot = new RealTimeVitalsSnapshot();
            var accessToken = await _tokenService.GetValidAccessTokenAsync(userId);

            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogWarning("[FitbitService] Could not get valid access token for user {UserId}", userId);
                return snapshot;
            }

            _logger.LogInformation("[FitbitService] Fetching baseline snapshot for user {UserId}", userId);

            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

            // 1. Heart Rate
            try
            {
                var response = await GetAsync<FitbitHeartRateResponse>(accessToken, $"1/user/-/activities/heart/date/{today}/1d.json");
                snapshot.HeartRate = response?.ActivitiesHeart?.FirstOrDefault()?.Value?.RestingHeartRate ?? 
                                    response?.ActivitiesHeartIntraday?.Dataset?.LastOrDefault()?.Value;
            }
            catch (Exception ex) { _logger.LogError(ex, "HeartRate fetch failed"); }

            // 2. HRV
            try
            {
                var response = await GetAsync<FitbitHrvResponse>(accessToken, $"1/user/-/hrv/date/{today}.json");
                snapshot.HRV = response?.Hrv?.FirstOrDefault()?.HrvValue?.DailyRmssd;
            }
            catch (Exception ex) { _logger.LogError(ex, "HRV fetch failed"); }

            // 3. Activities (Steps, Calories, Distance)
            try
            {
                var response = await GetAsync<FitbitActivityResponse>(accessToken, $"1/user/-/activities/date/{today}.json");
                snapshot.Steps = response?.Summary?.Steps;
                snapshot.Calories = response?.Summary?.CaloriesOut;
                snapshot.Distance = response?.Summary?.Distances?.FirstOrDefault(d => d.Activity == "total")?.Distance;
            }
            catch (Exception ex) { _logger.LogError(ex, "Activity fetch failed"); }

            // 4. Sleep
            try
            {
                var response = await GetAsync<FitbitSleepResponse>(accessToken, $"1.2/user/-/sleep/date/{today}.json");
                var mainSleep = response?.Sleep?.FirstOrDefault(s => s.IsMainSleep) ?? response?.Sleep?.FirstOrDefault();
                
                if (mainSleep != null)
                {
                    snapshot.SleepMinutes = mainSleep.MinutesAsleep;
                    snapshot.DeepSleepMinutes = mainSleep.Levels?.Summary?.Deep;
                    snapshot.RemSleepMinutes = mainSleep.Levels?.Summary?.Rem;
                    snapshot.LightSleepMinutes = mainSleep.Levels?.Summary?.Light;
                    snapshot.AwakeSleepMinutes = mainSleep.Levels?.Summary?.Wake;
                }
            }
            catch (Exception ex) { _logger.LogError(ex, "Sleep fetch failed"); }

            // 5. Stress Score (Health API)
            try
            {
                // Note: This endpoint might require specific permissions/scopes
                var json = await GetJsonAsync(accessToken, $"1/user/-/stress/score/date/{today}.json");
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("stressScore", out var scores) && scores.GetArrayLength() > 0)
                {
                    snapshot.StressScore = scores[0].GetProperty("value").GetInt32();
                }
            }
            catch (Exception ex) { _logger.LogWarning("StressScore fetch failed or endpoint not supported: {Msg}", ex.Message); }

            // 6. Location (Latitude/Longitude) - Fitbit usually does not expose real-time GPS 
            // but we can check the profile or last activity. Defaulting to null as requested if unavailable.
            snapshot.Latitude = null;
            snapshot.Longitude = null;

            _logger.LogInformation("[FitbitService] Snapshot complete for user {UserId}. HeartRate: {HR}, Steps: {Steps}", 
                userId, snapshot.HeartRate, snapshot.Steps);

            return snapshot;
        }

        private async Task<T?> GetAsync<T>(string token, string path) where T : class
        {
            var request = new HttpRequestMessage(HttpMethod.Get, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

        private async Task<string> GetJsonAsync(string token, string path)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, path);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}
