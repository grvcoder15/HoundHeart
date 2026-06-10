using System;

namespace Hounded_Heart.Models.Dtos
{
    public class EditPostDto
    {
        public string Content { get; set; }
    }

    public class EditCommentDto
    {
        public string Content { get; set; }
    }

    public class ReportDto
    {
        public Guid PostId { get; set; }
        public Guid? CommentId { get; set; }
        public string Reason { get; set; }
    }
}
