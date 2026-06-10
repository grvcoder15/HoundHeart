using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class SaveChakraRatingDto
    {
        public Guid UserId { get; set; }
        public Guid ChakraId { get; set; }
        public int Rating { get; set; } // 1–10
        public string? Notes { get; set; }   
    }
}
