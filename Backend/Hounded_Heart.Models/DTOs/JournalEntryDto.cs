using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class JournalEntryDto
    {
        public Guid UserId { get; set; }
        public string EntryType { get; set; }
        public string? Content { get; set; }
        public string? Tags { get; set; }
        public bool? IsArchive { get; set; }
        public string? LettrTo { get; set; }
        public string? MediaType { get; set; } 
        // Note: For file uploads, we usually bind to IFormFile in the controller method signature
        // to avoid adding ASP.NET Core dependencies to the Models project.
    }
}
