using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Api.Services
{
    public class LaunchInviteService : BackgroundService
    {
        private readonly ILogger<LaunchInviteService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly int _checkIntervalMinutes;

        public LaunchInviteService(
            ILogger<LaunchInviteService> logger,
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _checkIntervalMinutes = _configuration.GetValue<int>("HoundHeart:LaunchInviteCheckIntervalMinutes", 5);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("LaunchInviteService started. Check interval: {Interval} minutes.", _checkIntervalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendLaunchInvitesIfDue(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Launch invite cycle failed.");
                }

                await Task.Delay(TimeSpan.FromMinutes(_checkIntervalMinutes), stoppingToken);
            }
        }

        private async Task SendLaunchInvitesIfDue(CancellationToken ct)
        {
            var launchDateRaw = _configuration["HoundHeart:LaunchInviteDateUtc"];
            if (string.IsNullOrWhiteSpace(launchDateRaw))
            {
                _logger.LogDebug("LaunchInviteDateUtc not configured. Skipping invite cycle.");
                return;
            }

            if (!DateTime.TryParse(launchDateRaw, out var configuredDate))
            {
                _logger.LogWarning("Invalid HoundHeart:LaunchInviteDateUtc value: {Value}", launchDateRaw);
                return;
            }

            var launchDateUtc = DateTime.SpecifyKind(configuredDate, DateTimeKind.Utc);
            if (DateTime.UtcNow < launchDateUtc)
            {
                _logger.LogDebug("Launch date not reached yet. LaunchInviteDateUtc={LaunchDateUtc}", launchDateUtc);
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var pending = await context.PreRegistrations
                .Where(x => !x.IsDeleted && x.ConsentGiven && !x.IsLaunchInviteSent)
                .OrderBy(x => x.CreatedOn)
                .ToListAsync(ct);

            if (pending.Count == 0)
            {
                _logger.LogDebug("No pending pre-registrations for launch invites.");
                return;
            }

            var now = DateTime.UtcNow;
            var sentCount = 0;

            foreach (var record in pending)
            {
                ct.ThrowIfCancellationRequested();

                var body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>HoundHeart Is Live!</h2>
  <p>Hi {System.Net.WebUtility.HtmlEncode(record.FullName)},</p>
  <p>Great news! HoundHeart has officially launched.</p>
  <p>As a pre-registered member, you now have launch access and priority updates.</p>
  <p>Please log in to explore the app and watch your inbox for invite-first checkout links and drop alerts.</p>
  <p>Best regards,<br/>The Hound Heart Team</p>
</body>
</html>";

                try
                {
                    await emailService.SendEmailAsync(
                        record.Email,
                        "HoundHeart Launch Notification",
                        body,
                        record.FullName);

                    record.IsLaunchInviteSent = true;
                    record.InviteSentOn = now;
                    record.UpdatedOn = now;
                    sentCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send launch invite to {Email}", record.Email);
                }
            }

            if (sentCount > 0)
            {
                await context.SaveChangesAsync(ct);
            }

            _logger.LogInformation("Launch invite cycle completed. Sent {SentCount}/{TotalCount} emails.", sentCount, pending.Count);
        }
    }
}
