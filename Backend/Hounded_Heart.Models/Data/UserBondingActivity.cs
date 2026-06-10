using Hounded_Heart.Models.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class UserBondingActivity
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ActivityId { get; set; }
        public DateTime ActivityDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; }
        public BondingActivity Activity { get; set; }
    }
}
