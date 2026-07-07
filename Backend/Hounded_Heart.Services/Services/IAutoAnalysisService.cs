using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class CheckInSuggestion
    {
        public Guid CheckInId { get; set; }
        public string Question { get; set; }   // Full question text from CheckIns table
        public int SuggestedRating { get; set; }
        public string Reason { get; set; }
    }

    public class RitualSuggestion
    {
        public Guid RitualId { get; set; }
        public string RitualTitle { get; set; }
        public bool Suggested { get; set; }
        public string Reason { get; set; }
    }

    public class ActivitySuggestion
    {
        public Guid ActivityId { get; set; }
        public string ActivityName { get; set; }
        public bool Suggested { get; set; }
        public string Reason { get; set; }
    }

    public class AutoAnalysisResult
    {
        public List<CheckInSuggestion> CheckInSuggestions { get; set; } = new List<CheckInSuggestion>();
        public List<RitualSuggestion> RitualSuggestions { get; set; } = new List<RitualSuggestion>();
        public List<ActivitySuggestion> ActivitySuggestions { get; set; } = new List<ActivitySuggestion>();
    }

    public interface IAutoAnalysisService
    {
        Task<AutoAnalysisResult> GetAutoSuggestionsAsync(Guid userId, Guid dogId, DateTime date);
    }
}
