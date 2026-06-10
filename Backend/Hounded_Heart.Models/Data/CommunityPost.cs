using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Models.Dtos
{
    [Table("CommunityPosts")]
    public class CommunityPost
    {
        [Key]
        public Guid PostId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(2000)]
        public string Content { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public int LikeCount { get; set; } = 0;
        public int CommentCount { get; set; } = 0;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedOn { get; set; }
        public bool IsDeleted { get; set; } = false;

        // Moderation and Engagement fields
        [MaxLength(50)]
        public string? ModerationStatus { get; set; } = "published";

        [MaxLength(500)]
        public string? Hashtags { get; set; }

        // Navigation
        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}
