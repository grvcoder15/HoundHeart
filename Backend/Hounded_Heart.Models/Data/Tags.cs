using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class Tags
    {
        [Key]
        public int TagId { get; set; }
        public string TagName { get; set; }
    }
}
