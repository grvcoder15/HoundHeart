using System;
using System.Collections.Generic;
using Hounded_Heart.Models.Models;

namespace Hounded_Heart.Services.Services
{
    public interface IMockDataProvider
    {
        DogVitals GenerateDogVitals(Guid dogId, string state = "Normal");
        HumanVitals GenerateHumanVitals(Guid userId);
        List<DogVitals> GenerateHistoricalDogVitals(Guid dogId, int days);
        List<HumanVitals> GenerateHistoricalHumanVitals(Guid userId, int days);
    }
}
