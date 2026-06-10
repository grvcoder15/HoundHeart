using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public class ExpertQueryService : IExpertQueryService
    {
        private readonly AppDbContext _context;

        public ExpertQueryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExpertQueryResponseDto> SubmitQueryAsync(Guid userId, ExpertQueryCreateDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                throw new Exception("User not found.");
            }

            if (!user.IsPremium && dto.Priority.Equals("High Priority", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Upgrade to Premium to select High Priority.");
            }

            var expertQuery = new ExpertQuery
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CompanionName = dto.CompanionName,
                Category = dto.Category,
                Priority = dto.Priority,
                Subject = dto.Subject,
                QuestionText = dto.QuestionText,
            };

            _context.ExpertQueries.Add(expertQuery);
            await _context.SaveChangesAsync();

            return MapToDto(expertQuery);
        }

        public async Task<IEnumerable<ExpertQueryResponseDto>> GetUserQueriesAsync(Guid userId)
        {
            var queries = await _context.ExpertQueries
                .Where(q => q.UserId == userId && !q.IsDeleted)
                .OrderByDescending(q => q.CreatedOn)
                .ToListAsync();

            return queries.Select(MapToDto);
        }

        public async Task<bool> DeleteUserQueryAsync(Guid userId, Guid queryId)
        {
            var query = await _context.ExpertQueries
                .FirstOrDefaultAsync(q => q.Id == queryId && q.UserId == userId && !q.IsDeleted);

            if (query == null) return false;

            query.IsDeleted = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ExpertQueryResponseDto>> GetAllQueriesAsync()
        {
            var queries = await _context.ExpertQueries
                .Where(q => !q.IsDeleted)
                .OrderByDescending(q => q.CreatedOn)
                .ToListAsync();

            return queries.Select(MapToDto);
        }

        public async Task<bool> RespondToQueryAsync(Guid queryId, ExpertQueryAdminUpdateDto dto)
        {
            var query = await _context.ExpertQueries
                .FirstOrDefaultAsync(q => q.Id == queryId && !q.IsDeleted);

            if (query == null) return false;

            query.AdminResponse = dto.AdminResponse;
            query.Status = "Replied";
            query.RespondedOn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ExpertQueryCategoryDto>> GetCategoriesAsync()
        {
            var categories = await _context.ExpertQueryCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            return categories.Select(c => new ExpertQueryCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description
            });
        }

        private ExpertQueryResponseDto MapToDto(ExpertQuery query)
        {
            return new ExpertQueryResponseDto
            {
                Id = query.Id,
                UserId = query.UserId,
                CompanionName = query.CompanionName,
                Category = query.Category,
                Priority = query.Priority,
                Subject = query.Subject,
                QuestionText = query.QuestionText,
                Status = query.Status,
                CreatedOn = query.CreatedOn,
                AdminResponse = query.AdminResponse,
                RespondedOn = query.RespondedOn
            };
        }
    }
}
