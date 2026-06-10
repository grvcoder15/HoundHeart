using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(Guid userId, string title, string message, string type);
        Task<List<NotificationLog>> GetNotificationHistoryAsync(Guid userId);
        Task SendStressAlert(Guid userId, string suggestion, string dogName, string dogState);
        Task SendRecoveryMessage(Guid userId, string recoveryMessage);
    }

    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task SendNotificationAsync(Guid userId, string title, string message, string type)
        {
            var log = new NotificationLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                SentAt = DateTime.UtcNow,
                IsRead = false,
                IsDelivered = false,
                Type = type
            };

            _context.NotificationLogs.Add(log);
            await _context.SaveChangesAsync();
            
            // Console log for sandbox feedback
            Console.WriteLine($"[Mock Push Notification] To: {userId} | {title}: {message}");
        }

        public async Task<List<NotificationLog>> GetNotificationHistoryAsync(Guid userId)
        {
            return await _context.NotificationLogs
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.SentAt)
                .Take(10)
                .ToListAsync();
        }

        public async Task SendStressAlert(Guid userId, string suggestion, string dogName, string dogState)
        {
            var log = new MessageLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MessageType = "stress_alert",
                Channel = "push",
                RecipientContact = "pending",
                Title = "Stress Alert",
                Body = suggestion,
                Status = "pending",
                SentAt = DateTime.UtcNow
            };

            _context.MessageLogs.Add(log);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"[Message Queued] Type: stress_alert | User: {userId} | {suggestion}");
        }

        public async Task SendRecoveryMessage(Guid userId, string recoveryMessage)
        {
            var log = new MessageLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MessageType = "recovery",
                Channel = "push",
                RecipientContact = "pending",
                Title = "You're Back to Normal!",
                Body = recoveryMessage,
                Status = "pending",
                SentAt = DateTime.UtcNow
            };

            _context.MessageLogs.Add(log);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"[Message Queued] Type: recovery | User: {userId} | {recoveryMessage}");
        }
    }
}
