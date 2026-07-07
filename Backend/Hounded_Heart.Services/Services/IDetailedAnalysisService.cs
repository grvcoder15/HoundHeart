using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.DTOs;

namespace Hounded_Heart.Services.Services
{
    public interface IDetailedAnalysisService
    {
        Task<DetailedAnalysisReportDto> CreateAsync(Guid userId);
        Task<IEnumerable<DetailedAnalysisReportDto>> GetHistoryAsync(Guid userId);
        Task<DetailedAnalysisReportDto> GetByIdAsync(Guid userId, Guid id);
    }
}
