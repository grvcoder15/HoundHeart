using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class UserCheckInUpdateDto
    {
        public Guid UserId { get; set; }
        public DateTime? Date { get; set; } // Local date from client
        public List<CheckInRatingDto> CheckIns { get; set; }
    }
    public class CheckInRatingDto
    {
        public Guid CheckInId { get; set; }
        public int? Rating { get; set; }
    }
}
