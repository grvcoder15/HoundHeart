using System;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/stress")]
    [ApiController]
    public class StressDetectionController : ControllerBase
    {
        private readonly IStressService _stressService;
        private readonly AppDbContext _context;

        public StressDetectionController(IStressService stressService, AppDbContext context)
        {
            _stressService = stressService;
            _context = context;
        }

        [HttpGet("check/{userId}")]
        public async Task<IActionResult> RunStressCheck(Guid userId, [FromQuery] string? mode = null)
        {
            bool testMode = mode?.ToLower() == "test";
            
            // Use the newer CheckForStress method that always returns full calculation details
            var result = await _stressService.CheckForStress(userId);
            
            var message = testMode ? 
                (result.IsStressed ? "Stress detected! (Test mode - using recent data)" : "No stress detected. (Test mode)") :
                (result.IsStressed ? "Stress detected! Suggestion generated." : "No stress detected. User is calm.");
            
            return Ok(ResponseHelper.Success(result, message, 200));
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetStressHistory(Guid userId, [FromQuery] int days = 7)
        {
            var thresholdDate = DateTime.UtcNow.AddDays(-days);
            var history = await _context.StressEvents
                .AsNoTracking()
                .Where(s => s.UserId == userId && s.TimestampUtc >= thresholdDate)
                .OrderByDescending(s => s.TimestampUtc)
                .Take(10)
                .ToListAsync();
                
            return Ok(ResponseHelper.Success(history, $"Stress event history for last {days} days retrieved successfully.", 200));
        }

        [HttpGet("realtime/{userId}")]
        public async Task<IActionResult> CheckStressRealtime(Guid userId)
        {
            var result = await _stressService.CheckForStress(userId);
            return Ok(ResponseHelper.Success(result, "Stress check completed.", 200));
        }

        [HttpGet("events/{userId}")]
        public async Task<IActionResult> GetStressEvents(Guid userId)
        {
            var events = await _context.StressEvents
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.TimestampUtc)
                .Take(10)
                .ToListAsync();
            
            return Ok(ResponseHelper.Success(events, "Stress events retrieved successfully.", 200));
        }
    }
}
