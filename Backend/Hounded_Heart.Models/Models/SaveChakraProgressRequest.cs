using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Models
{
    public class SaveChakraProgressRequest
    {
        public Guid UserId { get; set; }
        public Guid ChakraId { get; set; }
        public decimal CurrentPosition { get; set; }
        public decimal TotalDuration { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? Date { get; set; } // Local date from client
        public bool IsPaused { get; set; }
    }
}
