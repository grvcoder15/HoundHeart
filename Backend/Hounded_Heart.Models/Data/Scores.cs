using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class Scores
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Points { get; set; }
        public DateTime CreatedAt { get; set; }
        
    }
}
