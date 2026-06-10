using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public class WeatherData
    {
        public double TemperatureCelsius { get; set; }
        public string Condition { get; set; }
        public string LocationName { get; set; }
        public DateTime FetchedAt { get; set; }
    }

    public interface IWeatherService
    {
        Task<WeatherData?> GetCurrentWeather(double latitude, double longitude);
    }

    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WeatherService> _logger;

        public WeatherService(HttpClient httpClient, IConfiguration configuration, ILogger<WeatherService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<WeatherData?> GetCurrentWeather(double latitude, double longitude)
        {
            try
            {
                var apiKey = _configuration["WeatherApi:ApiKey"];
                var baseUrl = _configuration["WeatherApi:BaseUrl"] ?? "https://api.openweathermap.org/data/2.5";

                if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_KEY_HERE")
                {
                    _logger.LogWarning("WeatherApi:ApiKey is not configured. Skipping weather fetch.");
                    return null;
                }

                var url = $"{baseUrl}/weather?lat={latitude}&lon={longitude}&appid={apiKey}&units=metric";

                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("OpenWeatherMap API returned {StatusCode} for lat={Lat}, lon={Lon}.",
                        response.StatusCode, latitude, longitude);
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                var temperatureCelsius = root
                    .GetProperty("main")
                    .GetProperty("temp")
                    .GetDouble();

                var condition = root
                    .GetProperty("weather")[0]
                    .GetProperty("description")
                    .GetString() ?? "Unknown";

                var locationName = root
                    .GetProperty("name")
                    .GetString() ?? "Unknown";

                return new WeatherData
                {
                    TemperatureCelsius = temperatureCelsius,
                    Condition = condition,
                    LocationName = locationName,
                    FetchedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch weather data for lat={Lat}, lon={Lon}. Returning null silently.",
                    latitude, longitude);
                return null;
            }
        }
    }
}
