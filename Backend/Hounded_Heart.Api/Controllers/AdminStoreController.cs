using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models;
using System.IO;
using Hounded_Heart.Services.Services;

namespace Hounded_Heart.Api.Controllers
{
    [ApiController]
    [Route("api/admin/store")]
    public class AdminStoreController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BlobStorageService _blobService;

        public AdminStoreController(AppDbContext context, BlobStorageService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _context.StoreProducts.OrderBy(p => p.DisplayOrder).ToListAsync();
            return Ok(new { success = true, data = products });
        }

        [HttpPost("products")]
        public async Task<IActionResult> AddProduct([FromForm] string name, [FromForm] string? description, [FromForm] decimal price, [FromForm] int displayOrder, IFormFile? imageFile)
        {
            try
            {
                string? imageUrl = null;

                if (imageFile != null && imageFile.Length > 0)
                {
                    using var memoryStream = new MemoryStream();
                    await imageFile.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();
                    var extension = Path.GetExtension(imageFile.FileName) ?? ".jpg";
                    var fileName = $"store_product_{Guid.NewGuid()}{extension}";

                    imageUrl = await _blobService.UploadImageFileAsync(imageBytes, fileName);
                }

                var product = new StoreProduct
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Description = description,
                    Price = price,
                    ImageUrl = imageUrl,
                    DisplayOrder = displayOrder,
                    IsComingSoon = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.StoreProducts.Add(product);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Product added successfully", data = product });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("products/{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromForm] string name, [FromForm] string? description, [FromForm] decimal price, [FromForm] int displayOrder, IFormFile? imageFile)
        {
            try
            {
                var product = await _context.StoreProducts.FindAsync(id);
                if (product == null) return NotFound(new { success = false, message = "Product not found" });

                if (imageFile != null && imageFile.Length > 0)
                {
                    using var memoryStream = new MemoryStream();
                    await imageFile.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();
                    var extension = Path.GetExtension(imageFile.FileName) ?? ".jpg";
                    var fileName = $"store_product_{Guid.NewGuid()}{extension}";

                    product.ImageUrl = await _blobService.UploadImageFileAsync(imageBytes, fileName);
                }

                product.Name = name;
                product.Description = description;
                product.Price = price;
                product.DisplayOrder = displayOrder;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Product updated successfully", data = product });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            try
            {
                var product = await _context.StoreProducts.FindAsync(id);
                if (product == null) return NotFound(new { success = false, message = "Product not found" });

                // We can potentially delete from Blob Storage here, but for now just DB delete.
                _context.StoreProducts.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Product deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
