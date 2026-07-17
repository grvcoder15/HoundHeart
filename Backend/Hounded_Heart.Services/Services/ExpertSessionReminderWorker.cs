using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public class ExpertSessionReminderWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ExpertSessionReminderWorker> _logger;

        public ExpertSessionReminderWorker(IServiceProvider serviceProvider, ILogger<ExpertSessionReminderWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing expert session reminders.");
                }

                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
        }

        private async Task ProcessRemindersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            var adminEmail = config["AdminEmail"] ?? "admin@houndheart.com";
            var now = DateTime.UtcNow;
            var targetTime = now.AddMinutes(15);

            // Look for sessions scheduled in the next 15 minutes
            var upcomingSessions = await context.ExpertSessionConfirmeds
                .Include(s => s.Request)
                .Where(s => s.Status == "Scheduled" 
                            && s.ScheduledDateTime > now 
                            && s.ScheduledDateTime <= targetTime
                            && (!s.AdminReminderSent || !s.UserReminderSent))
                .ToListAsync();

            if (!upcomingSessions.Any()) return;

            foreach (var session in upcomingSessions)
            {
                if (!session.AdminReminderSent)
                {
                    string adminSubject = $"Reminder: Upcoming Expert Session in 15 Minutes";
                    string adminBody = $@"
                        <h3>Reminder: Upcoming Expert Session</h3>
                        <p>You have a session with <strong>{session.Request.UserName}</strong> ({session.Request.UserEmail}) starting in 15 minutes.</p>
                        <p><strong>Scheduled Time:</strong> {session.ScheduledDateTime:yyyy-MM-dd HH:mm} UTC</p>
                        <p><a href='{session.MeetingLink}' target='_blank'>Click here to join the session</a></p>";

                    try 
                    {
                        await emailService.SendEmailAsync(adminEmail, adminSubject, adminBody);
                        session.AdminReminderSent = true;
                    } 
                    catch (Exception ex) 
                    {
                        _logger.LogError(ex, "Failed to send Admin reminder email");
                    }
                }

                if (!session.UserReminderSent)
                {
                    string userSubject = $"Reminder: Your HoundHeart Expert Session starts in 15 Minutes";
                    string userBody = $@"
                        <h3>Reminder: Your Expert Session</h3>
                        <p>Hi {session.Request.UserName}, your session is starting in 15 minutes!</p>
                        <p><strong>Scheduled Time:</strong> {session.ScheduledDateTime:yyyy-MM-dd HH:mm} UTC</p>
                        <p><a href='{session.MeetingLink}' target='_blank'>Click here to join the session</a></p>";

                    try 
                    {
                        await emailService.SendEmailAsync(session.Request.UserEmail, userSubject, userBody);
                        session.UserReminderSent = true;
                    } 
                    catch (Exception ex) 
                    {
                        _logger.LogError(ex, "Failed to send User reminder email");
                    }
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
