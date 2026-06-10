using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;
        private readonly AppDbContext _context;

        public DevController(IWebHostEnvironment environment, AppDbContext context)
        {
            _environment = environment;
            _context = context;
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedData([FromQuery] string? mode = null)
        {
            // Check if environment is Development
            if (!_environment.IsDevelopment())
            {
                return Forbid();
            }

            var random = new Random();
            var recordsInserted = 0;
            var isTestMode = mode?.ToLower() == "test";
            var modeString = isTestMode ? "test" : "full";

            // Get all UserId values from HumanProfiles table
            var userIds = await _context.HumanProfiles
                .Select(hp => hp.UserId)
                .ToListAsync();

            if (!userIds.Any())
            {
                return Ok(new
                {
                    message = "No users found in HumanProfiles table",
                    recordsInserted = 0,
                    mode = modeString
                });
            }

            var vitalsRecords = new List<HumanVitalsRecord>();

            foreach (var userId in userIds)
            {
                // Calculate time range based on mode
                var endTime = DateTime.UtcNow;
                DateTime startTime;
                TimeSpan interval;
                int totalRecords;

                if (isTestMode)
                {
                    // Test mode: last 10 minutes, one record every 30 seconds = 20 records
                    startTime = endTime.AddMinutes(-10);
                    interval = TimeSpan.FromSeconds(30);
                    totalRecords = 20;
                }
                else
                {
                    // Full mode: last 7 days, one record every 30 minutes = 336 records
                    startTime = endTime.AddDays(-7);
                    interval = TimeSpan.FromMinutes(30);
                    totalRecords = 336;
                }

                var userRecords = new List<HumanVitalsRecord>();

                // Generate regular records
                for (int i = 0; i < totalRecords; i++)
                {
                    var timestamp = startTime.Add(TimeSpan.FromTicks(interval.Ticks * i));
                    var hour = timestamp.Hour;

                    // Calculate steps based on time of day
                    int steps;
                    if (hour >= 22 || hour < 6) // 10pm to 6am
                    {
                        steps = 0;
                    }
                    else if (hour >= 6 && hour < 9) // 6am to 9am
                    {
                        steps = random.Next(0, 201); // 0 to 200
                    }
                    else if (hour >= 9 && hour < 18) // 9am to 6pm
                    {
                        steps = random.Next(200, 801); // 200 to 800
                    }
                    else // 18 to 22 (6pm to 10pm)
                    {
                        steps = random.Next(50, 201); // 50 to 200
                    }

                    var record = new HumanVitalsRecord
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        HeartRate = 72 + random.Next(-8, 9), // 72 ± 8
                        HRV = 45 + (float)(random.NextDouble() * 20 - 10), // 45 ± 10 as float
                        Steps = steps,
                        SleepMinutes = random.Next(300, 540), // 300-540 minutes (5-9 hours)
                        Source = "mock",
                        TimestampUtc = timestamp
                    };

                    userRecords.Add(record);
                }

                // Add 3 random stress spikes
                for (int spike = 0; spike < 3; spike++)
                {
                    if (userRecords.Count >= 6)
                    {
                        // Pick a random starting index that allows for 6 consecutive records
                        var startIndex = random.Next(0, userRecords.Count - 5);

                        // Apply stress spike to 6 consecutive records
                        for (int j = 0; j < 6; j++)
                        {
                            var recordIndex = startIndex + j;
                            if (recordIndex < userRecords.Count)
                            {
                                userRecords[recordIndex].HeartRate = random.Next(95, 111); // 95 to 110
                                userRecords[recordIndex].HRV = (float)(random.NextDouble() * 8 + 20); // 20 to 28
                            }
                        }
                    }
                }

                vitalsRecords.AddRange(userRecords);
                recordsInserted += userRecords.Count;
            }

            // Insert all records into the database
            await _context.HumanVitals.AddRangeAsync(vitalsRecords);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seeded successfully",
                recordsInserted = recordsInserted,
                mode = modeString
            });
        }
    }
}