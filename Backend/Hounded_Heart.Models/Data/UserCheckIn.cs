using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class UserCheckIn
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid CheckInId { get; set; }

        public int? Rating { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedOn { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        [ForeignKey(nameof(CheckInId))]
        public CheckIn CheckIn { get; set; }

        public int? DailyPointsChange { get; set; }
        public int? ScoreSnapshot { get; set; }
        public DateTime? ActivityDate { get; set; } // Localized date from client
        public bool IsMissed { get; set; } = false;
    }
}
