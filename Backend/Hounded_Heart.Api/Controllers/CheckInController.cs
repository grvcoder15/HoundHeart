using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckInController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CheckInController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllCheckIns()
        {
            try
            {
                var checkIns = await _context.CheckIns
                    .Where(c => !c.IsDeleted)  
                    .ToListAsync();

                if (checkIns == null || checkIns.Count == 0)
                    return Ok(ResponseHelper.Success(new List<object>(), "No check-ins found.", 200));

                return Ok(ResponseHelper.Success(checkIns, "Check-ins fetched successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while fetching check-ins: {ex.Message}", 500));
            }
        }

        [HttpPost("UpdateUserCheckIns")]
        public async Task<IActionResult> UpdateUserCheckIns([FromBody] UserCheckInUpdateDto dto)
        {
            try
            {
                if (dto == null || dto.CheckIns == null || !dto.CheckIns.Any())
                    return BadRequest(ResponseHelper.Fail<object>("Invalid request data.", 400));

                var userId = dto.UserId;
                var today = DateTime.SpecifyKind(dto.Date?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);
                var yesterday = today.AddDays(-1);

                // --- Step 1: Calculate Score BEFORE Update ---
                // We need to fetch the existing state to know what the score used to be.
                var existingCheckIns = await _context.UserCheckIns
                    .AsNoTracking()
                    .Include(x => x.CheckIn)
                    .Where(u => u.UserId == userId && (u.ActivityDate == today || (u.ActivityDate == null && u.CreatedOn.Date == today)))
                    .ToListAsync();
                
                double scoreBefore = await CalculateDailyScore(userId, today, existingCheckIns, _context);

                // --- Step 2: Apply Updates (Insert/Update) ---
                foreach (var item in dto.CheckIns)
                {
                    var existing = await _context.UserCheckIns
                        .FirstOrDefaultAsync(u => u.UserId == userId && u.CheckInId == item.CheckInId && (u.ActivityDate == today || (u.ActivityDate == null && u.CreatedOn.Date == today)));

                    if (existing != null)
                    {
                        existing.Rating = item.Rating;
                        existing.UpdatedOn = DateTime.UtcNow;
                        _context.UserCheckIns.Update(existing);
                    }
                    else
                    {
                        var newCheckIn = new UserCheckIn
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            CheckInId = item.CheckInId,
                            Rating = item.Rating,
                            CreatedOn = DateTime.UtcNow,
                            ActivityDate = today
                        };
                        await _context.UserCheckIns.AddAsync(newCheckIn);
                    }
                }
                await _context.SaveChangesAsync();

                // --- Step 3: Calculate Score AFTER Update ---
                // Fetch the refined data (Merging existing + new ensures we have the FULL picture)
                // Even if frontend sent partial data, the DB now has the complete set for today.
                var newCheckIns = await _context.UserCheckIns
                    .Include(x => x.CheckIn)
                    .Where(u => u.UserId == userId && (u.ActivityDate == today || (u.ActivityDate == null && u.CreatedOn.Date == today)))
                    .ToListAsync();

                // Double check: If the user just started (1st item), the list might still be partial.
                // But generally, the CheckIn page submits all visible sliders.
                // This 'newCheckIns' list is the Source of Truth for "Today's Status".

                double scoreAfter = await CalculateDailyScore(userId, today, newCheckIns, _context);

                // --- Step 4: Apply Delta to Bonded Score ---
                double delta = scoreAfter - scoreBefore;

                var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == userId);
                double currentDogScore = 0;
                if (dog != null)
                {
                    // Update score with delta
                    // Ensure global cap of 0-100
                    dog.CurrentScore = Math.Min(100, Math.Max(0, dog.CurrentScore + delta));
                    dog.UpdatedOn = DateTime.UtcNow;
                    _context.Dogs.Update(dog);
                    await _context.SaveChangesAsync();
                    currentDogScore = dog.CurrentScore;
                }

                // --- Step 5: Update History Snapshot (DailyPointsChange & ScoreSnapshot) ---
                // We update ALL records for today to reflect the final daily state
                foreach (var uci in newCheckIns)
                {
                    uci.DailyPointsChange = (int)delta;
                    uci.ScoreSnapshot = (int)currentDogScore;
                    uci.IsMissed = false;
                    _context.UserCheckIns.Update(uci);
                }
                await _context.SaveChangesAsync();


                // --- Calculate Dashboard Stats (View Only) ---
                var last7Days = today.AddDays(-7);
                double weeklyProgress = scoreAfter; // Simplified
                
                var ritualConsistencyData = await _context.UserActivitiesScores
                    .AsNoTracking()
                    .Where(x => x.UserId == userId && x.CreatedAt >= last7Days)
                    .Select(x => x.CreatedAt.Date)
                    .Distinct()
                    .CountAsync();

                var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                var monthEntriesCount = await _context.JournalEntries
                    .Where(x => x.UserId == userId && x.CreatedOn >= startOfMonth && !x.IsDeleted)
                    .CountAsync();

                return Ok(ResponseHelper.Success(new
                {
                    scoreUpdate = new {
                        gain = delta,
                        totalDailyScore = scoreAfter,
                        newScore = currentDogScore
                    },
                    stats = new {
                        weeklyProgress = weeklyProgress,
                        ritualConsistency = new { count = ritualConsistencyData, total = 7 },
                        journalEntries = new { count = monthEntriesCount, label = $"{monthEntriesCount} this month" }
                    }
                }, "User check-ins updated successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message}", 500));
            }
        }

        // Helper method to calculate the Daily Score based on a list of check-ins
        private async Task<double> CalculateDailyScore(Guid userId, DateTime today, List<UserCheckIn> checkIns, AppDbContext context)
        {
             double points = 0;
             var yesterday = today.AddDays(-1);

             // Fetch Rules from DB
             var rules = await context.ScoringRules.AsNoTracking().ToListAsync();
             var timeRule = (double)(rules.FirstOrDefault(r => r.RuleName == "Time_Spent_Per_Hour")?.Points ?? 1.0m);
             var peaceHighRule = (double)(rules.FirstOrDefault(r => r.RuleName == "Peace_High")?.Points ?? 1.0m);
             var peaceImprovRule = (double)(rules.FirstOrDefault(r => r.RuleName == "Peace_Improvement")?.Points ?? 1.0m); 
             var behaviorImprovRule = (double)(rules.FirstOrDefault(r => r.RuleName == "Behavior_Improvement")?.Points ?? 2.0m);
             var emergencyPenalty = (double)(rules.FirstOrDefault(r => r.RuleName == "Emergency_Penalty")?.Points ?? -5.0m);
             var ritualBonus = (double)(rules.FirstOrDefault(r => r.RuleName == "Ritual_Bonus")?.Points ?? 2.0m);
             var stressPenalty = (double)(rules.FirstOrDefault(r => r.RuleName == "Stress_Penalty")?.Points ?? -2.0m);
             var missedCheckInPenalty = (double)(rules.FirstOrDefault(r => r.RuleName == "Missed_CheckIn_Penalty")?.Points ?? -3.0m);

             // Pre-fetch Yesterday's Data
             var yesterdayCheckIns = await context.UserCheckIns
                 .AsNoTracking()
                 .Include(x => x.CheckIn)
                 .Where(u => u.UserId == userId && u.CreatedOn.Date == yesterday)
                 .ToListAsync();

             // Helper to find rating by category keyword
             int GetRating(List<UserCheckIn> list, string keyword)
             {
                 var item = list.FirstOrDefault(x => x.CheckIn != null && x.CheckIn.Questions.Contains(keyword, StringComparison.OrdinalIgnoreCase));
                 return item?.Rating ?? 0;
             }

             // --- 1. TIME SPENT (Direct Add) ---
             // Rule: +1 per hour (Max 10)
             int hoursSpent = GetRating(checkIns, "hours");
             if (hoursSpent > 0)
             {
                 points += Math.Min(10, hoursSpent * timeRule);
             }

             // --- 2. DOG BEHAVIOR (Improvement Only) ---
             // Rule: +2 if improved vs yesterday
             int behaviorToday = GetRating(checkIns, "behavior");
             int behaviorYesterday = GetRating(yesterdayCheckIns, "behavior");
             
             // Only if yesterday exists (not null/0 logic, simply if record existed? User said: "IF (Yesterday != null AND Today > Yesterday)")
             // Since we use 0 as default, we check if behaviorYesterday > 0 or checks existed?
             // User prompt: "Fix: New users (yesterdayLog == null) get 0".
             // We can check if *any* checkin existed yesterday to know if we should compare?
             // Or simpler: if yesterdayCheckIns is empty, we can't improve.
             if (yesterdayCheckIns.Any() && behaviorToday > behaviorYesterday)
             {
                 points += behaviorImprovRule;
             }

             // --- 3. EMERGENCY (Direct Penalty) ---
             // Rule: -5 if emergency > 0
             // Keywords: Emergency, Neglect, alone (implied from previous code)
             var emergencyCheckIn = checkIns.FirstOrDefault(x => x.CheckIn != null && 
                (x.CheckIn.Questions.Contains("Emergency", StringComparison.OrdinalIgnoreCase) || 
                 x.CheckIn.Questions.Contains("Neglect", StringComparison.OrdinalIgnoreCase)));
             
             if (emergencyCheckIn != null && (emergencyCheckIn.Rating ?? 0) > 0)
             {
                 points += emergencyPenalty;
             }

             // --- 4. HUMAN PEACE (Hybrid Logic) ---
             // Rule: +1 for Stress Reduction (>=7) OR Improvement. -2 for High Stress (1-3).
             
             // Identify Peace check-in (avoiding "present")
             var peaceCheckIn = checkIns.FirstOrDefault(x => x.CheckIn != null 
                && x.CheckIn.Questions.Contains("peaceful", StringComparison.OrdinalIgnoreCase)
                && !x.CheckIn.Questions.Contains("present", StringComparison.OrdinalIgnoreCase));

             int peaceToday = peaceCheckIn?.Rating ?? 0;
             
             // Find yesterday's peace
             var peaceYesterdayItem = yesterdayCheckIns.FirstOrDefault(x => x.CheckIn != null 
                && x.CheckIn.Questions.Contains("peaceful", StringComparison.OrdinalIgnoreCase)
                && !x.CheckIn.Questions.Contains("present", StringComparison.OrdinalIgnoreCase));
             int peaceYesterday = peaceYesterdayItem?.Rating ?? 0;

             bool isHighPeace = peaceToday >= 7;
             bool isImproved = (yesterdayCheckIns.Any() && peaceToday > peaceYesterday);

             if (isHighPeace || isImproved)
             {
                 // Logic said "OR", usually that means max 1 point, or sum? 
                 // User Logic: "1. IF >= 7 -> +1. 2. OR IF > Yesterday -> +1."
                 // Code snippet: "if (isHighPeace || isImproved) dailyDelta += 1;" -> Implies SINGLE point for either condition.
                 points += peaceImprovRule; // +1
             }
             else if (peaceToday >= 1 && peaceToday < 4)
             {
                 // Stress Penalty: -2 if < 4 AND !RitualDone
                 // We need to check Rituals
                 bool didRitualToday = await context.UserActivitiesScores
                    .AnyAsync(x => x.UserId == userId && x.CreatedAt.Date == today);
                 
                 if (!didRitualToday)
                 {
                     points += stressPenalty;
                 }
             }

             // --- 5. RITUAL BONUS (Daily RitualsLogs) ---
             // Any daily ritual gives +2 total per day
             bool dailyRitualDone = await context.RitualLogs
                .AnyAsync(x => x.UserId == userId && x.CompletedAt.Date == today);
             if (dailyRitualDone) points += ritualBonus;

             // --- 6. ADDITIONAL ACTIVITY POINTS (Additive) ---
             // Individual points for other activities like Chakra Sync
             double activityScoresSum = (double)await context.UserActivitiesScores
                .Where(x => x.UserId == userId && x.CreatedAt.Date == today)
                .SumAsync(x => x.Score ?? 0);
             points += activityScoresSum;

             // --- 7. MISSED CHECK-IN ---
             var userJoinedDate = await context.Users.Where(u => u.UserId == userId).Select(u => u.CreatedOn).FirstOrDefaultAsync();
             if ((today - userJoinedDate.Date).TotalDays > 1)
             {
                 bool didCheckInYesterday = await context.UserCheckIns.AnyAsync(x => x.UserId == userId && x.CreatedOn.Date == yesterday);
                 if (!didCheckInYesterday) points += missedCheckInPenalty;
             }

             // --- 7. NEUTRAL SLIDERS ---
             // Presence, Connection, Energy -> 0 Points. (Implicitly handled by not adding them)

             // Global Cap
             if (points > 15) points = 15;

             return points;
        }

        private async Task CheckAndApplyMissedPenalties(Guid userId)
        {
            var today = DateTime.UtcNow.Date;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return;

            // Find the last legitimate check-in date (excluding today)
            var lastCheckIn = await _context.UserCheckIns
                .Where(u => u.UserId == userId && u.CreatedOn.Date < today && !u.IsMissed)
                .OrderByDescending(u => u.CreatedOn)
                .FirstOrDefaultAsync();

            DateTime lastDate = lastCheckIn?.CreatedOn.Date ?? user.CreatedOn.Date;
            
            // If user just joined today, do nothing
            if (lastDate >= today) return;

            // Loop from (LastDate + 1) to (Today - 1)
            // Example: Last = 10th. Today = 12th. Loop -> 11th.
            // Example: Last = 10th. Today = 11th. Loop -> None.
            
            var dog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == userId);
            if (dog == null) return; // Should not happen

            // We need a dummy CheckInId for the rows
            var dummyCheckInId = await _context.CheckIns.Select(c => c.CheckInId).FirstOrDefaultAsync();
            if (dummyCheckInId == Guid.Empty) return; // No checks in DB

            var daysMissed = (today - lastDate).TotalDays - 1;
            if (daysMissed <= 0) return;

            // Limit check to reasonable lookback (e.g. 30 days) to prevent massive loops on stale accounts
            if (daysMissed > 30) 
            {
               lastDate = today.AddDays(-31);
            }

            for (DateTime d = lastDate.AddDays(1); d < today; d = d.AddDays(1))
            {
                // Double check if record exists (e.g. maybe IsMissed=true already exists)
                bool exists = await _context.UserCheckIns.AnyAsync(u => u.UserId == userId && u.CreatedOn.Date == d);
                if (exists) continue;

                // Apply Penalty (-3)
                // Cap at 0
                double oldScore = dog.CurrentScore;
                dog.CurrentScore = Math.Max(0, dog.CurrentScore - 3);
                dog.UpdatedOn = DateTime.UtcNow;

                // Create Missed Record
                var missedRecord = new UserCheckIn
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CheckInId = dummyCheckInId,
                    Rating = 0,
                    CreatedOn = d, // Backdated
                    UpdatedOn = DateTime.UtcNow,
                    IsMissed = true,
                    DailyPointsChange = -3,
                    ScoreSnapshot = (int)dog.CurrentScore
                };

                await _context.UserCheckIns.AddAsync(missedRecord);
            }

            _context.Dogs.Update(dog);
            await _context.SaveChangesAsync();
        }

        [HttpGet("GetCheckInsByuserId")]
        public async Task<IActionResult> GetCheckInsByuserId(Guid userId)
        {
            try
            {
                // Ensure missed penalties are calculated before fetching
                await CheckAndApplyMissedPenalties(userId);

                var checkIns = await _context.UserCheckIns
                    .AsNoTracking()
                    .Include(c => c.CheckIn)
                    .Where(c => c.UserId==userId)
                    .Select(c => new
                    {
                        c.Id,
                        c.UserId,
                        c.CheckInId,
                        c.Rating,
                        c.CreatedOn,
                        c.UpdatedOn,
                        c.IsMissed,
                        c.DailyPointsChange,
                        c.ScoreSnapshot,
                        CheckIn = new
                        {
                            c.CheckIn.CheckInId,
                            c.CheckIn.Questions,
                            c.CheckIn.LowEnergyLabel,
                            c.CheckIn.HighEnergyLabel
                        }
                    })
                    .ToListAsync();

                if (checkIns == null || !checkIns.Any())
                    return Ok(ResponseHelper.Success(new List<object>(), "No check-ins found.", 200));

                return Ok(ResponseHelper.Success(checkIns, "Check-ins fetched successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while fetching check-ins: {ex.Message}", 500));
            }
        }


        [HttpGet("CheckDoneToday")]
        public async Task<IActionResult> CheckDoneToday([FromQuery] Guid userId, [FromQuery] DateTime? clientDate = null)
        {
            try
            {
                if (userId == Guid.Empty) return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));

                var today = clientDate?.Date ?? DateTime.UtcNow.Date;
                var exists = await _context.UserCheckIns
                    .AnyAsync(x => x.UserId == userId
                                && (x.ActivityDate == today || (x.ActivityDate == null && x.CreatedOn.Date == today)));

                return Ok(ResponseHelper.Success(new { done = exists }, "Check done status retrieved.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error checking done status: {ex.Message}", 500));
            }
        }
    }
}
