using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface ISmsService
    {
        Task<bool> SendSms(
            Guid userId,
            string toPhoneNumber,
            string messageType,
            string body,
            Guid? relatedAlertId = null);
    }
}
