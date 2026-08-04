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
                // Generate a 12-hour valid presigned URL for the marketing video
                var url = _blobService.GetPresignedUrl("marketing-video/HoundHeart-Video.mp4", 720);
                return Ok(ResponseHelper.Success(new { url }, "Successfully fetched marketing video URL.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>(ex.Message, 500));
            }
        }
    }
}
