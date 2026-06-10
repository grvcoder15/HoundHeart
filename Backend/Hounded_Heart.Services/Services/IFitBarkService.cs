using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Hounded_Heart.Models.Models;

namespace Hounded_Heart.Services.Services
{
    public interface IFitBarkService
    {
        Task<string> GetAuthorizationUrlAsync();
        Task<bool> ExchangeCodeForTokensAsync(string code, string? state);
        bool IsConnected();
        void Disconnect();
        Task<FitBarkUserProfile?> GetUserInfoAsync();
        Task<List<FitBarkDogProfile>?> GetDogProfilesAsync();
        Task<FitBarkDogInfo?> GetDogInfoAsync(string dogSlug);
        Task<List<FitBarkUserRelation>?> GetDogRelatedUsersAsync(string dogSlug);
        Task<List<FitBarkActivityRecord>?> GetDailyActivityAsync(string dogSlug, string fromDate, string toDate, string resolution = "DAILY");
        Task<JsonElement?> GetActivityTotalsAsync(string dogSlug, string fromDate, string toDate);
        Task<JsonElement?> GetTimeBreakdownAsync(string dogSlug, string fromDate, string toDate);
        Task<JsonElement?> GetSimilarDogsStatsAsync(string dogSlug, string fromDate, string toDate);
        Task<FitBarkDailyGoal?> GetDailyGoalAsync(string dogSlug);
        Task<FitBarkImageResponse?> GetDogPictureAsync(string dogSlug);
        Task<FitBarkImageResponse?> GetUserPictureAsync(string userSlug);
    }
}
