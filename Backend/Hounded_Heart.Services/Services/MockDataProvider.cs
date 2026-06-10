using System;
using System.Collections.Generic;
using Hounded_Heart.Models.Models;

namespace Hounded_Heart.Services.Services
{
    public class MockDataProvider : IMockDataProvider
    {
        private readonly Random _random = new();

        public DogVitals GenerateDogVitals(Guid dogId, string state = "Normal")
        {
            var vitals = new DogVitals { DogId = dogId, Timestamp = DateTime.UtcNow }; // Note: I should add Timestamp to DogVitals if not there, but for now I'll use the metric timestamps
            
            bool isStressed = state == "Stressed";
            
            vitals.HeartRate = new HeartRateMetric 
            { 
                Bpm = isStressed ? _random.Next(110, 160) : _random.Next(70, 100),
                Timestamp = DateTime.UtcNow 
            };

            vitals.HRV = new HRVMetric 
            { 
                Ms = isStressed ? _random.Next(10, 30) : _random.Next(40, 80),
                Timestamp = DateTime.UtcNow 
            };

            vitals.Activity = new ActivityMetric 
            { 
                Intensity = isStressed ? "High" : "Low",
                Steps = isStressed ? _random.Next(500, 1000) : _random.Next(0, 50),
                Timestamp = DateTime.UtcNow 
            };

            vitals.Temperature = isStressed ? 39.5 : 38.5;
            vitals.Status = isStressed ? "Stressed" : "Resting";

            return vitals;
        }

        public HumanVitals GenerateHumanVitals(Guid userId)
        {
            return new HumanVitals
            {
                UserId = userId,
                HeartRate = new HeartRateMetric { Bpm = _random.Next(60, 90), Timestamp = DateTime.UtcNow },
                HRV = new HRVMetric { Ms = _random.Next(30, 70), Timestamp = DateTime.UtcNow },
                Activity = new ActivityMetric { Intensity = "Medium", Steps = _random.Next(100, 500), Timestamp = DateTime.UtcNow },
                SleepHours = _random.Next(6, 9)
            };
        }

        public List<DogVitals> GenerateHistoricalDogVitals(Guid dogId, int days)
        {
            var list = new List<DogVitals>();
            for (int i = 0; i < days; i++)
            {
                var vitals = GenerateDogVitals(dogId);
                // Adjust timestamp for history
                var ts = DateTime.UtcNow.AddDays(-i);
                vitals.HeartRate.Timestamp = ts;
                vitals.HRV.Timestamp = ts;
                vitals.Activity.Timestamp = ts;
                list.Add(vitals);
            }
            return list;
        }

        public List<HumanVitals> GenerateHistoricalHumanVitals(Guid userId, int days)
        {
            var list = new List<HumanVitals>();
            for (int i = 0; i < days; i++)
            {
                var vitals = GenerateHumanVitals(userId);
                var ts = DateTime.UtcNow.AddDays(-i);
                vitals.HeartRate.Timestamp = ts;
                vitals.HRV.Timestamp = ts;
                vitals.Activity.Timestamp = ts;
                list.Add(vitals);
            }
            return list;
        }
    }
}
