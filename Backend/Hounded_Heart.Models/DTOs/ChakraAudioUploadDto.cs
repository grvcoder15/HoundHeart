using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class ChakraAudioUploadDto
    {
        public Guid ChakraId { get; set; }
        public string Base64Audio { get; set; }
    }
}
