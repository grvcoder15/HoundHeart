using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.DTOs
{
    public class VerifyEmailOtpDto
    {
        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(4)]
        public string OtpCode { get; set; }
    }

    public class ResendVerificationDto
    {
        [Required]
        public Guid UserId { get; set; }
    }

    public class SendSignupOtpDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }
    }

    public class VerifySignupOtpDto
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, MaxLength(4)]
        public string OtpCode { get; set; }
    }
}
