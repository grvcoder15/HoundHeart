using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Dtos
{
    public class TrendingTopic
    {
        [Key]
        public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string TopicName { get; set; }

        public string Count { get; set; } // Storing as string to support format like "1.2K"

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}
