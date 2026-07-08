using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;
 
namespace Hounded_Heart.Services.Services
{
    public class BlobStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
 
        public BlobStorageService(IConfiguration configuration)
        {
            var serviceUrl = configuration["RailwayS3Storage:ServiceURL"];
            var accessKey = configuration["RailwayS3Storage:AccessKey"];
            var secretKey = configuration["RailwayS3Storage:SecretKey"];
            _bucketName = configuration["RailwayS3Storage:BucketName"];
 
            var config = new AmazonS3Config
            {
                ServiceURL = serviceUrl,
                ForcePathStyle = true
            };
 
            _s3Client = new AmazonS3Client(accessKey, secretKey, config);
        }
 
        private async Task<string> UploadToS3Async(byte[] fileBytes, string key, string contentType = "application/octet-stream")
        {
            using var stream = new MemoryStream(fileBytes);
 
            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType
            };
 
            await _s3Client.PutObjectAsync(request);
 
            // Return only the key now — NOT the full URL. DB will store this key.
            return key;
        }
 
        /// <summary>
        /// Generates a temporary signed URL for a given S3 key so it can be accessed
        /// even though the bucket is private. Default validity: 60 minutes.
        /// </summary>
        public string GetPresignedUrl(string key, int expiryMinutes = 60)
        {
            if (string.IsNullOrEmpty(key))
                return null;
 
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = key,
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
                Verb = HttpVerb.GET
            };
 
            return _s3Client.GetPreSignedURL(request);
        }
 
        public async Task<string> UploadBase64ImageAsync(string base64Image, string fileName)
        {
            try
            {
                var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
                byte[] imageBytes = Convert.FromBase64String(base64Data);
                var key = $"images/{fileName}";
                return await UploadToS3Async(imageBytes, key, "image/jpeg");
            }
            catch (FormatException ex)
            {
                throw new FormatException("Base64 image format is invalid. Please check input.", ex);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload to Railway Bucket: {ex.Message}");
                return null;
            }
        }
 
        public async Task<string> UploadAudioFileAsync(byte[] audioBytes, string fileName)
        {
            try
            {
                var key = $"audios/{fileName}";
                return await UploadToS3Async(audioBytes, key, "audio/mpeg");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload audio to Railway Bucket: {ex.Message}");
                throw new Exception($"Audio upload failed: {ex.Message}", ex);
            }
        }
 
        public async Task<string> UploadImageFileAsync(byte[] imageBytes, string fileName)
        {
            try
            {
                var key = $"images/{fileName}";
                return await UploadToS3Async(imageBytes, key, "image/jpeg");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload image to Railway Bucket: {ex.Message}");
                throw new Exception($"Image upload failed: {ex.Message}", ex);
            }
        }
 
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
 
        public async Task<string> UploadWellnessPhotoAsync(byte[] imageBytes, string userId, string type, string fileName)
        {
            try
            {
                var key = $"wellness-uploads/{userId}/{type}/{fileName}";
                return await UploadToS3Async(imageBytes, key, "image/jpeg");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to upload wellness photo to Railway Bucket: {ex.Message}");
                throw new Exception($"Wellness photo upload failed: {ex.Message}", ex);
            }
        }
    }
}






// using Amazon.S3;
// using Amazon.S3.Model;
// using Microsoft.Extensions.Configuration;
// using System;
// using System.IO;
// using System.Threading.Tasks;
 
// namespace Hounded_Heart.Services.Services
// {
//     public class BlobStorageService
//     {
//         private readonly IAmazonS3 _s3Client;
//         private readonly string _bucketName;
//         private readonly string _serviceUrl;
 
//         public BlobStorageService(IConfiguration configuration)
//         {
//             _serviceUrl = configuration["RailwayS3Storage:ServiceURL"];
//             var accessKey = configuration["RailwayS3Storage:AccessKey"];
//             var secretKey = configuration["RailwayS3Storage:SecretKey"];
//             _bucketName = configuration["RailwayS3Storage:BucketName"];
 
//  // TEMPORARY DEBUG - remove after testing
//     Console.WriteLine($"🔍 ServiceURL: {_serviceUrl}");
//     Console.WriteLine($"🔍 AccessKey Length: {accessKey?.Length}, Starts: {accessKey?.Substring(0, Math.Min(8, accessKey?.Length ?? 0))}, Ends: {accessKey?.Substring(Math.Max(0, (accessKey?.Length ?? 0) - 4))}");
//     Console.WriteLine($"🔍 SecretKey Length: {secretKey?.Length}");
//     Console.WriteLine($"🔍 BucketName: {_bucketName}");
 
//             var config = new AmazonS3Config
//             {
//                 ServiceURL = _serviceUrl,
//                 ForcePathStyle = true // Railway buckets often need path-style; we'll confirm in testing
//             };
 
//             _s3Client = new AmazonS3Client(accessKey, secretKey, config);
//         }
 
//         private async Task<string> UploadToS3Async(byte[] fileBytes, string key, string contentType = "application/octet-stream")
//         {
//             using var stream = new MemoryStream(fileBytes);
 
//             var request = new PutObjectRequest
//             {
//                 BucketName = _bucketName,
//                 Key = key,
//                 InputStream = stream,
//                 ContentType = contentType
//             };
 
//             await _s3Client.PutObjectAsync(request);
 
//             // Bucket is private — this URL will only work with presigned access (Step 4)
//             return $"{_serviceUrl}/{_bucketName}/{key}";
//         }
 
//         public async Task<string> UploadBase64ImageAsync(string base64Image, string fileName)
//         {
//             try
//             {
//                 var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
//                 byte[] imageBytes = Convert.FromBase64String(base64Data);
//                 return await UploadToS3Async(imageBytes, fileName, "image/jpeg");
//             }
//             catch (FormatException ex)
//             {
//                 throw new FormatException("Base64 image format is invalid. Please check input.", ex);
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload to Railway Bucket: {ex.Message}");
//                 return null;
//             }
//         }
 
//         public async Task<string> UploadAudioFileAsync(byte[] audioBytes, string fileName)
//         {
//             try
//             {
//                 var key = $"audios/{fileName}";
//                 return await UploadToS3Async(audioBytes, key, "audio/mpeg");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload audio to Railway Bucket: {ex.Message}");
//                 throw new Exception($"Audio upload failed: {ex.Message}", ex);
//             }
//         }
 
//         public async Task<string> UploadImageFileAsync(byte[] imageBytes, string fileName)
//         {
//             try
//             {
//                 var key = $"images/{fileName}";
//                 return await UploadToS3Async(imageBytes, key, "image/jpeg");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload image to Railway Bucket: {ex.Message}");
//                 throw new Exception($"Image upload failed: {ex.Message}", ex);
//             }
//         }
 
//         public async Task<string> UploadBase64AudioAsync(string base64Audio, string fileName)
//         {
//             try
//             {
//                 var base64Data = base64Audio.Contains(",") ? base64Audio.Split(',')[1] : base64Audio;
//                 byte[] audioBytes = Convert.FromBase64String(base64Data);
//                 return await UploadAudioFileAsync(audioBytes, fileName);
//             }
//             catch (FormatException ex)
//             {
//                 throw new FormatException("Base64 audio format is invalid. Please check input.", ex);
//             }
//         }
 
//         public async Task<string> UploadWellnessPhotoAsync(byte[] imageBytes, string userId, string type, string fileName)
//         {
//             try
//             {
//                 var key = $"wellness-uploads/{userId}/{type}/{fileName}";
//                 return await UploadToS3Async(imageBytes, key, "image/jpeg");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload wellness photo to Railway Bucket: {ex.Message}");
//                 throw new Exception($"Wellness photo upload failed: {ex.Message}", ex);
//             }
//         }
//     }
// }


// using Azure.Storage.Blobs;
// using Azure.Storage.Blobs.Models;
// using Microsoft.Extensions.Configuration;
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Text;
// using System.Threading.Tasks;

// namespace Hounded_Heart.Services.Services
// {
//     public class BlobStorageService
//     {
//         private readonly string _connectionString;
//         private readonly string _containerName;
//         private readonly bool _isEnabled;

//         public BlobStorageService(IConfiguration configuration)
//         {
//             _connectionString = configuration["AzureBlobStorage:ConnectionString"];
//             _containerName = configuration["AzureBlobStorage:ContainerName"];
            
//             // Check if blob storage is properly configured
//             _isEnabled = !string.IsNullOrEmpty(_connectionString) && 
//                         !string.IsNullOrEmpty(_containerName) &&
//                         !_connectionString.Contains("tpaysa"); // Disable if using the broken storage account
//         }

//         public async Task<string> UploadBase64ImageAsync(string base64Image, string fileName)
//         {
//              // Fallback: Local Storage if Azure is disabled
//             if (!_isEnabled)
//             {
//                 try
//                 {
//                     var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
//                     byte[] imageBytes = Convert.FromBase64String(base64Data);

//                     // Define local path: wwwroot/uploads/images
//                     var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
//                     var uploadDir = Path.Combine(webRootPath, "uploads", "images");

//                     if (!Directory.Exists(uploadDir))
//                     {
//                         Directory.CreateDirectory(uploadDir);
//                     }

//                     var filePath = Path.Combine(uploadDir, fileName);
//                     await File.WriteAllBytesAsync(filePath, imageBytes);

//                     // Return relative URL for frontend access
//                     return $"/uploads/images/{fileName}";
//                 }
//                 catch (Exception ex)
//                 {
//                     Console.WriteLine($"⚠️ Failed to save image locally: {ex.Message}");
//                     return null;
//                 }
//             }

//             try
//             {
//                 var base64Data = base64Image.Contains(",") ? base64Image.Split(',')[1] : base64Image;
//                 var blobServiceClient = new BlobServiceClient(_connectionString);
//                 var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

//                 await containerClient.CreateIfNotExistsAsync();
//                 await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

//                 var blobClient = containerClient.GetBlobClient(fileName);

//                 // Convert Base64 to byte stream
//                 byte[] imageBytes = Convert.FromBase64String(base64Data);
//                 using var stream = new MemoryStream(imageBytes);
//                 await blobClient.UploadAsync(stream, overwrite: true);

//                 return blobClient.Uri.ToString(); // Public URL
//             }
//             catch (FormatException ex)
//             {
//                 throw new FormatException("Base64 image format is invalid. Please check input.", ex);
//             }
//             catch (Exception ex)
//             {
//                 // Log the error but don't fail the entire operation
//                 Console.WriteLine($"⚠️ Failed to upload to Azure Blob Storage: {ex.Message}");
//                 // Return null to allow the operation to continue without the image
//                 return null;
//             }
//         }

//         /// <summary>
//         /// Upload audio file to Azure Blob Storage in 'audios' folder. Fallback to local storage if disabled.
//         /// </summary>
//         public async Task<string> UploadAudioFileAsync(byte[] audioBytes, string fileName)
//         {
//             // Fallback: Local Storage if Azure is disabled
//             if (!_isEnabled)
//             {
//                 try
//                 {
//                     // Define local path: wwwroot/uploads/audio
//                     var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
//                     var uploadDir = Path.Combine(webRootPath, "uploads", "audio");

//                     if (!Directory.Exists(uploadDir))
//                     {
//                         Directory.CreateDirectory(uploadDir);
//                     }

//                     var filePath = Path.Combine(uploadDir, fileName);
//                     await File.WriteAllBytesAsync(filePath, audioBytes);

//                     // Return relative URL for frontend access
//                     return $"/uploads/audio/{fileName}";
//                 }
//                 catch (Exception ex)
//                 {
//                     Console.WriteLine($"⚠️ Failed to save audio locally: {ex.Message}");
//                     throw new Exception($"Audio upload failed (Local Fallback): {ex.Message}", ex);
//                 }
//             }
            
//             // Azure Blob Storage Logic
//             try
//             {
//                 var blobServiceClient = new BlobServiceClient(_connectionString);
//                 var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

//                 await containerClient.CreateIfNotExistsAsync();
//                 await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

//                 // Upload to 'audios' folder
//                 var blobPath = $"audios/{fileName}";
//                 var blobClient = containerClient.GetBlobClient(blobPath);

//                 using var stream = new MemoryStream(audioBytes);
//                 await blobClient.UploadAsync(stream, overwrite: true);

//                 return blobClient.Uri.ToString(); // Public URL
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload audio to Azure Blob Storage: {ex.Message}");
//                 throw new Exception($"Audio upload failed: {ex.Message}", ex);
//             }
//         }

//         /// <summary>
//         /// Upload image file to Azure Blob Storage in 'images' folder. Fallback to local storage if disabled.
//         /// </summary>
//         public async Task<string> UploadImageFileAsync(byte[] imageBytes, string fileName)
//         {
//             // Fallback: Local Storage if Azure is disabled
//             if (!_isEnabled)
//             {
//                 try
//                 {
//                     var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
//                     var uploadDir = Path.Combine(webRootPath, "uploads", "images");

//                     if (!Directory.Exists(uploadDir))
//                     {
//                         Directory.CreateDirectory(uploadDir);
//                     }

//                     var filePath = Path.Combine(uploadDir, fileName);
//                     await File.WriteAllBytesAsync(filePath, imageBytes);

//                     return $"/uploads/images/{fileName}";
//                 }
//                 catch (Exception ex)
//                 {
//                     Console.WriteLine($"⚠️ Failed to save image locally: {ex.Message}");
//                     throw new Exception($"Image upload failed (Local Fallback): {ex.Message}", ex);
//                 }
//             }

//             // Azure Blob Storage Logic
//             try
//             {
//                 var blobServiceClient = new BlobServiceClient(_connectionString);
//                 var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

//                 await containerClient.CreateIfNotExistsAsync();
//                 await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

//                 var blobPath = $"images/{fileName}";
//                 var blobClient = containerClient.GetBlobClient(blobPath);

//                 using var stream = new MemoryStream(imageBytes);
//                 await blobClient.UploadAsync(stream, overwrite: true);

//                 return blobClient.Uri.ToString();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload image to Azure Blob Storage: {ex.Message}");
//                 throw new Exception($"Image upload failed: {ex.Message}", ex);
//             }
//         }

//         /// <summary>
//         /// Upload audio file from Base64 string to Azure Blob Storage in 'audios' folder
//         /// </summary>
//         public async Task<string> UploadBase64AudioAsync(string base64Audio, string fileName)
//         {
//             try
//             {
//                 var base64Data = base64Audio.Contains(",") ? base64Audio.Split(',')[1] : base64Audio;
//                 byte[] audioBytes = Convert.FromBase64String(base64Data);
//                 return await UploadAudioFileAsync(audioBytes, fileName);
//             }
//             catch (FormatException ex)
//             {
//                 throw new FormatException("Base64 audio format is invalid. Please check input.", ex);
//             }
//         }

//         /// <summary>
//         /// Upload a wellness check photo (Environment, Dog, or Progress) to Azure Blob Storage
//         /// under path: wellness-uploads/{userId}/{type}/{fileName}
//         /// </summary>
//         public async Task<string> UploadWellnessPhotoAsync(byte[] imageBytes, string userId, string type, string fileName)
//         {
//             if (!_isEnabled)
//             {
//                 try
//                 {
//                     var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
//                     var uploadDir = Path.Combine(webRootPath, "uploads", "wellness", userId, type);

//                     if (!Directory.Exists(uploadDir))
//                     {
//                         Directory.CreateDirectory(uploadDir);
//                     }

//                     var filePath = Path.Combine(uploadDir, fileName);
//                     await File.WriteAllBytesAsync(filePath, imageBytes);

//                     return $"/uploads/wellness/{userId}/{type}/{fileName}";
//                 }
//                 catch (Exception ex)
//                 {
//                     Console.WriteLine($"⚠️ Failed to save wellness photo locally: {ex.Message}");
//                     throw new Exception($"Wellness photo upload failed (Local Fallback): {ex.Message}", ex);
//                 }
//             }

//             try
//             {
//                 var blobServiceClient = new BlobServiceClient(_connectionString);
//                 var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

//                 await containerClient.CreateIfNotExistsAsync();
//                 await containerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

//                 var blobPath = $"wellness-uploads/{userId}/{type}/{fileName}";
//                 var blobClient = containerClient.GetBlobClient(blobPath);

//                 using var stream = new MemoryStream(imageBytes);
//                 await blobClient.UploadAsync(stream, overwrite: true);

//                 return blobClient.Uri.ToString();
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"⚠️ Failed to upload wellness photo to Azure Blob Storage: {ex.Message}");
//                 throw new Exception($"Wellness photo upload failed: {ex.Message}", ex);
//             }
//         }
//     }
// }
