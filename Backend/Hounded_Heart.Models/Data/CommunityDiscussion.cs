using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class CommunityDiscussion
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(255)]
        public string Title { get; set; }

        [Required, MaxLength(150)]
        public string AuthorName { get; set; }

        public int RepliesCount { get; set; } = 0;

        public bool IsPinned { get; set; } = false;

        public string LastActive { get; set; } // String representation like "15 min ago"

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}
