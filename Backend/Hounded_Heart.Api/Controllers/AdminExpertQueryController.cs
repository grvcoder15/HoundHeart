using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/admin/expert-queries")]
    [ApiController]
    public class AdminExpertQueryController : ControllerBase
    {
        private readonly IExpertQueryService _service;

        public AdminExpertQueryController(IExpertQueryService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllQueries()
        {
            var queries = await _service.GetAllQueriesAsync();
            return Ok(ResponseHelper.Success(queries, "Expert queries retrieved successfully.", 200));
        }

        [HttpPut("{id}/respond")]
        public async Task<IActionResult> RespondToQuery(Guid id, [FromBody] ExpertQueryAdminUpdateDto dto)
        {
            var success = await _service.RespondToQueryAsync(id, dto);
            if (success) return Ok(ResponseHelper.Success<object>("Response submitted successfully.", "Response submitted successfully.", 200));
            return NotFound(ResponseHelper.Fail<object>("Query not found.", 404));
        }
    }
}
