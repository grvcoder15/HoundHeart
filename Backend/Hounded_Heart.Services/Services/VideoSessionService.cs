using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    /// <summary>
    /// Handles creation and management of paid Daily.co video consultation sessions.
    /// </summary>
    public class VideoSessionService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        private const decimal SessionPrice = 30.00m;
        private const int SessionDurationMinutes = 15;
        private const string Currency = "usd";

        public VideoSessionService(
            AppDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;

            // Set Stripe API key
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        // ─────────────────────────────────────────────────────────────────────
        // STRIPE: Create PaymentIntent for $30 session fee
        // ─────────────────────────────────────────────────────────────────────

        public async Task<VideoPaymentIntentResponse> CreatePaymentIntentAsync(Guid userId, string? expertId)
        {
            var user = await _context.Users.FindAsync(userId)
                ?? throw new Exception("User not found.");

            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)(SessionPrice * 100), // Stripe uses cents
                Currency = Currency,
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Metadata = new System.Collections.Generic.Dictionary<string, string>
                {
                    { "userId", userId.ToString() },
                    { "expertId", expertId ?? "" },
                    { "type", "video_session" }
                },
                Description = "Hound Heart – 15-min Video Consultation ($30)"
            };

            var service = new PaymentIntentService();
            var intent = await service.CreateAsync(options);

            return new VideoPaymentIntentResponse
            {
                ClientSecret = intent.ClientSecret,
                PaymentIntentId = intent.Id,
                Amount = SessionPrice,
                Currency = Currency
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // DAILY.CO: Create a room that expires in 20 minutes
        // ─────────────────────────────────────────────────────────────────────

        private async Task<(string RoomUrl, string RoomName)> CreateDailyRoomAsync()
        {
            var apiKey = _configuration["DailyCo:ApiKey"]
                ?? throw new Exception("Daily.co API key is not configured.");
            var domain = _configuration["DailyCo:Domain"]
                ?? throw new Exception("Daily.co domain is not configured.");

            var roomName = $"hh-session-{Guid.NewGuid():N}";
            var expiryUnix = DateTimeOffset.UtcNow.AddMinutes(SessionDurationMinutes + 5).ToUnixTimeSeconds();

            var payload = new
            {
                name = roomName,
                properties = new
                {
                    exp = expiryUnix,
                    enable_chat = true,
                    enable_screenshare = false,
                    max_participants = 2,
                    start_video_off = false,
                    start_audio_off = false
                }
            };

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await client.PostAsync("https://api.daily.co/v1/rooms", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Daily.co room creation failed: {responseBody}");

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            var returnedName = root.GetProperty("name").GetString() ?? roomName;
            var roomUrl = root.GetProperty("url").GetString()
                ?? $"https://{domain}/{returnedName}";

            return (roomUrl, returnedName);
        }

        // ─────────────────────────────────────────────────────────────────────
        // SESSION: Verify payment + create session record
        // ─────────────────────────────────────────────────────────────────────

        public async Task<VideoSessionResponse> CreateSessionAsync(
            Guid userId,
            string paymentIntentId,
            string? expertId)
        {
            // 1. Verify payment intent succeeded
            var service = new PaymentIntentService();
            PaymentIntent intent;
            try
            {
                intent = await service.GetAsync(paymentIntentId);
            }
            catch (StripeException ex)
            {
                throw new Exception($"Could not verify payment: {ex.Message}");
            }

            if (intent.Status != "succeeded")
                throw new Exception($"Payment not completed. Status: {intent.Status}");

            // 2. Prevent duplicate session for same payment intent
            var existing = await _context.VideoSessions
                .FirstOrDefaultAsync(s => s.StripePaymentIntentId == paymentIntentId);

            if (existing != null)
            {
                // Return the existing session if valid
                return MapToResponse(existing);
            }

            // 3. Create Daily.co room
            var (roomUrl, roomName) = await CreateDailyRoomAsync();

            // 4. Save session to database
            var now = DateTime.UtcNow;
            var session = new VideoSession
            {
                SessionId = Guid.NewGuid(),
                UserId = userId.ToString(),
                ExpertId = expertId,
                RoomUrl = roomUrl,
                RoomName = roomName,
                StripePaymentIntentId = paymentIntentId,
                StartTime = now,
                ExpiresAt = now.AddMinutes(SessionDurationMinutes),
                AmountPaid = SessionPrice,
                IsActive = true,
                CreatedAt = now
            };

            _context.VideoSessions.Add(session);
            await _context.SaveChangesAsync();

            return MapToResponse(session);
        }

        // ─────────────────────────────────────────────────────────────────────
        // SESSION STATUS
        // ─────────────────────────────────────────────────────────────────────

        public async Task<SessionStatusResponse> GetSessionStatusAsync(Guid sessionId, Guid userId)
        {
            var userIdStr = userId.ToString();
            var session = await _context.VideoSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userIdStr)
                ?? throw new Exception("Session not found.");

            var now = DateTime.UtcNow;
            var isExpired = now >= session.ExpiresAt || !session.IsActive;
            var remaining = isExpired ? 0 : (int)(session.ExpiresAt - now).TotalSeconds;

            // Auto-deactivate if expired
            if (isExpired && session.IsActive)
            {
                session.IsActive = false;
                session.EndTime ??= now;
                await _context.SaveChangesAsync();
            }

            return new SessionStatusResponse
            {
                SessionId = session.SessionId,
                IsActive = session.IsActive,
                IsExpired = isExpired,
                ExpiresAt = session.ExpiresAt,
                EndTime = session.EndTime,
                RemainingSeconds = remaining
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // END SESSION
        // ─────────────────────────────────────────────────────────────────────

        public async Task EndSessionAsync(Guid sessionId, Guid userId)
        {
            var userIdStr = userId.ToString();
            var session = await _context.VideoSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userIdStr)
                ?? throw new Exception("Session not found.");

            session.IsActive = false;
            session.EndTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // ─────────────────────────────────────────────────────────────────────
        // PRIVATE HELPERS
        // ─────────────────────────────────────────────────────────────────────

        private static VideoSessionResponse MapToResponse(VideoSession session) => new()
        {
            SessionId = session.SessionId,
            RoomUrl = session.RoomUrl,
            RoomName = session.RoomName,
            StartTime = session.StartTime,
            ExpiresAt = session.ExpiresAt,
            IsActive = session.IsActive,
            AmountPaid = session.AmountPaid,
            DurationMinutes = SessionDurationMinutes
        };
    }
}
