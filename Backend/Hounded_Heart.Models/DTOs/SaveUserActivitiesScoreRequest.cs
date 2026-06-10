using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class ActivityScoreItem
    {
        public Guid ActivityId { get; set; }
        public int Score { get; set; }
    }

    public class SaveUserActivitiesScoreRequest
    {
        public Guid UserId { get; set; }
        public DateTime? Date { get; set; } // Local date from client
        public List<ActivityScoreItem> Activities { get; set; } = new();
    }
}
