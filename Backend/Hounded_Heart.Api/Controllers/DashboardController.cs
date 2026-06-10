using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IBondSyncService _bondSyncService;
        private readonly IStressService _stressService;
        private readonly IWeatherService _weatherService;

        public DashboardController(
            AppDbContext context,
            IBondSyncService bondSyncService,
            IStressService stressService,
            IWeatherService weatherService)
        {
            _context = context;
            _bondSyncService = bondSyncService;
            _stressService = stressService;
            _weatherService = weatherService;
        }

        [HttpGet("Stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] Guid userId, [FromQuery] DateTime? clientDate)
        {
            try
            {
                if (userId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<object>("Invalid user ID.", 400));

                var baseDate = DateTime.SpecifyKind(clientDate?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);
                var stats = await BuildDashboardStatsAsync(userId, baseDate);

                return Ok(ResponseHelper.Success(new
                {
                    weeklyProgress = stats.WeeklyProgress,
                    ritualConsistency = new { count = stats.RitualConsistencyCount, total = 7 },
                    journalEntries = new { count = stats.JournalEntriesCount, label = $"{stats.JournalEntriesCount} this month" },
                    bondedScore = stats.BondedScore
                }, "Dashboard stats retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching dashboard stats: {ex.Message}", 500));
            }
        }

        [HttpGet("summary/{userId}")]
        public async Task<IActionResult> GetDashboardSummary(
            Guid userId,
            [FromQuery] Guid? dogId,
            [FromQuery] DateTime? clientDate,
            [FromQuery] double? lat,
            [FromQuery] double? lon)
        {
            try
            {
                if (userId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<object>("Invalid user ID.", 400));

                var baseDate = DateTime.SpecifyKind(clientDate?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == userId);

                if (user == null)
                    return NotFound(ResponseHelper.Fail<object>("User not found.", 404));

                var resolvedDogId = dogId.GetValueOrDefault();
                if (resolvedDogId == Guid.Empty)
                {
                    resolvedDogId = await _context.DogProfiles
                        .AsNoTracking()
                        .Where(d => d.UserId == userId)
                        .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
                        .Select(d => d.Id)
                        .FirstOrDefaultAsync();

                    if (resolvedDogId == Guid.Empty)
                    {
                        resolvedDogId = await _context.Dogs
                            .AsNoTracking()
                            .Where(d => d.UserId == userId)
                            .Select(d => d.DogId)
                            .FirstOrDefaultAsync();
                    }
                }
                else
                {
                    var hasRequestedDogVitals = await _context.DogVitals
                        .AsNoTracking()
                        .AnyAsync(d => d.DogId == resolvedDogId);

                    if (!hasRequestedDogVitals)
                    {
                        var wellnessDogId = await _context.DogProfiles
                            .AsNoTracking()
                            .Where(d => d.UserId == userId)
                            .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
                            .Select(d => d.Id)
                            .FirstOrDefaultAsync();

                        if (wellnessDogId != Guid.Empty)
                        {
                            resolvedDogId = wellnessDogId;
                        }
                    }
                }

                var deviceConnections = await _context.DeviceConnections
                    .AsNoTracking()
                    .Where(dc => dc.UserId == userId)
                    .ToListAsync();

                bool hasHumanDeviceConnection = deviceConnections.Any(dc =>
                    dc.IsConnected &&
                    (string.Equals(dc.DeviceType, "humanwatch", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(dc.DeviceType, "fitbit", StringComparison.OrdinalIgnoreCase)));

                bool hasDogDeviceConnection = deviceConnections.Any(dc =>
                    dc.IsConnected &&
                    (string.Equals(dc.DeviceType, "petpace", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(dc.DeviceType, "fitbark", StringComparison.OrdinalIgnoreCase)));

                bool hasFitbitAuthConnection = !string.IsNullOrWhiteSpace(user.FitbitAccessToken);
                bool hasFitBarkAuthConnection = !string.IsNullOrWhiteSpace(user.FitBarkAccessToken);

                var baseline = await _context.UserBaselines
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.UserId == userId);

                var vitalsCount = await _context.HumanVitals
                    .AsNoTracking()
                    .Where(h => h.UserId == userId)
                    .OrderByDescending(h => h.TimestampUtc)
                    .Take(15)
                    .CountAsync();

                var stressStatus = await _stressService.CheckForStress(userId);

                object? syncScore = null;
                object? dogVitals = null;
                if (resolvedDogId != Guid.Empty)
                {
                    syncScore = await _bondSyncService.CalculateSyncScore(userId, resolvedDogId);

                    // syncScore calculation normalises the dog id internally via ResolveWellnessDogIdAsync.
                    // Mirror that resolution here so dogVitals uses the same FitBark-based id.
                    var wellnessDogId = await _context.DogVitals
                        .AsNoTracking()
                        .Where(d => d.Source == "fitbark")
                        .OrderByDescending(d => d.TimestampUtc)
                        .Select(d => d.DogId)
                        .FirstOrDefaultAsync();

                    var vitalsQueryDogId = wellnessDogId != Guid.Empty ? wellnessDogId : resolvedDogId;

                    dogVitals = await _context.DogVitals
                        .AsNoTracking()
                        .Where(d => d.DogId == vitalsQueryDogId)
                        .OrderByDescending(d => d.TimestampUtc)
                        .Select(d => new
                        {
                            d.TimestampUtc,
                            d.HeartRate,
                            d.ActivityScore,
                            d.Temperature,
                            d.RestScore,
                            d.RespirationRate,
                            d.State,
                            d.Source
                        })
                        .FirstOrDefaultAsync();
                }

                var alerts = await _context.WellnessAlerts
                    .AsNoTracking()
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                var weather = lat.HasValue && lon.HasValue
                    ? await _weatherService.GetCurrentWeather(lat.Value, lon.Value)
                    : null;

                var stats = await BuildDashboardStatsAsync(userId, baseDate);
                var checkInDone = await HasCheckInForDateAsync(userId, baseDate);
                var bondedScore = (int)Math.Round(stats.BondedScore);

                return Ok(ResponseHelper.Success(new
                {
                    device = new
                    {
                        connections = deviceConnections,
                        hasHumanDeviceConnection,
                        hasDogDeviceConnection,
                        hasFitbitAuthConnection,
                        hasFitBarkAuthConnection,
                        isDeviceConnected = hasHumanDeviceConnection || hasFitbitAuthConnection,
                        isDogConnected = hasDogDeviceConnection || hasFitBarkAuthConnection
                    },
                    baseline,
                    vitalsCount,
                    stressStatus,
                    syncScore,
                    alerts,
                    weather,
                    dogVitals,
                    stats = new
                    {
                        weeklyProgress = stats.WeeklyProgress,
                        ritualConsistency = new { count = stats.RitualConsistencyCount, total = 7 },
                        journalEntries = new { count = stats.JournalEntriesCount, label = $"{stats.JournalEntriesCount} this month" },
                        bondedScore
                    },
                    bond = new
                    {
                        score = bondedScore,
                        level = GetBondLevel(bondedScore),
                        weeklyProgress = stats.WeeklyProgress,
                        ritualDays = stats.RitualConsistencyCount
                    },
                    checkInStatus = new { done = checkInDone }
                }, "Dashboard summary retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"Error fetching dashboard summary: {ex.Message}", 500));
            }
        }

        private async Task<DashboardStatsSnapshot> BuildDashboardStatsAsync(Guid userId, DateTime baseDate)
        {
            int diff = ((int)baseDate.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
            var startOfCurrentWeek = baseDate.AddDays(-1 * diff);
            var startOfMonth = new DateTime(baseDate.Year, baseDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var weeklyCheckIns = await _context.UserCheckIns
                .AsNoTracking()
                .Include(x => x.CheckIn)
                .Where(x => x.UserId == userId && x.CreatedOn >= startOfCurrentWeek)
                .ToListAsync();

            double estimatedWeeklyGain = 0;
            var daysWithCheckIns = weeklyCheckIns
                .GroupBy(x => x.ActivityDate ?? x.CreatedOn.Date)
                .ToDictionary(g => g.Key, g => g.ToList());

            var userJoinedDate = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => u.CreatedOn)
                .FirstOrDefaultAsync();

            int daysSoFar = (baseDate - startOfCurrentWeek).Days + 1;
            for (int i = 0; i < daysSoFar; i++)
            {
                var loopDate = startOfCurrentWeek.AddDays(i);
                double dayPoints = 0;

                if (daysWithCheckIns.TryGetValue(loopDate, out var uciList))
                {
                    double positive = 1.0;
                    double penalty = 0;

                    foreach (var uci in uciList)
                    {
                        if (uci.CheckIn == null) continue;

                        string q = uci.CheckIn.Questions ?? string.Empty;
                        int rating = uci.Rating ?? 0;

                        if (q.Contains("hours", StringComparison.OrdinalIgnoreCase))
                            positive += Math.Min(10, rating);

                        if (q.Contains("peaceful", StringComparison.OrdinalIgnoreCase) && rating >= 7)
                            positive += 1.0;

                        if (q.Contains("energy", StringComparison.OrdinalIgnoreCase))
                            positive += 2.0;

                        if ((q.Contains("Emergency", StringComparison.OrdinalIgnoreCase) || q.Contains("Neglect", StringComparison.OrdinalIgnoreCase)) && rating >= 7)
                            penalty += 5.0;
                    }

                    bool didRitual = await _context.UserActivitiesScores
                        .AnyAsync(x => x.UserId == userId && (x.ActivityDate == loopDate || (x.ActivityDate == null && x.CreatedAt.Date == loopDate)))
                        || await _context.RitualLogs.AnyAsync(x => x.UserId == userId && x.CompletedAt.Date == loopDate);

                    if (didRitual)
                        positive += 2.0;

                    dayPoints = Math.Min(15, positive) - penalty;
                }
                else if (userJoinedDate.Date < loopDate && loopDate < baseDate)
                {
                    dayPoints = -3.0;
                }

                estimatedWeeklyGain += dayPoints;
            }

            var ritualDays = await _context.RitualLogs
                .Where(x => x.UserId == userId && x.CompletedAt >= startOfCurrentWeek)
                .Select(x => x.CompletedAt.Date)
                .Distinct()
                .ToListAsync();

            var activityDays = await _context.UserActivitiesScores
                .Where(x => x.UserId == userId && (x.ActivityDate >= startOfCurrentWeek || (x.ActivityDate == null && x.CreatedAt >= startOfCurrentWeek)))
                .Select(x => x.ActivityDate ?? x.CreatedAt.Date)
                .Distinct()
                .ToListAsync();

            var checkInDays = await _context.UserCheckIns
                .Where(x => x.UserId == userId && (x.ActivityDate >= startOfCurrentWeek || (x.ActivityDate == null && x.CreatedOn >= startOfCurrentWeek)))
                .Select(x => x.ActivityDate ?? x.CreatedOn.Date)
                .Distinct()
                .ToListAsync();

            var chakraDays = await _context.ChakraLogs
                .Where(x => x.UserId == userId && (x.LogDate >= startOfCurrentWeek || (x.LogDate == null && x.CreatedAt >= startOfCurrentWeek)))
                .Select(x => x.LogDate ?? x.CreatedAt.Date)
                .Distinct()
                .ToListAsync();

            var monthEntriesCount = await _context.JournalEntries
                .Where(x => x.UserId == userId && x.CreatedOn >= startOfMonth && !x.IsDeleted)
                .CountAsync();

            var dog = await _context.Dogs
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId);

            return new DashboardStatsSnapshot
            {
                WeeklyProgress = estimatedWeeklyGain,
                RitualConsistencyCount = ritualDays.Concat(activityDays).Concat(checkInDays).Concat(chakraDays).Distinct().Count(),
                JournalEntriesCount = monthEntriesCount,
                BondedScore = dog?.CurrentScore ?? 50
            };
        }

        private async Task<bool> HasCheckInForDateAsync(Guid userId, DateTime date)
        {
            return await _context.UserCheckIns
                .AsNoTracking()
                .AnyAsync(x => x.UserId == userId && (x.ActivityDate == date || (x.ActivityDate == null && x.CreatedOn.Date == date)));
        }

        private static string GetBondLevel(double score)
        {
            if (score >= 80) return "Kindred Spirit 💜";
            if (score >= 50) return "Deep Bond ❤️";
            if (score >= 20) return "Growing Connection 🌱";
            return "New Connection ✨";
        }

        private sealed class DashboardStatsSnapshot
        {
            public double WeeklyProgress { get; set; }
            public int RitualConsistencyCount { get; set; }
            public int JournalEntriesCount { get; set; }
            public double BondedScore { get; set; }
        }
    }
}
