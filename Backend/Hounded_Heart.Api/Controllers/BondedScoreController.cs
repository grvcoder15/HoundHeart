using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BondedScoreController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BondedScoreController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("CalculateBondedScore")]
        public async Task<IActionResult> CalculateBondedScore([FromQuery] Guid userId, [FromQuery] Guid dogId)
        {
            try
            {
                if (userId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<string>("UserId is required.", 400));

                Console.WriteLine($"[Scoring] Starting calculation for User: {userId}");

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null)
                    return BadRequest(ResponseHelper.Fail<string>("User not found.", 404));

                var today = DateTime.UtcNow.Date;
                var last7Days = today.AddDays(-7);
                var yesterday = today.AddDays(-1);

                // Fetch Rules from DB
                var dbRules = await _context.ScoringRules.AsNoTracking().ToListAsync();
                double GetRule(string name, double def) => (double)(dbRules.FirstOrDefault(r => r.RuleName == name)?.Points ?? (decimal)def);

                var rules = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
                {
                    { "BaseScore", 50.0 }, 
                    { "DailyRitualBonus", GetRule("Ritual_Bonus", 2.0) },
                    { "PointsPerHour", GetRule("Time_Spent_Per_Hour", 1.0) },
                    { "MoodImprovementBonus", GetRule("Behavior_Improvement", 2.0) },
                    { "StressReductionBonus", GetRule("Peace_High", 1.0) },
                    { "MissedCheckInPenalty", GetRule("Missed_CheckIn_Penalty", -3.0) },
                    { "EmergencyPenalty", GetRule("Emergency_Penalty", -5.0) },
                    // "SyncReward" maps to "Peace_Improvement"
                    { "SyncReward", GetRule("Peace_Improvement", 1.0) }, 
                    { "MaxPositivePointsCap", 15.0 },
                    { "HighStressNoSyncPenalty", GetRule("Stress_Penalty", -2.0) }
                };

                // Rituals
                var ritualData = await _context.UserActivitiesScores
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CreatedAt >= last7Days)
                    .Select(x => x.CreatedAt.Date)
                    .Distinct()
                    .ToListAsync();

                // Also include new Daily Rituals (RitualLogs)
                var ritualLogDates = await _context.RitualLogs
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CompletedAt >= last7Days)
                    .Select(x => x.CompletedAt.Date)
                    .Distinct()
                    .ToListAsync();

                // Calculate Ritual Days from RitualLogs (Daily Ritual Bonus) - 2 pts per day
                int ritualBonusDays = ritualLogDates.Count;
                double dailyRitualPoints = ritualBonusDays * rules["DailyRitualBonus"];
                bool didRitualToday = ritualLogDates.Any(d => d == today) || ritualData.Any(d => d == today);

                // Calculate Total from UserActivitiesScores (Additive) - Sum of all activity scores
                double activityScoresSum = (double)await _context.UserActivitiesScores
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CreatedAt >= last7Days)
                    .SumAsync(x => x.Score ?? 0);

                // Check-ins
                var checkInSummaries = await _context.UserCheckIns
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CreatedOn >= yesterday)
                    .Select(x => new {
                        x.Rating,
                        x.CreatedOn,
                        Questions = x.CheckIn != null ? x.CheckIn.Questions : ""
                    })
                    .ToListAsync();

                var checkInsToday = checkInSummaries.Where(x => x.CreatedOn.Date == today).ToList();
                bool didCheckInToday = checkInsToday.Any();

                double score = rules["BaseScore"] + dailyRitualPoints + activityScoresSum;
                double currentPositivePoints = 0;
                double currentNegativePoints = 0;

                // --- 1. TIME SPENT ---
                // Rule: +1 per hour (Max 10)
                var hoursCheckIn = checkInsToday.FirstOrDefault(x => x.Questions != null && x.Questions.Contains("hours", StringComparison.OrdinalIgnoreCase));
                if (hoursCheckIn != null)
                {
                    int rating = hoursCheckIn.Rating ?? 0;
                    if (rating > 0)
                        currentPositivePoints += Math.Min(10, rating * rules["PointsPerHour"]);
                }

                // --- 2. DOG BEHAVIOR (Improvement Only) ---
                // Rule: +2 if Today > Yesterday
                var behaviorTodayItem = checkInsToday.FirstOrDefault(x => x.Questions != null && x.Questions.Contains("behavior", StringComparison.OrdinalIgnoreCase));
                if (behaviorTodayItem != null)
                {
                    int ratingToday = behaviorTodayItem.Rating ?? 0;
                    
                    var behaviorYesterday = checkInSummaries
                        .FirstOrDefault(x => x.CreatedOn.Date == yesterday && (x.Questions?.Contains("behavior", StringComparison.OrdinalIgnoreCase) ?? false));
                    
                    // Only compare if yesterday existed
                    if (behaviorYesterday != null && ratingToday > (behaviorYesterday.Rating ?? 0))
                    {
                        currentPositivePoints += rules["MoodImprovementBonus"];
                    }
                }

                // --- 3. EMERGENCY (Penalty) ---
                // Rule: -5 if > 0
                var emergencyCheckIn = checkInsToday.FirstOrDefault(x => x.Questions != null && 
                    (x.Questions.Contains("Emergency", StringComparison.OrdinalIgnoreCase) || 
                     x.Questions.Contains("Neglect", StringComparison.OrdinalIgnoreCase) || 
                     x.Questions.Contains("alone", StringComparison.OrdinalIgnoreCase)));
                
                if (emergencyCheckIn != null && (emergencyCheckIn.Rating ?? 0) > 0)
                {
                    currentNegativePoints += rules["EmergencyPenalty"];
                }

                // --- 4. HUMAN PEACE (Hybrid) ---
                // Avoid "present". 
                var peaceCheckIn = checkInsToday.FirstOrDefault(x => x.Questions != null 
                    && x.Questions.Contains("peaceful", StringComparison.OrdinalIgnoreCase)
                    && !x.Questions.Contains("present", StringComparison.OrdinalIgnoreCase));

                if (peaceCheckIn != null)
                {
                    int rating = peaceCheckIn.Rating ?? 0;
                    
                    var peaceYesterday = checkInSummaries
                        .FirstOrDefault(x => x.CreatedOn.Date == yesterday 
                        && (x.Questions?.Contains("peaceful", StringComparison.OrdinalIgnoreCase) ?? false)
                        && (!x.Questions?.Contains("present", StringComparison.OrdinalIgnoreCase) ?? true));

                    bool isHighPeace = rating >= 7;
                    bool isImproved = (peaceYesterday != null && rating > (peaceYesterday.Rating ?? 0));

                    // Single point for either/both conditions
                    if (isHighPeace || isImproved)
                    {
                         currentPositivePoints += rules["SyncReward"]; // Using SyncReward/PeaceImprovement rule value
                    }
                    else if (rating >= 1 && rating < 4 && !didRitualToday)
                    {
                        currentNegativePoints += rules["HighStressNoSyncPenalty"];
                    }
                }


                // Rule: -3 if no check-in yesterday (24h gap)
                // Skip if user joined recently (CreatedOn >= yesterday)
                var checkInYesterday = checkInSummaries.Any(x => x.CreatedOn.Date == yesterday);
                bool isNewUser = user.CreatedOn.Date >= yesterday;

                if (!checkInYesterday && !didCheckInToday && !isNewUser)
                {
                    currentNegativePoints += rules["MissedCheckInPenalty"];
                }

                // Apply Today's Points
                score += (currentPositivePoints + currentNegativePoints);
                
                // HARD CAP: 100
                score = Math.Min(100, Math.Max(0, Math.Round(score, 2)));
                string bondLevel = score switch
                {
                    >= 80 => "Kindred Spirit \uD83D\uDC9C",
                    >= 50 => "Deep Bond \u2764\uFE0F",
                    >= 20 => "Growing Connection \uD83C\uDF31",
                    _ => "New Connection \u2728"
                };

                var weeklyPoints = await _context.UserActivitiesScores
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CreatedAt >= last7Days)
                    .Select(x => x.Score)
                    .ToListAsync();
                
                double weeklySum = weeklyPoints.Sum(s => (double?)(s ?? 0) ?? 0);

                var result = new
                {
                    BondedScore = score,
                    BondLevel = bondLevel,
                    RitualDaysCount = ritualBonusDays, // Showing Daily Ritual streak
                    WeeklyProgress = weeklySum,
                    LastUpdate = DateTime.UtcNow
                };

                return Ok(ResponseHelper.Success(result, "Calculated", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Scoring Error] {ex}");
                return StatusCode(500, ResponseHelper.Fail<string>($"Error: {ex.Message}", 500));
            }
        }

        [HttpGet("GetAllPoints")]
        public async Task<IActionResult> GetAllpoints()
        {
            try
            {
                var points = await _context.Scores.AsNoTracking().ToListAsync();
                return Ok(ResponseHelper.Success(points, "All points retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving points: {ex.Message}", 500));
            }
        }
    }
}
