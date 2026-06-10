using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IVitalsTrackingService
    {
        Task TrackHumanVitalsInserted(Guid userId);
        Task TrackDogVitalsInserted(Guid dogId);
    }

    public class VitalsTrackingService : IVitalsTrackingService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<VitalsTrackingService> _logger;

        public VitalsTrackingService(AppDbContext context, ILogger<VitalsTrackingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task TrackHumanVitalsInserted(Guid userId)
        {
            try
            {
                // Check if this user's baseline tracking has been started
                var profile = await _context.HumanProfiles
                    .FirstOrDefaultAsync(h => h.UserId == userId);

                if (profile != null && !profile.BaselineStartTime.HasValue)
                {
                    // This is the first vitals record for this user
                    profile.BaselineStartTime = DateTime.UtcNow;
                    profile.UpdatedAt = DateTime.UtcNow;
                    
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Started baseline tracking for user {UserId} at {StartTime}", 
                        userId, profile.BaselineStartTime);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking human vitals insertion for user {UserId}", userId);
                // Don't rethrow - this is a tracking feature, not critical to vitals saving
            }
        }

        public async Task TrackDogVitalsInserted(Guid dogId)
        {
            try
            {
                // Check if this dog's baseline tracking has been started
                var profile = await _context.DogProfiles
                    .FirstOrDefaultAsync(d => d.Id == dogId);

                if (profile != null && !profile.BaselineStartTime.HasValue)
                {
                    // This is the first vitals record for this dog
                    profile.BaselineStartTime = DateTime.UtcNow;
                    profile.UpdatedAt = DateTime.UtcNow;
                    
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Started baseline tracking for dog {DogId} at {StartTime}", 
                        dogId, profile.BaselineStartTime);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking dog vitals insertion for dog {DogId}", dogId);
                // Don't rethrow - this is a tracking feature, not critical to vitals saving
            }
        }
    }
}