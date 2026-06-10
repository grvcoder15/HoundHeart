using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class JournalEntry
    {
        [Key]
        public Guid EntryId { get; set; }
        public Guid UserId { get; set; }
        public string EntryType { get; set; }
        public string? Content { get; set; }
        public string? Tags { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public bool IsDeleted { get; set; }
        public bool? IsArchive { get; set; }
        public string? LettrTo { get; set; }
        public string? MediaType { get; set; } = "Text"; // Text, Audio, Photo
        public string? MediaUrl { get; set; }
        public string? ImageUrl { get; set; }
    }
}
