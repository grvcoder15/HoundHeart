using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class ExpertSessionService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        private const decimal SessionPrice = 30.00m;
        private const int SessionDurationMinutes = 15;

        public ExpertSessionService(
            AppDbContext context,
            IEmailService emailService,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;

            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        // 1. User Requests Session
        public async Task<Guid> CreateRequestAsync(string userId, CreateExpertSessionRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId.ToString() == userId) 
                ?? throw new Exception("User not found.");

            var sessionRequest = new ExpertSessionRequest
            {
                UserId = userId,
                UserName = user.FullName ?? "User",
                UserEmail = user.Email ?? "",
                ProblemDescription = request.ProblemDescription,
                PreferredTiming = request.PreferredTiming,
                Status = "Pending"
            };

            _context.ExpertSessionRequests.Add(sessionRequest);

            // Notify Admin
            _context.ExpertSessionNotifications.Add(new ExpertSessionNotification
            {
                UserId = null, // Admin
                IsAdminNotification = true,
                Message = $"🔔 New session request from {sessionRequest.UserName}",
                RequestId = sessionRequest.RequestId
            });

            await _context.SaveChangesAsync();

            // Email Admin
            var adminEmail = _configuration["AdminEmail"] ?? "admin@houndheart.com";
            await _emailService.SendEmailAsync(adminEmail, "New Expert Session Request", 
                $"<p><b>{sessionRequest.UserName}</b> has requested a session.</p><p><b>Problem:</b> {request.ProblemDescription}</p><p><b>Timing:</b> {request.PreferredTiming}</p>");

            return sessionRequest.RequestId;
        }

        // 2. Admin Gets Requests
        public async Task<List<ExpertSessionRequestDto>> GetRequestsAsync(string? statusFilter = null)
        {
            var query = _context.ExpertSessionRequests
                .Include(r => r.Slots)
                .Include(r => r.ConfirmedSession)
                .AsQueryable();

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(r => r.Status == statusFilter);
            }

            var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

            return requests.Select(r => new ExpertSessionRequestDto
            {
                RequestId = r.RequestId,
                UserId = r.UserId,
                UserName = r.UserName,
                UserEmail = r.UserEmail,
                ProblemDescription = r.ProblemDescription,
                PreferredTiming = r.PreferredTiming,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                Slots = r.Slots.Select(s => new ExpertSessionSlotDto
                {
                    SlotId = s.SlotId,
                    ProposedDateTime = s.ProposedDateTime,
                    IsSelected = s.IsSelected
                }).ToList(),
                ScheduledDateTime = r.ConfirmedSession?.ScheduledDateTime,
                MeetingLink = r.ConfirmedSession?.MeetingLink,
                CancellationReason = r.CancellationReason
            }).ToList();
        }

        // 2b. User Gets Their Own Requests
        public async Task<List<ExpertSessionRequestDto>> GetUserRequestsAsync(string userId)
        {
            var requests = await _context.ExpertSessionRequests
                .Include(r => r.Slots)
                .Include(r => r.ConfirmedSession)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return requests.Select(r => new ExpertSessionRequestDto
            {
                RequestId = r.RequestId,
                UserId = r.UserId,
                UserName = r.UserName,
                UserEmail = r.UserEmail,
                ProblemDescription = r.ProblemDescription,
                PreferredTiming = r.PreferredTiming,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                Slots = r.Slots.Select(s => new ExpertSessionSlotDto
                {
                    SlotId = s.SlotId,
                    ProposedDateTime = s.ProposedDateTime,
                    IsSelected = s.IsSelected
                }).ToList(),
                ScheduledDateTime = r.ConfirmedSession?.ScheduledDateTime,
                MeetingLink = r.ConfirmedSession?.MeetingLink,
                CancellationReason = r.CancellationReason
            }).ToList();
        }

        // 3. Admin Sends Slots
        public async Task SendSlotsAsync(SendSlotsRequest request)
        {
            var sessionReq = await _context.ExpertSessionRequests.FindAsync(request.RequestId)
                ?? throw new Exception("Request not found.");

            if (sessionReq.Status != "Pending")
                throw new Exception("Slots already sent or session confirmed or cancelled.");

            foreach (var dt in request.ProposedSlots)
            {
                _context.ExpertSessionSlots.Add(new ExpertSessionSlot
                {
                    RequestId = sessionReq.RequestId,
                    ProposedDateTime = dt
                });
            }

            sessionReq.Status = "SlotsSent";

            // Notify User
            _context.ExpertSessionNotifications.Add(new ExpertSessionNotification
            {
                UserId = sessionReq.UserId,
                Message = "📅 An expert has proposed time slots for your session request.",
                RequestId = sessionReq.RequestId
            });

            await _context.SaveChangesAsync();

            await _emailService.SendEmailAsync(sessionReq.UserEmail, "Time Slots Available for Your Session", 
                $"<p>Hello {sessionReq.UserName},</p><p>An expert has reviewed your request and proposed 3 time slots. Please log in to your dashboard to select one and confirm your booking.</p>");
        }

        // 4. User views slots
        public async Task<ExpertSessionRequestDto> GetUserRequestAsync(string userId, Guid requestId)
        {
            var req = await _context.ExpertSessionRequests
                .Include(r => r.Slots)
                .FirstOrDefaultAsync(r => r.RequestId == requestId && r.UserId == userId)
                ?? throw new Exception("Request not found.");

            return new ExpertSessionRequestDto
            {
                RequestId = req.RequestId,
                UserId = req.UserId,
                UserName = req.UserName,
                UserEmail = req.UserEmail,
                ProblemDescription = req.ProblemDescription,
                PreferredTiming = req.PreferredTiming,
                Status = req.Status,
                CreatedAt = req.CreatedAt,
                Slots = req.Slots.Select(s => new ExpertSessionSlotDto
                {
                    SlotId = s.SlotId,
                    ProposedDateTime = s.ProposedDateTime,
                    IsSelected = s.IsSelected
                }).ToList()
            };
        }

        // 5. User Selects Slot & Starts Payment Intent
        public async Task<VideoPaymentIntentResponse> ConfirmSlotAndGetPaymentAsync(string userId, ConfirmSlotRequest request)
        {
            var sessionReq = await _context.ExpertSessionRequests
                .Include(r => r.Slots)
                .FirstOrDefaultAsync(r => r.RequestId == request.RequestId && r.UserId == userId)
                ?? throw new Exception("Request not found.");

            var slot = sessionReq.Slots.FirstOrDefault(s => s.SlotId == request.SlotId)
                ?? throw new Exception("Invalid slot selected.");

            if (sessionReq.Status != "SlotsSent")
                throw new Exception("Session is not pending slot confirmation.");

            // Create Stripe Payment Intent
            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(SessionPrice * 100),
                Currency = "usd",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "requestId", request.RequestId.ToString() },
                    { "slotId", request.SlotId.ToString() },
                    { "type", "expert_session" }
                },
                Description = "Hound Heart – Expert Session ($30)"
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            return new VideoPaymentIntentResponse
            {
                ClientSecret = intent.ClientSecret,
                PaymentIntentId = intent.Id,
                Amount = SessionPrice,
                Currency = "usd"
            };
        }

        // 6. Payment Success -> Create Room
        public async Task<ExpertSessionConfirmedDto> HandlePaymentSuccessAsync(string userId, PaymentSuccessRequest request)
        {
            var sessionReq = await _context.ExpertSessionRequests
                .Include(r => r.Slots)
                .FirstOrDefaultAsync(r => r.RequestId == request.RequestId && r.UserId == userId)
                ?? throw new Exception("Request not found.");

            if (sessionReq.Status == "Confirmed" || sessionReq.Status == "Scheduled")
                throw new Exception("Session already confirmed.");

            var service = new PaymentIntentService();
            var intent = await service.GetAsync(request.PaymentIntentId);

            if (intent.Status != "succeeded")
                throw new Exception($"Payment not completed. Status: {intent.Status}");

            var slotIdStr = intent.Metadata.ContainsKey("slotId") ? intent.Metadata["slotId"] : "";
            if (!Guid.TryParse(slotIdStr, out Guid selectedSlotId))
                throw new Exception("Slot ID missing from payment metadata.");

            var slot = sessionReq.Slots.FirstOrDefault(s => s.SlotId == selectedSlotId)
                ?? throw new Exception("Slot not found.");

            // Create Daily Room
            var (roomUrl, roomName) = await CreateDailyRoomAsync(slot.ProposedDateTime);

            // Confirm
            slot.IsSelected = true;
            sessionReq.Status = "Scheduled";

            var confirmed = new ExpertSessionConfirmed
            {
                RequestId = sessionReq.RequestId,
                UserId = userId,
                SelectedSlotId = slot.SlotId,
                ScheduledDateTime = slot.ProposedDateTime,
                MeetingLink = roomUrl,
                RoomName = roomName,
                StripePaymentIntentId = request.PaymentIntentId,
                AmountPaid = SessionPrice,
                Status = "Scheduled"
            };

            _context.ExpertSessionConfirmeds.Add(confirmed);

            // Convert UTC to IST for display in notifications/emails
            var istZone = TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "India Standard Time" : "Asia/Kolkata");
            var slotIst = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.SpecifyKind(slot.ProposedDateTime, DateTimeKind.Utc), istZone);
            var slotDisplay = slotIst.ToString("dd-MM-yyyy hh:mm tt") + " IST";

            // Admin Notification
            _context.ExpertSessionNotifications.Add(new ExpertSessionNotification
            {
                UserId = null,
                IsAdminNotification = true,
                Message = $"✅ {sessionReq.UserName} confirmed slot: {slotDisplay}",
                RequestId = sessionReq.RequestId
            });

            await _context.SaveChangesAsync();

            // Email both
            var adminEmail = _configuration["AdminEmail"] ?? "admin@houndheart.com";
            await _emailService.SendEmailAsync(sessionReq.UserEmail, "Session Confirmed & Scheduled", 
                $"<p>Your session is confirmed for {slotDisplay}.</p><p>Join link: {roomUrl}</p>");
            
            await _emailService.SendEmailAsync(adminEmail, "Session Confirmed by User", 
                $"<p>{sessionReq.UserName} has paid and confirmed their session for {slotDisplay}.</p>");

            return new ExpertSessionConfirmedDto
            {
                SessionId = confirmed.SessionId,
                RequestId = confirmed.RequestId,
                UserId = confirmed.UserId,
                UserName = sessionReq.UserName,
                UserEmail = sessionReq.UserEmail,
                ScheduledDateTime = confirmed.ScheduledDateTime,
                MeetingLink = confirmed.MeetingLink,
                RoomName = confirmed.RoomName,
                AmountPaid = confirmed.AmountPaid,
                Status = confirmed.Status
            };
        }

        private async Task<(string RoomUrl, string RoomName)> CreateDailyRoomAsync(DateTime scheduledTime)
        {
            var apiKey = _configuration["DailyCo:ApiKey"] ?? throw new Exception("Daily.co API key not configured.");
            var domain = _configuration["DailyCo:Domain"] ?? throw new Exception("Daily.co domain not configured.");

            var roomName = $"expert-sess-{Guid.NewGuid():N}";
            var expiryUnix = ((DateTimeOffset)scheduledTime).AddMinutes(SessionDurationMinutes + 15).ToUnixTimeSeconds();

            var payload = new
            {
                name = roomName,
                properties = new
                {
                    exp = expiryUnix,
                    enable_chat = true,
                    max_participants = 2
                }
            };

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.daily.co/v1/rooms", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Daily.co room creation failed: {responseBody}");

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            var returnedName = root.GetProperty("name").GetString() ?? roomName;
            var roomUrl = root.GetProperty("url").GetString() ?? $"https://{domain}/{returnedName}";

            return (roomUrl, returnedName);
        }

        // 7. Get My Sessions (User)
        public async Task<List<ExpertSessionConfirmedDto>> GetUserUpcomingSessionsAsync(string userId)
        {
            var sessions = await _context.ExpertSessionConfirmeds
                .Include(c => c.Request)
                .Where(c => c.UserId == userId && c.Status == "Scheduled")
                .OrderBy(c => c.ScheduledDateTime)
                .ToListAsync();

            return sessions.Select(c => new ExpertSessionConfirmedDto
            {
                SessionId = c.SessionId,
                RequestId = c.RequestId,
                UserId = c.UserId,
                UserName = c.Request.UserName,
                UserEmail = c.Request.UserEmail,
                ScheduledDateTime = c.ScheduledDateTime,
                MeetingLink = c.MeetingLink,
                RoomName = c.RoomName,
                AmountPaid = c.AmountPaid,
                Status = c.Status
            }).ToList();
        }

        // 8. Admin Upcoming Sessions
        public async Task<List<ExpertSessionConfirmedDto>> GetAdminUpcomingSessionsAsync()
        {
            var sessions = await _context.ExpertSessionConfirmeds
                .Include(c => c.Request)
                .Where(c => c.Status == "Scheduled")
                .OrderBy(c => c.ScheduledDateTime)
                .ToListAsync();

            return sessions.Select(c => new ExpertSessionConfirmedDto
            {
                SessionId = c.SessionId,
                RequestId = c.RequestId,
                UserId = c.UserId,
                UserName = c.Request.UserName,
                UserEmail = c.Request.UserEmail,
                ScheduledDateTime = c.ScheduledDateTime,
                MeetingLink = c.MeetingLink,
                RoomName = c.RoomName,
                AmountPaid = c.AmountPaid,
                Status = c.Status
            }).ToList();
        }

        // 9. Notifications (User & Admin)
        public async Task<List<ExpertSessionNotificationDto>> GetNotificationsAsync(string? userId)
        {
            var isAdmin = string.IsNullOrEmpty(userId);
            var query = _context.ExpertSessionNotifications.AsQueryable();

            if (isAdmin)
                query = query.Where(n => n.IsAdminNotification && !n.IsRead);
            else
                query = query.Where(n => n.UserId == userId && !n.IsRead);

            var notifications = await query.OrderByDescending(n => n.CreatedAt).ToListAsync();

            return notifications.Select(n => new ExpertSessionNotificationDto
            {
                NotificationId = n.NotificationId,
                Message = n.Message,
                RequestId = n.RequestId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            }).ToList();
        }

        public async Task MarkNotificationReadAsync(Guid notificationId)
        {
            var notif = await _context.ExpertSessionNotifications.FindAsync(notificationId);
            if (notif != null)
            {
                notif.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        // Cancel Request
        public async Task CancelSessionAsync(CancelSessionRequest request)
        {
            var sessionReq = await _context.ExpertSessionRequests.FindAsync(request.RequestId)
                ?? throw new Exception("Request not found.");

            if (sessionReq.Status == "Confirmed" || sessionReq.Status == "Scheduled")
                throw new Exception("Cannot cancel an already scheduled session. Please contact support.");

            sessionReq.Status = "Cancelled";
            sessionReq.CancellationReason = request.Reason;

            await _context.SaveChangesAsync();

            // Email user
            await _emailService.SendEmailAsync(sessionReq.UserEmail, "Expert Session Request Cancelled", 
                $"<p>Hi {sessionReq.UserName},</p><p>Your request for an expert session has been cancelled.</p><p><b>Reason:</b> {request.Reason}</p>");

            // Email admin
            var adminEmail = _configuration["AdminEmail"] ?? "admin@houndheart.com";
            await _emailService.SendEmailAsync(adminEmail, "Expert Session Cancelled", 
                $"<p><b>{sessionReq.UserName}</b> has cancelled their expert session request.</p><p><b>Reason:</b> {request.Reason}</p>");
        }
    }
}
