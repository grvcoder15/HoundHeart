using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VitalsController : ControllerBase
    {
        private readonly IPetPaceService _petPaceService;
        private readonly IAppleHealthService _appleHealthService;
        private readonly AppDbContext _context;
        private readonly IVitalsTrackingService _vitalsTrackingService;

        public VitalsController(IPetPaceService petPaceService, IAppleHealthService appleHealthService, AppDbContext context, IVitalsTrackingService vitalsTrackingService)
        {
            _petPaceService = petPaceService;
            _appleHealthService = appleHealthService;
            _context = context;
            _vitalsTrackingService = vitalsTrackingService;
        }

        [HttpGet("dog/{dogId}/latest")]
        public async Task<IActionResult> GetLatestDogVitals(Guid dogId)
        {
            var vitals = await _petPaceService.GetLatestVitalsAsync(dogId);
            return Ok(ResponseHelper.Success(vitals, "Latest dog vitals retrieved successfully (Sandbox).", 200));
        }

        [HttpGet("dog/{dogId}/history")]
        public async Task<IActionResult> GetDogVitalsHistory(Guid dogId, [FromQuery] int days = 7)
        {
            var history = await _petPaceService.GetHistoricalVitalsAsync(dogId, days);
            return Ok(ResponseHelper.Success(history, $"Dog vitals history for last {days} days retrieved successfully (Sandbox).", 200));
        }

        [HttpGet("human/{userId}/latest")]
        public async Task<IActionResult> GetLatestHumanVitals(Guid userId)
        {
            var vitals = await _appleHealthService.GetLatestVitalsAsync(userId);
            return Ok(ResponseHelper.Success(vitals, "Latest human vitals retrieved successfully (Sandbox).", 200));
        }

        [HttpGet("human/{userId}/history")]
        public async Task<IActionResult> GetHumanVitalsHistory(Guid userId, [FromQuery] int days = 7)
        {
            var history = await _appleHealthService.GetHistoricalVitalsAsync(userId, days);
            return Ok(ResponseHelper.Success(history, $"Human vitals history for last {days} days retrieved successfully (Sandbox).", 200));
        }

        [HttpPost("human")]
        public async Task<IActionResult> SaveHumanVitals([FromBody] HumanVitalsRecord humanVitals)
        {
            try
            {
                if (humanVitals == null)
                    return BadRequest(ResponseHelper.Fail<string>("Invalid human vitals data.", 400));

                // Validation
                var validationErrors = new List<string>();

                if (humanVitals.HeartRate < 30 || humanVitals.HeartRate > 220)
                    validationErrors.Add("HeartRate must be between 30 and 220 bpm.");

                if (humanVitals.HRV < 5 || humanVitals.HRV > 200)
                    validationErrors.Add("HRV must be between 5 and 200 ms.");

                if (humanVitals.Steps < 0 || humanVitals.Steps > 50000)
                    validationErrors.Add("Steps must be between 0 and 50,000.");


                if (validationErrors.Any())
                    return UnprocessableEntity(ResponseHelper.Fail<string>(string.Join(" ", validationErrors), 422));

                humanVitals.Id = Guid.NewGuid();
                humanVitals.TimestampUtc = DateTime.UtcNow;

                _context.HumanVitals.Add(humanVitals);
                await _context.SaveChangesAsync();

                // Track vitals insertion to set baseline start time if needed
                await _vitalsTrackingService.TrackHumanVitalsInserted(humanVitals.UserId);

                return Ok(ResponseHelper.Success(humanVitals, "Human vitals saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error saving human vitals: {ex.Message}", 500));
            }
        }

        [HttpPost("dog")]
        public async Task<IActionResult> SaveDogVitals([FromBody] DogVitalsRecord dogVitals)
        {
            try
            {
                if (dogVitals == null)
                    return BadRequest(ResponseHelper.Fail<string>("Invalid dog vitals data.", 400));

                // Validation
                var validationErrors = new List<string>();

                if (dogVitals.HeartRate.HasValue && (dogVitals.HeartRate < 60 || dogVitals.HeartRate > 180))
                    validationErrors.Add("HeartRate must be between 60 and 180 bpm.");

                if (dogVitals.ActivityScore < 0 || dogVitals.ActivityScore > 100)
                    validationErrors.Add("ActivityScore must be between 0 and 100.");

                if (dogVitals.Temperature.HasValue && (dogVitals.Temperature < 99.5 || dogVitals.Temperature > 102.5))
                    validationErrors.Add("Temperature must be between 99.5 and 102.5 °F.");

                if (dogVitals.RestScore < 0 || dogVitals.RestScore > 100)
                    validationErrors.Add("RestScore must be between 0 and 100.");

                if (dogVitals.RespirationRate.HasValue && (dogVitals.RespirationRate < 10 || dogVitals.RespirationRate > 35))
                    validationErrors.Add("RespirationRate must be between 10 and 35 breaths per minute.");

                if (string.IsNullOrEmpty(dogVitals.State))
                    validationErrors.Add("State is required.");

                if (validationErrors.Any())
                    return UnprocessableEntity(ResponseHelper.Fail<string>(string.Join(" ", validationErrors), 422));

                dogVitals.Id = Guid.NewGuid();
                dogVitals.TimestampUtc = DateTime.UtcNow;

                _context.DogVitals.Add(dogVitals);
                await _context.SaveChangesAsync();

                // Track vitals insertion to set baseline start time if needed
                await _vitalsTrackingService.TrackDogVitalsInserted(dogVitals.DogId);

                return Ok(ResponseHelper.Success(dogVitals, "Dog vitals saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error saving dog vitals: {ex.Message}", 500));
            }
        }

        [HttpGet("human/latest/{userId}")]
        public async Task<IActionResult> GetLatestHumanVitalsFromDb(Guid userId)
        {
            try
            {
                var records = await _context.HumanVitals
                    .Where(h => h.UserId == userId)
                    .OrderByDescending(h => h.TimestampUtc)
                    .Take(15) // Increased to 15 for baseline tracking (15 min @ 90 sec interval = ~10 records)
                    .Select(h => new
                    {
                        timestampUtc = h.TimestampUtc, // Ensure lowercase for JavaScript convention
                        heartRate = h.HeartRate,
                        hrv = h.HRV,
                        steps = h.Steps,
                        sleepMinutes = h.SleepMinutes, // Replaced sleepScore
                        stressScore = h.StressScore,
                        source = h.Source
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(records, "Latest human vitals retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving human vitals: {ex.Message}", 500));
            }
        }

        [HttpGet("dog/latest/{dogId}")]
        public async Task<IActionResult> GetLatestDogVitalsFromDb(Guid dogId)
        {
            try
            {
                var record = await _context.DogVitals
                    .Where(d => d.DogId == dogId)
                    .OrderByDescending(d => d.TimestampUtc)
                    .Select(d => new
                    {
                        d.TimestampUtc,
                        d.HeartRate,
                        d.ActivityScore,
                        d.Temperature,
                        d.RestScore,
                        d.RespirationRate,
                        d.State,
                        d.Source
                    })
                    .FirstOrDefaultAsync();

                if (record == null)
                    return NotFound(ResponseHelper.Fail<string>("No vitals found for this dog.", 404));

                return Ok(ResponseHelper.Success(record, "Latest dog vitals retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving dog vitals: {ex.Message}", 500));
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetVitalsSummary()
        {
            try
            {
                var totalHumanRecords = await _context.HumanVitals.CountAsync();
                var stressSpikes = await _context.HumanVitals.CountAsync(h => h.HeartRate > 90);
                var totalDogRecords = await _context.DogVitals.CountAsync();
                
                var oldestRecord = await _context.HumanVitals
                    .MinAsync(h => (DateTime?)h.TimestampUtc);
                var newestRecord = await _context.HumanVitals
                    .MaxAsync(h => (DateTime?)h.TimestampUtc);

                var summary = new
                {
                    TotalHumanRecords = totalHumanRecords,
                    StressSpikes = stressSpikes,
                    TotalDogRecords = totalDogRecords,
                    OldestRecord = oldestRecord,
                    NewestRecord = newestRecord
                };

                return Ok(ResponseHelper.Success(summary, "Vitals summary retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving vitals summary: {ex.Message}", 500));
            }
        }

        [HttpGet("dog/history/{dogId}")]
        public async Task<IActionResult> GetDogVitalsHistory(Guid dogId)
        {
            try
            {
                var records = await _context.DogVitals
                    .Where(d => d.DogId == dogId)
                    .OrderByDescending(d => d.TimestampUtc)
                    .Take(10)
                    .Select(d => new
                    {
                        d.Id,
                        d.DogId,
                        d.HeartRate,
                        d.ActivityScore,
                        d.Temperature,
                        d.RestScore,
                        d.RespirationRate,
                        d.State,
                        d.Source,
                        d.TimestampUtc
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(records, "Dog vitals history retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving dog vitals history: {ex.Message}", 500));
            }
        }

        [HttpGet("dog/all-latest")]
        public async Task<IActionResult> GetAllLatestDogVitals()
        {
            try
            {
                // Get all unique DogIds first
                var dogIds = await _context.DogVitals
                    .Select(d => d.DogId)
                    .Distinct()
                    .ToListAsync();

                var latestRecords = new List<object>();

                // For each unique DogId, get the latest record
                foreach (var dogId in dogIds)
                {
                    var latestRecord = await _context.DogVitals
                        .Where(d => d.DogId == dogId)
                        .OrderByDescending(d => d.TimestampUtc)
                        .Select(d => new
                        {
                            d.Id,
                            d.DogId,
                            d.HeartRate,
                            d.ActivityScore,
                            d.Temperature,
                            d.RestScore,
                            d.RespirationRate,
                            d.State,
                            d.Source,
                            d.TimestampUtc
                        })
                        .FirstOrDefaultAsync();

                    if (latestRecord != null)
                    {
                        latestRecords.Add(latestRecord);
                    }
                }

                return Ok(ResponseHelper.Success(latestRecords, "Latest vitals for all dogs retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving latest dog vitals: {ex.Message}", 500));
            }
        }

        [HttpGet("cron-status")]
        public async Task<IActionResult> GetCronStatus()
        {
            try
            {
                var totalDogRecords = await _context.DogVitals.CountAsync();
                var lastEntryUtc = await _context.DogVitals.MaxAsync(d => (DateTime?)d.TimestampUtc);
                
                var minutesSinceLastEntry = lastEntryUtc.HasValue 
                    ? (int)(DateTime.UtcNow - lastEntryUtc.Value).TotalMinutes 
                    : int.MaxValue;

                var cronStatus = new
                {
                    IsRunning = true,
                    ServiceName = "MockPetPaceHostedService",
                    IntervalMinutes = 5,
                    TotalDogRecords = totalDogRecords,
                    LastEntryUtc = lastEntryUtc,
                    MinutesSinceLastEntry = minutesSinceLastEntry
                };

                return Ok(ResponseHelper.Success(cronStatus, "Cron job status retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error retrieving cron status: {ex.Message}", 500));
            }
        }
    }
}
