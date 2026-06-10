using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class BondingActivity
    {
        [Key]
        public Guid ActivityId { get; set; }
        public string ActivityName { get; set; }
        public int Points { get; set; }
        public string Category { get; set; } // Physical, Spiritual, Emotional
        public string InteractionType { get; set; } // Checkbox, Redirect, Input
    }
}
