using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class CheckIn
    {
        [Key]
        public Guid CheckInId { get; set; }

        [Required, MaxLength(500)]
        public string Questions { get; set; }

        public int? Rating { get; set; }

        [MaxLength(150)]
        public string? LowEnergyLabel { get; set; }

        [MaxLength(150)]
        public string? HighEnergyLabel { get; set; }

        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }

        public ICollection<UserCheckIn> UserCheckIns { get; set; }
    }
}
