using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class UserSpiritualTrait
    {
        [Key]
        public Guid TraitId { get; set; }

        [Required, MaxLength(100)]
        public string TraitName { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<UserSelectedTrait> UserSelectedTraits { get; set; }
    }
}
