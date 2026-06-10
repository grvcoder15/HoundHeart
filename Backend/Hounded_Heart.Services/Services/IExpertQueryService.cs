using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.Dtos;

namespace Hounded_Heart.Services.Services
{
    public interface IExpertQueryService
    {
        Task<ExpertQueryResponseDto> SubmitQueryAsync(Guid userId, ExpertQueryCreateDto dto);
        Task<IEnumerable<ExpertQueryResponseDto>> GetUserQueriesAsync(Guid userId);
        Task<bool> DeleteUserQueryAsync(Guid userId, Guid queryId);
        Task<IEnumerable<ExpertQueryCategoryDto>> GetCategoriesAsync();

        // Admin Endpoints
        Task<IEnumerable<ExpertQueryResponseDto>> GetAllQueriesAsync();
        Task<bool> RespondToQueryAsync(Guid queryId, ExpertQueryAdminUpdateDto dto);
    }
}
