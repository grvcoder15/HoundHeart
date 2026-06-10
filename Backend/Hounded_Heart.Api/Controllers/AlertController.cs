using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/alerts")]
    [ApiController]
    public class AlertController : ControllerBase
    {
        private readonly IAlertService _alertService;
        private readonly ISmsService _smsService;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public AlertController(IAlertService alertService, ISmsService smsService, AppDbContext context, IWebHostEnvironment environment)
        {
            _alertService = alertService;
            _smsService = smsService;
            _context = context;
            _environment = environment;
        }

        /// <summary>
        /// TEST ONLY — bypasses all stress math and directly fires a WellnessAlert + SMS.
        /// Use this to verify Twilio SMS delivery without needing a baseline.
        /// </summary>
        [HttpPost("force-test/{userId}/{dogId}")]
        public async Task<IActionResult> ForceTestAlert(Guid userId, Guid dogId)
        {
            if (_environment.IsProduction())
                return NotFound();
            var humanProfile = await _context.HumanProfiles
                .FirstOrDefaultAsync(h => h.UserId == userId);

            var phoneNumber = humanProfile?.PhoneNumber;

            var alert = new WellnessAlert
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DogId = dogId,
                AlertType = "stress_detected",
                Suggestion = "TEST ALERT: Your dog is nearby. Spend some quiet time together to help regulate your stress levels.",
                DogStateAtAlert = "resting",
                HRVAtAlert = 20,
                HRAtAlert = 110,
                IsDogNearby = true,
                DistanceMetres = 10,
                CreatedAt = DateTime.UtcNow,
                IsActedOn = false
            };

            _context.WellnessAlerts.Add(alert);
            await _context.SaveChangesAsync();

            bool smsSent = false;
            string smsNote = "No phone number found in HumanProfiles for this user.";

            if (!string.IsNullOrEmpty(phoneNumber))
            {
                string smsBody = $"HoundHeart TEST Alert: Your body shows signs of stress. Your dog is resting nearby. Sit quietly with them and focus on their breathing.";
                smsSent = await _smsService.SendSms(userId, phoneNumber, "stress_alert", smsBody, alert.Id);
                smsNote = smsSent ? $"SMS sent to {phoneNumber}" : $"SMS failed for {phoneNumber} — check MessageLogs";
            }

            return Ok(ResponseHelper.Success(new
            {
                AlertId = alert.Id,
                SmsSent = smsSent,
                PhoneNumber = phoneNumber,
                Note = smsNote
            }, "Force test alert fired.", 200));
        }

        [HttpPost("generate/{userId}/{dogId}")]
        public async Task<IActionResult> GenerateAlert(Guid userId, Guid dogId)
        {
            var result = await _alertService.GenerateAlert(userId, dogId);
            
            if (result == null)
            {
                return Ok(ResponseHelper.Success<object>(null, "No stress detected — no alert needed", 200));
            }
            
            return Ok(ResponseHelper.Success(result, "Wellness alert generated successfully.", 200));
        }

        [HttpGet("recent/{userId}")]
        public async Task<IActionResult> GetRecentAlerts(Guid userId)
        {
            var alerts = await _alertService.GetRecentAlerts(userId);
            return Ok(ResponseHelper.Success(alerts, "Recent alerts retrieved successfully.", 200));
        }

        [HttpPost("outcome/{alertId}")]
        public async Task<IActionResult> LogOutcome(Guid alertId, [FromBody] LogOutcomeRequest request)
        {
            var result = await _alertService.LogOutcome(alertId, request.Outcome);
            
            if (result == null)
            {
                return NotFound(ResponseHelper.Fail<object>("Alert not found.", 404));
            }
            
            return Ok(ResponseHelper.Success(result, "Alert outcome logged successfully.", 200));
        }
    }

    public class LogOutcomeRequest
    {
        public string Outcome { get; set; } = string.Empty;
    }
}