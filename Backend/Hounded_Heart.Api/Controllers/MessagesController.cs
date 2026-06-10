using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageLogsService _messageLogsService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(IMessageLogsService messageLogsService, ILogger<MessagesController> logger)
        {
            _messageLogsService = messageLogsService;
            _logger = logger;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserMessages(Guid userId)
        {
            try
            {
                var messages = await _messageLogsService.GetUserMessages(userId, 10);
                return Ok(ResponseHelper.Success(messages, "Messages retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving messages for user {userId}.");
                return StatusCode(500, ResponseHelper.Fail<object>("An error occurred while retrieving messages.", 500));
            }
        }
    }
}
