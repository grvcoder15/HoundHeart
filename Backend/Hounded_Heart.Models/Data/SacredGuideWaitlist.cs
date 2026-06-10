using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Data
{
    [Table("SacredGuideWaitlist")]
    public class SacredGuideWaitlist
    {
        [Key]
        public Guid WaitlistId { get; set; }

        [Required]
        public Guid SacredGuideId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public DateTime JoinedOn { get; set; } = DateTime.UtcNow;

        public bool IsNotified { get; set; } = false;

        // Navigation properties
        [ForeignKey("SacredGuideId")]
        public SacredGuide? SacredGuide { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
