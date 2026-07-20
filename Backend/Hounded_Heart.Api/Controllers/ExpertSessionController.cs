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
    public class ExpertSessionController : ControllerBase
    {
        private readonly ExpertSessionService _expertSessionService;

        public ExpertSessionController(ExpertSessionService expertSessionService)
        {
            _expertSessionService = expertSessionService;
        }

        private string? GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        // 1. User Requests Session
        [HttpPost("request")]
        public async Task<IActionResult> RequestSession([FromBody] CreateExpertSessionRequest request)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var id = await _expertSessionService.CreateRequestAsync(userId, request);
                return Ok(ResponseHelper.Success(new { RequestId = id }, "Request submitted successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 2. Admin Gets All Requests
        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests([FromQuery] string? statusFilter)
        {
            try
            {
                var reqs = await _expertSessionService.GetRequestsAsync(statusFilter);
                return Ok(ResponseHelper.Success(reqs, $"Requests fetched. Count: {reqs.Count}"));
            }
            catch (Exception ex)
            {
                // Return the full exception details for debugging
                return StatusCode(500, ResponseHelper.Fail<object>($"Error: {ex.Message} | Inner: {ex.InnerException?.Message}"));
            }
        }

        // 3. Admin Sends Slots
        [HttpPost("send-slots")]
        public async Task<IActionResult> SendSlots([FromBody] SendSlotsRequest request)
        {
            try
            {
                await _expertSessionService.SendSlotsAsync(request);
                return Ok(ResponseHelper.Success<object>(null, "Slots sent successfully."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 5. Cancel Session (Admin)
        [HttpPost("cancel")]
        public async Task<IActionResult> CancelSession([FromBody] CancelSessionRequest req)
        {
            try
            {
                await _expertSessionService.CancelSessionAsync(req);
                return Ok(ResponseHelper.Success("Session cancelled successfully."));
            }
            catch (Exception ex)
            {
                return BadRequest(ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 6. User views specific request / slots
        [HttpGet("slots/{requestId}")]
        public async Task<IActionResult> GetUserSlots(Guid requestId)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var req = await _expertSessionService.GetUserRequestAsync(userId, requestId);
                return Ok(ResponseHelper.Success(req, "Slots fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 5. User selects slot and pays
        [HttpPost("confirm-slot")]
        public async Task<IActionResult> ConfirmSlot([FromBody] ConfirmSlotRequest request)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var intent = await _expertSessionService.ConfirmSlotAndGetPaymentAsync(userId, request);
                return Ok(ResponseHelper.Success(intent, "Payment intent generated."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 6. Payment Success -> Finalize
        [HttpPost("payment-success")]
        public async Task<IActionResult> PaymentSuccess([FromBody] PaymentSuccessRequest request)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var session = await _expertSessionService.HandlePaymentSuccessAsync(userId, request);
                return Ok(ResponseHelper.Success(session, "Session confirmed and scheduled."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 7. Get My Sessions (User)
        [HttpGet("my-sessions")]
        public async Task<IActionResult> GetMySessions()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var sessions = await _expertSessionService.GetUserUpcomingSessionsAsync(userId);
                return Ok(ResponseHelper.Success(sessions, "Sessions fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 7b. Get My Requests (User)
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized(ResponseHelper.Fail<object>("Unauthorized"));

            try
            {
                var requests = await _expertSessionService.GetUserRequestsAsync(userId);
                return Ok(ResponseHelper.Success(requests, "Requests fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 8. Admin Upcoming Sessions
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetAdminUpcoming()
        {
            try
            {
                var sessions = await _expertSessionService.GetAdminUpcomingSessionsAsync();
                return Ok(ResponseHelper.Success(sessions, "Admin sessions fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 9. Get Notifications
        [HttpGet("notifications/{userId}")]
        [AllowAnonymous] // Might be called differently, but let's keep it open for polling simplicity
        public async Task<IActionResult> GetNotifications(string userId)
        {
            // If userId == "admin", we treat it as an admin call
            var targetUserId = userId.ToLower() == "admin" ? null : userId;

            try
            {
                var notifications = await _expertSessionService.GetNotificationsAsync(targetUserId);
                return Ok(ResponseHelper.Success(notifications, "Notifications fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 10. Mark Notification Read
        [HttpPost("notification/read")]
        public async Task<IActionResult> MarkNotificationRead([FromBody] Guid notificationId)
        {
            try
            {
                await _expertSessionService.MarkNotificationReadAsync(notificationId);
                return Ok(ResponseHelper.Success<object>(null, "Marked as read."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }
        // 11. End Session
        [HttpPost("end")]
        public async Task<IActionResult> EndSession([FromBody] EndExpertSessionRequest request)
        {
            try
            {
                await _expertSessionService.EndSessionAsync(request);
                return Ok(ResponseHelper.Success<object>(null, "Session marked as ended."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }

        // 12. Get Session Status (for pre-join check)
        [HttpGet("status/{sessionId}")]
        public async Task<IActionResult> GetSessionStatus(Guid sessionId)
        {
            try
            {
                var status = await _expertSessionService.GetSessionStatusAsync(sessionId);
                return Ok(ResponseHelper.Success(new { status }, "Status fetched."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>(ex.Message));
            }
        }
    }
}
