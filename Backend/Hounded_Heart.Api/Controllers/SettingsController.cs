using Hounded_Heart.Api.Response;
using Microsoft.AspNetCore.Mvc;
using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Globalization;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        public class AdminPlatformSettingsUpdateDto
        {
            public bool? MaintenanceMode { get; set; }
            public bool? AllowNewRegistrations { get; set; }
            public bool? EnableSacredGuideSales { get; set; }
            public bool? EnablePreRegistration { get; set; }
            public bool? EnableTshirtSales { get; set; }
        }

        public class AdminPricingSettingsUpdateDto
        {
            public decimal? PremiumPlanPrice { get; set; }
            public decimal? PremiumPlusPlanPrice { get; set; }
            public decimal? SacredGuidePrice { get; set; }
        }

        private static bool ParseBool(string? value, bool fallback)
        {
            if (string.IsNullOrWhiteSpace(value)) return fallback;
            if (bool.TryParse(value, out var parsed)) return parsed;
            return fallback;
        }

        private static decimal ParseDecimal(string? value, decimal fallback)
        {
            if (string.IsNullOrWhiteSpace(value)) return fallback;
            if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed)) return parsed;
            return fallback;
        }

        private async Task UpsertSiteSettingAsync(string key, string value)
        {
            var existing = await _context.SiteSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (existing == null)
            {
                _context.SiteSettings.Add(new SiteSetting
                {
                    SettingKey = key,
                    SettingValue = value
                });
            }
            else
            {
                existing.SettingValue = value;
            }
        }

        [HttpGet("ask-expert")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAskExpertSettings()
        {
            try
            {
                var settingsList = await _context.SiteSettings
                    .Where(s => s.SettingKey.StartsWith("AskExpert_"))
                    .ToListAsync();

                var settingsDict = settingsList.ToDictionary(s => s.SettingKey, s => s.SettingValue);

                return Ok(ResponseHelper.Success(settingsDict, "Ask Expert settings retrieved successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred fetching settings: {ex.Message}", 500));
            }
        }

        [HttpGet("public/sacred-guide-status")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicSacredGuideStatus()
        {
            try
            {
                var setting = await _context.SiteSettings
                    .Where(s => s.SettingKey == "Platform_EnableSacredGuideSales")
                    .Select(s => s.SettingValue)
                    .FirstOrDefaultAsync();

                return Ok(ResponseHelper.Success(new { enableSacredGuideSales = ParseBool(setting, true) }, "Sacred guide sales status retrieved.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message}", 500));
            }
        }

        [HttpGet("public/launch-flags")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicLaunchFlags()
        {
            try
            {
                var settings = await _context.SiteSettings
                    .Where(s => s.SettingKey == "Platform_EnablePreRegistration" ||
                                s.SettingKey == "Platform_EnableTshirtSales")
                    .ToListAsync();

                var dict = settings.ToDictionary(s => s.SettingKey, s => s.SettingValue);

                var enablePreRegistration = ParseBool(dict.GetValueOrDefault("Platform_EnablePreRegistration"), true);
                var enableTshirtSales = ParseBool(dict.GetValueOrDefault("Platform_EnableTshirtSales"), false);

                return Ok(ResponseHelper.Success(new
                {
                    enablePreRegistration,
                    enableTshirtSales,
                    ctaLabel = enableTshirtSales ? "Buy T-Shirt" : "Pre-Register"
                }, "Launch flags retrieved successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred: {ex.Message}", 500));
            }
        }

        [HttpGet("admin/platform")]
        [Authorize]
        public async Task<IActionResult> GetAdminPlatformSettings()
        {
            try
            {
                var settings = await _context.SiteSettings
                    .Where(s => s.SettingKey == "Platform_MaintenanceMode" ||
                                s.SettingKey == "Platform_AllowNewRegistrations" ||
                                s.SettingKey == "Platform_EnableSacredGuideSales" ||
                                s.SettingKey == "Platform_EnablePreRegistration" ||
                                s.SettingKey == "Platform_EnableTshirtSales")
                    .ToListAsync();

                var dict = settings.ToDictionary(s => s.SettingKey, s => s.SettingValue);

                return Ok(ResponseHelper.Success(new
                {
                    maintenanceMode = ParseBool(dict.GetValueOrDefault("Platform_MaintenanceMode"), false),
                    allowNewRegistrations = ParseBool(dict.GetValueOrDefault("Platform_AllowNewRegistrations"), true),
                    enableSacredGuideSales = ParseBool(dict.GetValueOrDefault("Platform_EnableSacredGuideSales"), true),
                    enablePreRegistration = ParseBool(dict.GetValueOrDefault("Platform_EnablePreRegistration"), true),
                    enableTshirtSales = ParseBool(dict.GetValueOrDefault("Platform_EnableTshirtSales"), false)
                }, "Platform settings retrieved successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred fetching admin platform settings: {ex.Message}", 500));
            }
        }

        [HttpPut("admin/platform")]
        [Authorize]
        public async Task<IActionResult> UpdateAdminPlatformSettings([FromBody] AdminPlatformSettingsUpdateDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(ResponseHelper.Fail<object>("Request body is required.", 400));

                if (dto.MaintenanceMode.HasValue)
                {
                    await UpsertSiteSettingAsync("Platform_MaintenanceMode", dto.MaintenanceMode.Value.ToString());
                }

                if (dto.AllowNewRegistrations.HasValue)
                {
                    await UpsertSiteSettingAsync("Platform_AllowNewRegistrations", dto.AllowNewRegistrations.Value.ToString());
                }

                if (dto.EnableSacredGuideSales.HasValue)
                {
                    await UpsertSiteSettingAsync("Platform_EnableSacredGuideSales", dto.EnableSacredGuideSales.Value.ToString());
                }

                if (dto.EnablePreRegistration.HasValue)
                {
                    await UpsertSiteSettingAsync("Platform_EnablePreRegistration", dto.EnablePreRegistration.Value.ToString());
                }

                if (dto.EnableTshirtSales.HasValue)
                {
                    await UpsertSiteSettingAsync("Platform_EnableTshirtSales", dto.EnableTshirtSales.Value.ToString());
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>("Platform settings updated successfully.", "Platform settings updated successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred updating admin platform settings: {ex.Message}", 500));
            }
        }

        [HttpGet("admin/pricing")]
        [Authorize]
        public async Task<IActionResult> GetAdminPricingSettings()
        {
            try
            {
                var plans = await _context.SubscriptionPlans
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Price)
                    .Take(2)
                    .ToListAsync();

                var sacredGuideSetting = await _context.SiteSettings
                    .FirstOrDefaultAsync(s => s.SettingKey == "Pricing_SacredGuidePrice");

                decimal fallbackGuidePrice = await _context.SacredGuides
                    .Where(g => g.IsActive)
                    .OrderByDescending(g => g.CreatedOn)
                    .Select(g => g.Price)
                    .FirstOrDefaultAsync();

                return Ok(ResponseHelper.Success(new
                {
                    premiumPlanPrice = plans.Count > 0 ? plans[0].Price : 0m,
                    premiumPlusPlanPrice = plans.Count > 1 ? plans[1].Price : 0m,
                    sacredGuidePrice = ParseDecimal(sacredGuideSetting?.SettingValue, fallbackGuidePrice),
                    planIds = plans.Select(p => p.PlanId).ToList()
                }, "Pricing settings retrieved successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred fetching pricing settings: {ex.Message}", 500));
            }
        }

        [HttpPut("admin/pricing")]
        [Authorize]
        public async Task<IActionResult> UpdateAdminPricingSettings([FromBody] AdminPricingSettingsUpdateDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(ResponseHelper.Fail<object>("Request body is required.", 400));

                if (dto.PremiumPlanPrice.HasValue && dto.PremiumPlanPrice.Value < 0)
                    return BadRequest(ResponseHelper.Fail<object>("Premium plan price cannot be negative.", 400));

                if (dto.PremiumPlusPlanPrice.HasValue && dto.PremiumPlusPlanPrice.Value < 0)
                    return BadRequest(ResponseHelper.Fail<object>("Premium+ plan price cannot be negative.", 400));

                if (dto.SacredGuidePrice.HasValue && dto.SacredGuidePrice.Value < 0)
                    return BadRequest(ResponseHelper.Fail<object>("Sacred guide price cannot be negative.", 400));

                var plans = await _context.SubscriptionPlans
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.DisplayOrder)
                    .ThenBy(p => p.Price)
                    .Take(2)
                    .ToListAsync();

                if (plans.Count > 0 && dto.PremiumPlanPrice.HasValue)
                {
                    plans[0].Price = dto.PremiumPlanPrice.Value;
                    plans[0].UpdatedOn = System.DateTime.UtcNow;
                }

                if (plans.Count > 1 && dto.PremiumPlusPlanPrice.HasValue)
                {
                    plans[1].Price = dto.PremiumPlusPlanPrice.Value;
                    plans[1].UpdatedOn = System.DateTime.UtcNow;
                }

                if (dto.SacredGuidePrice.HasValue)
                {
                    await UpsertSiteSettingAsync("Pricing_SacredGuidePrice", dto.SacredGuidePrice.Value.ToString(CultureInfo.InvariantCulture));
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<object>("Pricing settings updated successfully.", "Pricing settings updated successfully.", 200));
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred updating pricing settings: {ex.Message}", 500));
            }
        }
    }
}
