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

            var todayCheckIns = await _context.UserCheckIns
                .Where(c => c.UserId == userId && c.CreatedOn >= today && c.CreatedOn < tomorrow && c.Rating.HasValue)
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
                int prevScore = todayCheckIns.TryGetValue(id, out var rating) ? rating : 0;

                // ── Dog's behavior ───────────────────────────────────────────
                // Logic: Dog activities ARE arriving → dog is active → behaviour is good → nudge +1 each cycle.
                if (q.Contains("behavior", StringComparison.OrdinalIgnoreCase))
                {
                    if (currentDogVital != null && prevDogVital != null && currentDogVital.ActivityScore > prevDogVital.ActivityScore)
                    {
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        SuggestCheckIn(id, q, score, $"Dog activity increased ({currentDogVital.ActivityScore} > {prevDogVital.ActivityScore}) → score {score}.");
                    }
                    else if (dogVitals.Any(v => v.ActivityScore > 0 || v.MinActive > 0 || v.MinPlay > 0))
                    {
                        int score = Math.Clamp(prevScore == 0 ? 1 : prevScore, 0, 10);
                        SuggestCheckIn(id, q, score, $"Dog is active today. Score: {score}.");
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
                // Logic: if human and dog vitals arrive around the same duration, nudge +1.
                else if (q.Contains("quality", StringComparison.OrdinalIgnoreCase) || q.Contains("hours", StringComparison.OrdinalIgnoreCase))
                {
                    if (currentHumanVital != null && currentDogVital != null && Math.Abs((currentHumanVital.TimestampUtc - currentDogVital.TimestampUtc).TotalMinutes) <= 120 && ((currentHumanVital.Steps ?? 0) > 0 || (currentHumanVital.ActiveMinutes ?? 0) > 0) && (currentDogVital.ActivityScore > 0 || (currentDogVital.MinActive ?? 0) > 0 || (currentDogVital.MinPlay ?? 0) > 0))
                    {
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        SuggestCheckIn(id, q, score, $"Shared activity duration detected → score {score}.");
                    }
                    else if (humanVitals.Any(h => (h.Steps ?? 0) > 0 || (h.ActiveMinutes ?? 0) > 0) && dogVitals.Any(d => d.ActivityScore > 0 || (d.MinActive ?? 0) > 0))
                    {
                        int score = Math.Clamp(prevScore == 0 ? 1 : prevScore, 0, 10);
                        SuggestCheckIn(id, q, score, $"Partial shared activity today. Score: {score}.");
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for both human and dog to be active together in same duration.");
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
                    else if (currentHumanVital != null && currentDogVital != null && ((currentHumanVital.Steps ?? 0) > 0 || (currentHumanVital.ActiveMinutes ?? 0) > 0) && (currentDogVital.ActivityScore > 0 || (currentDogVital.MinActive ?? 0) > 0))
                    {
                        int score = Math.Clamp(prevScore + 1, 0, 10);
                        SuggestCheckIn(id, q, score, $"User and dog activity matched in vitals → score {score}.");
                    }
                    else
                    {
                        int score = Math.Clamp(prevScore, 0, 10);
                        SuggestCheckIn(id, q, score, "No journal/chakra/wellness activity or matching vitals today.");
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
                        bool vitalsMatched = currentHumanVital != null && currentDogVital != null && (currentDogVital.MinPlay ?? 0) > 0 && ((currentHumanVital.Steps ?? 0) > 0 || (currentHumanVital.ActiveMinutes ?? 0) > 0);

                        if (vitalsMatched)
                        {
                            int score = Math.Clamp(prevScore + 1, 0, 10);
                            SuggestCheckIn(id, q, score, $"Spiritual connection enhanced by matched play and human activity → score {score}.");
                        }
                        else if (dogPlayingToday || sharedEventsToday)
                        {
                            int score = Math.Clamp(prevScore == 0 ? 1 : prevScore, 0, 10);
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
                        if (currActivity > prevActivity)
                        {
                            int score = Math.Clamp(prevScore + 1, 0, 10);
                            SuggestCheckIn(id, q, score, $"Energy (combined activity) increased → score {score}.");
                        }
                        else
                        {
                            SuggestCheckIn(id, q, prevScore, "Energy steady or decreased; score remains.");
                        }
                    }
                    else if (humanVitals.Any(h => (h.Steps ?? 0) > 0) || dogVitals.Any(d => d.ActivityScore > 0))
                    {
                        int score = Math.Clamp(prevScore == 0 ? 1 : prevScore, 0, 10);
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
                    if (currentDogVital != null && prevDogVital != null)
                    {
                        // If dog's activity score is very low continuously, increase emergency score
                        if (currentDogVital.ActivityScore < 50 && prevDogVital.ActivityScore < 50)
                        {
                            int score = Math.Clamp(prevScore + 1, 0, 10);
                            SuggestCheckIn(id, q, score, $"Persistent low dog activity detected → score {score}.");
                        }
                        else if (currentDogVital.ActivityScore >= 50)
                        {
                            int score = Math.Clamp(prevScore - 1, 0, 10);
                            SuggestCheckIn(id, q, score, "Normal dog activity detected; decreasing emergency score.");
                        }
                        else
                        {
                            SuggestCheckIn(id, q, prevScore, "Dog activity monitored.");
                        }
                    }
                    else if (currentDogVital != null)
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for more dog vitals to assess emergency/neglect status.");
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

                        bool improving = (prevStress > 0 && currStress < prevStress) || (prevHrv > 0 && currHrv > prevHrv);
                        if (improving)
                        {
                            int score = Math.Clamp(prevScore + 1, 0, 10);
                            SuggestCheckIn(id, q, score, $"Stress/HRV improving → score {score}.");
                        }
                        else
                        {
                            SuggestCheckIn(id, q, prevScore, "Stress/HRV steady or worsening; score remains.");
                        }
                    }
                    else if (humanVitals.Any(h => (h.Steps ?? 0) > 0 || (h.ActiveMinutes ?? 0) > 0))
                    {
                        // No HRV/stress from Fitbit (Free tier) → nudge +1 if human is active
                        int score = Math.Clamp(prevScore == 0 ? 1 : Math.Min(prevScore + 1, 10), 0, 10);
                        SuggestCheckIn(id, q, score, "Nudged from human active vitals presence.");
                    }
                    else
                    {
                        SuggestCheckIn(id, q, prevScore, "Waiting for human vitals data.");
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

            // ── DUAL-SIGNAL ACTIVITY SUGGESTIONS (Form OR Vitals) ────────────────────────
            // Each activity triggers if EITHER:
            //   A) The corresponding Dog Check-in / Environment form answers match, OR
            //   B) The vitals data (DogVitals + HumanVitals) independently supports the same conclusion.
            
            var now = DateTime.UtcNow;
            DateTime currentWindowStart = today;
            DateTime currentWindowEnd = tomorrow;
            string currentWindowName = "today";
            if (now >= morningStart && now < morningEnd) { currentWindowStart = morningStart; currentWindowEnd = morningEnd; currentWindowName = "morning"; }
            else if (now >= afternoonStart && now < afternoonEnd) { currentWindowStart = afternoonStart; currentWindowEnd = afternoonEnd; currentWindowName = "afternoon"; }
            else if (now >= eveningStart && now < eveningEnd) { currentWindowStart = eveningStart; currentWindowEnd = eveningEnd; currentWindowName = "evening"; }

            int currentWindowDogRest = dogVitals.Where(v => v.TimestampUtc >= currentWindowStart && v.TimestampUtc < currentWindowEnd).Sum(v => v.MinRest ?? 0);
            bool currentWindowHumanActive = humanVitals.Any(v => v.TimestampUtc >= currentWindowStart && v.TimestampUtc < currentWindowEnd && ((v.Steps ?? 0) > 0 || (v.ActiveMinutes ?? 0) > 0));

            // Helper: set suggested=false with a specific reason (when neither form nor vitals conditions met)
            void SetActivityNotSuggested(string name, string reason)
            {
                var activity = result.ActivitySuggestions.FirstOrDefault(a => a.ActivityName.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (activity != null && !activity.Suggested) // don't overwrite already-suggested
                    activity.Reason = reason;
            }

            // ── Pre-compute vitals-based signals ─────────────────────────────────────────
            bool humanActiveToday = humanVitals.Any(h => (h.Steps ?? 0) > 0 || (h.ActiveMinutes ?? 0) > 0);
            
            bool lowHumanHR       = currentHumanVital != null && currentHumanVital.HeartRate.HasValue && currentHumanVital.HeartRate.Value < 70; // calm resting HR
            bool highHumanHRV     = currentHumanVital != null && (currentHumanVital.HRV ?? 0) > 40;                                             // relaxed HRV
            bool humanCalm        = lowHumanHR || highHumanHRV;                  // human is physiologically calm
            
            // Alternating active/play/rest pattern = typical of training, in daytime hours (morning or afternoon)
            bool trainingPattern  = dogVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < eveningStart && (v.MinActive ?? 0) > 5 && (v.MinPlay ?? 0) > 5 && (v.MinRest ?? 0) < 30);
            
            // Evening wind-down: dog mostly resting in evening window
            int eveningDogRest = dogVitals.Where(v => v.TimestampUtc >= eveningStart && v.TimestampUtc < eveningEnd).Sum(v => v.MinRest ?? 0);
            bool dogEveningRest   = eveningDogRest > 20;
            bool humanEveningLow  = humanVitals.Any(v => v.TimestampUtc >= eveningStart && v.TimestampUtc < eveningEnd && (v.Steps ?? 0) < 200 && (v.ActiveMinutes ?? 0) < 5);
            
            // Morning vitals: both active in morning window
            bool dogMorningVitals = dogVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && (v.ActivityScore > 0 || (v.MinActive ?? 0) > 0));
            bool humanMorningVitals = humanVitals.Any(v => v.TimestampUtc >= morningStart && v.TimestampUtc < morningEnd && ((v.Steps ?? 0) > 0 || (v.ActiveMinutes ?? 0) > 0));

            // 7. Belly Rubs
            // Form: Dog Q1=Yes (relaxed) AND Q9=Yes (settled near you)
            // Vitals: Dog resting calmly (MinRest > 30 mins) in a recent window AND human is present in that window
            if (dogIsRelaxed && dogSettledNearYou)
                SuggestActivity("Belly Rubs", "Dog Check-in: relaxed=Yes (Q1), settled near you=Yes (Q9).");
            else if (currentWindowDogRest > 30 && currentWindowHumanActive)
                SuggestActivity("Belly Rubs", $"Vitals: dog resting ({currentWindowDogRest} min rest) and human active in the {currentWindowName} window.");
            else
                SetActivityNotSuggested("Belly Rubs", dogCheckinSubmitted
                    ? $"Dog Check-in Q1 (relaxed)={(dogCheckinAnswers.TryGetValue("1", out var _br1) ? _br1 : "not answered")}, Q9 (settled near you)={(dogCheckinAnswers.TryGetValue("9", out var _br9) ? _br9 : "not answered")}. Vitals: dog {currentWindowName} rest={currentWindowDogRest} min."
                    : $"No Dog Check-in today and no calm resting vitals detected in the {currentWindowName} window (dog rest={currentWindowDogRest} min).");

            // 8. Cuddle Time
            // Form: Dog Q3=Yes (seeks closeness) AND Q9=Yes (settled near you)
            // Vitals: Dog resting a long time (> 60 min) AND human vitals present in the SAME window
            if (dogSeeksCloseness && dogSettledNearYou)
                SuggestActivity("Cuddle Time", "Dog Check-in: seeking closeness=Yes (Q3), settled near you=Yes (Q9).");
            else if (currentWindowDogRest > 60 && currentWindowHumanActive)
                SuggestActivity("Cuddle Time", $"Vitals: dog resting ({currentWindowDogRest} min) while owner is active in the {currentWindowName} window — likely cuddling together.");
            else
                SetActivityNotSuggested("Cuddle Time", dogCheckinSubmitted
                    ? $"Dog Check-in Q3 (seeks closeness)={(dogCheckinAnswers.TryGetValue("3", out var _ct3) ? _ct3 : "not answered")}, Q9 (settled near you)={(dogCheckinAnswers.TryGetValue("9", out var _ct9) ? _ct9 : "not answered")}. Vitals: dog {currentWindowName} rest={currentWindowDogRest} min."
                    : $"No Dog Check-in today. Vitals: dog {currentWindowName} rest={currentWindowDogRest} min (need >60 min) and human active={currentWindowHumanActive}.");

            // 9. Feeding Time
            // Form: Dog Q5=Yes (appetite normal)
            // Vitals: Only suggest via form, not generic vitals
            if (dogAteNormally)
                SuggestActivity("Feeding Time", "Dog Check-in: appetite normal=Yes (Q5).");
            else
                SetActivityNotSuggested("Feeding Time", "Feeding time must be confirmed via Dog Check-in (Q5).");

            // 10. Grooming — No reliable signal from form or vitals. Always false per spec.
            SetActivityNotSuggested("Grooming", "No reliable signal to auto-suggest grooming.");

            // 11. Training Session
            // Form: Dog Q4=Yes (playful) AND Environment Q8=Yes (enough room)
            // Vitals: Alternating active/play/rest pattern in daytime hours
            if (dogIsPlayful && (envRoomEnough != null && envRoomEnough.Equals("Yes", StringComparison.OrdinalIgnoreCase)))
                SuggestActivity("Training Session", "Dog Check-in: playful=Yes (Q4). Environment Check-in: enough room=Yes (Q8).");
            else if (trainingPattern)
                SuggestActivity("Training Session", $"Vitals: alternating active/play/rest pattern detected during daytime hours — typical of a training session.");
            else
                SetActivityNotSuggested("Training Session", dogCheckinSubmitted
                    ? $"Dog Check-in Q4 (playful)={(dogCheckinAnswers.TryGetValue("4", out var _ts4) ? _ts4 : "not answered")}. No training pattern in daytime vitals."
                    : $"No Dog Check-in today. Vitals daytime training pattern: {(trainingPattern ? "yes" : "no")}.");

            // 12. New Trick Practice
            // Form: Dog Q4=Yes (playful) AND Environment Q8=Yes (enough room) AND Q10=No (no stress)
            // Vitals: MinPlay > 5 min AND no stress AND human active, in an afternoon-ish window
            if (dogIsPlayful && (envRoomEnough != null && envRoomEnough.Equals("Yes", StringComparison.OrdinalIgnoreCase)) && !dogShownStress)
                SuggestActivity("New Trick Practice", "Dog Check-in: playful=Yes (Q4), no stress (Q10). Environment Check-in: enough room=Yes (Q8).");
            else if (afternoonTrickPractice)
                SuggestActivity("New Trick Practice", $"Vitals: dog has afternoon play activity ({afternoonDogPlay} min), no stress, and human active — good conditions for trick practice.");
            else
                SetActivityNotSuggested("New Trick Practice", dogCheckinSubmitted
                    ? $"Dog Check-in Q4 (playful)={(dogCheckinAnswers.TryGetValue("4", out var _nt4) ? _nt4 : "not answered")}. Vitals: afternoon play={afternoonDogPlay} min."
                    : $"No Dog Check-in today. Vitals: afternoon dog play={afternoonDogPlay} min, human active={humanAfternoonActive}.");

            // 13. Meditation Together
            // Form: Dog Q8=Yes (breathed calmly) AND (Env Q7=Calm OR Q10=Quiet)
            // Vitals: Human calm (low HR/high HRV) AND dog resting, same time window
            if (humanBreathedCalm && (envIsCalm || envIsQuiet))
                SuggestActivity("Meditation Together", $"Dog Check-in: breathed calmly with dog=Yes (Q8). Environment: {(envIsCalm ? "calm space (Q7)" : "quiet space (Q10)")}.");
            else if (humanBreathedCalm)
                SuggestActivity("Meditation Together", "Dog Check-in: breathed calmly with dog=Yes (Q8).");
            else if (humanCalm && currentWindowDogRest > 30)
                SuggestActivity("Meditation Together", $"Vitals: human is calm (HR/HRV) and dog is resting ({currentWindowDogRest} min) in the {currentWindowName} window.");
            else if (chakraLogs.Any())
                SuggestActivity("Meditation Together", "Nerve Center Sync (Chakra) session completed today.");
            else
                SetActivityNotSuggested("Meditation Together", $"No calm signals. Vitals: human calm={humanCalm}, dog {currentWindowName} rest={currentWindowDogRest} min. Form: Q8={(dogCheckinAnswers.TryGetValue("8", out var _mt8) ? _mt8 : "not answered")}.");

            // 14. Synchronized Breathing
            // Form: Dog Q8=Yes (breathed calmly with dog)
            // Vitals: Human calm AND dog resting, same time window
            if (humanBreathedCalm)
                SuggestActivity("Synchronized Breathing", $"Dog Check-in: breathed calmly with dog=Yes (Q8).{(envIsCalm ? " Environment: calm space." : envIsQuiet ? " Environment: quiet space." : "")}");
            else if (humanCalm && currentWindowDogRest > 30)
                SuggestActivity("Synchronized Breathing", $"Vitals: human calm (HR/HRV) and dog resting ({currentWindowDogRest} min) in the {currentWindowName} window.");
            else if (chakraLogs.Any())
                SuggestActivity("Synchronized Breathing", "Nerve Center Sync session completed today.");
            else
                SetActivityNotSuggested("Synchronized Breathing", $"No synchronized calm signals. Vitals: human calm={humanCalm}, dog {currentWindowName} rest={currentWindowDogRest} min.");

            // 15. Heart-to-Heart Reflection
            // Form: Dog Q3=Yes (seeks closeness) AND Q8=Yes (breathed calmly)
            // Vitals: Dog resting near human (MinRest > 30) + human is calm + both present together in same window
            if (dogSeeksCloseness && humanBreathedCalm)
                SuggestActivity("Heart-to-Heart Reflection", "Dog Check-in: seeking closeness=Yes (Q3), breathed calmly=Yes (Q8).");
            else if (currentWindowDogRest > 30 && humanCalm)
                SuggestActivity("Heart-to-Heart Reflection", $"Vitals: dog resting ({currentWindowDogRest} min) and human calm in the {currentWindowName} window.");
            else if (chakraLogs.Any() || hasEveningJournal)
                SuggestActivity("Heart-to-Heart Reflection", "Nerve Center Sync or evening journal completed.");
            else
                SetActivityNotSuggested("Heart-to-Heart Reflection", $"No shared calm signals. Dog {currentWindowName} rest={currentWindowDogRest} min, human calm={humanCalm}.");

            // 16. Nerve Center Sync
            if (chakraLogs.Any()) SuggestActivity("Nerve Center Sync", "Nerve Center Sync log exists for today.");
            else SetActivityNotSuggested("Nerve Center Sync", "No Nerve Center Sync session completed today.");

            // 17. Gratitude Moment
            // Form: Dog Q6=Yes (slept well)
            // Vitals: Both dog and human have morning vitals (they both woke up and started the day) specifically in the MORNING window
            if (dogSleptWell)
                SuggestActivity("Gratitude Moment", "Dog Check-in: dog slept well=Yes (Q6) — a great morning to start with gratitude.");
            else if (hasMorningJournal || hasMorningWellness)
                SuggestActivity("Gratitude Moment", "Morning journal or wellness check completed.");
            else if (dogMorningVitals && humanMorningVitals)
                SuggestActivity("Gratitude Moment", "Vitals: both dog and human have vitals specifically in the morning window — a great moment for gratitude.");
            else
                SetActivityNotSuggested("Gratitude Moment", $"No gratitude signals. Dog morning vitals={dogMorningVitals}, human morning vitals={humanMorningVitals}.");

            // 18. Energy Check-in
            // Vitals: Any human vitals today (always reliable signal for energy awareness)
            if (humanVitals.Any())
                SuggestActivity("Energy Check-in", dogGreetedNormally
                    ? "Dog Check-in: dog greeted with usual energy=Yes (Q2). Human vitals synced."
                    : "Human vitals data synced today.");
            else
                SetActivityNotSuggested("Energy Check-in", "No human vitals synced today.");

            // 19. Morning Intention Setting
            // Form: Dog Q6=Yes (slept well)
            // Vitals: Both dog AND human morning-window vitals
            if (dogSleptWell)
                SuggestActivity("Morning Intention Setting", "Dog Check-in: dog slept well=Yes (Q6) — good conditions for a positive morning intention.");
            else if (hasMorningJournal || hasMorningWellness)
                SuggestActivity("Morning Intention Setting", "Morning journal or wellness check completed.");
            else if (dogMorningVitals && humanMorningVitals)
                SuggestActivity("Morning Intention Setting", "Vitals: both dog and human active in the morning window — ideal for setting a morning intention.");
            else
                SetActivityNotSuggested("Morning Intention Setting", $"No morning signals. Dog morning vitals={dogMorningVitals}, human morning vitals={humanMorningVitals}.");

            // 20. Bedtime Blessing
            // Form: Dog Q1=Yes (relaxed) AND Q9=Yes (settled near you)
            // Vitals: Dog evening-window rest + human evening-window winding down
            if (dogIsRelaxed && dogSettledNearYou)
                SuggestActivity("Bedtime Blessing", "Dog Check-in: relaxed=Yes (Q1), settled near you=Yes (Q9) — lovely moment for a bedtime blessing.");
            else if (dogEveningRest && humanEveningLow)
                SuggestActivity("Bedtime Blessing", "Vitals: dog resting in evening window and human winding down — bedtime blessing moment detected.");
            else if (hasEveningJournal || hasEveningWellness)
                SuggestActivity("Bedtime Blessing", "Evening journal or wellness check completed.");
            else
                SetActivityNotSuggested("Bedtime Blessing", dogCheckinSubmitted
                    ? $"Dog Check-in Q1 (relaxed)={(dogCheckinAnswers.TryGetValue("1", out var _bb1) ? _bb1 : "not answered")}, Q9 (settled near you)={(dogCheckinAnswers.TryGetValue("9", out var _bb9) ? _bb9 : "not answered")}. Vitals: dog evening rest={dogEveningRest}."
                    : $"No Dog Check-in today. Vitals: dog evening rest={dogEveningRest}, human winding down={humanEveningLow}.");

            // 21. Evening Reflection
            // Form: Dog Q7=Yes (routine changed) OR Q10=Yes (stress signs)
            // Vitals: Dog abnormally inactive across the whole day (compare to baseline)
            bool dogAbnormalDay = currentDogVital != null && currentDogVital.ActivityScore < 50 && totalMinPlay == 0;
            if (routineChanged)
                SuggestActivity("Evening Reflection", "Dog Check-in: routine changed=Yes (Q7) — good time for an evening reflection.");
            else if (dogShownStress)
                SuggestActivity("Evening Reflection", "Dog Check-in: signs of stress=Yes (Q10) — reflect on what may have caused it.");
            else if (dogAbnormalDay && hasAnyDogVitals)
                SuggestActivity("Evening Reflection", "Vitals: dog had very low activity all day — worth reflecting on their day.");
            else if (hasEveningJournal || hasEveningWellness)
                SuggestActivity("Evening Reflection", "Evening journal or wellness check completed.");
            else
                SetActivityNotSuggested("Evening Reflection", $"No reflection signals. Dog stress signs={dogShownStress}, routine changed={routineChanged}, dog activity normal={!dogAbnormalDay}.");



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
