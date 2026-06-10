using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Services.Services
{
    public class MessageLogsService : IMessageLogsService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<MessageLogsService> _logger;

        public MessageLogsService(AppDbContext context, ILogger<MessageLogsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<MessageLog> LogMessage(
            Guid userId,
            string messageType,
            string channel,
            string recipientContact,
            string body,
            string? title = null,
            Guid? relatedAlertId = null)
        {
            var messageLog = new MessageLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MessageType = messageType,
                Channel = channel,
                RecipientContact = recipientContact,
                Body = body,
                Title = title,
                RelatedAlertId = relatedAlertId,
                Status = "pending",
                SentAt = DateTime.UtcNow
            };

            _context.MessageLogs.Add(messageLog);
            await _context.SaveChangesAsync();

            return messageLog;
        }

        public async Task UpdateStatus(
            Guid messageId,
            string status,
            string? errorMessage = null)
        {
            var messageLog = await _context.MessageLogs.FindAsync(messageId);
            if (messageLog != null)
            {
                messageLog.Status = status;
                if (errorMessage != null)
                {
                    messageLog.ErrorMessage = errorMessage;
                }

                if (status.Equals("delivered", StringComparison.OrdinalIgnoreCase))
                {
                    messageLog.DeliveredAt = DateTime.UtcNow;
                }

                _context.MessageLogs.Update(messageLog);
                await _context.SaveChangesAsync();
            }
            else
            {
                _logger.LogWarning($"MessageLog with Id {messageId} not found for status update.");
            }
        }

        public async Task<List<MessageLog>> GetUserMessages(
            Guid userId,
            int limit = 10)
        {
            return await _context.MessageLogs
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.SentAt)
                .Take(limit)
                .ToListAsync();
        }
    }
}
