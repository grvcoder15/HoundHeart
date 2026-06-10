using System;
using System.ComponentModel.DataAnnotations;

namespace Hounded_Heart.Models.Data
{
    public class StressEvent
    {
        [Key]
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime TimestampUtc { get; set; }
        public double HRVAtEvent { get; set; }
        public int HRAtEvent { get; set; }
        public double BaselineHRV { get; set; }
        public double BaselineHR { get; set; }
        public double DeviationScore { get; set; }
        public string? DogStateAtEvent { get; set; }
        public bool AlertFired { get; set; }
        public bool OutcomeLogged { get; set; }
    }
}
