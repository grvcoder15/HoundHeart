using System;

namespace Hounded_Heart.Models.Dtos
{
    public class UsageAnalyticsDto
    {
        // Weekly Progress (0-100)
        public int WeeklyProgressPercent { get; set; }

        // Dog Synchronizations (Chakra Logs this billing cycle)
        public int DogSyncCount { get; set; }

        // Intuitive Readings credit info
        public int ReadingsUsed { get; set; }
        public int ReadingsTotal { get; set; }

        // Monthly Coaching: null = N/A, value = sessions used/available
        public string CoachingDisplay { get; set; } = "N/A";
    }
}
