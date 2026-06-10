using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class Chakra
    {
        [Key]
        public Guid ChakraId { get; set; }

        [Required, MaxLength(100)]
        public string ChakraName { get; set; }

        [MaxLength(500)]
        public string? AudioUrl { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }

        //public ICollection<UserChakraProgress> UserChakraProgresses { get; set; }
    }
}
