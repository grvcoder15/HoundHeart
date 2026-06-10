using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class SaveUserChakraProgressDto
    {
        public Guid UserId { get; set; }
        public Guid ChakraId { get; set; }
        public int PauseTimeInSeconds { get; set; } // e.g. 65 for 1:05
        public bool IsCompleted { get; set; }
    }
}
