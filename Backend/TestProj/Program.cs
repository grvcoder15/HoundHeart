using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Npgsql;

namespace TestProj
{
    class Program
    {
        static async Task Main(string[] args)
        {
            string connString = "Host=db.vwohagwmmdqbgnswxwjb.supabase.co;Port=6543;Database=postgres;Username=postgres;Password=Csharptek@105;SSL Mode=Require;Trust Server Certificate=true";
            string realUserId = "a404d592-0892-4a74-9d3c-9a8233a180f4";
            string realDogId  = "69d60cde-6f5d-4d40-829e-957d31f568ee";

            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // ── 1. Restore + confirm IsPremium on real account ──────────────
            Console.WriteLine("=== STEP 1: Restoring IsPremium = true on real account ===");
            await using (var cmd = new NpgsqlCommand(
                @"UPDATE ""Users"" SET ""IsPremium"" = TRUE WHERE ""UserId"" = @uid", conn))
            {
                cmd.Parameters.AddWithValue("uid", Guid.Parse(realUserId));
                int rows = await cmd.ExecuteNonQueryAsync();
                Console.WriteLine($"  Rows updated: {rows}");
            }

            await using (var cmd = new NpgsqlCommand(
                @"SELECT ""Email"", ""IsPremium"" FROM ""Users"" WHERE ""UserId"" = @uid", conn))
            {
                cmd.Parameters.AddWithValue("uid", Guid.Parse(realUserId));
                await using var r = await cmd.ExecuteReaderAsync();
                if (await r.ReadAsync())
                    Console.WriteLine($"  ✅ Confirmed: Email={r["Email"]}, IsPremium={r["IsPremium"]}");
            }

            // ── 2. Test 60-min quality-time window via the live API ─────────
            Console.WriteLine("\n=== STEP 2: Testing quality-time (60-min window) via GetSuggestions ===");
            var client = new HttpClient { BaseAddress = new Uri("http://localhost:5182") };
            try
            {
                var res = await client.GetAsync(
                    $"/api/AutoAnalysis/GetSuggestions?userId={realUserId}&dogId={realDogId}&date=2026-07-03");
                var json = await res.Content.ReadAsStringAsync();

                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("data", out var data))
                {
                    Console.WriteLine("  Response missing 'data'. Full response:");
                    Console.WriteLine("  " + json);
                    return;
                }

                Console.WriteLine("\n  checkInSuggestions:");
                foreach (var item in data.GetProperty("checkInSuggestions").EnumerateArray())
                    Console.WriteLine($"    - Rating: {item.GetProperty("suggestedRating")}, Reason: {item.GetProperty("reason")}");

                // Specifically look for the quality-time entry (checkInId for 'hours' question)
                string qualityTimeId = "0d3b505a-2c2f-410e-9e87-8904eeae8368";
                bool qualityFound = false;
                foreach (var item in data.GetProperty("checkInSuggestions").EnumerateArray())
                {
                    if (item.GetProperty("checkInId").GetString() == qualityTimeId)
                    {
                        qualityFound = true;
                        Console.WriteLine($"\n  ✅ Quality time NOW POPULATED: Rating={item.GetProperty("suggestedRating")}, Reason={item.GetProperty("reason")}");
                    }
                }
                if (!qualityFound)
                    Console.WriteLine("\n  ⚪ Quality time still not populated (no overlapping active periods in DB today)");
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"  ⚠️ API not reachable: {ex.Message}");
                Console.WriteLine("  Start the backend with 'dotnet run' in Hounded_Heart.Api and re-run this test.");
            }
        }
    }
}
