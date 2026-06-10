using System;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Services.Services
{
    public interface IPhase1ProfileService
    {
        Task<HumanProfile> CreateHumanProfileAsync(CreateHumanProfileDto dto);
        Task<HumanProfile?> GetHumanProfileAsync(Guid userId);
        
        Task<DogProfile> CreateDogProfileAsync(CreateDogProfileDto dto);
        Task<DogProfile?> GetDogProfileAsync(Guid userId);
    }
}
