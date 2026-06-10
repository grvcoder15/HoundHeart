using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("PreRegistrations")]
    public class PreRegistration
    {
        [Key]
        public Guid PreRegistrationId { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(30)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AddressLine1 { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? AddressLine2 { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string StateProvince { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string PostalCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [Required]
        [MaxLength(600)]
        public string Address { get; set; } = string.Empty;

        public bool ConsentGiven { get; set; }

        [MaxLength(50)]
        public string Source { get; set; } = "LandingPage";

        public bool IsLaunchInviteSent { get; set; } = false;

        public DateTime? InviteSentOn { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedOn { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}
