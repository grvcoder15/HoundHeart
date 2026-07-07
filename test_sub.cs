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
        var hasActiveSub = ctx.Subscriptions.Any(s => s.UserId.ToString() == "45919dbd-f4c4-4388-a96a-9ecece083598" && s.Status == "active" && s.PlanName != null && (s.PlanName.ToLower().Contains("premium") || s.PlanName.ToLower().Contains("plus")));
        Console.WriteLine($"IsSubscribed: {hasActiveSub}");
    }
}
