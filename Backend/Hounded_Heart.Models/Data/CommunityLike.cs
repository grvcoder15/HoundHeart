using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CommunityLike
    {
        [Key]
        public Guid LikeId { get; set; }

        [Required]
        public Guid PostId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // Navigation
        public CommunityPost Post { get; set; }
        public User User { get; set; }
    }
}
