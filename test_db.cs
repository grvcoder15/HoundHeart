using System;
using System.Linq;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models;
using System.Text.Json;

class Program {
    static void Main() {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=Hound Heart;Username=postgres;Password=password");
        using var ctx = new AppDbContext(optionsBuilder.Options);
        var dogs = ctx.FitBarkDogs.Where(d => d.DogSlug == "44a9d4f9-a484-42c8-af2d-aa4a12348d7e").OrderBy(d => d.CreatedAt).ToList();
        foreach (var d in dogs) {
            Console.WriteLine($"ID: {d.Id} Slug: {d.DogSlug} Name: {d.Name} CreatedAt: {d.CreatedAt}");
        }
    }
}
