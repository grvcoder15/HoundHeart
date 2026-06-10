using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class AddUserProfileDto
    {
        public Guid UserId { get; set; }
        public string ProfileName { get; set; }
        public int? Age { get; set; }
        public string? ProfilePhotoUrl { get; set; } // Blob URL from front-end

    }
}
