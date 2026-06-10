using Hounded_Heart.Models.DTOs;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IFitbitTokenService
    {
        /// <summary>
        /// Builds and returns the Fitbit authorization URL with PKCE
        /// </summary>
        /// <param name="userId">User ID to associate with the OAuth flow</param>
        /// <param name="state">State parameter for OAuth security</param>
        /// <returns>Fitbit authorization URL</returns>
        Task<string> GetAuthorizationUrlAsync(string userId, string state);

        /// <summary>
        /// Exchanges authorization code for access and refresh tokens
        /// </summary>
        /// <param name="code">Authorization code from Fitbit</param>
        /// <param name="state">State parameter used in the initial request</param>
        /// <returns>FitbitTokenResponse containing tokens</returns>
        Task<FitbitTokenResponse> ExchangeCodeForTokensAsync(string code, string state);

        /// <summary>
        /// Refreshes an expired access token using refresh token
        /// </summary>
        /// <param name="refreshToken">Refresh token</param>
        /// <returns>New FitbitTokenResponse with updated tokens</returns>
        Task<FitbitTokenResponse> RefreshAccessTokenAsync(string refreshToken);

        /// <summary>
        /// Checks if the stored access token for a user is expired
        /// </summary>
        /// <param name="userId">User ID to check</param>
        /// <returns>True if token is expired or doesn't exist</returns>
        Task<bool> IsTokenExpiredAsync(string userId);

        /// <summary>
        /// Saves Fitbit tokens for a user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="tokenResponse">Token response from Fitbit</param>
        Task SaveFitbitTokensAsync(string userId, FitbitTokenResponse tokenResponse);

        /// <summary>
        /// Gets valid access token for a user, refreshing if necessary
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Valid access token or null if unavailable</returns>
        Task<string?> GetValidAccessTokenAsync(string userId);
    }
}