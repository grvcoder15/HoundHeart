using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class UserChakraRating
    {
        public Guid UserChakraRatingId { get; set; }
        public Guid UserId { get; set; }
        public Guid ChakraId { get; set; }
        public int Rating { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }
    }
}
