using Hounded_Heart.Api.Response;
using Hounded_Heart.Models.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuidedPracticesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GuidedPracticesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/GuidedPractices/get-all
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllAsync()
        {
            var list = await _context.GuidedPractices
                                     .AsNoTracking()
                                     .ToListAsync();

            return Ok(ResponseHelper.Success(list));
        }
    }
}
