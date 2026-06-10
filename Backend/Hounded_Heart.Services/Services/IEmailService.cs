using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? toName = null);
    }
}
