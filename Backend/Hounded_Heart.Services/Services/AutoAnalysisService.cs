using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public class AutoAnalysisService : IAutoAnalysisService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AutoAnalysisService> _logger;

        public AutoAnalysisService(AppDbContext context, ILogger<AutoAnalysisService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AutoAnalysisResult> GetAutoSuggestionsAsync(Guid userId, Guid dogId, DateTime date)
        {
            var result = new AutoAnalysisResult();
            var today = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
            var tomorrow = today.AddDays(1);

            // Time windows (UTC)
            var morningStart = today.AddHours(4);
            var morningEnd = today.AddHours(12);
            var afternoonStart = today.AddHours(12);
            var afternoonEnd = today.AddHours(17);
            var eveningStart = today.AddHours(17);
            var eveningEnd = tomorrow; // End of day

            // 1. Resolve Wellness Dog ID (FitBarkDogs Id)
            //    Step 1: Get explicitly linked FitBark device for this user's dog
            var deviceConnection = await _context.DeviceConnections
                .FirstOrDefaultAsync(dc => dc.UserId == userId && dc.DogId == dogId && dc.DeviceType.ToLower() == "fitbark");

            Guid resolvedDogId = dogId;
            if (deviceConnection != null && !string.IsNullOrWhiteSpace(deviceConnection.DeviceNumber))
            {
                // The DeviceNumber usually stores the FitBark DogSlug or Name based on frontend implementation
                var fitBarkDog = await _context.FitBarkDogs
                    .FirstOrDefaultAsync(d => d.DogSlug == deviceConnection.DeviceNumber || d.Name == deviceConnection.DeviceNumber);
                
                if (fitBarkDog != null)
                {
                    resolvedDogId = fitBarkDog.Id;
                    _logger.LogInformation($"AutoAnalysis: Resolved dogId via DeviceConnection for {deviceConnection.DeviceNumber} -> {resolvedDogId}");
                }
            }
            else 
            {
                // Step 2 fallback: Try direct match by Name in case DeviceConnection is missing
                var userDog = await _context.Dogs.FirstOrDefaultAsync(d => d.DogId == dogId && d.UserId == userId);
                if (userDog != null)
                {
                    var fitBarkDog = await _context.FitBarkDogs
                        .FirstOrDefaultAsync(d => d.Name.ToLower() == userDog.DogName.ToLower());
                    if (fitBarkDog != null)
                    {
                        resolvedDogId = fitBarkDog.Id;
                        _logger.LogInformation($"AutoAnalysis: Resolved dogId via Name match for {userDog.DogName} -> {resolvedDogId}");
                    }
                }
            }

            // 2. Fetch Data Sources
            var dogVitals = await _context.DogVitals
                .Where(v => v.DogId == resolvedDogId && v.TimestampUtc >= today && v.TimestampUtc < tomorrow)
                .ToListAsync();

            // Historical context for relative/incremental nudging
            var latestDogVitals = await _context.DogVitals
                .Where(v => v.DogId == resolvedDogId && v.TimestampUtc < tomorrow)
                .OrderByDescending(v => v.TimestampUtc)
                .Take(2)
                .ToListAsync();

            // CRITICAL FALLBACK: If resolvedDogId has no vitals at all, fall back to original dogId
            if (!latestDogVitals.Any())
            {
                _logger.LogWarning($"[AI-ANALYSIS] resolvedDogId {resolvedDogId} has NO vitals. Trying original dogId {dogId}.");
                if (resolvedDogId != dogId)
                {
                    latestDogVitals = await _context.DogVitals
                        .Where(v => v.DogId == dogId && v.TimestampUtc < tomorrow)
                        .OrderByDescending(v => v.TimestampUtc)
                        .Take(2)
                        .ToListAsync();
                    if (latestDogVitals.Any())
                    {
                        resolvedDogId = dogId;
                        _logger.LogInformation($"[AI-ANALYSIS] Fell back to original dogId {dogId} — found {latestDogVitals.Count} vitals.");
                        // Refresh today dogVitals with correct id
                        dogVitals = await _context.DogVitals
                            .Where(v => v.DogId == resolvedDogId && v.TimestampUtc >= today && v.TimestampUtc < tomorrow)
                            .ToListAsync();
                    }
                }
                
                // Final fallback: search any dog vitals linked to any dog owned by this user
                if (!latestDogVitals.Any())
                {
                    var userDogIds = await _context.Dogs
                        .Where(d => d.UserId == userId)
                        .Select(d => d.DogId)
                        .ToListAsync();
                    _logger.LogWarning($"[AI-ANALYSIS] Still no vitals. Searching ALL user dogs: [{string.Join(", ", userDogIds)}]");
                    
                    latestDogVitals = await _context.DogVitals
                        .Where(v => userDogIds.Contains(v.DogId) && v.TimestampUtc < tomorrow)
                        .OrderByDescending(v => v.TimestampUtc)
                        .Take(2)
                        .ToListAsync();
                    if (latestDogVitals.Any())
                    {
                        resolvedDogId = latestDogVitals.First().DogId;
                        _logger.LogInformation($"[AI-ANALYSIS] Final fallback: using DogId {resolvedDogId} from DogVitals table.");
                        dogVitals = await _context.DogVitals
                            .Where(v => v.DogId == resolvedDogId && v.TimestampUtc >= today && v.TimestampUtc < tomorrow)
                            .ToListAsync();
                    }
                }

                // ULTIMATE FALLBACK: FitBark dog ID doesn't live in Dogs table.
                // If user has a FitBark access token, directly use the latest fitbark-sourced vitals.
                if (!latestDogVitals.Any())
                {
                    var hasFitBarkToken = await _context.Users
                        .AnyAsync(u => u.UserId == userId && u.FitBarkAccessToken != null);

                    if (hasFitBarkToken)
                    {
                        _logger.LogWarning($"[AI-ANALYSIS] User {userId} has FitBark token — searching FitBark-sourced DogVitals directly.");

                        latestDogVitals = await _context.DogVitals
                            .Where(v => v.Source == "fitbark" && v.TimestampUtc < tomorrow)
                            .OrderByDescending(v => v.TimestampUtc)
                            .Take(2)
                            .ToListAsync();

                        if (latestDogVitals.Any())
                        {
                            resolvedDogId = latestDogVitals.First().DogId;
                            _logger.LogInformation($"[AI-ANALYSIS] Ultimate fallback: resolved via FitBark source vitals to DogId {resolvedDogId}.");
                            dogVitals = await _context.DogVitals
                                .Where(v => v.DogId == resolvedDogId && v.TimestampUtc >= today && v.TimestampUtc < tomorrow)
                                .ToListAsync();
                        }
                    }
                }
            }

            var currentDogVital = latestDogVitals.FirstOrDefault();
            var prevDogVital = latestDogVitals.Skip(1).FirstOrDefault();

            // Check if dog vitals have any useful data
            if (!dogVitals.Any())
            {
                _logger.LogWarning($"[AI-ANALYSIS] No dog vitals found for resolvedDogId {resolvedDogId} today. currentDogVital from history: {(currentDogVital != null ? "YES" : "NONE")}");
            }

            var humanVitals = await _context.HumanVitals
                .Where(v => v.UserId == userId && v.TimestampUtc >= today && v.TimestampUtc < tomorrow)
                .ToListAsync();

            var dogBaseline = await _context.DogBaselines.FirstOrDefaultAsync(b => b.DogId == resolvedDogId);
            var userBaseline = await _context.UserBaselines.FirstOrDefaultAsync(b => b.UserId == userId);

            var latestHumanVitals = await _context.HumanVitals
                .Where(v => v.UserId == userId && v.TimestampUtc < tomorrow)
                .OrderByDescending(v => v.TimestampUtc)
                .Take(2)
                .ToListAsync();
            var currentHumanVital = latestHumanVitals.FirstOrDefault();
            var prevHumanVital = latestHumanVitals.Skip(1).FirstOrDefault();

            var previousCheckIns = await _context.UserCheckIns
                .Where(c => c.UserId == userId && c.CreatedOn < tomorrow && c.Rating.HasValue)
                .GroupBy(c => c.CheckInId)
                .Select(g => g.OrderByDescending(c => c.CreatedOn).FirstOrDefault())
                .ToDictionaryAsync(c => c.CheckInId, c => c.Rating.Value);
            
            var chakraLogs = await _context.ChakraLogs
                .Where(l => l.UserId == userId && l.CreatedAt >= today && l.CreatedAt < tomorrow)
                .ToListAsync();

            var journalEntries = await _context.JournalEntries
                .Where(j => j.UserId == userId && j.CreatedOn >= today && j.CreatedOn < tomorrow && !j.IsDeleted)
                .ToListAsync();

            var wellnessChecks = await _context.WellnessChecks
                .Where(w => w.UserId == userId && w.CreatedAt >= today && w.CreatedAt < tomorrow)
                .ToListAsync();

            var allCheckIns = await _context.CheckIns.Where(c => !c.IsDeleted).ToListAsync();
            var allRituals = await _context.Rituals.ToListAsync();
            var allActivities = await _context.BondingActivities.ToListAsync();

            // ── HARD GATE: No vitals = no AI suggestions ─────────────────────
            // If neither dog vitals nor human vitals have been synced yet
            // (no device connected / no bond sync score formed), return empty.
            bool hasAnyDogVitals = dogVitals.Any() || currentDogVital != null;
            bool hasAnyHumanVitals = humanVitals.Any() || currentHumanVital != null;
            if (!hasAnyDogVitals && !hasAnyHumanVitals)
            {
                _logger.LogInformation($"AutoAnalysis: No vitals found for userId={userId}, dogId={resolvedDogId}. Returning empty suggestions.");
                return result; // Empty — no device, no data, no suggestions
            }

            // ==========================================
            // SECTION 1: CHECK-IN SLIDERS — ALL 7 ITEMS ALWAYS RETURNED
            // ==========================================
            // Scores build incrementally: 1 on first vitals, +1/-1 each cycle based on vitals delta.
            // If no vitals yet: return 5 (neutral) so the slider is always visible in the UI.

            _logger.LogInformation($"[AI-ANALYSIS] ================== STARTING AI ANALYSIS ==================");
            _logger.LogInformation($"[AI-ANALYSIS] User Baseline: {(userBaseline != null ? "YES" : "NO")}, Dog Baseline: {(dogBaseline != null ? "YES" : "NO")}");
            _logger.LogInformation($"[AI-ANALYSIS] Current Dog Vital: {(currentDogVital != null ? $"Activity={currentDogVital.ActivityScore}" : "NONE")}");
            _logger.LogInformation($"[AI-ANALYSIS] Current Human Vital: {(currentHumanVital != null ? $"Steps={currentHumanVital.Steps}" : "NONE")}");

            // Helper: add suggestion for a specific CheckIn (always, with question text)
            void SuggestCheckIn(Guid checkInId, string question, int rating, string reason)
            {
                _logger.LogInformation($"[AI-ANALYSIS] CheckIn '{question.Substring(0, Math.Min(40, question.Length))}' → Score: {rating}. Reason: {reason}");
                result.CheckInSuggestions.Add(new CheckInSuggestion
                {
                    CheckInId  = checkInId,
                    Question   = question,
                    SuggestedRating = Math.Clamp(rating, 1, 10),
                    Reason     = reason
                });
            }

            // Iterate over every CheckIn and compute a rating for it
            foreach (var checkIn in allCheckIns)
            {
                string q = checkIn.Questions ?? "";
                Guid   id = checkIn.CheckInId;
                // As requested, progress bars start from 0 each day instead of using the previous score
                int prevScore = 0;

                // ── Dog's behavior ───────────────────────────────────────────
                // Logic: Dog activities ARE arriving → dog is active → behaviour is good → nudge +1 each cycle.
                if (q.Contains("behavior", StringComparison.OrdinalIgnoreCase))
                {
                    if (dogVitals.Any(v => v.ActivityScore > 0 || v.MinActive > 0 || v.MinPlay > 0))
                    {
                        // Dog is active today
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        int totalActivity = dogVitals.Sum(v => v.ActivityScore);
                        SuggestCheckIn(id, q, score, $"Dog is active today (total activity={totalActivity}). Behaviour score: {score}.");
                    }
                    else if (currentDogVital != null)
                    {
                        SuggestCheckIn(id, q, prevScore, "Dog vitals received; resting state — score 0.");
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for dog vitals data.");
                    }
                }
                // ── Quality time (human + dog both active same day) ───────────
                // Logic: if human has ANY steps/activity AND dog has ANY activity on same day → they were
                // together → nudge +1. No strict time-window needed.
                else if (q.Contains("quality", StringComparison.OrdinalIgnoreCase) || q.Contains("hours", StringComparison.OrdinalIgnoreCase))
                {
                    bool humanActiveToday = humanVitals.Any(h => (h.Steps ?? 0) > 0 || (h.ActiveMinutes ?? 0) > 0 || h.Calories > 0);
                    bool dogActiveToday   = dogVitals.Any(d => d.ActivityScore > 0 || (d.MinActive ?? 0) > 0 || (d.MinPlay ?? 0) > 0);

                    if (humanActiveToday && dogActiveToday)
                    {
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        int humanSteps  = (int)(humanVitals.Max(h => h.Steps ?? 0));
                        int dogActivity = dogVitals.Sum(d => d.ActivityScore);
                        SuggestCheckIn(id, q, score, $"Human active (steps={humanSteps}) and dog active (activity={dogActivity}) today. Score: {score}.");
                    }
                    else if (dogActiveToday || humanActiveToday)
                    {
                        SuggestCheckIn(id, q, prevScore, "Partial activity detected; waiting for both human and dog to be active together.");
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for human and dog vitals to detect shared activity.");
                    }
                }
                // ── How present (app interactions) ──────────────────────────
                else if (q.Contains("present", StringComparison.OrdinalIgnoreCase))
                {
                    int interactions = chakraLogs.Count + journalEntries.Count + wellnessChecks.Count;
                    if (interactions > 0)
                    {
                        int score = Math.Clamp(interactions * 2, 0, 10);
                        SuggestCheckIn(id, q, score, $"Based on {interactions} app engagement(s) today (journal, chakra, wellness).");
                    }
                    else
                    {
                        int score = Math.Clamp(prevScore + (hasAnyDogVitals || hasAnyHumanVitals ? 1 : 0), 0, 10);
                        SuggestCheckIn(id, q, score, "No journal/chakra/wellness activity today; nudged from vitals presence.");
                    }
                }
                // ── Spiritual connection ──────────────────────────────────────
                // Logic: dog playing (happy) OR shared events (chakra/journal/wellness) → nudge +1.
                // Chakra HarmonyScore takes priority if available.
                else if (q.Contains("connection", StringComparison.OrdinalIgnoreCase) || q.Contains("spiritual", StringComparison.OrdinalIgnoreCase))
                {
                    var latestChakra = chakraLogs.OrderByDescending(c => c.CreatedAt).FirstOrDefault();
                    if (latestChakra != null && latestChakra.HarmonyScore.HasValue)
                    {
                        int score = latestChakra.HarmonyScore.Value <= 1.0f
                            ? (int)Math.Round(latestChakra.HarmonyScore.Value * 10)
                            : (int)Math.Round(latestChakra.HarmonyScore.Value);
                        SuggestCheckIn(id, q, Math.Clamp(score, 0, 10), "Derived from your latest Nerve Center Sync harmony score.");
                    }
                    else
                    {
                        bool dogPlayingToday  = dogVitals.Any(d => (d.MinPlay ?? 0) > 0);
                        bool sharedEventsToday = chakraLogs.Any() || journalEntries.Any() || wellnessChecks.Any();

                        if (dogPlayingToday || sharedEventsToday)
                        {
                            int score = Math.Clamp(prevScore + 1, 0, 10);
                            string why = dogPlayingToday && sharedEventsToday
                                ? "Dog is playing (happy) and shared events detected today"
                                : dogPlayingToday
                                    ? $"Dog play time detected (MinPlay>0) — dog is happy"
                                    : $"{chakraLogs.Count + journalEntries.Count + wellnessChecks.Count} shared event(s) today";
                            SuggestCheckIn(id, q, score, $"{why}. Score: {score}.");
                        }
                        else
                        {
                            SuggestCheckIn(id, q, prevScore, "No dog play or shared events today.");
                        }
                    }
                }
                // ── Energy level (human + dog combined activity) ─────────────
                else if (q.Contains("energy", StringComparison.OrdinalIgnoreCase))
                {
                    if (currentHumanVital != null && currentDogVital != null)
                    {
                        double currActivity = (currentHumanVital.Steps ?? 0) + ((currentHumanVital.ActiveMinutes ?? 0) * 10) + currentDogVital.ActivityScore;
                        double prevActivity = prevHumanVital != null && prevDogVital != null
                            ? (prevHumanVital.Steps ?? 0) + ((prevHumanVital.ActiveMinutes ?? 0) * 10) + prevDogVital.ActivityScore
                            : 0;
                        if (prevActivity == 0)
                        {
                            SuggestCheckIn(id, q, 0, "First combined vitals received; starting score at 0.");
                        }
                        else
                        {
                            double delta = (currActivity - prevActivity) / Math.Max(1, prevActivity);
                            int nudge = delta > 0 ? 1 : (delta < 0 ? -1 : 0);
                            int score = Math.Clamp(prevScore + nudge, 0, 10);
                            SuggestCheckIn(id, q, score, $"Activity delta ({delta:P1}) → score {score}.");
                        }
                    }
                    else if (currentDogVital != null || currentHumanVital != null)
                    {
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        SuggestCheckIn(id, q, score, "Partial vitals synced today; score 1.");
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for vitals data to compute energy score.");
                    }
                }
                // ── Emergency / Neglect ───────────────────────────────────────
                else if (q.Contains("emergency", StringComparison.OrdinalIgnoreCase) || q.Contains("neglect", StringComparison.OrdinalIgnoreCase))
                {
                    if (currentDogVital != null)
                    {
                        if (currentDogVital.ActivityScore < 100)
                        {
                            int score = Math.Clamp(prevScore + 2, 0, 10);
                            SuggestCheckIn(id, q, score, "Extremely low dog activity detected.");
                        }
                        else
                        {
                            int score = Math.Clamp(prevScore - 1, 0, 10);
                            SuggestCheckIn(id, q, score, "Normal dog activity detected.");
                        }
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for dog vitals to assess emergency/neglect status.");
                    }
                }
                // ── Emotional balance (Stress + HRV) ─────────────────────────
                else if (q.Contains("emotionally", StringComparison.OrdinalIgnoreCase) || q.Contains("emotional", StringComparison.OrdinalIgnoreCase))
                {
                    if (currentHumanVital != null && (currentHumanVital.StressScore > 0 || currentHumanVital.HRV > 0))
                    {
                        double currStress = currentHumanVital.StressScore ?? 0;
                        double currHrv    = currentHumanVital.HRV ?? 0;
                        double prevStress = prevHumanVital?.StressScore ?? 0;
                        double prevHrv    = prevHumanVital?.HRV ?? 0;

                        if (prevHumanVital == null || (prevStress == 0 && prevHrv == 0))
                        {
                            SuggestCheckIn(id, q, 0, "First stress/HRV vital received; starting score at 0.");
                        }
                        else
                        {
                            double stressDelta = prevStress > 0 ? (currStress - prevStress) / prevStress : 0;
                            double hrvDelta    = prevHrv    > 0 ? (currHrv    - prevHrv)    / prevHrv    : 0;
                            bool improving  = stressDelta < 0 || hrvDelta > 0;
                            bool worsening  = stressDelta > 0 || hrvDelta < 0;
                            int nudge = improving ? 1 : (worsening ? -1 : 0);
                            int score = Math.Clamp(prevScore + nudge, 0, 10);
                            SuggestCheckIn(id, q, score, $"Stress/HRV delta → score {score}.");
                        }
                    }
                    else
                    {
                        // No HRV/stress from Fitbit (Free tier) → nudge +1 each day vitals arrive at all
                        int score = Math.Clamp(prevScore + (hasAnyHumanVitals ? 1 : 0), 0, 10);
                        SuggestCheckIn(id, q, score, "No stress/HRV data (Fitbit Free tier); nudged from human vitals presence.");
                    }
                }
                else
                {
                    // Unknown / new check-in type — always include with neutral/incremental score
                    int score = Math.Clamp(prevScore + (hasAnyDogVitals || hasAnyHumanVitals ? 1 : 0), 0, 10);
                    SuggestCheckIn(id, q, score, "General check-in; nudged from today's vitals data.");
                }
            }

            // ==========================================
            // SECTION 2: DAILY RITUALS (6 Items)
            // ==========================================

            // Initialize all rituals to false
            foreach (var r in allRituals)
            {
                result.RitualSuggestions.Add(new RitualSuggestion
                {
                    RitualId = r.Id,
                    RitualTitle = r.Title,
                    Suggested = false,
                    Reason = "No specific signals detected for this time period."
                });
            }

            void SuggestRitual(string title, string reason)
            {
                var ritual = result.RitualSuggestions.FirstOrDefault(r => r.RitualTitle.Equals(title, StringComparison.OrdinalIgnoreCase));
                if (ritual != null)
                {
                    ritual.Suggested = true;
                    ritual.Reason = reason;
                }
            }

            // Morning Signals (04:00 - 11:59 UTC)
            bool hasMorningVitals = dogVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && ((v.MinActive ?? 0) > 0 || (v.MinPlay ?? 0) > 0)) ||
                                    humanVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && ((v.Steps ?? 0) > 0 || (v.ActiveMinutes ?? 0) > 0));
            bool hasMorningJournal = journalEntries.Any(j => j.CreatedOn >= morningStart && j.CreatedOn < morningEnd);
            bool hasMorningWellness = wellnessChecks.Any(w => w.CreatedAt >= morningStart && w.CreatedAt < morningEnd);

            Console.WriteLine($"[DEBUG] Total wellness checks found today: {wellnessChecks.Count}");
            
            var allTimeChecks = await _context.WellnessChecks.Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt).Take(5).ToListAsync();
            Console.WriteLine($"[DEBUG] Latest 5 wellness checks all-time for this user:");
            foreach (var c in allTimeChecks) {
                Console.WriteLine($"[DEBUG] ID: {c.Id} Type: {c.Type} CreatedAt: {c.CreatedAt} Answers: {c.AnswersJson}");
            }
            
            foreach (var wc in wellnessChecks)
            {
                Console.WriteLine($"[DEBUG] WellnessCheck ID: {wc.Id}, Type: '{wc.Type}', CreatedAt: {wc.CreatedAt}, AnswersJson: {wc.AnswersJson}");
            }

            if (hasMorningVitals || hasMorningJournal || hasMorningWellness)
            {
                string reason = "Morning activity detected (vitals, journal, or wellness check).";
                SuggestRitual("Gratitude Moment", reason);
                SuggestRitual("Energy Check-in", reason);
                SuggestRitual("Morning Intention Setting", reason);
            }

            // Afternoon Signals (12:00 - 16:59 UTC)
            bool hasAfternoonVitals = dogVitals.Any(v => v.TimestampUtc >= afternoonStart && v.TimestampUtc < afternoonEnd && (v.ActivityScore > 0 || (v.MinActive ?? 0) > 0 || (v.MinPlay ?? 0) > 0)) ||
                                      humanVitals.Any(v => v.TimestampUtc >= afternoonStart && v.TimestampUtc < afternoonEnd && ((v.Steps ?? 0) > 0 || (v.ActiveMinutes ?? 0) > 0));

            if (hasAfternoonVitals)
                SuggestRitual("Mindful Walk", "Afternoon activity detected in vitals data (walk or play assumed).");

            // Evening Signals (17:00 - 23:59 UTC)
            bool hasEveningVitals = dogVitals.Any(v => v.TimestampUtc >= eveningStart && v.TimestampUtc < eveningEnd && (v.ActivityScore > 0 || (v.MinActive ?? 0) > 0 || (v.MinPlay ?? 0) > 0)) ||
                                    humanVitals.Any(v => v.TimestampUtc >= eveningStart && v.TimestampUtc < eveningEnd && ((v.Steps ?? 0) > 0 || (v.ActiveMinutes ?? 0) > 0));
            bool hasEveningJournal = journalEntries.Any(j => j.CreatedOn >= eveningStart && j.CreatedOn < eveningEnd);
            bool hasEveningWellness = wellnessChecks.Any(w => w.CreatedAt >= eveningStart && w.CreatedAt < eveningEnd);

            if (hasEveningVitals || hasEveningJournal || hasEveningWellness)
            {
                string eveningReason = "Evening activity detected (vitals, journal, or wellness check).";
                SuggestRitual("Bedtime Blessing", eveningReason);
                SuggestRitual("Evening Reflection", eveningReason);
            }

            // ==========================================
            // SECTION 3: BONDING ACTIVITIES (~21 Items)
            // ==========================================

            // Initialize all activities to false
            foreach (var a in allActivities)
            {
                result.ActivitySuggestions.Add(new ActivitySuggestion
                {
                    ActivityId = a.ActivityId,
                    ActivityName = a.ActivityName,
                    Suggested = false,
                    Reason = "Waiting for matching vitals or app events."
                });
            }

            void SuggestActivity(string name, string reason)
            {
                var activity = result.ActivitySuggestions.FirstOrDefault(a => a.ActivityName.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (activity != null)
                {
                    activity.Suggested = true;
                    activity.Reason = reason;
                }
            }

            // 1. Morning Walk
            bool hasMorningWalk = dogVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && ((v.MinActive ?? 0) > 5 || (v.MinPlay ?? 0) > 5)) &&
                                  humanVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && (v.Steps ?? 0) > 500);
            if (hasMorningWalk) SuggestActivity("Morning Walk", "Morning activity spikes detected for both human and dog.");

            // 2. Nature Walk (Morning Walk + GPS)
            bool hasGPS = dogVitals.Any(v => v.Latitude.HasValue && v.Longitude.HasValue);
            if (hasMorningWalk && hasGPS) SuggestActivity("Nature Walk", "Morning walk detected with outdoor GPS locations.");

            // 3. Outdoor Adventure
            bool hasEnvOutdoor = wellnessChecks.Any(w => w.Type == "Environment" && w.AnswersJson != null && (w.AnswersJson.Contains("outdoor", StringComparison.OrdinalIgnoreCase) || w.AnswersJson.Contains("outside", StringComparison.OrdinalIgnoreCase) || w.AnswersJson.Contains("Walking area", StringComparison.OrdinalIgnoreCase) || w.AnswersJson.Contains("Backyard", StringComparison.OrdinalIgnoreCase)));
            if (hasEnvOutdoor || hasGPS) SuggestActivity("Outdoor Adventure", "Outdoor environment check or GPS location detected.");

            // 4. Play Fetch
            bool hasFetch = dogVitals.Any(v => v.TimestampUtc >= afternoonStart && v.TimestampUtc < afternoonEnd && (v.MinPlay ?? 0) > 10) &&
                            humanVitals.Any(v => v.TimestampUtc >= afternoonStart && v.TimestampUtc < afternoonEnd && ((v.ActiveMinutes ?? 0) > 0 || (v.Steps ?? 0) > 100));
            if (hasFetch) SuggestActivity("Play Fetch", "Afternoon play bursts detected with human activity.");

            // 5. Playtime
            int totalMinPlay = dogVitals.Sum(v => v.MinPlay ?? 0);
            if (totalMinPlay > 15) SuggestActivity("Playtime", "Substantial dog play time detected today.");

            // 6. Mindful Walk (Activity)
            if (hasAfternoonVitals) SuggestActivity("Mindful Walk", "Afternoon walk pattern detected in vitals data.");

            // ── Parse Dog Check-in answers (Type=DogCheckIn) ──────────────────────────
            // Q1=relaxed, Q2=usual energy greeting, Q3=seeking closeness, Q4=playful,
            // Q5=appetite normal, Q6=slept well, Q7=routine changed, Q8=breathe calmly together,
            // Q9=settle/sigh/relax near you, Q10=signs of stress
            var latestDogCheckin = wellnessChecks
                .Where(w => w.Type.Equals("DogCheckIn", StringComparison.OrdinalIgnoreCase) && w.AnswersJson != null)
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefault();

            Dictionary<string, string> dogCheckinAnswers = new();
            if (latestDogCheckin?.AnswersJson != null)
            {
                Console.WriteLine($"[DEBUG] Found DogCheckIn AnswersJson: {latestDogCheckin.AnswersJson}");
                try { dogCheckinAnswers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(latestDogCheckin.AnswersJson) ?? new(); }
                catch (Exception ex) { Console.WriteLine($"[DEBUG] Exception deserializing DogCheckIn AnswersJson: {ex.Message}"); }
            }
            else
            {
                Console.WriteLine("[DEBUG] No DogCheckIn found or AnswersJson is null.");
            }

            foreach (var kvp in dogCheckinAnswers)
            {
                Console.WriteLine($"[DEBUG] DogCheckIn parsed -> Key: '{kvp.Key}' Value: '{kvp.Value}'");
            }

            bool dogIsRelaxed       = dogCheckinAnswers.TryGetValue("1", out var dq1) && dq1.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogGreetedNormally = dogCheckinAnswers.TryGetValue("2", out var dq2) && dq2.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogSeeksCloseness  = dogCheckinAnswers.TryGetValue("3", out var dq3) && dq3.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogIsPlayful       = dogCheckinAnswers.TryGetValue("4", out var dq4) && dq4.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogAteNormally     = dogCheckinAnswers.TryGetValue("5", out var dq5) && dq5.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogSleptWell       = dogCheckinAnswers.TryGetValue("6", out var dq6) && dq6.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool routineChanged     = dogCheckinAnswers.TryGetValue("7", out var dq7) && dq7.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool humanBreathedCalm  = dogCheckinAnswers.TryGetValue("8", out var dq8) && dq8.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogSettledNearYou  = dogCheckinAnswers.TryGetValue("9", out var dq9) && dq9.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogShownStress     = dogCheckinAnswers.TryGetValue("10", out var dq10) && dq10.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool dogCheckinSubmitted = latestDogCheckin != null;

            // ── Parse Environment Check-in answers (Type=Environment) ─────────────────
            // Q1=space type, Q2=easy to move, Q3=clutter, Q4=changes, Q5=resting spot,
            // Q6=clear path, Q7=calm/chaotic, Q8=enough room, Q9=good lighting, Q10=noise level
            var latestEnvCheckin = wellnessChecks
                .Where(w => w.Type.Equals("Environment", StringComparison.OrdinalIgnoreCase) && w.AnswersJson != null)
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefault();

            Dictionary<string, string> envAnswers = new();
            if (latestEnvCheckin?.AnswersJson != null)
            {
                try { envAnswers = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(latestEnvCheckin.AnswersJson) ?? new(); }
                catch { envAnswers = new(); }
            }

            envAnswers.TryGetValue("1", out var envSpace);    // Living room / Bedroom / Backyard / Walking area / Other
            envAnswers.TryGetValue("7", out var envCalmness); // Calm / Mixed / Chaotic
            envAnswers.TryGetValue("8", out var envRoomEnough); // Yes / No
            envAnswers.TryGetValue("10", out var envNoise);   // Quiet / Some noise / Noisy

            bool envIsCalm   = envCalmness != null && envCalmness.Equals("Calm", StringComparison.OrdinalIgnoreCase);
            bool envIsQuiet  = envNoise != null && envNoise.Equals("Quiet", StringComparison.OrdinalIgnoreCase);
            bool envHasRoom  = envRoomEnough != null && envRoomEnough.Equals("Yes", StringComparison.OrdinalIgnoreCase);
            bool envOutdoor  = envSpace != null && (envSpace.Contains("Backyard", StringComparison.OrdinalIgnoreCase) || envSpace.Contains("Walking area", StringComparison.OrdinalIgnoreCase));

            // 7. Cuddle Time — Dog seeks closeness + dog settled near you + both are calm
            if (dogSeeksCloseness && dogSettledNearYou)
                SuggestActivity("Cuddle Time", "Dog check-in: dog seeking closeness and settled/relaxed near you.");
            else if (dogIsRelaxed && dogSettledNearYou && dogVitals.Any(v => (v.MinRest ?? 0) > 60))
                SuggestActivity("Cuddle Time", "Dog resting calmly; check-in confirms relaxed state near you.");

            // 8. Belly Rubs — Dog relaxed + human calm + environment calm
            if (dogIsRelaxed && dogSettledNearYou && (envIsCalm || !envAnswers.Any()))
                SuggestActivity("Belly Rubs", "Dog check-in shows dog relaxed and settling near you in a calm space.");

            // 9. Feeding Time — Dog ate normally (from check-in) OR dog vitals exist today
            if (dogAteNormally)
                SuggestActivity("Feeding Time", "Dog check-in confirms appetite is normal today.");
            else if (dogCheckinSubmitted)
                SuggestActivity("Feeding Time", "Dog check-in submitted today; feeding routine assumed.");
            else if (dogVitals.Any(v => v.ActivityScore > 0 || (v.MinActive ?? 0) > 0 || (v.MinRest ?? 0) > 0))
                SuggestActivity("Feeding Time", "Dog vitals recorded today; feeding routine assumed.");

            // 10. Grooming — Dog check-in submitted (any check-in = owner is engaged with dog care)
            if (dogCheckinSubmitted)
                SuggestActivity("Grooming", "Dog check-in submitted today; grooming as part of routine care.");

            // 11. Training Session — Dog is playful + environment has room OR sensor alternating pattern
            bool hasTraining = dogVitals.Any(v => (v.MinActive ?? 0) > 5 && (v.MinPlay ?? 0) > 5 && (v.MinRest ?? 0) < 30);
            if ((dogIsPlayful && envHasRoom) || hasTraining)
                SuggestActivity("Training Session", dogIsPlayful && envHasRoom
                    ? "Dog check-in: dog is playful and space has enough room for training."
                    : "Alternating active/rest patterns detected typical of training.");

            // 12. New Trick Practice — Dog is playful + not stressed + environment has room
            if (dogIsPlayful && !dogShownStress && envHasRoom)
                SuggestActivity("New Trick Practice", "Dog check-in: dog is playful and engaged, good conditions for training.");

            // 13. Meditation Together — Human breathed calmly with dog + environment is calm & quiet
            if (humanBreathedCalm && (envIsCalm || envIsQuiet))
                SuggestActivity("Meditation Together", "Dog check-in: you took a calm breathing moment with your dog in a quiet environment.");
            else if (chakraLogs.Any())
                SuggestActivity("Meditation Together", "Nerve Center Sync (Chakra) session completed today.");

            // 14. Synchronized Breathing — Same as Meditation but focuses on breath
            if (humanBreathedCalm)
                SuggestActivity("Synchronized Breathing", "Dog check-in: you took a calm breathing moment with your dog today.");
            else if (chakraLogs.Any())
                SuggestActivity("Synchronized Breathing", "Nerve Center Sync session completed today.");

            // 15. Heart-to-Heart Reflection — Dog seeks closeness + human breathed calmly OR chakra/journal
            if (dogSeeksCloseness && humanBreathedCalm)
                SuggestActivity("Heart-to-Heart Reflection", "Dog check-in: dog sought closeness and you shared a calm breathing moment.");
            else if (chakraLogs.Any() || hasEveningJournal)
                SuggestActivity("Heart-to-Heart Reflection", "Nerve Center Sync or evening journal completed.");

            // 16. Nerve Center Sync
            if (chakraLogs.Any()) SuggestActivity("Nerve Center Sync", "Nerve Center Sync log exists for today.");

            // 17. Gratitude Moment
            if (hasMorningJournal || hasMorningWellness || dogSleptWell)
                SuggestActivity("Gratitude Moment", dogSleptWell
                    ? "Dog check-in: dog slept well — a great morning to start with gratitude."
                    : "Morning journal or wellness check completed.");

            // 18. Energy Check-in
            if (humanVitals.Any())
                SuggestActivity("Energy Check-in", dogGreetedNormally
                    ? "Human vitals synced and dog greeted you with usual energy today."
                    : "Human vitals data synced today.");

            // 19. Morning Intention Setting
            if (hasMorningJournal || hasMorningWellness || dogSleptWell)
                SuggestActivity("Morning Intention Setting", dogSleptWell
                    ? "Dog check-in: dog rested well — good conditions for setting a positive morning intention."
                    : "Morning journal or wellness check completed.");

            // 20. Bedtime Blessing
            if (hasEveningJournal || hasEveningWellness || (dogSettledNearYou && dogIsRelaxed))
                SuggestActivity("Bedtime Blessing", (dogSettledNearYou && dogIsRelaxed)
                    ? "Dog check-in: dog settled and relaxed near you — lovely moment for a bedtime blessing."
                    : "Evening journal or wellness check completed.");

            // 21. Evening Reflection
            if (hasEveningJournal || hasEveningWellness || dogShownStress || routineChanged)
                SuggestActivity("Evening Reflection", dogShownStress
                    ? "Dog check-in: dog showed signs of stress today — reflect on what may have caused it."
                    : routineChanged
                        ? "Dog check-in: routine changed today — good time for an evening reflection."
                        : "Evening journal or wellness check completed.");


            // Persist the generated suggestions to UserCheckIns so subsequent cycles build upon them
            foreach (var suggestion in result.CheckInSuggestions)
            {
                var existingCheckIn = await _context.UserCheckIns
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.DogId == resolvedDogId && c.CheckInId == suggestion.CheckInId && c.CreatedOn >= today && c.CreatedOn < tomorrow);
                
                if (existingCheckIn != null)
                {
                    existingCheckIn.Rating = suggestion.SuggestedRating;
                    existingCheckIn.UpdatedOn = DateTime.UtcNow;
                }
                else
                {
                    _context.UserCheckIns.Add(new Hounded_Heart.Models.Dtos.UserCheckIn
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        DogId = resolvedDogId,
                        CheckInId = suggestion.CheckInId,
                        Rating = suggestion.SuggestedRating,
                        CreatedOn = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();

            return result;
        }
    }

    public static class UserBaselineExtensions
    {
        public static double AvgActiveMinutes(this UserBaselines baseline)
        {
            // Just a helper to return a non-null active minutes or proxy if missing
            return baseline.AvgCalories ?? 1.0; // fallback if ActiveMinutes not explicitly in UserBaselines
        }
    }
}
