using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Dtos
{
    [Table("CommunityComments")]
    public class CommunityComment
    {
        [Key]
        public Guid CommentId { get; set; }

        [Required]
        public Guid PostId { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(1000)]
        public string Content { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public Guid? ParentCommentId { get; set; }

        // Navigation
        [ForeignKey("PostId")]
        public CommunityPost Post { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("ParentCommentId")]
        public CommunityComment ParentComment { get; set; }

        public ICollection<CommunityComment> Replies { get; set; } = new List<CommunityComment>();
    }
}
