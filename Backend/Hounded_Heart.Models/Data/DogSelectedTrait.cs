using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class DogSelectedTrait
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid DogId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid TraitId { get; set; }

        public bool IsSelected { get; set; } = true;
        public DateTime CreatedOn { get; set; } = DateTime.Now;

        [ForeignKey(nameof(DogId))]
        public Dog Dog { get; set; }

        [ForeignKey(nameof(TraitId))]
        public DogSpiritualTrait Trait { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; }
    }
}
