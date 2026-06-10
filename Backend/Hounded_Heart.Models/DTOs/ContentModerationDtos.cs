using System;
using System.Collections.Generic;

namespace Hounded_Heart.Models.Dtos
{
    public class ContentStatsDto
    {
        public int TotalPosts { get; set; }
        public int PendingReview { get; set; }
        public int FlaggedPosts { get; set; }
        public int PostsToday { get; set; }
    }

    public class ContentPostDto
    {
        public Guid PostId { get; set; }
        public string User { get; set; } = string.Empty;
        public string Handle { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new List<string>();
        public string Time { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
    }
}
