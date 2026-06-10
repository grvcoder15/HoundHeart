using System;

namespace Hounded_Heart.Services.Services
{
    public interface IProximityService
    {
        double CalculateDistanceMetres(double lat1, double lon1, double lat2, double lon2);
        bool IsWithinProximity(double lat1, double lon1, double lat2, double lon2, double radiusMetres);
    }

    public class ProximityService : IProximityService
    {
        private const double EarthRadiusKm = 6371.0;

        /// <summary>
        /// Calculate the distance between two GPS coordinates using the Haversine formula
        /// </summary>
        /// <param name="lat1">Latitude of first point</param>
        /// <param name="lon1">Longitude of first point</param>
        /// <param name="lat2">Latitude of second point</param>
        /// <param name="lon2">Longitude of second point</param>
        /// <returns>Distance in metres</returns>
        public double CalculateDistanceMetres(double lat1, double lon1, double lat2, double lon2)
        {
            // Convert degrees to radians
            var lat1Rad = DegreesToRadians(lat1);
            var lon1Rad = DegreesToRadians(lon1);
            var lat2Rad = DegreesToRadians(lat2);
            var lon2Rad = DegreesToRadians(lon2);

            // Calculate differences
            var deltaLat = lat2Rad - lat1Rad;
            var deltaLon = lon2Rad - lon1Rad;

            // Haversine formula
            var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            // Distance in kilometres
            var distanceKm = EarthRadiusKm * c;

            // Convert to metres
            return distanceKm * 1000;
        }

        /// <summary>
        /// Check if two GPS coordinates are within a specified radius
        /// </summary>
        /// <param name="lat1">Latitude of first point</param>
        /// <param name="lon1">Longitude of first point</param>
        /// <param name="lat2">Latitude of second point</param>
        /// <param name="lon2">Longitude of second point</param>
        /// <param name="radiusMetres">Radius in metres</param>
        /// <returns>True if within proximity, false otherwise</returns>
        public bool IsWithinProximity(double lat1, double lon1, double lat2, double lon2, double radiusMetres)
        {
            var distance = CalculateDistanceMetres(lat1, lon1, lat2, lon2);
            return distance <= radiusMetres;
        }

        private static double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180.0;
        }
    }
}