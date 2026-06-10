using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.Models;

namespace Hounded_Heart.Services.Services
{
    public interface IPetPaceService
    {
        Task<DogVitals> GetLatestVitalsAsync(Guid dogId);
        Task<List<DogVitals>> GetHistoricalVitalsAsync(Guid dogId, int days);
    }

    public interface IAppleHealthService
    {
        Task<HumanVitals> GetLatestVitalsAsync(Guid userId);
        Task<List<HumanVitals>> GetHistoricalVitalsAsync(Guid userId, int days);
    }
}
