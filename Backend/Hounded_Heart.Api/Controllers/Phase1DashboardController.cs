using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Phase1DashboardController : ControllerBase
    {
        private readonly IBondSyncService _bondSyncService;
        private readonly IStressService _stressService;
        private readonly IBaselineService _baselineService;

        public Phase1DashboardController(
            IBondSyncService bondSyncService,
            IStressService stressService,
            IBaselineService baselineService)
        {
            _bondSyncService = bondSyncService;
            _stressService = stressService;
            _baselineService = baselineService;
        }

        [HttpGet("summary/{userId}/{dogId}")]
        public async Task<IActionResult> GetDashboardSummary(Guid userId, Guid dogId)
        {
            var bondResult = await _bondSyncService.GetCurrentSyncScoreAsync(userId, dogId);
            var baselineResult = await _baselineService.GetBaselineProgressAsync(userId, dogId);
            var stressHistory = await _stressService.GetStressHistoryAsync(dogId, 1); // Last 24 hours

            var summary = new
            {
                BondScore = bondResult.Score,
                BondLevel = bondResult.Level,
                BaselineProgress = baselineResult.PercentComplete,
                DaysRemaining = baselineResult.DaysRemaining,
                LatestStressEvent = stressHistory.FirstOrDefault(),
                CurrentVitals = new
                {
                    Dog = bondResult.DogVitals,
                    Human = bondResult.HumanVitals
                },
                NotificationCount = stressHistory.Count(e => e.AlertFired && !e.OutcomeLogged)
            };

            return Ok(ResponseHelper.Success(summary, "Phase 1 Dashboard summary retrieved successfully (Sandbox).", 200));
        }
    }
}
