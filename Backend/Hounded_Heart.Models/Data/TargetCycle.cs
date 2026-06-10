using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class TargetCycle
    {
        [Key]
        public Guid Id { get; set; }

        public int Cycles { get; set; }

        [MaxLength(50)]
        public string DurationDescription { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime? UpdatedOn { get; set; }
    }
}
