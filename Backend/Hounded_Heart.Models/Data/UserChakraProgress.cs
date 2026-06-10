using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class UserChakraProgress
    {
       
       
            [Key]
            public Guid ChakraProgressId { get; set; }

            [Required]
            public Guid UserId { get; set; }

            [Required]
            public Guid ChakraId { get; set; }

            public int? PauseTimeInSeconds { get; set; }
            public bool IsCompleted { get; set; } = false;

            public DateTime LastPlayedOn { get; set; } = DateTime.Now;
            public DateTime CreatedOn { get; set; } = DateTime.Now;
            public DateTime? UpdatedOn { get; set; }

            [ForeignKey(nameof(UserId))]
            public User User { get; set; }

            [ForeignKey(nameof(ChakraId))]
            public Chakra Chakra { get; set; }
        
    }
}
