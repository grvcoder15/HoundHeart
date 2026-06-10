using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.DTOs
{
    public class DogSelectedTraitsDto
    {
        public Guid DogId { get; set; }
        public Guid UserId { get; set; }
        public List<Guid> TraitIds { get; set; }
    }
}
