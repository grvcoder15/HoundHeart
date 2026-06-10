using Hounded_Heart.Models.Data;
using Hounded_Heart.Api.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/devices")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DeviceController> _logger;

        public DeviceController(AppDbContext context, ILogger<DeviceController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("connect")]
        public async Task<IActionResult> ConnectDevice([FromBody] ConnectDeviceRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "🔍 Device connection request: UserId={UserId}, DeviceType={DeviceType}, DeviceNumber={DeviceNumber}, DogId={DogId}",
                    request.UserId, request.DeviceType, request.DeviceNumber, request.DogId);

                // Auto-fetch DogId if not provided (null or empty Guid) for any device type
                bool dogIdMissing = request.DogId == null || request.DogId == Guid.Empty;
                if (dogIdMissing)
                {
                    _logger.LogInformation(
                        "🔍 DogId is null/empty for {DeviceType} — attempting auto-fetch for UserId {UserId}",
                        request.DeviceType, request.UserId);

                    var dogProfile = await _context.DogProfiles
                        .Where(d => d.UserId == request.UserId)
                        .FirstOrDefaultAsync();

                    if (dogProfile != null)
                    {
                        request.DogId = dogProfile.Id;
                        _logger.LogInformation(
                            "✅ Auto-fetched DogId {DogId} for UserId {UserId}, DeviceType {DeviceType}",
                            dogProfile.Id, request.UserId, request.DeviceType);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "❌ No dog profile found for UserId {UserId} — DogId will remain null",
                            request.UserId);
                    }
                }
                else
                {
                    _logger.LogInformation("✅ DogId already provided: {DogId}", request.DogId);
                }

                // Check if a DeviceConnection already exists for this userId + deviceType
                var existingConnection = await _context.DeviceConnections
                    .FirstOrDefaultAsync(dc => dc.UserId == request.UserId && dc.DeviceType == request.DeviceType);

                if (existingConnection != null)
                {
                    _logger.LogInformation(
                        "🔄 Updating existing connection for UserId={UserId}, DeviceType={DeviceType}, DogId={DogId}",
                        request.UserId, request.DeviceType, request.DogId);

                    existingConnection.IsConnected    = true;
                    existingConnection.DeviceNumber   = request.DeviceNumber;
                    existingConnection.DeviceModel    = request.DeviceModel;
                    existingConnection.DogId          = request.DogId;
                    existingConnection.ConnectedAt    = DateTime.UtcNow;
                    existingConnection.DisconnectedAt = null;
                }
                else
                {
                    _logger.LogInformation(
                        "➕ Creating new connection for UserId={UserId}, DeviceType={DeviceType}, DogId={DogId}",
                        request.UserId, request.DeviceType, request.DogId);

                    var newConnection = new DeviceConnection
                    {
                        Id             = Guid.NewGuid(),
                        UserId         = request.UserId,
                        DogId          = request.DogId,
                        DeviceType     = request.DeviceType,
                        DeviceModel    = request.DeviceModel,
                        DeviceNumber   = request.DeviceNumber,
                        IsConnected    = true,
                        ConnectedAt    = DateTime.UtcNow,
                        DisconnectedAt = null,
                        CreatedAt      = DateTime.UtcNow
                    };

                    _context.DeviceConnections.Add(newConnection);
                    existingConnection = newConnection;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "💾 Saved DeviceConnection Id={Id} with DogId={DogId}",
                    existingConnection.Id, existingConnection.DogId);

                return Ok(ResponseHelper.Success(existingConnection, "Device connected successfully.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Device connection failed for UserId={UserId}", request.UserId);
                return StatusCode(500, ResponseHelper.Fail<string>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpPost("disconnect")]
        public async Task<IActionResult> DisconnectDevice([FromBody] DisconnectDeviceRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "🔌 Disconnect request: UserId={UserId}, DeviceType={DeviceType}",
                    request.UserId, request.DeviceType);

                var connection = await _context.DeviceConnections
                    .FirstOrDefaultAsync(dc => dc.UserId == request.UserId && dc.DeviceType == request.DeviceType);

                if (connection == null)
                {
                    _logger.LogWarning(
                        "❌ Device connection not found for UserId={UserId}, DeviceType={DeviceType}",
                        request.UserId, request.DeviceType);
                    return NotFound(ResponseHelper.Fail<string>("Device connection not found.", 404));
                }

                connection.IsConnected    = false;
                connection.DisconnectedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Device disconnected: Id={Id}", connection.Id);

                return Ok(ResponseHelper.Success(connection, "Device disconnected successfully.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Device disconnect failed for UserId={UserId}", request.UserId);
                return StatusCode(500, ResponseHelper.Fail<string>($"Internal server error: {ex.Message}", 500));
            }
        }

        [HttpGet("status/{userId}")]
        public async Task<IActionResult> GetDeviceStatus(Guid userId)
        {
            try
            {
                var connections = await _context.DeviceConnections
                    .Where(dc => dc.UserId == userId)
                    .ToListAsync();

                _logger.LogInformation(
                    "📊 Returning {Count} device connections for UserId={UserId}",
                    connections.Count, userId);

                return Ok(ResponseHelper.Success(connections, "Device status retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ GetDeviceStatus failed for UserId={UserId}", userId);
                return StatusCode(500, ResponseHelper.Fail<string>($"Internal server error: {ex.Message}", 500));
            }
        }
    }

    // Request DTOs
    public class ConnectDeviceRequest
    {
        public Guid UserId { get; set; }
        public Guid? DogId { get; set; }
        public string DeviceType { get; set; } = string.Empty;
        public string? DeviceModel { get; set; }
        public string DeviceNumber { get; set; } = string.Empty;
    }

    public class DisconnectDeviceRequest
    {
        public Guid UserId { get; set; }
        public string DeviceType { get; set; } = string.Empty;
    }
}