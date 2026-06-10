using System;
using Hounded_Heart.Services.Services;

namespace ProximityTesting
{
    public class ProximityTest
    {
        public static void Main(string[] args)
        {
            var proximityService = new ProximityService();
            
            // Test case 1: Same location (should be 0 distance)
            var distance1 = proximityService.CalculateDistanceMetres(40.7589, -73.9851, 40.7589, -73.9851);
            Console.WriteLine($"Same location distance: {distance1:F2} meters");
            
            // Test case 2: 100m apart (approximate)
            var distance2 = proximityService.CalculateDistanceMetres(40.7589, -73.9851, 40.7598, -73.9851);
            Console.WriteLine($"~100m apart distance: {distance2:F2} meters");
            
            // Test case 3: 500m apart (threshold test)
            var distance3 = proximityService.CalculateDistanceMetres(40.7589, -73.9851, 40.7634, -73.9851);
            Console.WriteLine($"~500m apart distance: {distance3:F2} meters");
            Console.WriteLine($"Is within 500m proximity: {proximityService.IsWithinProximity(40.7589, -73.9851, 40.7634, -73.9851)}");
            
            // Test case 4: 1km apart (should be outside proximity)
            var distance4 = proximityService.CalculateDistanceMetres(40.7589, -73.9851, 40.7679, -73.9851);
            Console.WriteLine($"~1km apart distance: {distance4:F2} meters");
            Console.WriteLine($"Is within 500m proximity: {proximityService.IsWithinProximity(40.7589, -73.9851, 40.7679, -73.9851)}");
        }
    }
}