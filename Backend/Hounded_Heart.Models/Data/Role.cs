using Hounded_Heart.Models.Dtos;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class Role
    {

        [Key]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string RoleName { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public DateTime UpdatedOn { get; set; } = DateTime.Now;

        public ICollection<User> User { get; set; }

    }
}
