using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetNotifications(Guid userId)
        {
            if (userId == Guid.Empty)
            {
                return BadRequest(ResponseHelper.Fail<object>("Invalid userId.", 400));
            }

            try
            {
                var notifications = await _notificationService.GetNotificationHistoryAsync(userId);
                return Ok(ResponseHelper.Success(notifications, "Notifications retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error retrieving notifications: {ex.Message}", 500));
            }
        }
    }
}