using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PreRegisterController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public PreRegisterController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public class PreRegisterRequestDto
        {
            public string? FullName { get; set; }
            public string? Email { get; set; }
            public string? PhoneNumber { get; set; }
            public string? AddressLine1 { get; set; }
            public string? AddressLine2 { get; set; }
            public string? City { get; set; }
            public string? State { get; set; }
            public string? Country { get; set; }
            public string? PostalCode { get; set; }
            public string? Address { get; set; }
            public bool ConsentGiven { get; set; }
            public string? Source { get; set; }
        }

        public class MarkInvitesSentRequestDto
        {
            public List<string> Emails { get; set; } = new();
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateOrUpdate([FromBody] PreRegisterRequestDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(ResponseHelper.Fail<object>("Request body is required.", 400));
                }

                var fullName = (dto.FullName ?? string.Empty).Trim();
                var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
                var phoneNumber = (dto.PhoneNumber ?? string.Empty).Trim();
                var addressLine1 = (dto.AddressLine1 ?? string.Empty).Trim();
                var addressLine2 = (dto.AddressLine2 ?? string.Empty).Trim();
                var city = (dto.City ?? string.Empty).Trim();
                var state = (dto.State ?? string.Empty).Trim();
                var country = (dto.Country ?? string.Empty).Trim();
                var postalCode = (dto.PostalCode ?? string.Empty).Trim();
                var address = (dto.Address ?? string.Empty).Trim();
                var source = string.IsNullOrWhiteSpace(dto.Source) ? "LandingPage" : dto.Source.Trim();

                if (string.IsNullOrWhiteSpace(address))
                {
                    address = string.Join(", ", new[] { addressLine1, addressLine2, city, state, country, postalCode }
                        .Where(x => !string.IsNullOrWhiteSpace(x)));
                }

                if (string.IsNullOrWhiteSpace(fullName))
                {
                    return BadRequest(ResponseHelper.Fail<object>("Full name is required.", 400));
                }

                if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                {
                    return BadRequest(ResponseHelper.Fail<object>("Valid email is required.", 400));
                }

                if (string.IsNullOrWhiteSpace(phoneNumber))
                {
                    return BadRequest(ResponseHelper.Fail<object>("Phone number is required.", 400));
                }

                if (string.IsNullOrWhiteSpace(addressLine1) ||
                    string.IsNullOrWhiteSpace(city) ||
                    string.IsNullOrWhiteSpace(state) ||
                    string.IsNullOrWhiteSpace(country) ||
                    string.IsNullOrWhiteSpace(postalCode))
                {
                    return BadRequest(ResponseHelper.Fail<object>("Shipping address fields are required.", 400));
                }

                var existing = await _context.PreRegistrations
                    .FirstOrDefaultAsync(x => x.Email.ToLower() == email);

                var isNewRegistration = existing == null;

                if (existing == null)
                {
                    var preRegistration = new PreRegistration
                    {
                        PreRegistrationId = Guid.NewGuid(),
                        FullName = fullName,
                        Email = email,
                        PhoneNumber = phoneNumber,
                        AddressLine1 = addressLine1,
                        AddressLine2 = string.IsNullOrWhiteSpace(addressLine2) ? null : addressLine2,
                        City = city,
                        StateProvince = state,
                        Country = country,
                        PostalCode = postalCode,
                        Address = address,
                        ConsentGiven = dto.ConsentGiven,
                        Source = source,
                        IsLaunchInviteSent = false,
                        CreatedOn = DateTime.UtcNow
                    };

                    _context.PreRegistrations.Add(preRegistration);
                }
                else
                {
                    // Update only non-empty incoming values to avoid accidental data loss.
                    if (!string.IsNullOrWhiteSpace(fullName)) existing.FullName = fullName;
                    if (!string.IsNullOrWhiteSpace(phoneNumber)) existing.PhoneNumber = phoneNumber;
                    if (!string.IsNullOrWhiteSpace(addressLine1)) existing.AddressLine1 = addressLine1;
                    existing.AddressLine2 = string.IsNullOrWhiteSpace(addressLine2) ? existing.AddressLine2 : addressLine2;
                    if (!string.IsNullOrWhiteSpace(city)) existing.City = city;
                    if (!string.IsNullOrWhiteSpace(state)) existing.StateProvince = state;
                    if (!string.IsNullOrWhiteSpace(country)) existing.Country = country;
                    if (!string.IsNullOrWhiteSpace(postalCode)) existing.PostalCode = postalCode;
                    if (!string.IsNullOrWhiteSpace(address)) existing.Address = address;
                    if (!string.IsNullOrWhiteSpace(source)) existing.Source = source;
                    existing.ConsentGiven = dto.ConsentGiven;
                    existing.UpdatedOn = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                var emailSubject = isNewRegistration
                    ? "HoundHeart Pre-Registration Confirmed"
                    : "HoundHeart Pre-Registration Updated";

                var emailBody = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>{(isNewRegistration ? "You are successfully pre-registered!" : "Your pre-registration details were updated!")}</h2>
  <p>Hi {System.Net.WebUtility.HtmlEncode(fullName)},</p>
  <p>Thank you for {(isNewRegistration ? "joining the HoundHeart launch list" : "updating your HoundHeart pre-registration")}. We will notify you by email when launch access opens and when your invite-first checkout link is ready.</p>
  <p><strong>Email:</strong> {System.Net.WebUtility.HtmlEncode(email)}</p>
  <p><strong>Country:</strong> {System.Net.WebUtility.HtmlEncode(country)}</p>
  <p><strong>Status:</strong> {(isNewRegistration ? "Pre-registered" : "Pre-registration updated")}</p>
  <p>Keep an eye on your inbox for launch updates, product drop alerts, and next steps.</p>
  <p>Best regards,<br/>The Hound Heart Team</p>
</body>
</html>";

                try
                {
                    await _emailService.SendEmailAsync(email, emailSubject, emailBody, fullName);
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Pre-registration email failed for {email}: {emailEx.Message}");
                }

                return Ok(ResponseHelper.Success(new
                {
                    isNewRegistration,
                    email,
                    message = isNewRegistration ? "Pre-registration saved successfully." : "Pre-registration details updated successfully."
                }, "Pre-registration processed successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while saving pre-registration: {ex.Message}", 500));
            }
        }

        [HttpGet("admin/list")]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var records = await _context.PreRegistrations
                    .Where(x => !x.IsDeleted)
                    .OrderByDescending(x => x.CreatedOn)
                    .Select(x => new
                    {
                        x.PreRegistrationId,
                        x.FullName,
                        x.Email,
                        x.PhoneNumber,
                        x.AddressLine1,
                        x.AddressLine2,
                        x.City,
                        state = x.StateProvince,
                        x.Country,
                        x.PostalCode,
                        x.Address,
                        x.ConsentGiven,
                        x.Source,
                        x.IsLaunchInviteSent,
                        x.InviteSentOn,
                        x.CreatedOn,
                        x.UpdatedOn,
                        x.IsDeleted
                    })
                    .ToListAsync();

                return Ok(ResponseHelper.Success(records, "Pre-registrations fetched successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while fetching pre-registrations: {ex.Message}", 500));
            }
        }

        [HttpPost("admin/mark-invites-sent")]
        [Authorize]
        public async Task<IActionResult> MarkInvitesSent([FromBody] MarkInvitesSentRequestDto dto)
        {
            try
            {
                if (dto == null || dto.Emails == null || dto.Emails.Count == 0)
                {
                    return BadRequest(ResponseHelper.Fail<object>("At least one email is required.", 400));
                }

                var normalizedEmails = dto.Emails
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim().ToLowerInvariant())
                    .Distinct()
                    .ToList();

                if (normalizedEmails.Count == 0)
                {
                    return BadRequest(ResponseHelper.Fail<object>("At least one valid email is required.", 400));
                }

                var now = DateTime.UtcNow;
                var records = await _context.PreRegistrations
                    .Where(x => normalizedEmails.Contains(x.Email.ToLower()))
                    .ToListAsync();

                foreach (var record in records)
                {
                    record.IsLaunchInviteSent = true;
                    record.InviteSentOn = now;
                    record.UpdatedOn = now;
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    markedCount = records.Count,
                    requestedCount = normalizedEmails.Count
                }, "Launch invite status updated successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while updating invite status: {ex.Message}", 500));
            }
        }

        [HttpDelete("admin/{preRegistrationId}")]
        [Authorize]
        public async Task<IActionResult> DeleteRecord(Guid preRegistrationId)
        {
            try
            {
                if (preRegistrationId == Guid.Empty)
                {
                    return BadRequest(ResponseHelper.Fail<object>("Pre-registration ID is required.", 400));
                }

                var record = await _context.PreRegistrations
                    .FirstOrDefaultAsync(x => x.PreRegistrationId == preRegistrationId && !x.IsDeleted);

                if (record == null)
                {
                    return NotFound(ResponseHelper.Fail<object>("Pre-registration record not found.", 404));
                }

                // Soft delete: set IsDeleted to true
                record.IsDeleted = true;
                record.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new { preRegistrationId }, "Pre-registration record deleted successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<object>($"An error occurred while deleting the record: {ex.Message}", 500));
            }
        }
    }
}
