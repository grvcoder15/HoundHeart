using System;

namespace Hounded_Heart.Models.DTOs
{
    public class UserManagementStatsDto
    {
        public int TotalUsers { get; set; }
        public int PremiumMembers { get; set; }
        public int ActiveToday { get; set; }
        public int Suspended { get; set; }
    }

    public class UserManagementListItemDto
    {
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Status { get; set; }
        public string TierLevel { get; set; } = "free";
        public string Role { get; set; } // e.g., "Premium", "Free"
        public double BondedScore { get; set; }
        public int CommunityPosts { get; set; }
        public DateTime JoinedDate { get; set; }
        public string? ProfilePhoto { get; set; }
    }

    public class UserManagementDetailsDto : UserManagementListItemDto
    {
        public string DogName { get; set; }
        public List<string> DogTraits { get; set; } = new List<string>();
        public bool IsPremium { get; set; }
    }
}
