using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Dtos
{
    public class Dog
    {
        [Key]
        public Guid DogId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(100)]
        public string DogName { get; set; }

        [MaxLength(500)]
        public string? ProfilePhoto { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }
        public double CurrentScore { get; set; } = 50.0;
        public string? Breed { get; set; }
        public int? Age { get; set; }
        public double? Weight { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        [ForeignKey(nameof(UserId))]
        public User User { get; set; }

        public ICollection<DogSelectedTrait> SelectedTraits { get; set; }
    }
}
