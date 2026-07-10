using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Services.Services
{
    public class DetailedAnalysisService : IDetailedAnalysisService
    {
        private readonly AppDbContext _context;
        private readonly IGeminiService _geminiService;

        private const string DetailedAnalysisPromptBase =
            "You are a gentle, supportive canine wellness coach, not a veterinarian. Review all provided details together and offer a warm, non-clinical analysis. " +
            "Do not use veterinary, medical, diagnostic, or urgent language. Mention photos only as visual context if they are available. " +
            "Return ONLY valid JSON matching this schema exactly: " +
            "{ \"summary\": \"\", \"connectionHighlights\": [], \"vitalsAndBaselineNotes\": \"\", \"environmentInsights\": \"\", \"dogBehaviorInsights\": \"\", \"combinedRecommendations\": [], \"photosReferenced\": [] }";

        public DetailedAnalysisService(AppDbContext context, IGeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        public async Task<DetailedAnalysisReportDto> CreateAsync(Guid userId)
        {
            var activeDog = await _context.Dogs
                .Where(d => d.UserId == userId && d.IsActive && !d.IsDeleted)
                .OrderByDescending(d => d.UpdatedOn ?? d.CreatedOn)
                .FirstOrDefaultAsync();

            var latestDogCheckin = await _context.WellnessChecks
                .Where(w => w.UserId == userId && w.Type == "DogCheckIn" && w.Status == "Complete")
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();

            var latestEnvironmentCheckin = await _context.WellnessChecks
                .Where(w => w.UserId == userId && w.Type == "EnvironmentFlow" && w.Status == "Complete")
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();

            var latestHumanCheckin = await _context.WellnessChecks
                .Where(w => w.UserId == userId && w.Type == "HumanCheckIn" && w.Status == "Complete")
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();

            DogBaseline? latestBaseline = null;
            DogVitalsRecord? latestVitals = null;
            if (activeDog != null)
            {
                latestBaseline = await _context.DogBaselines
                    .Where(b => b.DogId == activeDog.DogId)
                    .OrderByDescending(b => b.LastUpdatedUtc)
                    .FirstOrDefaultAsync();

                latestVitals = await _context.DogVitals
                    .Where(v => v.DogId == activeDog.DogId)
                    .OrderByDescending(v => v.TimestampUtc)
                    .FirstOrDefaultAsync();
            }

            if (latestDogCheckin == null && latestEnvironmentCheckin == null && latestHumanCheckin == null && latestVitals == null)
            {
                throw new Exception("Please complete at least one wellness check-in (Dog, Human, or Environment) or connect a wearable before requesting a detailed analysis.");
            }

            var baselineSnapshot = latestBaseline != null
                ? JsonSerializer.Serialize(new
                {
                    latestBaseline.DaysOfDataCollected,
                    latestBaseline.AvgHeartRate,
                    latestBaseline.AvgActivityScore,
                    latestBaseline.AvgTemperature,
                    latestBaseline.AvgRestScore,
                    latestBaseline.AvgRespirationRate,
                    latestBaseline.DogBaselineEstablished,
                    latestBaseline.LastUpdatedUtc
                })
                : "No baseline data available.";

            var vitalsSnapshot = latestVitals != null
                ? JsonSerializer.Serialize(new
                {
                    latestVitals.HeartRate,
                    latestVitals.ActivityScore,
                    latestVitals.Temperature,
                    latestVitals.RestScore,
                    latestVitals.RespirationRate,
                    latestVitals.State,
                    latestVitals.Source,
                    latestVitals.ActivityValue,
                    latestVitals.MinPlay,
                    latestVitals.MinActive,
                    latestVitals.MinRest,
                    latestVitals.NapTime,
                    latestVitals.TimestampUtc
                })
                : "No recent wearable or vitals data available.";

            var answers = new Dictionary<string, string>();
            answers["Baseline Snapshot"] = baselineSnapshot;
            answers["Latest Vitals Snapshot"] = vitalsSnapshot;
            answers["Dog Profile"] = activeDog != null ? JsonSerializer.Serialize(new { activeDog.DogName, activeDog.Breed, activeDog.Age, activeDog.Weight }) : "No active dog profile found.";

            string? dogCheckinAnswers = latestDogCheckin?.AnswersJson ?? "No dog check-in available.";
            string? dogCheckinReflection = latestDogCheckin?.AiResponseJson ?? "No prior dog check-in reflection available.";
            string? envCheckinAnswers = latestEnvironmentCheckin?.AnswersJson ?? "No environment check-in available.";
            string? envCheckinReflection = latestEnvironmentCheckin?.AiResponseJson ?? "No prior environment check-in reflection available.";
            string? humanCheckinAnswers = latestHumanCheckin?.AnswersJson ?? "No human check-in available.";
            string? humanCheckinReflection = latestHumanCheckin?.AiResponseJson ?? "No prior human check-in reflection available.";

            answers["Dog Check-in Answers"] = dogCheckinAnswers;
            answers["Dog Check-in Reflection"] = dogCheckinReflection;
            answers["Environment Check-in Answers"] = envCheckinAnswers;
            answers["Environment Check-in Reflection"] = envCheckinReflection;
            answers["Human Check-in Answers"] = humanCheckinAnswers;
            answers["Human Check-in Reflection"] = humanCheckinReflection;

            var photoUrls = new Dictionary<string, string>();
            AddWellnessCheckPhotos(photoUrls, latestDogCheckin, "Dog Check-in Photo");
            AddWellnessCheckPhotos(photoUrls, latestEnvironmentCheckin, "Environment Check-in Photo");

            if (photoUrls.Count > 0)
            {
                answers["Photo Notes"] = "Photos are included for context when available.";
            }

            var prompt = DetailedAnalysisPromptBase + "\nUse the full summary and the attached answer sections to build the report.";

            string reportJson = await _geminiService.AnalyzeWithContextAsync(prompt, answers, photoUrls.Count > 0 ? photoUrls : null);

            var report = new DetailedAnalysisReport
            {
                UserId = userId,
                DogId = activeDog?.DogId,
                LatestDogCheckinId = latestDogCheckin?.Id,
                LatestEnvironmentCheckinId = latestEnvironmentCheckin?.Id,
                BaselineSnapshotJson = baselineSnapshot,
                LatestVitalsSnapshotJson = vitalsSnapshot,
                PhotoUrlsJson = photoUrls.Count > 0 ? JsonSerializer.Serialize(photoUrls) : null,
                ReportJson = reportJson,
                Status = "Complete",
                UpdatedAt = DateTime.UtcNow
            };

            _context.DetailedAnalysisReports.Add(report);
            await _context.SaveChangesAsync();

            return MapToDto(report);
        }

        public async Task<IEnumerable<DetailedAnalysisReportDto>> GetHistoryAsync(Guid userId)
        {
            var reports = await _context.DetailedAnalysisReports
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reports.Select(MapToDto);
        }

        public async Task<DetailedAnalysisReportDto> GetByIdAsync(Guid userId, Guid id)
        {
            var report = await _context.DetailedAnalysisReports
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Id == id);

            if (report == null) throw new Exception("Detailed analysis report not found.");
            return MapToDto(report);
        }

        private static void AddWellnessCheckPhotos(Dictionary<string, string> photoUrls, WellnessCheck? check, string prefix)
        {
            if (check == null) return;

            if (!string.IsNullOrEmpty(check.PhotoUrlsJson))
            {
                try
                {
                    var storedPhotos = JsonSerializer.Deserialize<Dictionary<string, string>>(check.PhotoUrlsJson);
                    if (storedPhotos != null)
                    {
                        int index = 1;
                        foreach (var url in storedPhotos.Values)
                        {
                            photoUrls[$"{prefix} {index}"] = url;
                            index++;
                        }
                        return;
                    }
                }
                catch
                {
                    // ignore and fall back to PhotoUrl
                }
            }

            if (!string.IsNullOrEmpty(check.PhotoUrl))
            {
                photoUrls[prefix] = check.PhotoUrl;
            }
        }

        private static DetailedAnalysisReportDto MapToDto(DetailedAnalysisReport report)
        {
            return new DetailedAnalysisReportDto
            {
                Id = report.Id,
                UserId = report.UserId,
                DogId = report.DogId,
                LatestDogCheckinId = report.LatestDogCheckinId,
                LatestEnvironmentCheckinId = report.LatestEnvironmentCheckinId,
                BaselineSnapshotJson = report.BaselineSnapshotJson,
                LatestVitalsSnapshotJson = report.LatestVitalsSnapshotJson,
                PhotoUrlsJson = report.PhotoUrlsJson,
                ReportJson = report.ReportJson,
                Status = report.Status,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt
            };
        }
    }
}
