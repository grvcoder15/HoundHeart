using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;
using System.Collections.Generic;

public class Program
{
    static string ConnectedId = "d45b178e-28a5-4399-aa08-5139df5b5213";
    static string PresentId = "549e577f-4c7e-494d-9141-08a1bb1f1b63";
    static string EnergyId = "09105c88-1ef1-4713-a3e6-c29466270c57";
    static string TimeId = "ea15b2bc-6fdf-49f2-8766-9cb303aecdba"; 
    static string PeaceId = "eb196807-5c63-4800-a05a-92e2d2b09458"; 
    static string BehaviorId = "33c4324e-4417-4292-8876-7bd48958b723";

    public static async Task Main()
    {
        using (var client = new HttpClient())
        {
            try 
            {
                // 1. Register
                var unique = DateTime.Now.Ticks;
                var registerPayload = new { Email = $"newuser_{unique}@test.com", Password = "Password123!", FullName = "New User Test", IsTermsAccepted = true };
                Console.WriteLine("Registering user...");
                var regResponse = await client.PostAsync("http://localhost:5182/api/Account/register", new StringContent(JsonSerializer.Serialize(registerPayload), Encoding.UTF8, "application/json"));
                var regJson = await regResponse.Content.ReadAsStringAsync();
                
                if (!regResponse.IsSuccessStatusCode) { Console.WriteLine($"Reg Failed: {regResponse.StatusCode}"); return; }

                var regDoc = JsonDocument.Parse(regJson);
                string userIdStr = "";
                if (regDoc.RootElement.TryGetProperty("data", out var dataEl))
                    userIdStr = dataEl.GetProperty("userId").GetString();
                else
                    userIdStr = regDoc.RootElement.GetProperty("userId").GetString(); // Fallback

                Console.WriteLine($"User Created ID: {userIdStr}");
                
                // 2. Add Dog
                var dogPayload = new { UserId = userIdStr, DogName = "TestDog" }; 
                Console.WriteLine("Adding Dog...");
                var dogResponse = await client.PostAsync("http://localhost:5182/api/Account/add-dogprofile", new StringContent(JsonSerializer.Serialize(dogPayload), Encoding.UTF8, "application/json"));
                if (!dogResponse.IsSuccessStatusCode) { Console.WriteLine($"Dog Profile Failed: {dogResponse.StatusCode}"); return; }
                Console.WriteLine("Dog Profile Created.");

                // 3. Submit Day 1 Check-in
                // Scenario: 
                // Time: 5 hrs -> +5 pts
                // Peace: 8 -> +1 pt (High Peace)
                // Behavior: 8 -> 0 pts (No yesterday to compare)
                // Total Daily: +6
                // Expected Total: 50 + 6 = 56
                
                var checkInPayload = new { UserId = userIdStr, CheckIns = new[] {
                    new { CheckInId = TimeId, Rating = 5 },       
                    new { CheckInId = PeaceId, Rating = 8 },      
                    new { CheckInId = BehaviorId, Rating = 8 },   
                    new { CheckInId = ConnectedId, Rating = 5 },  
                    new { CheckInId = PresentId, Rating = 5 },    
                    new { CheckInId = EnergyId, Rating = 5 }      
                }};

                Console.WriteLine("Submitting Check-in...");
                var checkInResponse = await client.PostAsync("http://localhost:5182/api/CheckIn/UpdateUserCheckIns", new StringContent(JsonSerializer.Serialize(checkInPayload), Encoding.UTF8, "application/json"));
                var checkInJson = await checkInResponse.Content.ReadAsStringAsync();
                
                var result = JsonDocument.Parse(checkInJson).RootElement;
                if (result.TryGetProperty("scoreUpdate", out var scoreUpdate))
                {
                    var dailyGain = scoreUpdate.GetProperty("gain").GetDouble();
                    var totalScore = scoreUpdate.GetProperty("newScore").GetDouble();
                    
                    Console.WriteLine($"Daily Gain: {dailyGain}");
                    Console.WriteLine($"Total Score: {totalScore}");

                    if (dailyGain == 6 && totalScore == 56) Console.WriteLine("VERIFICATION SUCCESS");
                    else Console.WriteLine("VERIFICATION FAILED (Mismatch)");
                }
                else
                {
                    Console.WriteLine($"scoreUpdate missing. Response: {checkInJson}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}
