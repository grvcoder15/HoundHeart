using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AudioController : ControllerBase
    {
        private readonly BlobStorageService _blobService;
        private readonly ChakraService _chakraService;

        public AudioController(BlobStorageService blobService, ChakraService chakraService)
        {
            _blobService = blobService;
            _chakraService = chakraService;
        }

        /// <summary>
        /// Upload audio file for a specific chakra
        /// POST /api/audio/upload
        /// </summary>
        [HttpPost("upload")]
        public async Task<IActionResult> UploadChakraAudio([FromBody] AudioUploadRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.ChakraType) || string.IsNullOrEmpty(request.Base64Audio))
                return BadRequest(ResponseHelper.Fail<object>("ChakraType and Base64Audio are required.", 400));

            // Validate chakra type
            var validChakras = new[] { "Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown" };
            if (!Array.Exists(validChakras, c => c.Equals(request.ChakraType, StringComparison.OrdinalIgnoreCase)))
                return BadRequest(ResponseHelper.Fail<object>($"Invalid ChakraType. Valid values: {string.Join(", ", validChakras)}", 400));

            try
            {
                // Generate unique filename
                var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                var fileName = $"{request.ChakraType.Replace(" ", "_")}_{timestamp}.mp3";

                // Upload to Azure Blob Storage
                var audioUrl = await _blobService.UploadBase64AudioAsync(request.Base64Audio, fileName);

                if (string.IsNullOrEmpty(audioUrl))
                    return StatusCode(500, ResponseHelper.Fail<object>("Failed to upload audio to blob storage.", 500));

                // Update Chakra table with audio URL
                var updated = await _chakraService.UpdateChakraAudioUrlAsync(request.ChakraType, audioUrl);

                if (!updated)
                    return NotFound(ResponseHelper.Fail<object>($"Chakra '{request.ChakraType}' not found in database. Please insert chakra data first.", 404));

                return Ok(ResponseHelper.Success(new
                {
                    chakraType = request.ChakraType,
                    audioUrl = audioUrl,
                    uploadedAt = DateTime.UtcNow
                }, "Audio uploaded successfully.", 200));
            }
            catch (FormatException ex)
            {
                return BadRequest(ResponseHelper.Fail<object>($"Invalid Base64 format: {ex.Message}", 400));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error uploading audio: {ex.Message}", 500));
            }
        }

        /// <summary>
        /// Get all chakras with their audio URLs
        /// GET /api/audio/chakras
        /// </summary>
        [HttpGet("chakras")]
        public async Task<IActionResult> GetAllChakras()
        {
            try
            {
                var chakras = await _chakraService.GetAllChakrasAsync();
                return Ok(ResponseHelper.Success(chakras, "Chakras retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching chakras: {ex.Message}", 500));
            }
        }

        public class AudioUploadRequest
        {
            public string ChakraType { get; set; } // e.g., "Root", "Sacral", etc.
            public string Base64Audio { get; set; } // Base64 encoded audio file
        }
    }
}
