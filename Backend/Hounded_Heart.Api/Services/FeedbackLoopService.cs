using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Services
{
    public class FeedbackLoopService : BackgroundService
    {
        private readonly ILogger<FeedbackLoopService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public FeedbackLoopService(ILogger<FeedbackLoopService> logger, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FeedbackLoopService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessUnresolvedAlerts();
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Expected when cancellation is requested
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing unresolved alerts.");
                    // Wait a bit before retrying to avoid rapid failure loops
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }

            _logger.LogInformation("FeedbackLoopService stopped.");
        }

        private async Task ProcessUnresolvedAlerts()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 1. Find all WellnessAlerts WHERE:
            // - IsActedOn = false
            // - CreatedAt >= DateTime.UtcNow.AddMinutes(-25)
            // - CreatedAt <= DateTime.UtcNow.AddMinutes(-15)
            // (alerts that are 15-25 minutes old and unresolved)
            var cutoffTimeStart = DateTime.UtcNow.AddMinutes(-25);
            var cutoffTimeEnd = DateTime.UtcNow.AddMinutes(-15);

            // Find unresolved alerts only for users with active Fitbit connections
            var unresolvedAlerts = await (from a in context.WellnessAlerts
                                        join u in context.Users on a.UserId equals u.UserId
                                        where !a.IsActedOn &&
                                              a.CreatedAt >= cutoffTimeStart &&
                                              a.CreatedAt <= cutoffTimeEnd &&
                                              !string.IsNullOrEmpty(u.FitbitAccessToken) &&
                                              !string.IsNullOrEmpty(u.FitbitRefreshToken) &&
                                              u.IsActive && !u.IsDeleted
                                        select a).ToListAsync();

            if (!unresolvedAlerts.Any())
            {
                _logger.LogInformation("No unresolved alerts found in the 15-25 minute window.");
                return;
            }

            int resolvedCount = 0;

            // 2. For each alert found:
            foreach (var alert in unresolvedAlerts)
            {
                try
                {
                    // a. Get the HRV at the time of alert (HRVAtAlert)
                    var hrvAtAlert = alert.HRVAtAlert;

                    // b. Get current latest HumanVitals for that UserId
                    var latestHumanVitals = await context.HumanVitals
                        .Where(h => h.UserId == alert.UserId)
                        .OrderByDescending(h => h.TimestampUtc)
                        .FirstOrDefaultAsync();

                    if (latestHumanVitals == null)
                    {
                        _logger.LogWarning($"No human vitals found for user {alert.UserId}. Skipping alert {alert.Id}.");
                        continue;
                    }

                    // c. Compare current HRV to HRV at alert time:
                    var currentHRV = latestHumanVitals.HRV.GetValueOrDefault(0);
                    var improvementPercentage = hrvAtAlert > 0 ? ((currentHRV - hrvAtAlert) / hrvAtAlert) * 100 : 0;

                    string outcome;
                    if (improvementPercentage >= 10)
                    {
                        // If current HRV improved by 10%+ → outcome = "improved"
                        outcome = "improved";
                    }
                    else if (improvementPercentage < 0)
                    {
                        // If current HRV dropped further → outcome = "worsened"
                        outcome = "worsened";
                    }
                    else
                    {
                        // Otherwise → outcome = "no_change"
                        outcome = "no_change";
                    }

                    // d. Generate recovery message based on outcome
                    string recoveryMessage = GenerateRecoveryMessage(outcome, improvementPercentage);

                    // e. Update the alert:
                    alert.Outcome = outcome;
                    alert.RecoveryMessage = recoveryMessage;
                    alert.IsActedOn = true;
                    alert.ResolvedAt = DateTime.UtcNow;

                    context.WellnessAlerts.Update(alert);
                    resolvedCount++;

                    // f. Get NotificationService from scope and send recovery notification
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    var smsService = scope.ServiceProvider.GetRequiredService<ISmsService>();
                    
                    await notificationService.SendRecoveryMessage(alert.UserId, recoveryMessage);

                    var humanProfile = await context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == alert.UserId);
                    if (humanProfile != null && !string.IsNullOrEmpty(humanProfile.PhoneNumber))
                    {
                        string smsBody = "";
                        if (outcome == "improved")
                        {
                            smsBody = $"HoundHeart: Feeling better? " +
                            $"Your HRV recovered from {hrvAtAlert}ms " +
                            $"to {currentHRV}ms. " +
                            "Your time with your dog helped 🐾";
                        }
                        else if (outcome == "no_change")
                        {
                            smsBody = "HoundHeart: Still feeling stressed? " +
                            "Try a short walk with your dog or " +
                            "practice slow breathing together.";
                        }
                        else if (outcome == "worsened")
                        {
                            smsBody = "HoundHeart: Your stress is still elevated. " +
                            "Consider taking a break and spending " +
                            "quiet time with your dog.";
                        }

                        await smsService.SendSms(
                            alert.UserId, humanProfile.PhoneNumber,
                            "recovery_calm", smsBody, alert.Id);
                    }

                    _logger.LogInformation($"Resolved alert {alert.Id} for user {alert.UserId} with outcome '{outcome}'. HRV change: {improvementPercentage:F1}%. Recovery message sent.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing alert {alert.Id} for user {alert.UserId}.");
                }
            }

            // e. SaveChangesAsync()
            if (resolvedCount > 0)
            {
                await context.SaveChangesAsync();
            }

            // 3. Log how many alerts were resolved
            _logger.LogInformation($"FeedbackLoopService processed {resolvedCount} unresolved alerts.");
        }

        /// <summary>
        /// Generate outcome-based recovery message for wellness alerts
        /// </summary>
        /// <param name="outcome">The determined outcome: "improved", "worsened", or "no_change"</param>
        /// <param name="improvementPercentage">The HRV improvement percentage</param>
        /// <returns>Personalized recovery message</returns>
        private string GenerateRecoveryMessage(string outcome, double improvementPercentage)
        {
            return outcome switch
            {
                "improved" => $"Great news! Your stress levels have improved significantly. Your HRV increased by {Math.Abs(improvementPercentage):F1}%, showing your body has recovered well. Keep up the positive momentum!",
                "worsened" => $"We noticed your stress levels may still be elevated. Your HRV decreased by {Math.Abs(improvementPercentage):F1}% since our last check. Consider taking some time to relax or practice breathing exercises.",
                "no_change" => $"Your stress levels appear stable since our last alert. Your HRV changed by {improvementPercentage:F1}%. Continue monitoring your wellness and remember to take breaks when needed.",
                _ => "We've completed our wellness check-in. Continue taking care of yourself and your bond with your dog."
            };
        }
    }
}