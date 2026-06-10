using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class ChakraRitualProgress   
    {
        [Key]
        public Guid Id { get; set; } 
        public Guid UserId { get; set; }
        public Guid ChakraId { get; set; }
        public decimal? LastPlayedPosition { get; set; } // seconds
        public decimal? TotalDuration { get; set; }      // seconds
        public bool? IsCompleted { get; set; }
        public DateTime? LastPlayedDate { get; set; } = DateTime.UtcNow;
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool? IsPaused { get; set; }
    }
}
