using Hounded_Heart.Models.DTOs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;

namespace Hounded_Heart.Services.Services
{
    public class FitbitTokenService : IFitbitTokenService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;
        private readonly IUserRepository _userRepository;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<FitbitTokenService> _logger;

        public FitbitTokenService(
            HttpClient httpClient,
            IConfiguration configuration,
            IMemoryCache memoryCache,
            IUserRepository userRepository,
            IServiceScopeFactory scopeFactory,
            ILogger<FitbitTokenService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _memoryCache = memoryCache;
            _userRepository = userRepository;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task<string> GetAuthorizationUrlAsync(string userId, string state)
        {
            try
            {
                var clientId = _configuration["Fitbit:ClientId"];
                var redirectUri = _configuration["Fitbit:RedirectUri"];
                var authUrl = _configuration["Fitbit:AuthUrl"];

                if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(redirectUri) || string.IsNullOrEmpty(authUrl))
                {
                    throw new InvalidOperationException("Fitbit configuration is missing required values");
                }

                // Generate PKCE code verifier and challenge
                var codeVerifier = GenerateCodeVerifier();
                var codeChallenge = GenerateCodeChallenge(codeVerifier);

                // Store code verifier in cache keyed by state (expires in 10 minutes)
                var cacheKey = $"fitbit_code_verifier_{state}";
                _memoryCache.Set(cacheKey, codeVerifier, TimeSpan.FromMinutes(10));

                // Store user ID associated with this state for later retrieval
                var userCacheKey = $"fitbit_user_id_{state}";
                _memoryCache.Set(userCacheKey, userId, TimeSpan.FromMinutes(10));

                // Build authorization URL
                var queryParams = HttpUtility.ParseQueryString(string.Empty);
                queryParams["client_id"] = clientId;
                queryParams["response_type"] = "code";
                queryParams["scope"] = "heartrate activity sleep profile weight temperature respiratory_rate oxygen_saturation";
                queryParams["redirect_uri"] = redirectUri;
                queryParams["state"] = state;
                queryParams["code_challenge"] = codeChallenge;
                queryParams["code_challenge_method"] = "S256";
                queryParams["prompt"] = "login consent";

                var authorizationUrl = $"{authUrl}?{queryParams}";

                _logger.LogInformation("Generated Fitbit authorization URL for user {UserId} with state {State}", userId, state);
                return authorizationUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Fitbit authorization URL for user {UserId}", userId);
                throw;
            }
        }

        public async Task<FitbitTokenResponse> ExchangeCodeForTokensAsync(string code, string state)
        {
            try
            {
                var tokenUrl = _configuration["Fitbit:TokenUrl"];
                var clientId = _configuration["Fitbit:ClientId"];
                var clientSecret = _configuration["Fitbit:ClientSecret"];
                var redirectUri = _configuration["Fitbit:RedirectUri"];

                if (string.IsNullOrEmpty(tokenUrl) || string.IsNullOrEmpty(clientId) || 
                    string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
                {
                    throw new InvalidOperationException("Fitbit configuration is missing required values");
                }

                // Retrieve code verifier from cache
                var cacheKey = $"fitbit_code_verifier_{state}";
                if (!_memoryCache.TryGetValue(cacheKey, out string? codeVerifier))
                {
                    throw new InvalidOperationException("Code verifier not found or expired");
                }

                // Retrieve user ID from cache
                var userCacheKey = $"fitbit_user_id_{state}";
                if (!_memoryCache.TryGetValue(userCacheKey, out string? userId))
                {
                    throw new InvalidOperationException("User ID not found for the given state");
                }

                // Prepare request
                var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);

                // Set Basic authentication header
                var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);

                // Set form data
                var formData = new List<KeyValuePair<string, string>>
                {
                    new("client_id", clientId),
                    new("grant_type", "authorization_code"),
                    new("code", code),
                    new("redirect_uri", redirectUri),
                    new("code_verifier", codeVerifier!)
                };

                request.Content = new FormUrlEncodedContent(formData);

                // Make request
                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Fitbit token exchange failed with status {StatusCode}: {ResponseContent}", 
                        response.StatusCode, responseContent);
                    throw new HttpRequestException($"Fitbit token exchange failed: {response.StatusCode}. Details: {responseContent}");
                }

                var tokenResponse = JsonSerializer.Deserialize<FitbitTokenResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (tokenResponse == null)
                {
                    throw new InvalidOperationException("Failed to deserialize Fitbit token response");
                }

                // Save tokens to database
                await SaveFitbitTokensAsync(userId!, tokenResponse);

                // Initialize Baseline tracking in HumanProfile
                using (var scope = _scopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<Hounded_Heart.Models.Data.AppDbContext>();
                    var profile = await context.HumanProfiles.FirstOrDefaultAsync(p => p.UserId == Guid.Parse(userId!));
                    if (profile != null && !profile.BaselineStartTime.HasValue)
                    {
                        profile.BaselineStartTime = DateTime.UtcNow;
                        profile.HumanBaselineEstablished = false;
                        profile.UpdatedAt = DateTime.UtcNow;
                        await context.SaveChangesAsync();
                        _logger.LogInformation("Initialized HumanProfile BaselineStartTime for user {UserId}", userId);
                    }
                    else if (profile != null)
                    {
                        _logger.LogInformation(
                            "Preserved existing HumanProfile BaselineStartTime for user {UserId}: {BaselineStartTime}",
                            userId,
                            profile.BaselineStartTime);
                    }
                }

                // Clean up cache entries
                _memoryCache.Remove(cacheKey);
                _memoryCache.Remove(userCacheKey);

                _logger.LogInformation("Successfully exchanged authorization code for tokens for user {UserId}", userId);
                return tokenResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exchanging code for tokens: {Code}, {State}", code, state);
                throw;
            }
        }

        public async Task<FitbitTokenResponse> RefreshAccessTokenAsync(string refreshToken)
        {
            try
            {
                var tokenUrl = _configuration["Fitbit:TokenUrl"];
                var clientId = _configuration["Fitbit:ClientId"];
                var clientSecret = _configuration["Fitbit:ClientSecret"];

                if (string.IsNullOrEmpty(tokenUrl) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                {
                    throw new InvalidOperationException("Fitbit configuration is missing required values");
                }

                // Prepare request
                var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);

                // Set Basic authentication header
                var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);

                // Set form data
                var formData = new List<KeyValuePair<string, string>>
                {
                    new("grant_type", "refresh_token"),
                    new("refresh_token", refreshToken)
                };

                request.Content = new FormUrlEncodedContent(formData);

                // Make request
                var response = await _httpClient.SendAsync(request);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Fitbit token refresh failed with status {StatusCode}: {ResponseContent}", 
                        response.StatusCode, responseContent);
                    throw new HttpRequestException($"Fitbit token refresh failed: {response.StatusCode}");
                }

                var tokenResponse = JsonSerializer.Deserialize<FitbitTokenResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (tokenResponse == null)
                {
                    throw new InvalidOperationException("Failed to deserialize Fitbit token response");
                }

                _logger.LogInformation("Successfully refreshed Fitbit access token");
                return tokenResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing access token");
                throw;
            }
        }

        public async Task<bool> IsTokenExpiredAsync(string userId)
        {
            try
            {
                var tokens = await _userRepository.GetFitbitTokensAsync(userId);
                if (tokens == null)
                {
                    return true; // No tokens found, consider expired
                }

                // Check if token expires within 5 minutes (buffer)
                return DateTime.UtcNow >= tokens.Value.expiresAt.AddMinutes(-5);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if token is expired for user {UserId}", userId);
                return true; // Assume expired on error
            }
        }

        public async Task SaveFitbitTokensAsync(string userId, FitbitTokenResponse tokenResponse)
        {
            try
            {
                var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
                await _userRepository.SaveFitbitTokensAsync(userId, tokenResponse.AccessToken, 
                    tokenResponse.RefreshToken, expiresAt);

                _logger.LogInformation("Fitbit tokens saved for user {UserId}, expires at {ExpiresAt}", userId, expiresAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving Fitbit tokens for user {UserId}", userId);
                throw;
            }
        }

        public async Task<string?> GetValidAccessTokenAsync(string userId)
        {
            try
            {
                var tokens = await _userRepository.GetFitbitTokensAsync(userId);
                if (tokens == null)
                {
                    _logger.LogWarning("No Fitbit tokens found for user {UserId}", userId);
                    return null;
                }

                // Check if token is expired
                if (DateTime.UtcNow >= tokens.Value.expiresAt.AddMinutes(-5))
                {
                    _logger.LogInformation("Access token expired for user {UserId}, attempting refresh", userId);
                    
                    try
                    {
                        var newTokens = await RefreshAccessTokenAsync(tokens.Value.refreshToken);
                        await SaveFitbitTokensAsync(userId, newTokens);
                        _logger.LogInformation("Token refreshed for userId: {userId} at {time}", userId, DateTime.UtcNow);
                        return newTokens.AccessToken;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to refresh token for user {UserId}", userId);
                        return null;
                    }
                }

                return tokens.Value.accessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting valid access token for user {UserId}", userId);
                return null;
            }
        }

        private static string GenerateCodeVerifier()
        {
            // Generate a cryptographically random 32-byte array (results in ~43 chars Base64url)
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            // Base64url encode the random bytes (remove padding and make URL-safe)
            return Convert.ToBase64String(randomBytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static string GenerateCodeChallenge(string codeVerifier)
        {
            // Create SHA256 hash of the code verifier
            using var sha256 = SHA256.Create();
            var challengeBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(codeVerifier));
            
            // Base64url encode the hash (remove padding and make URL-safe)
            return Convert.ToBase64String(challengeBytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }
    }
}