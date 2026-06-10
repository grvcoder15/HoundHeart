using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Models
{
    public class ChangePasswordRequestModel
    {
        public Guid? UserId { get; set; }
        public string NewPassword { get; set; }
        public string? CurrentPassword { get; set; }
        public string? Email { get; set; }
    }
}
