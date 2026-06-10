using Microsoft.Extensions.Configuration;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? toName = null)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");

                string? smtpHost = smtpSettings["Host"];
                string? smtpPortStr = smtpSettings["Port"];
                string? useSslStr = smtpSettings["UseSsl"];
                string? fromEmail = smtpSettings["FromEmail"];
                string? fromName = smtpSettings["FromName"];
                string? username = smtpSettings["Username"];
                string? password = smtpSettings["Password"];

                if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpPortStr) || 
                    string.IsNullOrEmpty(fromEmail) || string.IsNullOrEmpty(username) || 
                    string.IsNullOrEmpty(password))
                {
                    throw new InvalidOperationException("SMTP configuration is incomplete");
                }

                int smtpPort = int.Parse(smtpPortStr);
                bool useSsl = bool.Parse(useSslStr ?? "true");

                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.EnableSsl = useSsl;
                    client.Credentials = new NetworkCredential(username, password);
                    client.Timeout = 10000; // 10 seconds

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName ?? "Hound Heart"),
                        Subject = subject,
                        Body = htmlBody,
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(new MailAddress(toEmail, toName ?? toEmail));

                    await client.SendMailAsync(mailMessage);
                    mailMessage.Dispose();
                }

                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Email send failed: {ex.Message}");
                throw;
            }
        }
    }
}
