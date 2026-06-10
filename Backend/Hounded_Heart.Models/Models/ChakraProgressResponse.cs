using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Models
{
    public class ChakraProgressResponse
    {
        public Guid ChakraId { get; set; }
        public decimal LastPlayedPosition { get; set; }
        public decimal TotalDuration { get; set; }
        public bool IsCompleted { get; set; }
        public string FormattedTime { get; set; }
        public string Message { get; set; }
    }
}
