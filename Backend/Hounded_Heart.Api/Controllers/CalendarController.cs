using Hounded_Heart.Models.Data;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/calendar")]
    [ApiController]
    public class CalendarController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CalendarController> _logger;
        private readonly IDailyVitalsSummaryService _dailySummaryService;

        public CalendarController(
            AppDbContext context,
            ILogger<CalendarController> logger,
            IDailyVitalsSummaryService dailySummaryService)
        {
            _context = context;
            _logger = logger;
            _dailySummaryService = dailySummaryService;
        }

        [HttpGet("data/{userId}")]
        public async Task<IActionResult> GetCalendarData(
            Guid userId, 
            [FromQuery] DateTime? startDate = null, 
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
                var queryStartDate = DateTime.SpecifyKind((startDate ?? today.AddDays(-30)).Date, DateTimeKind.Utc);
                var queryEndDate = DateTime.SpecifyKind((endDate ?? today).Date, DateTimeKind.Utc);

                _logger.LogInformation($"📅 Getting calendar data for user {userId} from {queryStartDate:yyyy-MM-dd} to {queryEndDate:yyyy-MM-dd}");

                // For historical dates (before today), get from daily summaries
                // Materialize raw DB columns first to avoid EF Core C#-method translation error
                var historicalRaw = await _context.HumanDailySummaries
                    .Where(s => s.UserId == userId && s.Date >= queryStartDate && s.Date < today)
                    .OrderBy(s => s.Date)
                    .Select(s => new
                    {
                        s.Date,
                        s.SyncScore,
                        s.SyncTrend,
                        s.AvgHeartRate,
                        s.AvgHRV,
                        s.TotalSteps,
                        s.AvgSleepMinutes,
                        s.AvgStressScore,
                        s.DataPointsCount
                    })
                    .ToListAsync();

                var historicalData = historicalRaw.Select(s => new CalendarDataResponse
                {
                    Date = s.Date,
                    Score = s.SyncScore ?? 0,
                    Trend = s.SyncTrend ?? "stable",
                    ScoreTitle = GetScoreTitleFromSync(s.SyncScore),
                    ScoreDescription = GetScoreDescriptionFromSync(s.SyncScore),
                    ScoreAction = GetScoreActionFromSync(s.SyncScore),
                    Disclaimer = "This assessment is based on biometric data and AI analysis of your sync with your dog.",
                    AvgHeartRate = s.AvgHeartRate ?? 0,
                    AvgHRV = s.AvgHRV ?? 0,
                    TotalSteps = s.TotalSteps ?? 0,
                    AvgSleepScore = s.AvgSleepMinutes ?? 0,
                    AvgStressScore = s.AvgStressScore ?? 0,
                    DataPointsCount = s.DataPointsCount ?? 0,
                    DataType = "Historical"
                }).ToList();

                // For today and recent dates, get from real-time data and calculate on-demand
                var realtimeData = new List<CalendarDataResponse>();
                if (queryEndDate >= today)
                {
                    var realtimeStartDate = Math.Max(queryStartDate.Ticks, today.Ticks);
                    var realtimeStart = DateTime.SpecifyKind(new DateTime(realtimeStartDate), DateTimeKind.Utc);

                    var dailyRealtimeData = await _context.HumanVitals
                        .Where(h => h.UserId == userId && h.TimestampUtc >= realtimeStart && h.TimestampUtc <= queryEndDate.AddDays(1))
                        .GroupBy(h => h.TimestampUtc.Date)
                        .Select(g => new
                        {
                            Date = g.Key,
                            AvgHeartRate = g.Where(h => h.HeartRate > 0).Average(h => (double?)h.HeartRate),
                            AvgHRV = g.Where(h => h.HRV > 0).Average(h => h.HRV),
                            TotalSteps = g.Max(h => (int?)h.Steps) ?? 0,
                            AvgSleepScore = g.Where(h => h.SleepMinutes > 0).Average(h => (double?)h.SleepMinutes),
                            AvgStressScore = g.Where(h => h.StressScore > 0).Average(h => (double?)h.StressScore),
                            DataPointsCount = g.Count()
                        })
                        .ToListAsync();

                    foreach (var dayData in dailyRealtimeData)
                    {
                        // Calculate real-time sync score (simplified version)
                        int realtimeScore = CalculateRealtimeScore(dayData.AvgStressScore ?? 0, dayData.AvgHRV ?? 0, dayData.AvgSleepScore ?? 0);

                        realtimeData.Add(new CalendarDataResponse
                        {
                            Date = dayData.Date,
                            Score = realtimeScore,
                            Trend = "realtime",
                            ScoreTitle = GetScoreTitleFromSync(realtimeScore),
                            ScoreDescription = GetScoreDescriptionFromSync(realtimeScore),
                            ScoreAction = GetScoreActionFromSync(realtimeScore),
                            Disclaimer = "This assessment is based on biometric data and AI analysis of your sync with your dog.",
                            AvgHeartRate = dayData.AvgHeartRate ?? 0,
                            AvgHRV = dayData.AvgHRV ?? 0,
                            TotalSteps = dayData.TotalSteps,
                            AvgSleepScore = dayData.AvgSleepScore ?? 0,
                            AvgStressScore = dayData.AvgStressScore ?? 0,
                            DataPointsCount = dayData.DataPointsCount,
                            DataType = "Realtime"
                        });
                    }
                }

                var combinedData = historicalData.Concat(realtimeData).OrderBy(d => d.Date);

                _logger.LogInformation($"📅 Retrieved {historicalData.Count} historical + {realtimeData.Count} realtime days for user {userId}");

                return Ok(ResponseHelper.Success(combinedData, "Calendar data retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Calendar data retrieval failed: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<string>($"Error: {ex.Message}", 500));
            }
        }

        [HttpGet("score-details/{userId}/{date}")]
        public async Task<IActionResult> GetScoreDetails(Guid userId, DateTime date)
        {
            try
            {
                _logger.LogInformation($"📊 Getting detailed score for user {userId} on {date:yyyy-MM-dd}");

                // Check if it's a historical date or current date
                var isHistorical = date.Date < DateTime.Today;

                if (isHistorical)
                {
                    var dayStart = date.Date;
                    var dayEnd = dayStart.AddDays(1);

                    var summary = await _context.HumanDailySummaries
                        .Where(s => s.UserId == userId && s.Date >= dayStart && s.Date < dayEnd)
                        .OrderByDescending(s => s.Date)
                        .FirstOrDefaultAsync();

                    if (summary == null)
                    {
                        // Fallback: compute score from vitals if daily summary for that date is not present yet.
                        var vitalsData = await _context.HumanVitals
                            .Where(h => h.UserId == userId && h.TimestampUtc >= dayStart && h.TimestampUtc < dayEnd)
                            .ToListAsync();

                        if (!vitalsData.Any())
                        {
                            return NotFound(ResponseHelper.Fail<string>("No data found for the specified date.", 404));
                        }

                        var avgStress = vitalsData.Where(d => d.StressScore > 0).Average(d => (double?)d.StressScore) ?? 0;
                        var avgHRV = vitalsData.Where(d => d.HRV > 0).Average(d => (double?)d.HRV) ?? 0;
                        var avgSleep = vitalsData.Where(d => d.SleepMinutes > 0).Average(d => (double?)d.SleepMinutes) ?? 0;

                        int computedScore = CalculateRealtimeScore(avgStress, avgHRV, avgSleep);

                        var computedResponse = new ScoreDetailsResponse
                        {
                            Date = dayStart,
                            Score = computedScore,
                            Trend = "computed",
                            ScoreTitle = GetScoreTitleFromSync(computedScore),
                            ScoreDescription = GetScoreDescriptionFromSync(computedScore),
                            ScoreAction = GetScoreActionFromSync(computedScore),
                            Disclaimer = "This assessment is based on biometric data and AI analysis of your sync with your dog.",
                            DetailedMetrics = new DetailedMetrics
                            {
                                AvgHeartRate = vitalsData.Where(d => d.HeartRate > 0).Average(d => (double?)d.HeartRate) ?? 0,
                                AvgHRV = avgHRV,
                                TotalSteps = vitalsData.Max(d => (int?)d.Steps) ?? 0,
                                AvgSleepScore = avgSleep,
                                AvgStressScore = avgStress,
                                MinHeartRate = vitalsData.Where(d => d.HeartRate > 0).Min(d => (double?)d.HeartRate) ?? 0,
                                MaxHeartRate = vitalsData.Where(d => d.HeartRate > 0).Max(d => (double?)d.HeartRate) ?? 0,
                                MinHRV = vitalsData.Where(d => d.HRV > 0).Min(d => (double?)d.HRV) ?? 0,
                                MaxHRV = vitalsData.Where(d => d.HRV > 0).Max(d => (double?)d.HRV) ?? 0,
                                DataPointsCount = vitalsData.Count
                            }
                        };

                        return Ok(ResponseHelper.Success(computedResponse, "Score details calculated from raw vitals for the specified date.", 200));
                    }

                    var response = new ScoreDetailsResponse
                    {
                        Date = summary.Date,
                        Score = summary.SyncScore ?? 0,
                        Trend = summary.SyncTrend ?? "stable",
                        ScoreTitle = GetScoreTitleFromSync(summary.SyncScore),
                        ScoreDescription = GetScoreDescriptionFromSync(summary.SyncScore),
                        ScoreAction = GetScoreActionFromSync(summary.SyncScore),
                        Disclaimer = "This assessment is based on biometric data and AI analysis of your sync with your dog.",
                        DetailedMetrics = new DetailedMetrics
                        {
                            AvgHeartRate = summary.AvgHeartRate ?? 0,
                            AvgHRV = summary.AvgHRV ?? 0,
                            TotalSteps = summary.TotalSteps ?? 0,
                            AvgSleepScore = summary.AvgSleepMinutes ?? 0,
                            AvgStressScore = summary.AvgStressScore ?? 0,
                            MinHeartRate = 0,
                            MaxHeartRate = 0,
                            MinHRV = 0,
                            MaxHRV = 0,
                            DataPointsCount = summary.DataPointsCount ?? 0
                        }
                    };

                    return Ok(ResponseHelper.Success(response, "Score details retrieved successfully.", 200));
                }
                else
                {
                    // For current day, calculate from real-time data
                    var startDate = date.Date;
                    var endDate = startDate.AddDays(1);

                    var vitalsData = await _context.HumanVitals
                        .Where(h => h.UserId == userId && h.TimestampUtc >= startDate && h.TimestampUtc < endDate)
                        .ToListAsync();

                    if (!vitalsData.Any())
                    {
                        return NotFound(ResponseHelper.Fail<string>("No data found for the specified date.", 404));
                    }

                    var avgStress = vitalsData.Where(d => d.StressScore > 0).Average(d => (double?)d.StressScore) ?? 0;
                    var avgHRV = vitalsData.Where(d => d.HRV > 0).Average(d => (double?)d.HRV) ?? 0;
                    var avgSleep = vitalsData.Where(d => d.SleepMinutes > 0).Average(d => (double?)d.SleepMinutes) ?? 0;

                    int realtimeScore = CalculateRealtimeScore(avgStress, avgHRV, avgSleep);
                    var scoreContent = GetScoreContent(realtimeScore);

                    var response = new ScoreDetailsResponse
                    {
                        Date = date.Date,
                        Score = realtimeScore,
                        Trend = "realtime",
                        ScoreTitle = GetScoreTitleFromSync(realtimeScore),
                        ScoreDescription = GetScoreDescriptionFromSync(realtimeScore),
                        ScoreAction = GetScoreActionFromSync(realtimeScore),
                        Disclaimer = "This assessment is based on biometric data and AI analysis of your sync with your dog.",
                        DetailedMetrics = new DetailedMetrics
                        {
                            AvgHeartRate = vitalsData.Where(d => d.HeartRate > 0).Average(d => (double?)d.HeartRate) ?? 0,
                            AvgHRV = avgHRV,
                            TotalSteps = vitalsData.Max(d => (int?)d.Steps) ?? 0,
                            AvgSleepScore = avgSleep,
                            AvgStressScore = avgStress,
                            MinHeartRate = vitalsData.Where(d => d.HeartRate > 0).Min(d => (double?)d.HeartRate) ?? 0,
                            MaxHeartRate = vitalsData.Where(d => d.HeartRate > 0).Max(d => (double?)d.HeartRate) ?? 0,
                            MinHRV = vitalsData.Where(d => d.HRV > 0).Min(d => (double?)d.HRV) ?? 0,
                            MaxHRV = vitalsData.Where(d => d.HRV > 0).Max(d => (double?)d.HRV) ?? 0,
                            DataPointsCount = vitalsData.Count
                        }
                    };

                    return Ok(ResponseHelper.Success(response, "Real-time score details calculated successfully.", 200));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Score details retrieval failed: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<string>($"Error: {ex.Message}", 500));
            }
        }

        [HttpPost("generate-summary/{date}")]
        public async Task<IActionResult> GenerateDailySummary(string date)
        {
            try
            {
                // Parse date from YYYY-MM-DD format
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, 
                    System.Globalization.DateTimeStyles.AssumeUniversal, out var parsedDate))
                {
                    return BadRequest(ResponseHelper.Fail<string>("Invalid date format. Please use YYYY-MM-dd format.", 400));
                }

                _logger.LogInformation($"📊 [ManualTrigger] Generating daily summary for {parsedDate:yyyy-MM-dd}");

                // Call the daily summary generation method
                int processedCount = await _dailySummaryService.GenerateDailySummaryAsync(parsedDate.Date);

                _logger.LogInformation($"✅ [ManualTrigger] Daily summary generation completed for {parsedDate:yyyy-MM-dd}");

                return Ok(ResponseHelper.Success(new { date = parsedDate.Date, processedCount, message = "Daily summary generated successfully" }, 
                    "Daily summary generation completed.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ [ManualTrigger] Daily summary generation failed: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<string>($"Error: {ex.Message}", 500));
            }
        }

        private int CalculateRealtimeScore(double avgStress, double avgHRV, double avgSleep)
        {
            // Simplified version of the sync score calculation for real-time data
            double stressScore = Math.Max(0, 30 - (avgStress * 3)); // Invert stress (0-30 points)
            double hrvScore = Math.Min(25, avgHRV * 0.5); // Scale HRV (0-25 points)
            double sleepScore = (avgSleep / 10) * 20; // Scale sleep (0-20 points)

            double totalScore = (stressScore + hrvScore + sleepScore) * (100.0 / 75.0); // Scale to 0-100
            return (int)Math.Round(Math.Max(0, Math.Min(100, totalScore)));
        }

        private int CalculateScoreFromSync(int? syncScore)
        {
            return syncScore ?? 50; // Return sync score or default to neutral 50
        }

        private static string GetScoreTitleFromSync(int? syncScore)
        {
            int score = syncScore ?? 50;
            return score switch
            {
                >= 0 and <= 10 => "Critical Disconnect",
                >= 11 and <= 20 => "Severe Imbalance",
                >= 21 and <= 30 => "Disconnected",
                >= 31 and <= 40 => "Elevated",
                >= 41 and <= 50 => "Low Alignment",
                >= 51 and <= 60 => "Neutral",
                >= 61 and <= 70 => "Mild Sync",
                >= 71 and <= 80 => "Good Alignment",
                >= 81 and <= 90 => "Strong Sync",
                >= 91 and <= 100 => "Full Alignment",
                _ => "Neutral"
            };
        }

        private static string GetScoreDescriptionFromSync(int? syncScore)
        {
            int score = syncScore ?? 50;
            return score switch
            {
                >= 0 and <= 10 => "Your current state is unsustainable. Immediate intervention is required.",
                >= 11 and <= 20 => "Your current emotional and mental state shows severe imbalance with your dog.",
                >= 21 and <= 30 => "Stress is affecting your life and your relationship with your dog.",
                >= 31 and <= 40 => "Your body is under tension and your dog is sensing it.",
                >= 41 and <= 50 => "You are functional but not deeply connected with your dog right now.",
                >= 51 and <= 60 => "Nothing is dead but nothing is alive. Both you and your dog are neutral.",
                >= 61 and <= 70 => "You and your dog are generally aligned in a mild sync.",
                >= 71 and <= 80 => "You are in a solid state and your dog is responding positively.",
                >= 81 and <= 90 => "You and your dog are deeply connected and synchronized.",
                >= 91 and <= 100 => "You and your dog are fully in sync - an ideal state.",
                _ => "Unable to determine sync status at this moment."
            };
        }

        private static string GetScoreActionFromSync(int? syncScore)
        {
            int score = syncScore ?? 50;
            return score switch
            {
                >= 0 and <= 10 => "Stop what you are doing now and seek immediate grounding techniques.",
                >= 11 and <= 20 => "Take a slow, unhurried walk with your dog in a calm environment.",
                >= 21 and <= 30 => "Take a 15 to 20 minute walk with your dog in nature.",
                >= 31 and <= 40 => "Take a short deliberate reset - pause and breathe deeply.",
                >= 41 and <= 50 => "Spend at least 10 minutes walking or playing calmly with your dog.",
                >= 51 and <= 60 => "Take a short walk or spend 10 minutes in quiet time with your dog.",
                >= 61 and <= 70 => "Take a relaxed walk or an easy play session to maintain this state.",
                >= 71 and <= 80 => "Build on it. Keep doing what you are doing - you're on the right track.",
                >= 81 and <= 90 => "Do not overthink it and do not tinker. Maintain your current rhythm.",
                >= 91 and <= 100 => "No correction needed. No action required. Savor this perfect moment.",
                _ => "Ensure consistent data collection for better recommendations."
            };
        }

        private (string title, string description, string action, string disclaimer) GetScoreContent(int score)
        {
            // Reuse the same scoring content from SyncScoreService
            return score switch
            {
                >= 0 and <= 10 => ("Critical Disconnect", "Your current state is unsustainable...", "Stop what you are doing now...", "This assessment is based on biometric data..."),
                >= 11 and <= 20 => ("Severe Imbalance", "Your current emotional and mental state...", "Take a slow, unhurried walk...", "This assessment is based on biometric data..."),
                >= 21 and <= 30 => ("Disconnected", "Stress is affecting your life...", "Take a 15 to 20 minute walk...", "This assessment is based on biometric data..."),
                >= 31 and <= 40 => ("Elevated", "Your body is under tension...", "Take a short deliberate reset...", "This assessment is based on biometric data..."),
                >= 41 and <= 50 => ("Low Alignment", "You are functional but not connected...", "Spend at least 10 minutes walking...", "This assessment is based on biometric data..."),
                >= 51 and <= 60 => ("Neutral", "Nothing is dead but nothing is alive...", "Take a short walk or spend 10 minutes...", "This assessment is based on biometric data..."),
                >= 61 and <= 70 => ("Mild Sync", "You and your dog are generally aligned...", "Take a relaxed walk or an easy play session...", "This assessment is based on biometric data..."),
                >= 71 and <= 80 => ("Good Alignment", "You are in a solid state...", "Build on it. Keep doing what you are doing...", "This assessment is based on biometric data..."),
                >= 81 and <= 90 => ("Strong Sync", "You and your dog are deeply connected...", "Do not overthink it and do not tinker...", "This assessment is based on biometric data..."),
                >= 91 and <= 100 => ("Full Alignment", "You and your dog are fully in sync...", "No correction needed. No action required...", "This assessment is based on biometric data..."),
                _ => ("Neutral", "Unable to determine sync status...", "Ensure consistent data collection...", "This assessment is based on biometric data...")
            };
        }
    }

    // Response DTOs
    public class CalendarDataResponse
    {
        public DateTime Date { get; set; }
        public int Score { get; set; }
        public string Trend { get; set; }
        public string ScoreTitle { get; set; }
        public string ScoreDescription { get; set; }
        public string ScoreAction { get; set; }
        public string Disclaimer { get; set; }
        public double AvgHeartRate { get; set; }
        public double AvgHRV { get; set; }
        public int TotalSteps { get; set; }
        public double AvgSleepScore { get; set; }
        public double AvgStressScore { get; set; }
        public int DataPointsCount { get; set; }
        public string DataType { get; set; } // "Historical" or "Realtime"
    }

    public class ScoreDetailsResponse
    {
        public DateTime Date { get; set; }
        public int Score { get; set; }
        public string Trend { get; set; }
        public string ScoreTitle { get; set; }
        public string ScoreDescription { get; set; }
        public string ScoreAction { get; set; }
        public string Disclaimer { get; set; }
        public DetailedMetrics DetailedMetrics { get; set; }
    }

    public class DetailedMetrics
    {
        public double AvgHeartRate { get; set; }
        public double AvgHRV { get; set; }
        public int TotalSteps { get; set; }
        public double AvgSleepScore { get; set; }
        public double AvgStressScore { get; set; }
        public double MinHeartRate { get; set; }
        public double MaxHeartRate { get; set; }
        public double MinHRV { get; set; }
        public double MaxHRV { get; set; }
        public int DataPointsCount { get; set; }
    }
}