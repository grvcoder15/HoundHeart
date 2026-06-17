using System;
using System.Threading.Tasks;
using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;

namespace Hounded_Heart.Services.Services
{
    public class SmsService : ISmsService
    {
        private readonly IMessageLogsService _messageLogsService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;
        private readonly ILogger<SmsService> _logger;
        private readonly IConfiguration _configuration;

        public SmsService(
            IMessageLogsService messageLogsService,
            IEmailService emailService,
            AppDbContext context,
            IConfiguration configuration,
            ILogger<SmsService> logger)
        {
            _messageLogsService = messageLogsService;
            _emailService = emailService;
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendSms(
            Guid userId,
            string toPhoneNumber,
            string messageType,
            string body,
            Guid? relatedAlertId = null)
        {
            var recipientEmail = await ResolveRecipientEmailAsync(userId, toPhoneNumber);

            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                _logger.LogWarning("Email notification skipped because no recipient email was resolved for user {UserId}.", userId);
                return false;
            }

            var log = await _messageLogsService.LogMessage(
                userId,
                messageType,
                "email",
                recipientEmail,
                body,
                null,
                relatedAlertId);

            try
            {
                var subject = BuildSubject(messageType);
                var encodedBody = $"<p>{WebUtility.HtmlEncode(body).Replace("\n", "<br/>")}</p>";
                var htmlBody = EmailTemplateHelper.Build(subject, null, encodedBody);
                await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);

                await _messageLogsService.UpdateStatus(log.Id, "sent");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification email");
                await _messageLogsService.UpdateStatus(log.Id, "failed", ex.Message);
                return false;
            }
        }

        private async Task<string?> ResolveRecipientEmailAsync(Guid userId, string recipientHint)
        {
            if (!string.IsNullOrWhiteSpace(recipientHint) && recipientHint.Contains("@"))
            {
                return recipientHint.Trim();
            }

            if (userId != Guid.Empty)
            {
                var userEmail = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrWhiteSpace(userEmail))
                {
                    return userEmail.Trim();
                }
            }

            return null;
        }

        private static string BuildSubject(string messageType)
        {
            return messageType switch
            {
                "stress_alert" => "HoundHeart Stress Alert",
                "recovery_calm" => "HoundHeart Recovery Check-In",
                "baseline_ready" => "HoundHeart Baseline Ready",
                "system" => "HoundHeart Notification",
                _ => "HoundHeart Update"
            };
        }
    }
}
