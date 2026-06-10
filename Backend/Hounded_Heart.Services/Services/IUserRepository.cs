using Hounded_Heart.Models.Dtos;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IUserRepository
    {
        /// <summary>
        /// Gets a user by their ID
        /// </summary>
        /// <param name="userId">User ID (GUID as string)</param>
        /// <returns>User object or null if not found</returns>
        Task<User?> GetUserByIdAsync(string userId);

        /// <summary>
        /// Saves Fitbit access and refresh tokens for a user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="accessToken">Fitbit access token</param>
        /// <param name="refreshToken">Fitbit refresh token</param>
        /// <param name="expiresAt">When the access token expires</param>
        Task SaveFitbitTokensAsync(string userId, string accessToken, string refreshToken, DateTime expiresAt, string? fitbitUserId = null);

        /// <summary>
        /// Gets Fitbit tokens for a user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>Tuple of (accessToken, refreshToken, expiresAt) or null if not found</returns>
        Task<(string accessToken, string refreshToken, DateTime expiresAt)?> GetFitbitTokensAsync(string userId);

        /// <summary>
        /// Updates a user's information
        /// </summary>
        /// <param name="user">User object to update</param>
        Task UpdateUserAsync(User user);

        /// <summary>
        /// Gets all users who have connected Fitbit accounts
        /// </summary>
        /// <returns>List of users with valid Fitbit tokens</returns>
        Task<List<User>> GetAllFitbitConnectedUsersAsync();

        /// <summary>
        /// Gets all users with active Fitbit connections and established baselines
        /// </summary>
        /// <returns>List of users with Fitbit connections and baselines</returns>
        Task<List<User>> GetFitbitConnectedUsersWithBaselinesAsync();
    }
}