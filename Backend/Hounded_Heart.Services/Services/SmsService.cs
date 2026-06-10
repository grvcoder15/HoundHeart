using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace Hounded_Heart.Services.Services
{
    public class SmsService : ISmsService
    {
        private readonly IMessageLogsService _messageLogsService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmsService> _logger;

        public SmsService(IMessageLogsService messageLogsService, IConfiguration configuration, ILogger<SmsService> logger)
        {
            _messageLogsService = messageLogsService;
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
            // 1. Create a pending MessageLog entry first
            var log = await _messageLogsService.LogMessage(
                userId,
                messageType,
                "sms",
                toPhoneNumber,
                body,
                null,
                relatedAlertId);

            bool.TryParse(_configuration["Twilio:Enabled"], out bool isTwilioEnabled);

            if (!isTwilioEnabled)
            {
                // 2. Simulated sending for testing
                _logger.LogInformation($"SMS (disabled): {body}");
                await _messageLogsService.UpdateStatus(log.Id, "sent");
                return true;
            }

            // 3. Real Twilio sending
            try
            {
                string accountSid = _configuration["Twilio:AccountSid"];
                string authToken = _configuration["Twilio:AuthToken"];
                string fromNumber = _configuration["Twilio:FromNumber"];

                TwilioClient.Init(accountSid, authToken);

                // Normalize to E.164 format: if 10-digit Indian number, add +91
                var normalizedTo = toPhoneNumber.Trim();
                if (!normalizedTo.StartsWith("+") && normalizedTo.Length == 10)
                    normalizedTo = "+91" + normalizedTo;

                var message = await MessageResource.CreateAsync(
                    to: new PhoneNumber(normalizedTo),
                    from: new PhoneNumber(fromNumber),
                    body: body
                );

                await _messageLogsService.UpdateStatus(log.Id, "sent");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SMS via Twilio");
                await _messageLogsService.UpdateStatus(log.Id, "failed", ex.Message);
                return false;
            }
        }
    }
}
