using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IFitbitMockService
    {
        /// <summary>
        /// Generates mock heart rate response with realistic data
        /// </summary>
        FitbitHeartRateResponse GetMockHeartRateResponse(string userId);

        /// <summary>
        /// Generates mock HRV response with realistic values
        /// </summary>
        FitbitHrvResponse GetMockHrvResponse(string userId);

        /// <summary>
        /// Generates mock sleep response with realistic sleep stages
        /// </summary>
        FitbitSleepResponse GetMockSleepResponse(string userId);

        /// <summary>
        /// Generates mock activity response with realistic daily activity
        /// </summary>
        FitbitActivityResponse GetMockActivityResponse(string userId);

        /// <summary>
        /// Generates mock stress event data for testing alert pipeline
        /// </summary>
        (FitbitHeartRateResponse heartRate, FitbitHrvResponse hrv) GetMockStressEventResponse(string userId);

        /// <summary>
        /// Processes full mock data poll through vitals service pipeline
        /// </summary>
        Task<MockPollSummary> BuildFullMockPoll(string userId);
    }

    public class FitbitMockService : IFitbitMockService
    {
        private readonly IVitalsService _vitalsService;
        private readonly ILogger<FitbitMockService> _logger;

        public FitbitMockService(IVitalsService vitalsService, ILogger<FitbitMockService> logger)
        {
            _vitalsService = vitalsService;
            _logger = logger;
        }

        public FitbitHeartRateResponse GetMockHeartRateResponse(string userId)
        {
            var random = new Random(userId.GetHashCode());
            var today = DateTime.Today;

            // Generate resting heart rate (62-72 bpm, seeded by userId)
            var restingHr = random.Next(62, 73);

            // Generate 24 hourly intraday data points with natural variation
            var intradayDataPoints = new List<HeartRateDataPoint>();
            for (int hour = 0; hour < 24; hour++)
            {
                int baseHr;
                
                // Natural HR variation by time of day
                if (hour >= 22 || hour <= 6) // Night: 55-65 bpm
                {
                    baseHr = random.Next(55, 66);
                }
                else if (hour >= 12 && hour <= 18) // Afternoon: 75-95 bpm
                {
                    baseHr = random.Next(75, 96);
                }
                else // Morning/Evening: 65-85 bpm
                {
                    baseHr = random.Next(65, 86);
                }

                intradayDataPoints.Add(new HeartRateDataPoint
                {
                    Time = $"{hour:D2}:00:00",
                    Value = baseHr
                });
            }

            return new FitbitHeartRateResponse
            {
                ActivitiesHeart = new List<FitbitHeartRateDay>
                {
                    new FitbitHeartRateDay
                    {
                        DateTime = today,
                        Value = new HeartRateValue
                        {
                            RestingHeartRate = restingHr,
                            HeartRateZones = new List<HeartRateZone>
                            {
                                new HeartRateZone { Name = "Fat Burn", Min = 91, Max = 127, Minutes = 23, CaloriesOut = 84.39 },
                                new HeartRateZone { Name = "Cardio", Min = 127, Max = 154, Minutes = 12, CaloriesOut = 165.33 },
                                new HeartRateZone { Name = "Peak", Min = 154, Max = 220, Minutes = 0, CaloriesOut = 0 }
                            }
                        }
                    }
                },
                ActivitiesHeartIntraday = new FitbitIntradayData
                {
                    Dataset = intradayDataPoints,
                    DatasetInterval = 3600 // 1 hour intervals
                }
            };
        }

        public FitbitHrvResponse GetMockHrvResponse(string userId)
        {
            var random = new Random(userId.GetHashCode() + 1000);
            
            // Generate realistic HRV values (dailyRmssd 38-58ms, deepRmssd 28-45ms)
            var dailyRmssd = random.Next(38, 59) + random.NextDouble();
            var deepRmssd = random.Next(28, 46) + random.NextDouble();

            return new FitbitHrvResponse
            {
                Hrv = new List<FitbitHrvDay>
                {
                    new FitbitHrvDay
                    {
                        DateTime = DateTime.Today.ToString("yyyy-MM-dd"),
                        HrvValue = new FitbitHrvValue
                        {
                            DailyRmssd = Math.Round(dailyRmssd, 1),
                            DeepRmssd = Math.Round(deepRmssd, 1)
                        }
                    }
                }
            };
        }

        public FitbitSleepResponse GetMockSleepResponse(string userId)
        {
            var random = new Random(userId.GetHashCode() + 2000);
            
            // Generate realistic sleep stage minutes
            var deepMinutes = random.Next(60, 91);      // Deep: 60-90 min
            var remMinutes = random.Next(80, 111);      // REM: 80-110 min
            var lightMinutes = random.Next(150, 201);   // Light: 150-200 min
            var wakeMinutes = random.Next(20, 41);      // Wake: 20-40 min
            
            var totalAsleep = deepMinutes + remMinutes + lightMinutes;
            var totalInBed = totalAsleep + wakeMinutes;
            var efficiency = Math.Round((double)totalAsleep / totalInBed * 100, 1);

            var startTime = DateTime.Today.AddHours(22).AddMinutes(random.Next(0, 120)); // 10 PM - 12 AM
            var endTime = startTime.AddMinutes(totalInBed);

            return new FitbitSleepResponse
            {
                Sleep = new List<FitbitSleepSession>
                {
                    new FitbitSleepSession
                    {
                        DateOfSleep = DateTime.Today.ToString("yyyy-MM-dd"),
                        StartTime = startTime,
                        EndTime = endTime,
                        Duration = totalInBed * 60000, // Convert to milliseconds
                        Efficiency = efficiency,
                        IsMainSleep = true,
                        MinutesAsleep = totalAsleep,
                        MinutesAwake = wakeMinutes,
                        MinutesToFallAsleep = random.Next(5, 21),
                        MinutesAfterWakeup = random.Next(0, 16),
                        Levels = new FitbitSleepLevels
                        {
                            Summary = new FitbitSleepStages
                            {
                                Deep = deepMinutes,
                                Light = lightMinutes,
                                Rem = remMinutes,
                                Wake = wakeMinutes
                            }
                        }
                    }
                },
                Summary = new FitbitSleepSummary
                {
                    TotalMinutesAsleep = totalAsleep,
                    TotalTimeInBed = totalInBed,
                    Stages = new FitbitSleepStages
                    {
                        Deep = deepMinutes,
                        Light = lightMinutes,
                        Rem = remMinutes,
                        Wake = wakeMinutes
                    }
                }
            };
        }

        public FitbitActivityResponse GetMockActivityResponse(string userId)
        {
            var random = new Random(userId.GetHashCode() + 3000);
            
            // Generate realistic daily activity (steps 5000-11000, calories 1800-2600)
            var steps = random.Next(5000, 11001);
            var calories = random.Next(1800, 2601);
            var veryActiveMinutes = random.Next(10, 61);
            var fairlyActiveMinutes = random.Next(15, 91);
            var lightlyActiveMinutes = random.Next(120, 241);
            var sedentaryMinutes = 1440 - veryActiveMinutes - fairlyActiveMinutes - lightlyActiveMinutes; // Rest of the day

            var totalDistance = Math.Round(steps * 0.0008, 2); // Rough conversion: steps to km

            return new FitbitActivityResponse
            {
                Summary = new FitbitActivitySummary
                {
                    Steps = steps,
                    CaloriesOut = calories,
                    ActiveScore = random.Next(100, 301),
                    VeryActiveMinutes = veryActiveMinutes,
                    FairlyActiveMinutes = fairlyActiveMinutes,
                    LightlyActiveMinutes = lightlyActiveMinutes,
                    SedentaryMinutes = sedentaryMinutes,
                    Distances = new List<FitbitDistance>
                    {
                        new FitbitDistance { Activity = "total", Distance = totalDistance },
                        new FitbitDistance { Activity = "tracker", Distance = totalDistance },
                        new FitbitDistance { Activity = "loggedActivities", Distance = 0 }
                    }
                },
                Goals = new FitbitActivityGoals
                {
                    Steps = 10000,
                    CaloriesOut = 2500,
                    Distance = 8.0,
                    ActiveMinutes = 30
                }
            };
        }

        public (FitbitHeartRateResponse heartRate, FitbitHrvResponse hrv) GetMockStressEventResponse(string userId)
        {
            var random = new Random(userId.GetHashCode() + 4000);
            
            // Generate baseline values first
            var baselineHr = random.Next(65, 76);
            var baselineHrv = random.Next(38, 59);
            
            // Create stress event: HR rises 20%, HRV drops 25%
            var stressHr = (int)(baselineHr * 1.2);
            var stressHrv = baselineHrv * 0.75;

            // Heart rate response with elevated values
            var heartRateResponse = new FitbitHeartRateResponse
            {
                ActivitiesHeart = new List<FitbitHeartRateDay>
                {
                    new FitbitHeartRateDay
                    {
                        DateTime = DateTime.Today,
                        Value = new HeartRateValue
                        {
                            RestingHeartRate = stressHr,
                            HeartRateZones = new List<HeartRateZone>()
                        }
                    }
                },
                ActivitiesHeartIntraday = new FitbitIntradayData
                {
                    Dataset = new List<HeartRateDataPoint>
                    {
                        new HeartRateDataPoint { Time = DateTime.Now.ToString("HH:mm:ss"), Value = stressHr }
                    },
                    DatasetInterval = 60
                }
            };

            // HRV response with reduced values
            var hrvResponse = new FitbitHrvResponse
            {
                Hrv = new List<FitbitHrvDay>
                {
                    new FitbitHrvDay
                    {
                        DateTime = DateTime.Today.ToString("yyyy-MM-dd"),
                        HrvValue = new FitbitHrvValue
                        {
                            DailyRmssd = Math.Round(stressHrv, 1),
                            DeepRmssd = Math.Round(stressHrv * 0.8, 1)
                        }
                    }
                }
            };

            return (heartRateResponse, hrvResponse);
        }

        public async Task<MockPollSummary> BuildFullMockPoll(string userId)
        {
            try
            {
                _logger.LogInformation("Building full mock poll for user {UserId}", userId);
                
                var summary = new MockPollSummary { UserId = userId };
                
                // Generate all mock data
                var heartRateData = GetMockHeartRateResponse(userId);
                var hrvData = GetMockHrvResponse(userId);
                var sleepData = GetMockSleepResponse(userId);
                var activityData = GetMockActivityResponse(userId);

                // Process heart rate data
                if (heartRateData.ActivitiesHeart.Count > 0)
                {
                    var restingHr = heartRateData.ActivitiesHeart[0].Value.RestingHeartRate;
                    var vital = new HumanVital
                    {
                        UserId = Guid.Parse(userId),
                        Timestamp = DateTime.UtcNow,
                        HeartRate = restingHr,
                        DeviceType = "Fitbit Mock"
                    };
                    
                    await _vitalsService.SaveHumanVitalAsync(vital);
                    summary.HeartRateSaved = restingHr;
                }

                // Process HRV data
                if (hrvData.Hrv.Count > 0)
                {
                    var hrvRecord = new HrvRecord
                    {
                        UserId = Guid.Parse(userId),
                        Timestamp = DateTime.UtcNow,
                        DailyRmssd = hrvData.Hrv[0].HrvValue.DailyRmssd,
                        DeepRmssd = hrvData.Hrv[0].HrvValue.DeepRmssd,
                        DeviceType = "Fitbit Mock"
                    };
                    
                    await _vitalsService.SaveHrvAsync(hrvRecord);
                    summary.HrvSaved = hrvRecord.DailyRmssd;
                }

                // Process sleep data
                if (sleepData.Sleep.Count > 0)
                {
                    var sleepSession = sleepData.Sleep[0];
                    var sleepRecord = new SleepRecord
                    {
                        UserId = Guid.Parse(userId),
                        Date = DateTime.UtcNow.Date,
                        TotalMinutesAsleep = sleepSession.MinutesAsleep,
                        MinutesToFallAsleep = sleepSession.MinutesToFallAsleep,
                        MinutesAwake = sleepSession.MinutesAwake,
                        MinutesAfterWakeup = sleepSession.MinutesAfterWakeup,
                        Efficiency = sleepSession.Efficiency,
                        DeviceType = "Fitbit Mock",
                        StartTime = sleepSession.StartTime,
                        EndTime = sleepSession.EndTime
                    };
                    
                    await _vitalsService.SaveSleepAsync(sleepRecord);
                    summary.SleepMinutesSaved = sleepRecord.TotalMinutesAsleep;
                }

                // Process activity data
                var steps = activityData.Summary.Steps;
                var activityVital = new HumanVital
                {
                    UserId = Guid.Parse(userId),
                    Timestamp = DateTime.UtcNow,
                    Steps = steps,
                    Calories = activityData.Summary.CaloriesOut,
                    Distance = activityData.Summary.Distances.FirstOrDefault()?.Distance ?? 0,
                    ActiveMinutes = activityData.Summary.ActiveMinutes,
                    DeviceType = "Fitbit Mock"
                };
                
                await _vitalsService.SaveHumanVitalAsync(activityVital);
                summary.StepsSaved = steps;
                summary.CaloriesSaved = activityData.Summary.CaloriesOut;

                summary.ProcessedAt = DateTime.UtcNow;
                summary.Success = true;
                
                _logger.LogInformation("Successfully processed mock poll for user {UserId}", userId);
                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing mock poll for user {UserId}", userId);
                return new MockPollSummary 
                { 
                    UserId = userId, 
                    Success = false, 
                    ErrorMessage = ex.Message,
                    ProcessedAt = DateTime.UtcNow
                };
            }
        }
    }

    /// <summary>
    /// Summary of data saved during mock poll processing
    /// </summary>
    public class MockPollSummary
    {
        public string UserId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime ProcessedAt { get; set; }
        public int? HeartRateSaved { get; set; }
        public double? HrvSaved { get; set; }
        public int? SleepMinutesSaved { get; set; }
        public int? StepsSaved { get; set; }
        public int? CaloriesSaved { get; set; }
    }
}