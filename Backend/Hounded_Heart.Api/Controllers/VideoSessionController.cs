using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VideoSessionController : ControllerBase
    {
        private readonly VideoSessionService _videoSessionService;

        public VideoSessionController(VideoSessionService videoSessionService)
        {
            _videoSessionService = videoSessionService;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helper: Extract UserId from JWT
        // ─────────────────────────────────────────────────────────────────────

        private Guid? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(claim) && Guid.TryParse(claim, out Guid id))
                return id;
            return null;
        }

        // ═════════════════════════════════════════════════════════════════════
        // POST /api/VideoSession/create-payment-intent
        // Creates a Stripe PaymentIntent for $30 — returns clientSecret
        // ═════════════════════════════════════════════════════════════════════

        [HttpPost("create-payment-intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] CreateVideoPaymentIntentRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("User not authenticated."));

            try
            {
                var result = await _videoSessionService.CreatePaymentIntentAsync(
                    userId.Value,
                    request.ExpertId);

                return Ok(ResponseHelper.Success(result, "Payment intent created successfully."));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CreatePaymentIntent error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error creating payment intent: {ex.Message}"));
            }
        }

        // ═════════════════════════════════════════════════════════════════════
        // POST /api/VideoSession/create
        // Verifies Stripe payment + creates Daily.co room + saves session
        // ═════════════════════════════════════════════════════════════════════

        [HttpPost("create")]
        public async Task<IActionResult> CreateSession([FromBody] CreateVideoSessionRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("User not authenticated."));

            if (string.IsNullOrWhiteSpace(request.PaymentIntentId))
                return BadRequest(ResponseHelper.Fail<object>("PaymentIntentId is required."));

            try
            {
                var session = await _videoSessionService.CreateSessionAsync(
                    userId.Value,
                    request.PaymentIntentId,
                    request.ExpertId);

                return Ok(ResponseHelper.Success(session, "Video session created successfully.", 200));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CreateSession error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error creating session: {ex.Message}"));
            }
        }

        // ═════════════════════════════════════════════════════════════════════
        // GET /api/VideoSession/status/{sessionId}
        // Returns active/expired status + remaining seconds
        // ═════════════════════════════════════════════════════════════════════

        [HttpGet("status/{sessionId:guid}")]
        public async Task<IActionResult> GetStatus(Guid sessionId)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("User not authenticated."));

            try
            {
                var status = await _videoSessionService.GetSessionStatusAsync(sessionId, userId.Value);
                return Ok(ResponseHelper.Success(status, "Session status retrieved."));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetStatus error: {ex.Message}");
                return NotFound(ResponseHelper.Fail<object>($"Session not found: {ex.Message}"));
            }
        }

        // ═════════════════════════════════════════════════════════════════════
        // POST /api/VideoSession/end
        // Marks session as ended (user clicked end or timer hit 0)
        // ═════════════════════════════════════════════════════════════════════

        [HttpPost("end")]
        public async Task<IActionResult> EndSession([FromBody] EndVideoSessionRequest request)
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(ResponseHelper.Fail<object>("User not authenticated."));

            try
            {
                await _videoSessionService.EndSessionAsync(request.SessionId, userId.Value);
                return Ok(ResponseHelper.Success<object>(null, "Session ended successfully."));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ EndSession error: {ex.Message}");
                return StatusCode(500, ResponseHelper.Fail<object>($"Error ending session: {ex.Message}"));
            }
        }
    }
}
