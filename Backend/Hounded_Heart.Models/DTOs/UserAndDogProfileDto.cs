using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class UserAndDogProfileDto
    {
        public Guid UserId { get; set; }  
        public string? ProfileName { get; set; }
        public int? Age { get; set; }
        public string? Email { get; set; }
        public string? Base64Image { get; set; }
        public string? DogName { get; set; }
        public string? Breed { get; set; }
        public int? DogAge { get; set; }
        public double? Weight { get; set; }
        public string? DogBase64Image { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
