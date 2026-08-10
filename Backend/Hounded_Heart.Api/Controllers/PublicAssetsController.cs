using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hounded_Heart.Services.Services;
using Hounded_Heart.Api.Response;
using System;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublicAssetsController : ControllerBase
    {
        private readonly BlobStorageService _blobService;

        // Static server-side cache — shared across all requests.
        // Generates a fresh 7-day URL only when the cached one is about to expire.
        // This means zero ongoing manual work: it renews itself automatically forever.
        private static string _cachedVideoUrl = null;
        private static DateTime _cacheExpiry = DateTime.MinValue;
        private static readonly object _lock = new object();

        // How long the presigned URL is valid (7 days = 10080 minutes)
        private const int PresignedUrlExpiryMinutes = 10080;

        // Refresh the cache 30 minutes before expiry to avoid serving an expired URL
        private static readonly TimeSpan RefreshBuffer = TimeSpan.FromMinutes(30);

        public PublicAssetsController(BlobStorageService blobService)
        {
            _blobService = blobService;
        }

        [AllowAnonymous]
        [HttpGet("marketing-video")]
        public IActionResult GetMarketingVideoUrl()
        {
            try
            {
                string url;

                lock (_lock)
                {
                    // Serve from cache if still valid (with a 30-min safety buffer)
                    if (_cachedVideoUrl != null && DateTime.UtcNow < _cacheExpiry - RefreshBuffer)
                    {
                        url = _cachedVideoUrl;
                    }
                    else
                    {
                        // Generate a fresh 7-day presigned URL and cache it
                        url = _blobService.GetPresignedUrl("marketing-video/HoundHeart-Video.mp4", PresignedUrlExpiryMinutes);
                        _cachedVideoUrl = url;
                        _cacheExpiry = DateTime.UtcNow.AddMinutes(PresignedUrlExpiryMinutes);
                    }
                }

                return Ok(ResponseHelper.Success(new { url }, "Successfully fetched marketing video URL.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>(ex.Message, 500));
            }
        }
    }
}
