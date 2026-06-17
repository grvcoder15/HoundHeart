using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public static class UserNotificationEmails
    {
        public static async Task SendFitbitConnectedAsync(
            IEmailService emailService,
            ILogger logger,
            string toEmail,
            string? fullName)
        {
            await SendAsync(
                emailService,
                logger,
                toEmail,
                fullName,
                "Your Fitbit is now connected",
                "Fitbit Connected Successfully",
                "<p>Your Fitbit account is now linked to HoundHeart. We will start monitoring your health data including heart rate, steps, and sleep.</p>");
        }

        public static async Task SendFitBarkConnectedAsync(
            IEmailService emailService,
            ILogger logger,
            string toEmail,
            string? fullName)
        {
            await SendAsync(
                emailService,
                logger,
                toEmail,
                fullName,
                "Your FitBark device is now connected",
                "FitBark Connected Successfully",
                "<p>Your FitBark device is now linked to HoundHeart. We will start tracking your dog's activity, sleep, and GPS data.</p>");
        }

        public static async Task SendBaselineReadyAsync(
            IEmailService emailService,
            ILogger logger,
            string toEmail,
            string? fullName)
        {
            await SendAsync(
                emailService,
                logger,
                toEmail,
                fullName,
                "Your HoundHeart baseline is ready",
                "Baseline Formed",
                "<p>Your personal health baseline has been formed. Stress monitoring is now active and tailored to your data.</p>");
        }

        private static async Task SendAsync(
            IEmailService emailService,
            ILogger logger,
            string toEmail,
            string? fullName,
            string subject,
            string heading,
            string bodyHtml)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                logger.LogWarning("Skipped sending '{Subject}' because recipient email is empty.", subject);
                return;
            }

            var html = EmailTemplateHelper.Build(heading, fullName, bodyHtml);

            try
            {
                await emailService.SendEmailAsync(toEmail, subject, html, fullName);
                logger.LogInformation("Sent '{Subject}' email to {Email}.", subject, toEmail);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send '{Subject}' email to {Email}.", subject, toEmail);
                throw;
            }
        }
    }
}
