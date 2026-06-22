using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Hounded_Heart.Models.DTOs
{
    public class UpdateDogDetailsDto
    {
        [Required]
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }
        
        [JsonPropertyName("age")]
        public int? Age { get; set; }

        [JsonPropertyName("dogPhotoUrl")]
        public string? DogPhotoUrl { get; set; }
        
        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("dateOfDeath")]
        public DateTime? DateOfDeath { get; set; }

        [JsonPropertyName("dateLost")]
        public DateTime? DateLost { get; set; }

        [JsonPropertyName("memoryNote")]
        public string? MemoryNote { get; set; }
    }
}
