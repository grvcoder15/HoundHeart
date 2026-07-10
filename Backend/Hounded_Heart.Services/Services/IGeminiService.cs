using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public interface IGeminiService
    {
        /// <summary>
        /// Analyze text context (wizard answers) along with an optional image using Gemini Flash.
        /// </summary>
        Task<string> AnalyzeWithContextAsync(string prompt, System.Collections.Generic.Dictionary<string, string> answers, System.Collections.Generic.Dictionary<string, string>? questionImages = null);

        /// <summary>
        /// Compare two checks (historical vs current) using Gemini Pro.
        /// Images are optional in both checks.
        /// </summary>
        Task<string> CompareChecksAsync(string prompt, string? oldImageUrl, string? newImageUrl);

        /// <summary>
        /// Analyze a journal image URL using Gemini Vision to detect physical interactions (cuddle, belly rub, etc.).
        /// Returns a JSON string with detected interaction labels.
        /// </summary>
        Task<string> AnalyzeJournalImageAsync(string imageUrl);
    }
}
