using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Hounded_Heart.Models;
using Hounded_Heart.Models.Data;

class Program {
    static void Main() {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=Hound Heart;Username=postgres;Password=password");
        using var ctx = new AppDbContext(optionsBuilder.Options);
        var checks = ctx.WellnessChecks
            .Where(c => c.UserId.ToString() == "45919dbd-f4c4-4388-a96a-9ecece083598" && c.Type == "DogCheckIn")
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .ToList();
        Console.WriteLine($"Found {checks.Count} DogCheckIns");
        foreach (var c in checks) {
            Console.WriteLine($"[{c.CreatedAt}] {c.AnswersJson}");
        }
    }
}
