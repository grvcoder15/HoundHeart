using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public interface IBondSyncService
    {
        Task<BondSyncResult> GetCurrentSyncScoreAsync(Guid userId, Guid dogId);
        Task<List<BondSyncTrend>> GetSyncTrendAsync(Guid userId, Guid dogId, int days = 7);
        Task<SyncScoreResult> CalculateSyncScore(Guid userId, Guid dogId);
    }

    public class BondSyncResult
    {
        public int Score { get; set; }
        public string Level { get; set; }
        public DateTime Timestamp { get; set; }
        public DogVitals DogVitals { get; set; }
        public HumanVitals HumanVitals { get; set; }
    }

    public class BondSyncTrend
    {
        public DateTime Date { get; set; }
        public int AverageScore { get; set; }
    }

    public class SyncScoreResult
    {
        public int Score { get; set; }
        public string Trend { get; set; }
        public int HRVStabilityScore { get; set; }
        public int SharedActivityScore { get; set; }
        public int DogCalmScore { get; set; }
        public int SleepQualityScore { get; set; }
        public int HumanHealthScore { get; set; }
        public int DogHealthScore { get; set; }
        public double HumanHRV { get; set; }
        public int HumanHR { get; set; }
        public int DogActivity { get; set; }
        public int DogRestScore { get; set; }
        public DateTime CalculatedAt { get; set; }
        public string Reason { get; set; }
        public string ScoreTitle { get; set; }
        public string ScoreDescription { get; set; }
        public string ScoreAction { get; set; }
        public string Disclaimer { get; set; }
        public WellnessStatusResult HumanStatus { get; set; }
        public WellnessStatusResult DogStatus { get; set; }
    }

    public class WellnessStatusResult
    {
        public string Label { get; set; }
        public int Score { get; set; }
        public string Summary { get; set; }
        public string Recommendation { get; set; }
        public bool BaselineAvailable { get; set; }
    }

    public class ScoreDetails
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Action { get; set; }
        public string Disclaimer { get; set; }
    }

    public class BondSyncService : IBondSyncService
    {
        private readonly IPetPaceService _petPaceService;
        private readonly IAppleHealthService _appleHealthService;
        private readonly AppDbContext _context;

        public BondSyncService(IPetPaceService petPaceService, IAppleHealthService appleHealthService, AppDbContext context)
        {
            _petPaceService = petPaceService;
            _appleHealthService = appleHealthService;
            _context = context;
        }

        private async Task<Guid> ResolveWellnessDogIdAsync(Guid userId, Guid requestedDogId)
        {
            // DogVitals and DogBaselines use FitBarkDogs.Id as their DogId.
            // FitBarkDogs has no UserId column, so we cannot filter by user there.
            // Strategy: if the requested id already has wellness records, use it directly.
            // Otherwise fall back to the most recently synced FitBark dog id from DogVitals.

            if (requestedDogId != Guid.Empty)
            {
                var hasWellnessRecords = await _context.DogVitals
                    .AsNoTracking()
                    .AnyAsync(d => d.DogId == requestedDogId);

                if (hasWellnessRecords)
                    return requestedDogId;
            }

            // Fall back: get the FitBark dog id that has the most recent vitals record.
            var latestFitBarkDogId = await _context.DogVitals
                .AsNoTracking()
                .Where(d => d.Source == "fitbark")
                .OrderByDescending(d => d.TimestampUtc)
                .Select(d => d.DogId)
                .FirstOrDefaultAsync();

            if (latestFitBarkDogId != Guid.Empty)
                return latestFitBarkDogId;

            // Last resort: any dog vitals record regardless of source.
            var anyDogId = await _context.DogVitals
                .AsNoTracking()
                .OrderByDescending(d => d.TimestampUtc)
                .Select(d => d.DogId)
                .FirstOrDefaultAsync();

            return anyDogId != Guid.Empty ? anyDogId : requestedDogId;
        }

        private ScoreDetails GetScoreDescription(int score)
        {
            var details = new ScoreDetails
            {
                Disclaimer = "HoundHeart does not provide medical advice, diagnosis, or treatment. The physiological and neurochemical references throughout this score are based on published research into human-animal interaction and are presented for educational and informational purposes only. Individual experiences may vary. Always consult a qualified healthcare professional regarding any health concerns or before making changes to your health or wellness routine."
            };

            if (score <= 10)
            {
                details.Title = "Critical Disconnect";
                details.Description = "Your current state is unsustainable. You are in danger. You and your dog are completely out of sync. Your body is locked in a stress state. Cortisol and adrenaline may be critically elevated, while dopamine, serotonin, oxytocin, and endorphin levels may be too low. This level of stress is associated with cardiovascular strain, weakened immune response, and diminished organ function.";
                details.Action = "Stop what you are doing now. Step outside now. Walk with the dog for 30 to 60 minutes. Put away the phone. Walk on grass barefoot if you can. During the walk, stop and place your hand on your dog for a few seconds at a time. Slow your breathing until it matches their calm. Perform a full synchronization ritual: stand still, maintain gentle contact, breathe in for four seconds and out for six, and do not move until both you and your dog fully settle. This is not optional. You are in danger.";
            }
            else if (score <= 20)
            {
                details.Title = "Severe Imbalance";
                details.Description = "Your current emotional and mental state are unsustainable. You are physically present but mentally gone. Your dog knows the difference. Your body is running hot even if you do not feel it. Cortisol is likely elevated. Oxytocin and serotonin levels are suppressed. Prolonged states like this are associated with elevated blood pressure, weakened immunity, and increased burden on the body's filtration systems.";
                details.Action = "Take a slow, unhurried walk for 20 to 30 minutes. Look around. Talk to your dog. Halfway through, stop completely. Stand still with your dog. Breathe in for four seconds and out for six. Keep one hand on your dog and feel their body settle before you move again. You cannot lead what you have not calmed.";
            }
            else if (score <= 30)
            {
                details.Title = "Disconnected";
                details.Description = "Stress is affecting your life. The connection between you and your dog is thin. Your nervous system is likely stuck in fight or flight running in the background. This is associated with elevated cortisol, increased inflammation, and reduced capacity for natural repair.";
                details.Action = "Take a 15 to 20 minute walk with your dog. Walk at a steady comfortable pace. No rushing, no destination. For at least five minutes give your dog your complete attention — eye contact, touch, calm presence. Add a short synchronization ritual: stop, place your hand on your dog, and slow your breathing until both of you are calm and steady.";
            }
            else if (score <= 40)
            {
                details.Title = "Elevated";
                details.Description = "Your body is under tension, stress, mental overload, or restlessness your dog is already reading. Even moderate persistent stress is associated with slightly elevated blood pressure, increased cortisol, and reduced efficiency in how your body processes and eliminates toxins.";
                details.Action = "Take a short deliberate reset. Go outside for 15 to 20 minutes. Move slowly. Be intentional with every step. Let your dog set the pace. Follow, do not lead. Include a brief synchronization ritual by pausing, placing your hand on your dog, and aligning your breathing with theirs for one to two minutes.";
            }
            else if (score <= 50)
            {
                details.Title = "Low Alignment";
                details.Description = "You are functional but not connected. If this becomes your norm, the bond erodes and so do the health benefits. Oxytocin release, cortisol modulation, and the cardiovascular calming effect all depend on the quality of your connection, not just the fact that a dog is in the room.";
                details.Action = "Spend at least 10 minutes walking or sitting quietly with your dog. Place one hand on them and slow your breathing. Bring your full attention into the present moment. Close with a short synchronization ritual by pausing together and allowing both of you to settle fully before moving on.";
            }
            else if (score <= 60)
            {
                details.Title = "Neutral";
                details.Description = "Nothing is dead but nothing is alive either. This is the most deceptive range. It feels fine while the connection quietly flattens. Your stress markers are not alarming but the positive neurochemical feedback — oxytocin, serotonin, and measurable drops in cortisol — is not firing at any meaningful level.";
                details.Action = "Take a short walk or spend 10 minutes in focused undistracted interaction. Be deliberate about making contact, both physical and verbal. Add a brief synchronization ritual by slowing your breathing and placing your attention fully on your dog for one to two minutes. Ten minutes of real effort outweighs an hour of passive presence.";
            }
            else if (score <= 70)
            {
                details.Title = "Mild Sync";
                details.Description = "You and your dog are generally aligned but running slightly on autopilot. The connection is active and your body is beginning to reflect it. Moderate bonding interactions are associated with improved heart rate variability, lower resting cortisol, and gentle increases in oxytocin and serotonin.";
                details.Action = "Take a relaxed walk or an easy play session for 10 to 15 minutes. Stay conscious and alert to your dog. Notice body language, energy, and breathing. Briefly pause and perform a light synchronization ritual by matching your breathing to your dog's calm state. Awareness is the difference between being near your dog and being with your dog.";
            }
            else if (score <= 80)
            {
                details.Title = "Good Alignment";
                details.Description = "You are in a solid state. Your dog is comfortable, responsive, and calm in your presence. The bonding neurochemistry — oxytocin, serotonin, endorphins — is active. This quality of connection is associated with sustained cardiovascular improvements, stronger immune function, and more efficient recovery across the body's major systems.";
                details.Action = "Build on it. Keep doing what you are doing and add one shared activity such as a walk, a play session, or five minutes of quiet time together. If you want to deepen it further, pause briefly and align your breathing with your dog for a short synchronization ritual. The bond does not just hold here, it deepens.";
            }
            else if (score <= 90)
            {
                details.Title = "Strong Sync";
                details.Description = "You and your dog are deeply connected. Calm, present, and stable. Deep human-dog connection is associated with lower blood pressure, reduced cortisol, elevated oxytocin, improved immune resilience, and stronger function across cardiovascular, endocrine, and hepatic systems. Your dog's calm is reinforcing your biological equilibrium. Yours is reinforcing theirs.";
                details.Action = "Do not overthink it and do not tinker. A walk or quiet time together is enough. If anything, simply pause and acknowledge the state. A short synchronization moment reinforces the loop without effort. This is the feedback loop working the way it is supposed to.";
            }
            else
            {
                details.Title = "Full Alignment";
                details.Description = "You and your dog are fully in sync. Grounded, calm, connected. The neurochemical exchange is at its peak. Oxytocin, serotonin, and endorphins are flowing naturally. Cortisol is suppressed. Your cardiovascular system, immune function, and the body's ability to process, filter, and recover are all operating in the state most associated with long-term health and resilience.";
                details.Action = "No correction needed. No action required. Stay aware of it and let it continue naturally. Stay here as long as you can. Return here as often as you can. This is what you are building toward every single day.";
            }

            return details;
        }

        private static int ClampScore(double value)
        {
            return (int)Math.Max(0, Math.Min(100, Math.Round(value)));
        }

        private static int ScoreFromDeviation(double? currentValue, double? baselineValue)
        {
            if (!currentValue.HasValue || !baselineValue.HasValue || baselineValue.Value <= 0)
            {
                return 50;
            }

            var deviation = Math.Abs(currentValue.Value - baselineValue.Value) / baselineValue.Value * 100.0;

            if (deviation <= 10) return 100;
            if (deviation <= 20) return 80;
            if (deviation <= 30) return 60;
            if (deviation <= 40) return 40;
            return 20;
        }

        private static WellnessStatusResult BuildHumanStatus(int score)
        {
            if (score >= 70)
            {
                return new WellnessStatusResult
                {
                    Label = "Calm",
                    Score = score,
                    Summary = "Your current vitals are close to your normal baseline.",
                    Recommendation = "Maintain your current routine and keep regular moments with your dog.",
                    BaselineAvailable = true
                };
            }

            if (score >= 45)
            {
                return new WellnessStatusResult
                {
                    Label = "Moderate",
                    Score = score,
                    Summary = "Your vitals are showing some strain compared with your baseline.",
                    Recommendation = "Take a short reset and spend calm, undistracted time with your dog.",
                    BaselineAvailable = true
                };
            }

            return new WellnessStatusResult
            {
                Label = "Stressed",
                Score = score,
                Summary = "Your current biometrics are significantly outside your normal range.",
                Recommendation = "Pause, regulate your breathing, and spend supportive time with your dog.",
                BaselineAvailable = true
            };
        }

        private static WellnessStatusResult BuildDogStatus(int score, bool baselineAvailable)
        {
            if (score >= 70)
            {
                return new WellnessStatusResult
                {
                    Label = "Calm",
                    Score = score,
                    Summary = baselineAvailable
                        ? "Your dog's vitals are close to their normal baseline."
                        : "Your dog's current vitals look steady.",
                    Recommendation = "Keep the environment calm and continue normal bonding routines.",
                    BaselineAvailable = baselineAvailable
                };
            }

            if (score >= 45)
            {
                return new WellnessStatusResult
                {
                    Label = "Restless",
                    Score = score,
                    Summary = baselineAvailable
                        ? "Your dog's vitals are mildly outside their usual range."
                        : "Your dog's current vitals suggest mild restlessness.",
                    Recommendation = "Reduce stimulation and try a calm walk or rest period together.",
                    BaselineAvailable = baselineAvailable
                };
            }

            return new WellnessStatusResult
            {
                Label = "Anxious",
                Score = score,
                Summary = baselineAvailable
                    ? "Your dog's current vitals are well outside their normal baseline."
                    : "Your dog's current vitals suggest clear distress.",
                Recommendation = "Create a quiet recovery space and focus on calm co-regulation.",
                BaselineAvailable = baselineAvailable
            };
        }

        public async Task<BondSyncResult> GetCurrentSyncScoreAsync(Guid userId, Guid dogId)
        {
            dogId = await ResolveWellnessDogIdAsync(userId, dogId);
            var syncResult = await CalculateSyncScore(userId, dogId);
            
            var dogVitals = await _petPaceService.GetLatestVitalsAsync(dogId);
            var humanVitals = await _appleHealthService.GetLatestVitalsAsync(userId);

            return new BondSyncResult
            {
                Score = syncResult.Score,
                Level = syncResult.Trend,
                Timestamp = syncResult.CalculatedAt,
                DogVitals = dogVitals,
                HumanVitals = humanVitals
            };
        }

        public async Task<SyncScoreResult> CalculateSyncScore(Guid userId, Guid dogId)
        {
            dogId = await ResolveWellnessDogIdAsync(userId, dogId);

            var latestHuman = await _context.HumanVitals
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.TimestampUtc)
                .FirstOrDefaultAsync();

            if (latestHuman == null)
            {
                var fallbackDetails = GetScoreDescription(0);
                return new SyncScoreResult
                {
                    Score = 0,
                    Trend = "Needs attention",
                    Reason = "No human vitals data available",
                    CalculatedAt = DateTime.UtcNow,
                    ScoreTitle = fallbackDetails.Title,
                    ScoreDescription = fallbackDetails.Description,
                    ScoreAction = fallbackDetails.Action,
                    Disclaimer = fallbackDetails.Disclaimer
                };
            }

            var latestDog = await _context.DogVitals
                .Where(d => d.DogId == dogId)
                .OrderByDescending(d => d.TimestampUtc)
                .FirstOrDefaultAsync();

            if (latestDog == null)
            {
                var fallbackDetails = GetScoreDescription(0);
                return new SyncScoreResult
                {
                    Score = 0,
                    Trend = "Needs attention",
                    Reason = "No dog vitals data available",
                    CalculatedAt = DateTime.UtcNow,
                    ScoreTitle = fallbackDetails.Title,
                    ScoreDescription = fallbackDetails.Description,
                    ScoreAction = fallbackDetails.Action,
                    Disclaimer = fallbackDetails.Disclaimer
                };
            }

            var humanBaseline = await _context.UserBaselines
                .FirstOrDefaultAsync(b => b.UserId == userId);

            if (humanBaseline == null)
            {
                var fallbackDetails = GetScoreDescription(0);
                return new SyncScoreResult
                {
                    Score = 0,
                    Trend = "Needs attention",
                    Reason = "No baseline established yet",
                    CalculatedAt = DateTime.UtcNow,
                    ScoreTitle = fallbackDetails.Title,
                    ScoreDescription = fallbackDetails.Description,
                    ScoreAction = fallbackDetails.Action,
                    Disclaimer = fallbackDetails.Disclaimer,
                    HumanStatus = new WellnessStatusResult
                    {
                        Label = "No Data",
                        Score = 0,
                        Summary = "Human baseline is not established yet.",
                        Recommendation = "Complete baseline formation to enable health status scoring.",
                        BaselineAvailable = false
                    },
                    DogStatus = new WellnessStatusResult
                    {
                        Label = "No Data",
                        Score = 0,
                        Summary = "Dog status cannot be paired until the human baseline is ready.",
                        Recommendation = "Wait for both wellness baselines to complete.",
                        BaselineAvailable = false
                    }
                };
            }

            var dogBaseline = await _context.DogBaselines
                .FirstOrDefaultAsync(b => b.DogId == dogId && b.DogBaselineEstablished);

            var hrvScore = ScoreFromDeviation(latestHuman.HRV, humanBaseline.AvgHRV);
            var heartRateScore = ScoreFromDeviation(
                latestHuman.HeartRate.GetValueOrDefault() > 0 ? latestHuman.HeartRate.Value : null,
                humanBaseline.AvgHeartRate);
            var sleepScore = latestHuman.SleepMinutes.HasValue
                ? ClampScore((latestHuman.SleepMinutes.Value / 480.0) * 100.0)
                : 50;

            var humanStressScore = latestHuman.StressScore.HasValue && latestHuman.StressScore.Value > 0
                ? ClampScore(100 - (latestHuman.StressScore.Value * 10.0))
                : 50;

            var humanHealthScore = ClampScore((hrvScore * 0.35) + (heartRateScore * 0.20) + (sleepScore * 0.25) + (humanStressScore * 0.20));

            var dogHeartRateScore = dogBaseline?.AvgHeartRate > 0
                ? ScoreFromDeviation(latestDog.HeartRate, dogBaseline.AvgHeartRate)
                : 50;
            var dogRestStabilityScore = dogBaseline != null
                ? ScoreFromDeviation(latestDog.RestScore, dogBaseline.AvgRestScore)
                : 50;
            var dogActivityStabilityScore = dogBaseline != null
                ? ScoreFromDeviation(latestDog.ActivityScore, dogBaseline.AvgActivityScore)
                : 50;
            var dogRespirationScore = dogBaseline?.AvgRespirationRate > 0
                ? ScoreFromDeviation(latestDog.RespirationRate, dogBaseline.AvgRespirationRate)
                : 50;

            var dogHealthScore = ClampScore((dogHeartRateScore * 0.30) + (dogRestStabilityScore * 0.30) + (dogActivityStabilityScore * 0.25) + (dogRespirationScore * 0.15));

            string humanActivityLevel = latestHuman.Steps.GetValueOrDefault() > 500 ? "active" : "low";
            var dogActivityThreshold = dogBaseline != null ? dogBaseline.AvgActivityScore : 50;
            string dogActivityLevel = latestDog.ActivityScore >= dogActivityThreshold ? "active" : "low";
            int sharedActivityScore = humanActivityLevel == dogActivityLevel ? 100 : 40;

            int roundedScore = ClampScore((humanHealthScore * 0.45) + (dogHealthScore * 0.30) + (sharedActivityScore * 0.25));

            string trend;
            if (roundedScore >= 70) trend = "Strong bond";
            else if (roundedScore >= 50) trend = "Good connection";
            else if (roundedScore >= 30) trend = "Developing bond";
            else trend = "Needs attention";

            var humanStatus = BuildHumanStatus(humanHealthScore);
            var dogStatus = BuildDogStatus(dogHealthScore, dogBaseline != null);

            var calculatedAt = DateTime.UtcNow;
            var cutoff = calculatedAt.AddSeconds(-60);
            var exists = await _context.SyncScoreRecords
                .AnyAsync(s => s.UserId == userId 
                           && s.DogId == dogId 
                           && s.CalculatedAt >= cutoff);

            if (!exists)
            {
                var syncScoreRecord = new SyncScoreRecord
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    DogId = dogId,
                    Score = roundedScore,
                    Trend = trend,
                    HRVStabilityScore = hrvScore,
                    SharedActivityScore = sharedActivityScore,
                    DogCalmScore = dogHealthScore,
                    SleepQualityScore = sleepScore,
                    CalculatedAt = calculatedAt
                };

                _context.SyncScoreRecords.Add(syncScoreRecord);
                await _context.SaveChangesAsync();
            }

            var details = GetScoreDescription(roundedScore);
            return new SyncScoreResult
            {
                Score = roundedScore,
                Trend = trend,
                HRVStabilityScore = hrvScore,
                SharedActivityScore = sharedActivityScore,
                DogCalmScore = dogHealthScore,
                SleepQualityScore = sleepScore,
                HumanHealthScore = humanHealthScore,
                DogHealthScore = dogHealthScore,
                HumanHRV = latestHuman.HRV.GetValueOrDefault(),
                HumanHR = latestHuman.HeartRate.GetValueOrDefault(),
                DogActivity = latestDog.ActivityScore,
                DogRestScore = latestDog.RestScore,
                CalculatedAt = calculatedAt,
                Reason = $"Calculated from human health ({humanHealthScore}), dog health ({dogHealthScore}), and shared activity ({sharedActivityScore})",
                ScoreTitle = details.Title,
                ScoreDescription = details.Description,
                ScoreAction = details.Action,
                Disclaimer = details.Disclaimer,
                HumanStatus = humanStatus,
                DogStatus = dogStatus
            };
        }

        public async Task<List<BondSyncTrend>> GetSyncTrendAsync(Guid userId, Guid dogId, int days = 7)
        {
            // For Phase 1 Sandbox, we'll generate mock trend data
            var trend = new List<BondSyncTrend>();
            var random = new Random();
            for (int i = 0; i < days; i++)
            {
                trend.Add(new BondSyncTrend
                {
                    Date = DateTime.UtcNow.AddDays(-i).Date,
                    AverageScore = random.Next(40, 95)
                });
            }
            return trend.OrderBy(t => t.Date).ToList();
        }
    }
}
