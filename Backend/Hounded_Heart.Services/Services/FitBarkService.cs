using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Security.Claims;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public class FitBarkService : IFitBarkService
    {
        private const string OobRedirectUri = "urn:ietf:wg:oauth:2.0:oob";
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FitBarkService> _logger;
        private readonly IMemoryCache _memoryCache;
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _configuredAccessToken;
        private readonly string _baseUrl;
        private readonly string _tokenUrl;
        private readonly string _authUrl;
        private readonly string _redirectUri;
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _scope;
        private Guid? _tokenOwnerUserId;
        private string? _oauthAccessToken;
        private string? _oauthRefreshToken;
        private DateTime _oauthAccessTokenExpiresUtc = DateTime.MinValue;
        private string? _dynamicAccessToken;
        private DateTime _dynamicAccessTokenExpiresUtc = DateTime.MinValue;

        public FitBarkService(IHttpClientFactory httpClientFactory, IConfiguration configuration, IMemoryCache memoryCache, AppDbContext context, IHttpContextAccessor httpContextAccessor, ILogger<FitBarkService> logger)
        {
            _configuration = configuration;
            _memoryCache = memoryCache;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            
            _configuredAccessToken = _configuration["FitBark:AccessToken"] ?? "";
            _baseUrl = _configuration["FitBark:BaseUrl"] ?? "https://app.fitbark.com/api/v2";
            _tokenUrl = _configuration["FitBark:TokenUrl"] ?? "https://app.fitbark.com/oauth/token";
            _authUrl = _configuration["FitBark:AuthUrl"] ?? "https://app.fitbark.com/oauth/authorize";
            _redirectUri = _configuration["FitBark:RedirectUri"] ?? "";
            _clientId = _configuration["FitBark:ClientId"] ?? "";
            _clientSecret = _configuration["FitBark:ClientSecret"] ?? "";
            _scope = _configuration["FitBark:Scope"] ?? "";

            if (!string.IsNullOrEmpty(_configuredAccessToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuredAccessToken);
            }
        }

        public Task<string> GetAuthorizationUrlAsync()
        {
            if (string.IsNullOrWhiteSpace(_clientId) || string.IsNullOrWhiteSpace(_authUrl) || string.IsNullOrWhiteSpace(_redirectUri))
            {
                throw new InvalidOperationException("FitBark OAuth configuration is incomplete. ClientId, AuthUrl, and RedirectUri are required.");
            }

            var state = Guid.NewGuid().ToString("N");
            if (!IsOutOfBandRedirectUri())
            {
                _memoryCache.Set($"fitbark_oauth_state_{state}", true, TimeSpan.FromMinutes(10));
            }

            var query = $"client_id={Uri.EscapeDataString(_clientId)}" +
                        $"&response_type=code" +
                        $"&redirect_uri={Uri.EscapeDataString(_redirectUri)}";

            if (!IsOutOfBandRedirectUri())
            {
                query += $"&state={Uri.EscapeDataString(state)}";
            }

            if (!string.IsNullOrWhiteSpace(_scope))
            {
                query += $"&scope={Uri.EscapeDataString(_scope)}";
            }

            return Task.FromResult($"{_authUrl}?{query}");
        }

        public async Task<bool> ExchangeCodeForTokensAsync(string code, string? state)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return false;
            }

            if (!IsOutOfBandRedirectUri())
            {
                if (string.IsNullOrWhiteSpace(state))
                {
                    _logger.LogWarning("FitBark OAuth callback missing state for non-OOB flow.");
                    return false;
                }

                if (!_memoryCache.TryGetValue($"fitbark_oauth_state_{state}", out bool _))
                {
                    _logger.LogWarning("FitBark OAuth callback received invalid or expired state: {State}", state);
                    return false;
                }

                _memoryCache.Remove($"fitbark_oauth_state_{state}");
            }

            if (string.IsNullOrWhiteSpace(_clientId) || string.IsNullOrWhiteSpace(_clientSecret) || string.IsNullOrWhiteSpace(_redirectUri))
            {
                _logger.LogError("FitBark OAuth token exchange failed due to missing config values.");
                return false;
            }

            var requestPayload = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["code"] = code,
                ["redirect_uri"] = _redirectUri
            };

            if (!string.IsNullOrWhiteSpace(_scope))
            {
                requestPayload["scope"] = _scope;
            }

            var request = new HttpRequestMessage(HttpMethod.Post, _tokenUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("FitBark OAuth code exchange failed: {StatusCode} - {Content}", response.StatusCode, responseBody);
                return false;
            }

            using var json = JsonDocument.Parse(responseBody);
            if (!json.RootElement.TryGetProperty("access_token", out var accessTokenElement))
            {
                _logger.LogError("FitBark OAuth response missing access_token.");
                return false;
            }

            _oauthAccessToken = accessTokenElement.GetString();
            _oauthRefreshToken = json.RootElement.TryGetProperty("refresh_token", out var refreshTokenElement)
                ? refreshTokenElement.GetString()
                : null;

            _logger.LogInformation("FitBark OAuth exchange completed. Refresh token returned: {HasRefreshToken}", !string.IsNullOrWhiteSpace(_oauthRefreshToken));

            var expiresInSeconds = json.RootElement.TryGetProperty("expires_in", out var expiresInElement)
                ? Math.Max(60, expiresInElement.GetInt32())
                : 3600;

            _oauthAccessTokenExpiresUtc = DateTime.UtcNow.AddSeconds(expiresInSeconds - 60);
            await SaveOAuthTokensToDatabaseAsync();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _oauthAccessToken);

            return !string.IsNullOrWhiteSpace(_oauthAccessToken);
        }

        private bool IsOutOfBandRedirectUri()
        {
            return string.Equals(_redirectUri?.Trim(), OobRedirectUri, StringComparison.OrdinalIgnoreCase);
        }

        public bool IsConnected()
        {
            if (!string.IsNullOrWhiteSpace(_configuredAccessToken))
            {
                return true;
            }

            LoadOAuthTokensFromDatabase();

            return !string.IsNullOrWhiteSpace(_oauthAccessToken) && DateTime.UtcNow < _oauthAccessTokenExpiresUtc;
        }

        public void Disconnect()
        {
            _oauthAccessToken = null;
            _oauthRefreshToken = null;
            _oauthAccessTokenExpiresUtc = DateTime.MinValue;
            ClearOAuthTokensFromDatabase();

            if (!string.IsNullOrWhiteSpace(_configuredAccessToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuredAccessToken);
            }
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = null;
            }
        }

        private async Task<bool> TryRefreshOAuthAccessTokenAsync()
        {
            if (string.IsNullOrWhiteSpace(_oauthRefreshToken) || string.IsNullOrWhiteSpace(_clientId) || string.IsNullOrWhiteSpace(_clientSecret))
            {
                return false;
            }

            var requestPayload = new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["refresh_token"] = _oauthRefreshToken
            };

            if (!string.IsNullOrWhiteSpace(_scope))
            {
                requestPayload["scope"] = _scope;
            }

            var request = new HttpRequestMessage(HttpMethod.Post, _tokenUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("FitBark OAuth token refresh failed: {StatusCode} - {Content}", response.StatusCode, responseBody);
                return false;
            }

            using var json = JsonDocument.Parse(responseBody);
            if (!json.RootElement.TryGetProperty("access_token", out var accessTokenElement))
            {
                return false;
            }

            _oauthAccessToken = accessTokenElement.GetString();
            if (json.RootElement.TryGetProperty("refresh_token", out var refreshTokenElement))
            {
                _oauthRefreshToken = refreshTokenElement.GetString();
            }

            var expiresInSeconds = json.RootElement.TryGetProperty("expires_in", out var expiresInElement)
                ? Math.Max(60, expiresInElement.GetInt32())
                : 3600;

            _oauthAccessTokenExpiresUtc = DateTime.UtcNow.AddSeconds(expiresInSeconds - 60);
            await SaveOAuthTokensToDatabaseAsync();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _oauthAccessToken);

            return !string.IsNullOrWhiteSpace(_oauthAccessToken);
        }

        private async Task<bool> EnsureAccessTokenAsync()
        {
            if (!string.IsNullOrWhiteSpace(_configuredAccessToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuredAccessToken);
                return true;
            }

            await LoadOAuthTokensFromDatabaseAsync();

            if (!string.IsNullOrWhiteSpace(_oauthAccessToken) && DateTime.UtcNow < _oauthAccessTokenExpiresUtc)
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _oauthAccessToken);
                return true;
            }

            if (await TryRefreshOAuthAccessTokenAsync())
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(_dynamicAccessToken) && DateTime.UtcNow < _dynamicAccessTokenExpiresUtc)
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _dynamicAccessToken);
                return true;
            }

            if (string.IsNullOrWhiteSpace(_clientId) || string.IsNullOrWhiteSpace(_clientSecret))
            {
                _logger.LogError("FitBark credentials are missing. Configure FitBark:ClientId and FitBark:ClientSecret.");
                return false;
            }

            var requestPayload = new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret
            };

            if (!string.IsNullOrWhiteSpace(_scope))
            {
                requestPayload["scope"] = _scope;
            }

            var request = new HttpRequestMessage(HttpMethod.Post, _tokenUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(requestPayload), Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("FitBark token request failed: {StatusCode} - {Content}", response.StatusCode, responseBody);
                return false;
            }

            using var json = JsonDocument.Parse(responseBody);
            if (!json.RootElement.TryGetProperty("access_token", out var accessTokenElement))
            {
                _logger.LogError("FitBark token response missing access_token.");
                return false;
            }

            _dynamicAccessToken = accessTokenElement.GetString() ?? string.Empty;
            var expiresInSeconds = json.RootElement.TryGetProperty("expires_in", out var expiresInElement)
                ? Math.Max(60, expiresInElement.GetInt32())
                : 3600;

            _dynamicAccessTokenExpiresUtc = DateTime.UtcNow.AddSeconds(expiresInSeconds - 60);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _dynamicAccessToken);
            return !string.IsNullOrWhiteSpace(_dynamicAccessToken);
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }

        private async Task SaveOAuthTokensToDatabaseAsync()
        {
            var userId = GetCurrentUserId() ?? _tokenOwnerUserId;
            if (!userId.HasValue || string.IsNullOrWhiteSpace(_oauthAccessToken))
            {
                return;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId.Value);
            if (user == null)
            {
                return;
            }

            user.FitBarkAccessToken = _oauthAccessToken;
            user.FitBarkRefreshToken = _oauthRefreshToken;
            user.FitBarkTokenExpiresAt = _oauthAccessTokenExpiresUtc;

            if (string.IsNullOrWhiteSpace(user.FitBarkUserId))
            {
                try
                {
                    var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/user");
                    userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _oauthAccessToken);
                    var userInfoResponse = await _httpClient.SendAsync(userInfoRequest);
                    if (userInfoResponse.IsSuccessStatusCode)
                    {
                        var userInfoBody = await userInfoResponse.Content.ReadAsStringAsync();
                        var userInfoJson = JsonSerializer.Deserialize<FitBarkUserInfoResponse>(userInfoBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        if (!string.IsNullOrWhiteSpace(userInfoJson?.User?.Slug))
                            user.FitBarkUserId = userInfoJson.User.Slug;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "FitBark: Could not fetch user slug during token save.");
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task LoadOAuthTokensFromDatabaseAsync()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                var fallbackUser = await _context.Users
                    .AsNoTracking()
                    .Where(u => !string.IsNullOrWhiteSpace(u.FitBarkAccessToken) || !string.IsNullOrWhiteSpace(u.FitBarkRefreshToken))
                    .OrderByDescending(u => u.FitBarkTokenExpiresAt)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FitBarkAccessToken,
                        u.FitBarkRefreshToken,
                        u.FitBarkTokenExpiresAt
                    })
                    .FirstOrDefaultAsync();

                _tokenOwnerUserId = fallbackUser?.UserId;
                _oauthAccessToken = fallbackUser?.FitBarkAccessToken;
                _oauthRefreshToken = fallbackUser?.FitBarkRefreshToken;
                _oauthAccessTokenExpiresUtc = fallbackUser?.FitBarkTokenExpiresAt ?? DateTime.MinValue;

                if (_tokenOwnerUserId.HasValue)
                {
                    _logger.LogInformation("FitBark: Loaded OAuth token from fallback user {UserId} for background operation.", _tokenOwnerUserId);
                }

                return;
            }

            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == userId.Value)
                .Select(u => new { u.FitBarkAccessToken, u.FitBarkRefreshToken, u.FitBarkTokenExpiresAt })
                .FirstOrDefaultAsync();

            _tokenOwnerUserId = userId;
            _oauthAccessToken = user?.FitBarkAccessToken;
            _oauthRefreshToken = user?.FitBarkRefreshToken;
            _oauthAccessTokenExpiresUtc = user?.FitBarkTokenExpiresAt ?? DateTime.MinValue;
        }

        private void LoadOAuthTokensFromDatabase()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                var fallbackUser = _context.Users
                    .AsNoTracking()
                    .Where(u => !string.IsNullOrWhiteSpace(u.FitBarkAccessToken) || !string.IsNullOrWhiteSpace(u.FitBarkRefreshToken))
                    .OrderByDescending(u => u.FitBarkTokenExpiresAt)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FitBarkAccessToken,
                        u.FitBarkRefreshToken,
                        u.FitBarkTokenExpiresAt
                    })
                    .FirstOrDefault();

                _tokenOwnerUserId = fallbackUser?.UserId;
                _oauthAccessToken = fallbackUser?.FitBarkAccessToken;
                _oauthRefreshToken = fallbackUser?.FitBarkRefreshToken;
                _oauthAccessTokenExpiresUtc = fallbackUser?.FitBarkTokenExpiresAt ?? DateTime.MinValue;
                return;
            }

            var user = _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == userId.Value)
                .Select(u => new { u.FitBarkAccessToken, u.FitBarkRefreshToken, u.FitBarkTokenExpiresAt })
                .FirstOrDefault();

            _tokenOwnerUserId = userId;
            _oauthAccessToken = user?.FitBarkAccessToken;
            _oauthRefreshToken = user?.FitBarkRefreshToken;
            _oauthAccessTokenExpiresUtc = user?.FitBarkTokenExpiresAt ?? DateTime.MinValue;
        }

        private void ClearOAuthTokensFromDatabase()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return;
            }

            var user = _context.Users.FirstOrDefault(u => u.UserId == userId.Value);
            if (user == null)
            {
                return;
            }

            user.FitBarkAccessToken = null;
            user.FitBarkRefreshToken = null;
            user.FitBarkTokenExpiresAt = null;
            user.FitBarkUserId = null;
            _context.SaveChanges();
        }

        private async Task<(HttpStatusCode StatusCode, string Content)> SendAsyncWithAuthRetry(Func<HttpRequestMessage> requestFactory, string operationName)
        {
            var response = await _httpClient.SendAsync(requestFactory());
            var content = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == HttpStatusCode.Unauthorized)
            {
                _logger.LogWarning("FitBark: Unauthorized response during {Operation}. Attempting token refresh retry.", operationName);

                if (await TryRefreshOAuthAccessTokenAsync())
                {
                    response = await _httpClient.SendAsync(requestFactory());
                    content = await response.Content.ReadAsStringAsync();
                }
            }

            return (response.StatusCode, content);
        }

        private T? DeserializeResponse<T>(string content)
        {
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        private JsonElement? ParseRawJson(string content)
        {
            using var document = JsonDocument.Parse(content);
            return document.RootElement.Clone();
        }

        public async Task<FitBarkUserProfile?> GetUserInfoAsync()
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/user";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), nameof(GetUserInfoAsync));
                if (statusCode == HttpStatusCode.Unauthorized)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error during {Operation}: {StatusCode} - {Content}", nameof(GetUserInfoAsync), statusCode, content);
                    return null;
                }

                return DeserializeResponse<FitBarkUserInfoResponse>(content)?.User;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetUserInfoAsync");
                return null;
            }
        }

        public async Task<List<FitBarkDogProfile>?> GetDogProfilesAsync()
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/dog_relations";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), nameof(GetDogProfilesAsync));
                _logger.LogInformation("FitBark Response Status: {StatusCode}", statusCode);

                if (statusCode == HttpStatusCode.Unauthorized)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error: {StatusCode} - {Content}", statusCode, content);
                    return null;
                }

                var result = DeserializeResponse<FitBarkDogRelationResponse>(content);
                return result?.DogRelations?.Select(r => r.Dog).ToList() ?? new List<FitBarkDogProfile>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetDogProfilesAsync");
                return null;
            }
        }

        public async Task<FitBarkDogInfo?> GetDogInfoAsync(string dogSlug)
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/dog/{dogSlug}";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), nameof(GetDogInfoAsync));
                if (statusCode == HttpStatusCode.Unauthorized || statusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error during {Operation}: {StatusCode} - {Content}", nameof(GetDogInfoAsync), statusCode, content);
                    return null;
                }

                return DeserializeResponse<FitBarkDogInfoResponse>(content)?.Dog;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetDogInfoAsync");
                return null;
            }
        }

        public async Task<List<FitBarkUserRelation>?> GetDogRelatedUsersAsync(string dogSlug)
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/user_relations/{dogSlug}";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), nameof(GetDogRelatedUsersAsync));
                if (statusCode == HttpStatusCode.Unauthorized || statusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error during {Operation}: {StatusCode} - {Content}", nameof(GetDogRelatedUsersAsync), statusCode, content);
                    return null;
                }

                return DeserializeResponse<FitBarkUserRelationsResponse>(content)?.UserRelations ?? new List<FitBarkUserRelation>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetDogRelatedUsersAsync");
                return null;
            }
        }

        public async Task<List<FitBarkActivityRecord>?> GetDailyActivityAsync(string dogSlug, string fromDate, string toDate, string resolution = "DAILY")
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/activity_series";
                var requestedResolution = string.IsNullOrWhiteSpace(resolution) ? "DAILY" : resolution.ToUpperInvariant();
                var requestBody = new
                {
                    activity_series = new
                    {
                        slug = dogSlug,
                        from = fromDate,
                        to = toDate,
                        resolution = requestedResolution
                    }
                };

                var jsonRequest = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation("FitBark: POST {Url} with Body {Body}", url, jsonRequest);

                var (statusCode, contentResponse) = await SendAsyncWithAuthRetry(
                    () => new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json")
                    },
                    nameof(GetDailyActivityAsync));

                _logger.LogInformation("FitBark Response Status: {StatusCode}", statusCode);

                // FitBark can reject MINUTE/HOURLY windows for some accounts/apps.
                // Retry with DAILY + date-only window so polling still gets usable activity data.
                if (statusCode == HttpStatusCode.BadRequest && requestedResolution != "DAILY")
                {
                    var fallbackFrom = ToDateOnly(fromDate, DateTime.UtcNow.AddDays(-1));
                    var fallbackTo = ToDateOnly(toDate, DateTime.UtcNow);

                    var fallbackBody = new
                    {
                        activity_series = new
                        {
                            slug = dogSlug,
                            from = fallbackFrom,
                            to = fallbackTo,
                            resolution = "DAILY"
                        }
                    };

                    var fallbackJson = JsonSerializer.Serialize(fallbackBody);
                    _logger.LogWarning(
                        "FitBark activity_series returned BadRequest for resolution {Resolution}. Retrying with DAILY window {FromDate} to {ToDate}.",
                        requestedResolution,
                        fallbackFrom,
                        fallbackTo);

                    (statusCode, contentResponse) = await SendAsyncWithAuthRetry(
                        () => new HttpRequestMessage(HttpMethod.Post, url)
                        {
                            Content = new StringContent(fallbackJson, Encoding.UTF8, "application/json")
                        },
                        nameof(GetDailyActivityAsync));

                    _logger.LogInformation("FitBark fallback Response Status: {StatusCode}", statusCode);
                }

                if (statusCode == HttpStatusCode.Unauthorized)
                {
                    _logger.LogWarning("FitBark: Token expired or invalid");
                    return null;
                }

                if (statusCode == HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("FitBark: Dog not found for slug {Slug}", dogSlug);
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError(
                        "FitBark API Error: {StatusCode} - {Content}. RequestContext: slug={DogSlug}, from={FromDate}, to={ToDate}, resolution={Resolution}",
                        statusCode,
                        contentResponse,
                        dogSlug,
                        fromDate,
                        toDate,
                        requestedResolution);
                    return null;
                }

                var result = DeserializeResponse<FitBarkActivitySeriesResponse>(contentResponse);
                return result?.ActivitySeries?.Records ?? new List<FitBarkActivityRecord>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetDailyActivityAsync");
                return null;
            }
        }

        private static string ToDateOnly(string input, DateTime fallbackUtc)
        {
            if (DateTime.TryParse(input, out var parsed))
            {
                var utc = parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
                return utc.ToString("yyyy-MM-dd");
            }

            return fallbackUtc.ToString("yyyy-MM-dd");
        }

        public async Task<JsonElement?> GetActivityTotalsAsync(string dogSlug, string fromDate, string toDate)
        {
            return await PostSeriesRequestAsync("activity_totals", dogSlug, fromDate, toDate, nameof(GetActivityTotalsAsync));
        }

        public async Task<JsonElement?> GetTimeBreakdownAsync(string dogSlug, string fromDate, string toDate)
        {
            return await PostSeriesRequestAsync("time_breakdown", dogSlug, fromDate, toDate, nameof(GetTimeBreakdownAsync));
        }

        public async Task<JsonElement?> GetSimilarDogsStatsAsync(string dogSlug, string fromDate, string toDate)
        {
            return await PostSeriesRequestAsync("similar_dogs_stats", dogSlug, fromDate, toDate, nameof(GetSimilarDogsStatsAsync));
        }

        public async Task<FitBarkDailyGoal?> GetDailyGoalAsync(string dogSlug)
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/daily_goal/{dogSlug}";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), nameof(GetDailyGoalAsync));
                _logger.LogInformation("FitBark Response Status: {StatusCode}", statusCode);

                if (statusCode == HttpStatusCode.Unauthorized)
                {
                    _logger.LogWarning("FitBark: Token expired or invalid");
                    return null;
                }

                if (statusCode == HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("FitBark: Dog not found for slug {Slug}", dogSlug);
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error: {StatusCode} - {Content}", statusCode, content);
                    return null;
                }

                return DeserializeResponse<FitBarkDailyGoal>(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in GetDailyGoalAsync");
                return null;
            }
        }

        public async Task<FitBarkImageResponse?> GetDogPictureAsync(string dogSlug)
        {
            return await GetImageAsync($"picture/dog/{dogSlug}", nameof(GetDogPictureAsync));
        }

        public async Task<FitBarkImageResponse?> GetUserPictureAsync(string userSlug)
        {
            return await GetImageAsync($"picture/user/{userSlug}", nameof(GetUserPictureAsync));
        }

        private async Task<FitBarkImageResponse?> GetImageAsync(string relativePath, string operationName)
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/{relativePath}";
                _logger.LogInformation("FitBark: GET {Url}", url);

                var (statusCode, content) = await SendAsyncWithAuthRetry(() => new HttpRequestMessage(HttpMethod.Get, url), operationName);
                if (statusCode == HttpStatusCode.Unauthorized || statusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error during {Operation}: {StatusCode} - {Content}", operationName, statusCode, content);
                    return null;
                }

                return DeserializeResponse<FitBarkImageResponse>(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in {Operation}", operationName);
                return null;
            }
        }

        private async Task<JsonElement?> PostSeriesRequestAsync(string endpoint, string dogSlug, string fromDate, string toDate, string operationName)
        {
            try
            {
                if (!await EnsureAccessTokenAsync())
                {
                    return null;
                }

                var url = $"{_baseUrl}/{endpoint}";
                // Note: activity_totals, time_breakdown, similar_dogs_stats endpoints don't accept resolution parameter
                // They return aggregated/summary data, not time-series
                var requestBody = JsonSerializer.Serialize(new
                {
                    activity_series = new
                    {
                        slug = dogSlug,
                        from = fromDate,
                        to = toDate
                    }
                });

                _logger.LogInformation("FitBark: POST {Url} with Body {Body}", url, requestBody);

                var (statusCode, content) = await SendAsyncWithAuthRetry(
                    () => new HttpRequestMessage(HttpMethod.Post, url)
                    {
                        Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
                    },
                    operationName);

                if (statusCode == HttpStatusCode.Unauthorized || statusCode == HttpStatusCode.NotFound)
                {
                    return null;
                }

                if (statusCode != HttpStatusCode.OK)
                {
                    _logger.LogError("FitBark API Error during {Operation}: {StatusCode} - {Content}", operationName, statusCode, content);
                    return null;
                }

                return ParseRawJson(content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FitBark: Exception in {Operation}", operationName);
                return null;
            }
        }
    }
}
