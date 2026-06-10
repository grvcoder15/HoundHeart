using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class UserProfileDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? ProfilePhoto { get; set; }
        public int? Age { get; set; }
        public string? ProfileName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool? IsProfileSetupCompleted { get; set; }
        public int JournalEntryCount { get; set; }
        public bool IsGoogleSignIn { get; set; }

        public DogDto? Dog { get; set; }
        public List<UserTraitDto> UserSelectedTraits { get; set; }
        public List<DogTraitDto> DogSelectedTraits { get; set; }
    }

    public class DogDto
    {
        public Guid DogId { get; set; }
        public string DogName { get; set; }
        public string? Breed { get; set; }
        public int? Age { get; set; }
        public double? Weight { get; set; }
        public string? ProfilePhoto { get; set; }
    }
    public class UserTraitDto
    {
        public Guid TraitId { get; set; }
        public string TraitName { get; set; }
    }

    public class DogTraitDto
    {
        public Guid TraitId { get; set; }
        public string TraitName { get; set; }
    }


}
