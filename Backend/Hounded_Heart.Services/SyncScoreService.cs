using Hounded_Heart.Models.Data;

namespace Hounded_Heart.Api.Services
{
    public class SyncScoreService
    {
        public static (int score, string trend, string title, string description, string action, string disclaimer) CalculateSyncScore(
            HumanDailySummary humanData, 
            DogDailySummary dogData,
            HumanDailySummary? previousDayHuman = null)
        {
            // Calculate base score from multiple factors
            int syncScore = CalculateBaseScore(humanData, dogData);
            
            // Calculate trend
            string trend = CalculateTrend(humanData, previousDayHuman);
            
            // Get score-based content
            var scoreContent = GetScoreContent(syncScore);
            
            return (syncScore, trend, scoreContent.title, scoreContent.description, scoreContent.action, scoreContent.disclaimer);
        }

        private static int CalculateBaseScore(HumanDailySummary humanData, DogDailySummary dogData)
        {
            double totalScore = 0;
            int factors = 0;

            // Factor 1: Human Stress Level (0-30 points)
            // Lower stress = higher score
            if (humanData.AvgStressScore.HasValue && humanData.AvgStressScore > 0)
            {
                double stressScore = Math.Max(0, 30 - (humanData.AvgStressScore.Value * 3)); // Invert stress
                totalScore += stressScore;
                factors++;
            }

            // Factor 2: Human HRV (Heart Rate Variability) (0-25 points)
            // Higher HRV = better recovery = higher score
            if (humanData.AvgHRV.HasValue && humanData.AvgHRV > 0)
            {
                double hrvScore = Math.Min(25, humanData.AvgHRV.Value * 0.5); // Scale HRV to 0-25
                totalScore += hrvScore;
                factors++;
            }

            // Factor 3: Human Sleep Quality (0-20 points)
            if (humanData.AvgSleepMinutes.HasValue && humanData.AvgSleepMinutes > 0)
            {
                double sleepScore = (humanData.AvgSleepMinutes.Value / 10) * 20; // Scale to 0-20
                totalScore += sleepScore;
                factors++;
            }

            // Factor 4: Dog Calmness/Rest State (0-15 points)
            if (dogData != null)
            {
                double dogCalmScore = (dogData.RestPercentage + dogData.SleepPercentage) * 0.15; // Scale to 0-15
                totalScore += dogCalmScore;
                factors++;
            }

            // Factor 5: Activity Synchronization (0-10 points)
            // This would require comparing human and dog activity patterns
            if (dogData != null && humanData.TotalSteps.HasValue && humanData.TotalSteps > 0)
            {
                // Simple sync indicator: if human was active, dog should be too
                double activitySync = Math.Min(10, (dogData.ActivePercentage + dogData.PlayPercentage) * 0.1);
                totalScore += activitySync;
                factors++;
            }

            // Calculate weighted average and scale to 0-100
            if (factors == 0) return 50; // Default neutral score
            
            double averageScore = totalScore / factors;
            int finalScore = (int)Math.Round(Math.Max(0, Math.Min(100, averageScore)));
            
            return finalScore;
        }

        private static string CalculateTrend(HumanDailySummary currentDay, HumanDailySummary previousDay)
        {
            if (previousDay == null) return "stable";
            
            int currentScore = currentDay.Score ?? 50;
            int previousScore = previousDay.Score ?? 50;
            
            int difference = currentScore - previousScore;
            
            if (difference >= 5) return "improving";
            if (difference <= -5) return "declining";
            return "stable";
        }

        private static (string title, string description, string action, string disclaimer) GetScoreContent(int score)
        {
            string disclaimer = "This assessment is based on biometric data and is not a substitute for professional medical advice. Consult with healthcare providers for any health concerns.";
            
            return score switch
            {
                >= 0 and <= 10 => (
                    "Critical Disconnect",
                    "Your current state is unsustainable. You are in danger. You and your dog are completely out of sync. Your body is locked in a stress state. Cortisol and adrenaline may be critically elevated, while dopamine, serotonin, oxytocin, and endorphin levels may be too low. This level of stress is associated with cardiovascular strain, weakened immune response, and diminished organ function.",
                    "Stop what you are doing now. Step outside now. Walk with the dog for 30 to 60 minutes. Put away the phone. Walk on grass barefoot if you can. During the walk, stop and place your hand on your dog for a few seconds at a time. Slow your breathing until it matches their calm. Perform a full synchronization ritual: stand still, maintain gentle contact, breathe in for four seconds and out for six, and do not move until both you and your dog fully settle. This is not optional. You are in danger.",
                    disclaimer
                ),
                
                >= 11 and <= 20 => (
                    "Severe Imbalance",
                    "Your current emotional and mental state are unsustainable. You are physically present but mentally gone. Your dog knows the difference. Your body is running hot even if you do not feel it. Cortisol is likely elevated. Oxytocin and serotonin levels are suppressed. Prolonged states like this are associated with elevated blood pressure, weakened immunity, and increased burden on the body's filtration systems.",
                    "Take a slow, unhurried walk for 20 to 30 minutes. Look around. Talk to your dog. Halfway through, stop completely. Stand still with your dog. Breathe in for four seconds and out for six. Keep one hand on your dog and feel their body settle before you move again. You cannot lead what you have not calmed.",
                    disclaimer
                ),
                
                >= 21 and <= 30 => (
                    "Disconnected",
                    "Stress is affecting your life. The connection between you and your dog is thin. Your nervous system is likely stuck in fight or flight running in the background. This is associated with elevated cortisol, increased inflammation, and reduced capacity for natural repair.",
                    "Take a 15 to 20 minute walk with your dog. Walk at a steady comfortable pace. No rushing, no destination. For at least five minutes give your dog your complete attention — eye contact, touch, calm presence. Add a short synchronization ritual: stop, place your hand on your dog, and slow your breathing until both of you are calm and steady.",
                    disclaimer
                ),
                
                >= 31 and <= 40 => (
                    "Elevated",
                    "Your body is under tension, stress, mental overload, or restlessness your dog is already reading. Even moderate persistent stress is associated with slightly elevated blood pressure, increased cortisol, and reduced efficiency in how your body processes and eliminates toxins.",
                    "Take a short deliberate reset. Go outside for 15 to 20 minutes. Move slowly. Be intentional with every step. Let your dog set the pace. Follow, do not lead. Include a brief synchronization ritual by pausing, placing your hand on your dog, and aligning your breathing with theirs for one to two minutes.",
                    disclaimer
                ),
                
                >= 41 and <= 50 => (
                    "Low Alignment",
                    "You are functional but not connected. If this becomes your norm, the bond erodes and so do the health benefits. Oxytocin release, cortisol modulation, and the cardiovascular calming effect all depend on the quality of your connection, not just the fact that a dog is in the room.",
                    "Spend at least 10 minutes walking or sitting quietly with your dog. Place one hand on them and slow your breathing. Bring your full attention into the present moment. Close with a short synchronization ritual by pausing together and allowing both of you to settle fully before moving on.",
                    disclaimer
                ),
                
                >= 51 and <= 60 => (
                    "Neutral",
                    "Nothing is dead but nothing is alive either. This is the most deceptive range. It feels fine while the connection quietly flattens. Your stress markers are not alarming but the positive neurochemical feedback — oxytocin, serotonin, and measurable drops in cortisol — is not firing at any meaningful level.",
                    "Take a short walk or spend 10 minutes in focused undistracted interaction. Be deliberate about making contact, both physical and verbal. Add a brief synchronization ritual by slowing your breathing and placing your attention fully on your dog for one to two minutes. Ten minutes of real effort outweighs an hour of passive presence.",
                    disclaimer
                ),
                
                >= 61 and <= 70 => (
                    "Mild Sync",
                    "You and your dog are generally aligned but running slightly on autopilot. The connection is active and your body is beginning to reflect it. Moderate bonding interactions are associated with improved heart rate variability, lower resting cortisol, and gentle increases in oxytocin and serotonin.",
                    "Take a relaxed walk or an easy play session for 10 to 15 minutes. Stay conscious and alert to your dog. Notice body language, energy, and breathing. Briefly pause and perform a light synchronization ritual by matching your breathing to your dog's calm state. Awareness is the difference between being near your dog and being with your dog.",
                    disclaimer
                ),
                
                >= 71 and <= 80 => (
                    "Good Alignment",
                    "You are in a solid state. Your dog is comfortable, responsive, and calm in your presence. The bonding neurochemistry — oxytocin, serotonin, endorphins — is active. This quality of connection is associated with sustained cardiovascular improvements, stronger immune function, and more efficient recovery across the body's major systems.",
                    "Build on it. Keep doing what you are doing and add one shared activity such as a walk, a play session, or five minutes of quiet time together. If you want to deepen it further, pause briefly and align your breathing with your dog for a short synchronization ritual. The bond does not just hold here, it deepens.",
                    disclaimer
                ),
                
                >= 81 and <= 90 => (
                    "Strong Sync",
                    "You and your dog are deeply connected. Calm, present, and stable. Deep human-dog connection is associated with lower blood pressure, reduced cortisol, elevated oxytocin, improved immune resilience, and stronger function across cardiovascular, endocrine, and hepatic systems. Your dog's calm is reinforcing your biological equilibrium. Yours is reinforcing theirs.",
                    "Do not overthink it and do not tinker. A walk or quiet time together is enough. If anything, simply pause and acknowledge the state. A short synchronization moment reinforces the loop without effort. This is the feedback loop working the way it is supposed to.",
                    disclaimer
                ),
                
                >= 91 and <= 100 => (
                    "Full Alignment",
                    "You and your dog are fully in sync. Grounded, calm, connected. The neurochemical exchange is at its peak. Oxytocin, serotonin, and endorphins are flowing naturally. Cortisol is suppressed. Your cardiovascular system, immune function, and the body's ability to process, filter, and recover are all operating in the state most associated with long-term health and resilience.",
                    "No correction needed. No action required. Stay aware of it and let it continue naturally. Stay here as long as you can. Return here as often as you can. This is what you are building toward every single day.",
                    disclaimer
                ),
                
                _ => (
                    "Neutral",
                    "Unable to determine sync status. Insufficient data to calculate meaningful score.",
                    "Ensure consistent data collection from both human and dog wearables for accurate sync assessment.",
                    disclaimer
                )
            };
        }
    }
}