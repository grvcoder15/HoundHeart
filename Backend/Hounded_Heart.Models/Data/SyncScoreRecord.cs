using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("SyncScoreRecords")]
    public class SyncScoreRecord
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid DogId { get; set; }

        public int Score { get; set; }

        [MaxLength(50)]
        public string Trend { get; set; }

        public int HRVStabilityScore { get; set; }

        public int SharedActivityScore { get; set; }

        public int DogCalmScore { get; set; }

        public int SleepQualityScore { get; set; }

        public DateTime CalculatedAt { get; set; }
    }
}