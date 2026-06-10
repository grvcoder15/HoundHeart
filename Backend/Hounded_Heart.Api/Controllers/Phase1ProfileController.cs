using System;
using System.Threading.Tasks;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Phase1ProfileController : ControllerBase
    {
        private readonly IPhase1ProfileService _profileService;

        public Phase1ProfileController(IPhase1ProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpPost("human")]
        public async Task<IActionResult> CreateOrUpdateHumanProfile([FromBody] CreateHumanProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var profile = await _profileService.CreateHumanProfileAsync(dto);
            return Ok(ResponseHelper.Success(profile, "Human profile created/updated successfully.", 200));
        }

        [HttpGet("human/{userId}")]
        public async Task<IActionResult> GetHumanProfile(Guid userId)
        {
            var profile = await _profileService.GetHumanProfileAsync(userId);
            if (profile == null)
                return NotFound(ResponseHelper.Fail<object>("Human profile not found.", 404));

            return Ok(ResponseHelper.Success(profile, "Human profile retrieved successfully.", 200));
        }

        [HttpPost("dog")]
        public async Task<IActionResult> CreateOrUpdateDogProfile([FromBody] CreateDogProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var profile = await _profileService.CreateDogProfileAsync(dto);
            return Ok(ResponseHelper.Success(profile, "Dog profile created/updated successfully.", 200));
        }

        [HttpGet("dog/{userId}")]
        public async Task<IActionResult> GetDogProfile(Guid userId)
        {
            var profile = await _profileService.GetDogProfileAsync(userId);
            if (profile == null)
                return NotFound(ResponseHelper.Fail<object>("Dog profile not found.", 404));

            return Ok(ResponseHelper.Success(profile, "Dog profile retrieved successfully.", 200));
        }
    }
}
