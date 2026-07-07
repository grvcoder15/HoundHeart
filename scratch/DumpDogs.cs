using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using Microsoft.Extensions.Configuration;

class Program
{
    static async Task Main(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer("Server=localhost;Database=HoundHeart;Trusted_Connection=True;TrustServerCertificate=True;");
        
        using var context = new AppDbContext(optionsBuilder.Options);
        
        var dogs = await context.Dogs.ToListAsync();
        Console.WriteLine("DOGS:");
        foreach(var d in dogs) Console.WriteLine($"ID: {d.DogId}, Name: '{d.DogName}', UserId: {d.UserId}");
        
        var fbDogs = await context.FitBarkDogs.ToListAsync();
        Console.WriteLine("\nFITBARK DOGS:");
        foreach(var d in fbDogs) Console.WriteLine($"ID: {d.Id}, Name: '{d.Name}', Slug: {d.DogSlug}");
    }
}
