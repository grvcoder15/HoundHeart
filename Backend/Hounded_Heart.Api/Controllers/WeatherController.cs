using System.Threading.Tasks;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WeatherController : ControllerBase
    {
        private readonly IWeatherService _weatherService;

        public WeatherController(IWeatherService weatherService)
        {
            _weatherService = weatherService;
        }

        /// <summary>
        /// GET /api/weather/current?lat={lat}&amp;lon={lon}
        /// Returns current weather data for the given coordinates.
        /// Returns 503 if the weather service is unavailable.
        /// </summary>
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentWeather([FromQuery] double lat, [FromQuery] double lon)
        {
            var weather = await _weatherService.GetCurrentWeather(lat, lon);

            if (weather == null)
            {
                return StatusCode(503, new
                {
                    success = false,
                    message = "Weather service is currently unavailable. Please try again later."
                });
            }

            return Ok(new
            {
                success = true,
                data = weather
            });
        }
    }
}
