using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/bondsync")]
    [ApiController]
    public class BondSyncController : ControllerBase
    {
        private readonly IBondSyncService _bondSyncService;

        public BondSyncController(IBondSyncService bondSyncService)
        {
            _bondSyncService = bondSyncService;
        }

        [HttpGet("current/{userId}/{dogId}")]
        public async Task<IActionResult> GetCurrentSync(Guid userId, Guid dogId)
        {
            var result = await _bondSyncService.GetCurrentSyncScoreAsync(userId, dogId);
            return Ok(ResponseHelper.Success(result, "Current synchronization score calculated (Sandbox).", 200));
        }

        [HttpGet("trend/{userId}/{dogId}")]
        public async Task<IActionResult> GetSyncTrend(Guid userId, Guid dogId, [FromQuery] int days = 7)
        {
            var trend = await _bondSyncService.GetSyncTrendAsync(userId, dogId, days);
            return Ok(ResponseHelper.Success(trend, $"Synchronization trend for last {days} days retrieved (Sandbox).", 200));
        }

        [HttpGet("score/{userId}/{dogId}")]
        public async Task<IActionResult> GetSyncScore(Guid userId, Guid dogId)
        {
            var result = await _bondSyncService.CalculateSyncScore(userId, dogId);
            return Ok(ResponseHelper.Success(result, "Synchronization score calculated successfully.", 200));
        }
    }
}
