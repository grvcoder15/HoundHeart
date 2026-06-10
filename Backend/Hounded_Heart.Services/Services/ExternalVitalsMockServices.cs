using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Hounded_Heart.Models.Models;

namespace Hounded_Heart.Services.Services
{
    public class PetPaceMockService : IPetPaceService
    {
        private readonly IMockDataProvider _mockDataProvider;

        public PetPaceMockService(IMockDataProvider mockDataProvider)
        {
            _mockDataProvider = mockDataProvider;
        }

        public async Task<DogVitals> GetLatestVitalsAsync(Guid dogId)
        {
            // Simulate API delay
            await Task.Delay(100);
            return _mockDataProvider.GenerateDogVitals(dogId);
        }

        public async Task<List<DogVitals>> GetHistoricalVitalsAsync(Guid dogId, int days)
        {
            await Task.Delay(200);
            return _mockDataProvider.GenerateHistoricalDogVitals(dogId, days);
        }
    }

    public class AppleHealthMockService : IAppleHealthService
    {
        private readonly IMockDataProvider _mockDataProvider;

        public AppleHealthMockService(IMockDataProvider mockDataProvider)
        {
            _mockDataProvider = mockDataProvider;
        }

        public async Task<HumanVitals> GetLatestVitalsAsync(Guid userId)
        {
            await Task.Delay(100);
            return _mockDataProvider.GenerateHumanVitals(userId);
        }

        public async Task<List<HumanVitals>> GetHistoricalVitalsAsync(Guid userId, int days)
        {
            await Task.Delay(200);
            return _mockDataProvider.GenerateHistoricalHumanVitals(userId, days);
        }
    }
}
