using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("DogVitals")]
    public class DogVitalsRecord
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid DogId { get; set; }

        public int? HeartRate { get; set; }

        public int ActivityScore { get; set; }

        public double? Temperature { get; set; }

        public int RestScore { get; set; }

        public double? RespirationRate { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        [MaxLength(50)]
        public string State { get; set; }

        [MaxLength(50)]
        public string Source { get; set; } = "mock";

        // FitBark-specific columns
        public int? ActivityValue { get; set; }
        public int? MinPlay { get; set; }
        public int? MinActive { get; set; }
        public int? MinRest { get; set; }
        public int? NapTime { get; set; }

        public DateTime TimestampUtc { get; set; }
    }
}