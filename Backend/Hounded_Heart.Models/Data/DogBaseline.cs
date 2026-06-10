using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("DogBaselines")]
    public class DogBaseline
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid DogId { get; set; }

        public double? AvgHeartRate { get; set; }
        public double AvgActivityScore { get; set; }
        public double? AvgTemperature { get; set; }
        public double AvgRestScore { get; set; }
        public double? AvgRespirationRate { get; set; }

        [Required]
        public DateTime LastUpdatedUtc { get; set; }

        [Required]
        public int DaysOfDataCollected { get; set; }

        public bool DogBaselineEstablished { get; set; } = false;
    }
}