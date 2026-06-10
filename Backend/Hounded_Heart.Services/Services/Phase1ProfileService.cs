using System;
using System.Linq;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public class Phase1ProfileService : IPhase1ProfileService
    {
        private readonly AppDbContext _context;

        public Phase1ProfileService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<HumanProfile> CreateHumanProfileAsync(CreateHumanProfileDto dto)
        {
            var existing = await _context.HumanProfiles.FirstOrDefaultAsync(p => p.UserId == dto.UserId);
            if (existing != null)
            {
                existing.Name = dto.Name;
                existing.Age = dto.Age;
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existing;
            }

            var profile = new HumanProfile
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                Name = dto.Name,
                Age = dto.Age,
                CreatedAt = DateTime.UtcNow
            };

            _context.HumanProfiles.Add(profile);
            await _context.SaveChangesAsync();
            return profile;
        }

        public async Task<HumanProfile?> GetHumanProfileAsync(Guid userId)
        {
            return await _context.HumanProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<DogProfile> CreateDogProfileAsync(CreateDogProfileDto dto)
        {
            var existing = await _context.DogProfiles.FirstOrDefaultAsync(p => p.UserId == dto.UserId);
            if (existing != null)
            {
                existing.Name = dto.Name;
                existing.Breed = dto.Breed;
                existing.Age = dto.Age;
                existing.Weight = dto.Weight;
                existing.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existing;
            }

            var profile = new DogProfile
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                Name = dto.Name,
                Breed = dto.Breed,
                Age = dto.Age,
                Weight = dto.Weight,
                CreatedAt = DateTime.UtcNow
            };

            _context.DogProfiles.Add(profile);
            await _context.SaveChangesAsync();
            return profile;
        }

        public async Task<DogProfile?> GetDogProfileAsync(Guid userId)
        {
            return await _context.DogProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        }
    }
}
