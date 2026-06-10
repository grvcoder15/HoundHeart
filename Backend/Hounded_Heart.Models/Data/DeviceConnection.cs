using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("DeviceConnections")]
    public class DeviceConnection
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public Guid? DogId { get; set; }

        [Required, MaxLength(50)]
        public string DeviceType { get; set; }

        [MaxLength(100)]
        public string? DeviceModel { get; set; }

        [Required, MaxLength(100)]
        public string DeviceNumber { get; set; }

        public bool IsConnected { get; set; } = false;

        public DateTime? ConnectedAt { get; set; }

        public DateTime? DisconnectedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}