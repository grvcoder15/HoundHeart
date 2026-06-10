using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Hounded_Heart.Services.ServiceResult;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class ChangePasswordService
    {
        private readonly AppDbContext _dbContext;
        private readonly IEmailService _emailService;

        public ChangePasswordService(AppDbContext dbContext, IEmailService emailService)
        {
            _dbContext = dbContext;
            _emailService = emailService;
        }

        public async Task<ApiResponse<string>> SendMailchangepassword(EmailSendModel emailSendModel)
        {
            var userdetails = _dbContext.Users
                .FirstOrDefault(x => x.Email == emailSendModel.Email);

            if (userdetails == null)
            {
                return ResponseHelper.Fail<string>("User not found.", 404);
            }

            if (string.IsNullOrEmpty(emailSendModel.Email))
            {
                return ResponseHelper.Fail<string>("Email address not valid", 400);
            }

            try
            {
                var otp = new Random().Next(1000, 9999).ToString();

                // Check if OTP record already exists for this user
                var existingOtp = await _dbContext.UserOtps
                    .FirstOrDefaultAsync(x => x.UserId == userdetails.UserId);

                if (existingOtp != null)
                {
                    // ✅ Update existing OTP record for resend
                    existingOtp.OtpCode = otp;
                    existingOtp.ExpiryTime = DateTime.UtcNow.AddMinutes(10);
                    existingOtp.IsUsed = false;
                    existingOtp.CreatedAt = DateTime.UtcNow;
                    _dbContext.UserOtps.Update(existingOtp);
                }
                else
                {
                    // ✅ Create new record only if not exists
                    var newOtp = new UserOtp
                    {
                        Id = Guid.NewGuid(),
                        UserId = userdetails.UserId,
                        Email = emailSendModel.Email,
                        OtpCode = otp,
                        ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                        IsUsed = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.UserOtps.Add(newOtp);
                }

                await _dbContext.SaveChangesAsync();

                string body = $@"
        <html>
        <body>
          <p>Dear,</p>
          <p>Thank you for your request!</p>
          <p><strong>Your Code is:</strong> {otp}</p>
          <p>Please use this Code to verify your account within the next 10 minutes.</p>
          <p>If you did not request this Code, please ignore this message.</p>
          <p>Thank you,</p>
          <p>The Support Team</p>
        </body>
        </html>";

                // Send email via SMTP
                await _emailService.SendEmailAsync(emailSendModel.Email, "OTP Verification", body);

                return ResponseHelper.Success("Mail sent successfully", "Mail Sent", 200);
            }
            catch (Exception ex)
            {
                return ResponseHelper.Fail<string>(ex.Message, 500);
            }
        }
    }
}
