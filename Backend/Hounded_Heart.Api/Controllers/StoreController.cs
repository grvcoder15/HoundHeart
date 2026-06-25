using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models;

namespace Hounded_Heart.Api.Controllers
{
    [ApiController]
    [Route("api/store")]
    public class StoreController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StoreController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            try
            {
                var products = await _context.StoreProducts.OrderBy(p => p.DisplayOrder).ToListAsync();
                return Ok(new { success = true, data = products });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
