using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(AppDbContext context, ILogger<UserRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                    return null;
                }

                return await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid && !u.IsDeleted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
                return null;
            }
        }

        public async Task<(string accessToken, string refreshToken, DateTime expiresAt)?> GetFitbitTokensAsync(string userId)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                    return null;
                }

                var user = await _context.Users
                    .Where(u => u.UserId == userGuid && !u.IsDeleted)
                    .Select(u => new { u.FitbitAccessToken, u.FitbitRefreshToken, u.FitbitTokenExpiresAt })
                    .FirstOrDefaultAsync();

                if (user?.FitbitAccessToken == null || user.FitbitRefreshToken == null || user.FitbitTokenExpiresAt == null)
                {
                    return null;
                }

                return (user.FitbitAccessToken, user.FitbitRefreshToken, user.FitbitTokenExpiresAt.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Fitbit tokens for user: {UserId}", userId);
                return null;
            }
        }

        public async Task SaveFitbitTokensAsync(string userId, string accessToken, string refreshToken, DateTime expiresAt, string? fitbitUserId = null)
        {
            try
            {
                if (!Guid.TryParse(userId, out var userGuid))
                {
                    _logger.LogWarning("Invalid user ID format: {UserId}", userId);
                    return;
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userGuid && !u.IsDeleted);
                if (user == null)
                {
                    _logger.LogWarning("User not found: {UserId}", userId);
                    return;
                }

                user.FitbitAccessToken = accessToken;
                user.FitbitRefreshToken = refreshToken;
                user.FitbitTokenExpiresAt = expiresAt;
                if (!string.IsNullOrEmpty(fitbitUserId))
                {
                    user.FitbitUserId = fitbitUserId;
                }
                user.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Fitbit tokens saved successfully for user: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving Fitbit tokens for user: {UserId}", userId);
                throw;
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            try
            {
                user.UpdatedOn = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                _logger.LogInformation("User updated successfully: {UserId}", user.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user: {UserId}", user.UserId);
                throw;
            }
        }

        public async Task<List<User>> GetAllFitbitConnectedUsersAsync()
        {
            try
            {
                return await _context.Users
                    .Where(u => !string.IsNullOrEmpty(u.FitbitAccessToken) && 
                               !string.IsNullOrEmpty(u.FitbitRefreshToken) && 
                               !u.IsDeleted && 
                               u.IsActive)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all Fitbit connected users");
                return new List<User>();
            }
        }

        public async Task<List<User>> GetFitbitConnectedUsersWithBaselinesAsync()
        {
            try
            {
                return await (from u in _context.Users
                              join h in _context.HumanProfiles on u.UserId equals h.UserId
                              where !string.IsNullOrEmpty(u.FitbitAccessToken) &&
                                    !string.IsNullOrEmpty(u.FitbitRefreshToken) &&
                                    h.HumanBaselineEstablished &&
                                    u.IsActive && !u.IsDeleted
                              select u).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Fitbit connected users with baselines");
                return new List<User>();
            }
        }
    }
}