using System.Threading.Tasks;
using Hounded_Heart.Models.DTOs;

namespace Hounded_Heart.Services.Services
{
    public interface IFitbitService
    {
        /// <summary>
        /// Fetches real-time vitals and activity data from Fitbit API for baseline creation.
        /// Each field is fetched independently to ensure resilience.
        /// </summary>
        Task<RealTimeVitalsSnapshot> GetRealTimeVitalsAsync(string userId);
    }
}
