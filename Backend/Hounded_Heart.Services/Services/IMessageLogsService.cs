using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;

namespace Hounded_Heart.Services.Services
{
    public interface IMessageLogsService
    {
        Task<MessageLog> LogMessage(
            Guid userId,
            string messageType,
            string channel,
            string recipientContact,
            string body,
            string? title = null,
            Guid? relatedAlertId = null);

        Task UpdateStatus(
            Guid messageId,
            string status,
            string? errorMessage = null);

        Task<List<MessageLog>> GetUserMessages(
            Guid userId,
            int limit = 10);
    }
}
