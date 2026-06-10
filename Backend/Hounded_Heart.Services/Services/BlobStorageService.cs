using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class BlobStorageService
    {
        private readonly string _connectionString;
        private readonly string _containerName;
        private readonly bool _isEnabled;

        public BlobStorageService(IConfiguration configuration)
        {
            _connectionString = configuration["AzureBlobStorage:ConnectionString"];
            _containerName = configuration["AzureBlobStorage:ContainerName"];
            
            // Check if blob storage is properly configured
            _isEnabled = !string.IsNullOrEmpty(_connectionString) && 
                        !string.IsNullOrEmpty(_containerName) &&
                        !_connectionString.Contains("tpaysa"); // Disable if using the broken storage account
        }

        public async Task<string> UploadBase64ImageAsync(string base64Image, string fileName)
        {
             // Fallback: Local Storage if Azure is disabled
            if (!_isEnabled)
            {
                try
                {
                    var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
                    byte[] imageBytes = Convert.FromBase64String(base64Data);

                    // Define local path: wwwroot/uploads/images
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadDir = Path.Combine(webRootPath, "uploads", "images");

                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, fileName);
                    await File.WriteAllBytesAsync(filePath, imageBytes);

                    // Return relative URL for frontend access
                    return $"/uploads/images/{fileName}";
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Failed to save image locally: {ex.Message}");
                    return null;
                }
            }

            try
            {
                var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
                var blobServiceClient = new BlobServiceClient(_connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                await containerClient.CreateIfNotExistsAsync();
                await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

                var blobClient = containerClient.GetBlobClient(fileName);

                // Convert Base64 to byte stream
                byte[] imageBytes = Convert.FromBase64String(base64Data);
                using var stream = new MemoryStream(imageBytes);
                await blobClient.UploadAsync(stream, overwrite: true);

                return blobClient.Uri.ToString(); // Public URL
            }
            catch (FormatException ex)
            {
                throw new FormatException("Base64 image format is invalid. Please check input.", ex);
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the entire operation
                Console.WriteLine($"⚠️ Failed to upload to Azure Blob Storage: {ex.Message}");
                // Return null to allow the operation to continue without the image
                return null;
            }
        }

        /// <summary>
        /// Upload audio file to Azure Blob Storage in 'audios' folder. Fallback to local storage if disabled.
        /// </summary>
        public async Task<string> UploadAudioFileAsync(byte[] audioBytes, string fileName)
        {
            // Fallback: Local Storage if Azure is disabled
            if (!_isEnabled)
            {
                try
                {
                    // Define local path: wwwroot/uploads/audio
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadDir = Path.Combine(webRootPath, "uploads", "audio");

                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, fileName);
                    await File.WriteAllBytesAsync(filePath, audioBytes);

                    // Return relative URL for frontend access
                    return $"/uploads/audio/{fileName}";
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Failed to save audio locally: {ex.Message}");
                    throw new Exception($"Audio upload failed (Local Fallback): {ex.Message}", ex);
                }
            }
            
            // Azure Blob Storage Logic
            try
            {
                var blobServiceClient = new BlobServiceClient(_connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                await containerClient.CreateIfNotExistsAsync();
                await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

                // Upload to 'audios' folder
                var blobPath = $"audios/{fileName}";
                var blobClient = containerClient.GetBlobClient(blobPath);

                using var stream = new MemoryStream(audioBytes);
                await blobClient.UploadAsync(stream, overwrite: true);

                return blobClient.Uri.ToString(); // Public URL
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload audio to Azure Blob Storage: {ex.Message}");
                throw new Exception($"Audio upload failed: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Upload image file to Azure Blob Storage in 'images' folder. Fallback to local storage if disabled.
        /// </summary>
        public async Task<string> UploadImageFileAsync(byte[] imageBytes, string fileName)
        {
            // Fallback: Local Storage if Azure is disabled
            if (!_isEnabled)
            {
                try
                {
                    var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadDir = Path.Combine(webRootPath, "uploads", "images");

                    if (!Directory.Exists(uploadDir))
                    {
                        Directory.CreateDirectory(uploadDir);
                    }

                    var filePath = Path.Combine(uploadDir, fileName);
                    await File.WriteAllBytesAsync(filePath, imageBytes);

                    return $"/uploads/images/{fileName}";
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Failed to save image locally: {ex.Message}");
                    throw new Exception($"Image upload failed (Local Fallback): {ex.Message}", ex);
                }
            }

            // Azure Blob Storage Logic
            try
            {
                var blobServiceClient = new BlobServiceClient(_connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                await containerClient.CreateIfNotExistsAsync();
                await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

                var blobPath = $"images/{fileName}";
                var blobClient = containerClient.GetBlobClient(blobPath);

                using var stream = new MemoryStream(imageBytes);
                await blobClient.UploadAsync(stream, overwrite: true);

                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload image to Azure Blob Storage: {ex.Message}");
                throw new Exception($"Image upload failed: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Upload audio file from Base64 string to Azure Blob Storage in 'audios' folder
        /// </summary>
        public async Task<string> UploadBase64AudioAsync(string base64Audio, string fileName)
        {
            try
            {
                var base64Data = base64Audio.Contains(",") ? base64Audio.Split(',')[1] : base64Audio;
                byte[] audioBytes = Convert.FromBase64String(base64Data);
                return await UploadAudioFileAsync(audioBytes, fileName);
            }
            catch (FormatException ex)
            {
                throw new FormatException("Base64 audio format is invalid. Please check input.", ex);
            }
        }
    }
}
