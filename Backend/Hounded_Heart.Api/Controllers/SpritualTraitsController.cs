using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Models.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SpritualTraitsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SpritualTraitsController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("getAllUserTraits")]
        public async Task<IActionResult> GetAllUserSpiritualTraits()
        {
            try
            {
                var traits = await _context.UserSpiritualTraits
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .OrderBy(t => t.TraitName)
                    .ToListAsync();

                if (traits == null || !traits.Any())
                    return Ok(ResponseHelper.Success(traits, "No traits found", 200));

                return Ok(ResponseHelper.Success(traits, "Fetched user spiritual traits successfully", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error fetching traits: {ex.Message}", 500));
            }
        }
        [HttpGet("getAllDogTraits")]
        public async Task<IActionResult> GetAllDogSpiritualTraits()
        {
            try
            {
                var traits = await _context.DogSpiritualTraits
                    .Where(t => t.IsActive && !t.IsDeleted)
                    .OrderBy(t => t.TraitName)
                    .ToListAsync();

                if (traits == null || !traits.Any())
                    return Ok(ResponseHelper.Success(traits, "No traits found", 200));

                return Ok(ResponseHelper.Success(traits, "Fetched Dogs spiritual traits successfully", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error fetching traits: {ex.Message}", 500));
            }
        }
        [HttpPost("UserSelectedTraits")]
        public async Task<IActionResult> SaveUserSelectedTraits([FromBody] UserSelectedTraitsDto dto)
        {
            try
            {
                if (dto == null || dto.UserId == Guid.Empty || dto.TraitIds == null || !dto.TraitIds.Any())
                {
                    return BadRequest(ResponseHelper.Fail<string>("Invalid request data", 400));
                }

                // Remove old traits for this user & dog
                var existingTraits = await _context.UserSelectedTraits
                    .Where(x => x.UserId == dto.UserId)
                    .ToListAsync();

                if (existingTraits.Any())
                {
                    _context.UserSelectedTraits.RemoveRange(existingTraits);
                    await _context.SaveChangesAsync();
                }

                // Add new traits
                var newTraits = dto.TraitIds.Select(traitId => new UserSelectedTrait
                {
                    Id = Guid.NewGuid(),
                    UserId = dto.UserId,
                    TraitId = traitId,
                    IsSelected = true,
                    CreatedOn = DateTime.UtcNow
                }).ToList();

                await _context.UserSelectedTraits.AddRangeAsync(newTraits);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<string>("User selected traits saved successfully", "Success", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error saving user traits: {ex.Message}", 500));
            }
        }
        [HttpPost("DogSelectedTraits")]
        public async Task<IActionResult> SaveDogSelectedTraits([FromBody] DogSelectedTraitsDto dto)
        {
            try
            {
                if (dto == null || dto.UserId == Guid.Empty || dto.DogId == Guid.Empty || dto.TraitIds == null || !dto.TraitIds.Any())
                {
                    return BadRequest(ResponseHelper.Fail<string>("Invalid request data", 400));
                }

                // Remove old traits for this dog and user
                var existingTraits = await _context.DogSelectedTraits
                    .Where(x => x.UserId == dto.UserId && x.DogId == dto.DogId)
                    .ToListAsync();
                var existinguser = await _context.Users.Where(x => x.UserId == dto.UserId).FirstOrDefaultAsync(); ;
                if (existingTraits.Any())
                {
                    _context.DogSelectedTraits.RemoveRange(existingTraits);
                    await _context.SaveChangesAsync();
                }

                // Add new traits
                var newTraits = dto.TraitIds.Select(traitId => new DogSelectedTrait
                {
                    Id = Guid.NewGuid(),
                    DogId = dto.DogId,
                    UserId = dto.UserId,
                    TraitId = traitId,
                    IsSelected = true,
                    CreatedOn = DateTime.UtcNow
                }).ToList();

                await _context.DogSelectedTraits.AddRangeAsync(newTraits);
                await _context.SaveChangesAsync();

                existinguser.IsProfileSetupCompleted = true;
                _context.Users.Update(existinguser);
                await _context.SaveChangesAsync();
                return Ok(ResponseHelper.Success<string>(null, "Dog selected traits saved successfully", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Error saving dog traits: {ex.Message}", 500));
            }
        }

    }
}
