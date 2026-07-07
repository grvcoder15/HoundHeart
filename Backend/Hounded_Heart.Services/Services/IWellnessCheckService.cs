using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.DTOs;

namespace Hounded_Heart.Services.Services
{
    public interface IWellnessCheckService
    {
        Task<WellnessCheckResponseDto> SubmitAsync(Guid userId, WellnessCheckCreateDto dto, bool isSubscribed = false);
        Task<IEnumerable<WellnessCheckResponseDto>> GetHistoryAsync(Guid userId);
        Task<WellnessCheckResponseDto> GetByIdAsync(Guid userId, Guid checkId);
        Task DeleteAsync(Guid userId, Guid checkId);
    }
}
