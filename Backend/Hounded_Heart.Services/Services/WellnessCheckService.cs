using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Hounded_Heart.Services.Services
{
    public class WellnessCheckService : IWellnessCheckService
    {
        private readonly AppDbContext _context;
        private readonly BlobStorageService _blobService;
        private readonly IGeminiService _geminiService;
        private readonly IServiceScopeFactory _scopeFactory;

        // ── Prompt templates ────────────────────────────────────────────────

        // Dog Check-in — no FitBark data (no device connected)
        private const string DogCheckInPromptBase =
            "You are a professional canine wellness expert and a gentle wellness coach, not a veterinarian. Analyze ALL of the following information together. " +
            "The user answered these check-in questions about their dog: {0}. {1} " +
            "IMPORTANT: You must NEVER recommend veterinary consultation, NEVER use words like 'medical issue,' 'illness,' 'diagnosis,' 'symptom,' or 'condition,' and NEVER tell the user to see a vet, even if the answers suggest the dog may be off. " +
            "Instead, if the dog seems to be having a harder day, respond with supportive, observational language only — note that the dog seems less relaxed or energetic, encourage calm presence and comfort, and suggest continuing to watch how things unfold. " +
            "You are a wellness coach offering observations and comfort, not a medical authority. Do not suggest or imply any medical urgency. " +
            "If no photo was provided, do not include any photo analysis or confidence placeholder text. " +
            "If a photo was provided, analyze it deeply: describe what the image appears to show, explain how it relates to the question, and say what it suggests about the dog's mood, movement, posture, environment, or comfort. " +
            "Analyze every question individually. Correlate each uploaded image with its corresponding question and the owner's response when a photo exists. Do not skip any question. " +
            "For every question, describe what you observe, whether the answer seems consistent, any helpful supportive notes, and your confidence level only when photo evidence is present. " +
            "Use varied phrasing across questions and sections: avoid repeating the same sentence structure or tone. Write each section in a distinct way, with different examples or imagery, so the response feels uniquely tailored to this check-in rather than formulaic. " +
            "If a photo is present, explicitly mention the visual cues and how they influence your insight. " +
            "After completing all questions, provide an overall wellbeing summary, behavioral reflection, positive observations, gentle concerns, and recommendations written in a coach-like, calming tone. Do not include veterinary or professional medical advice. " +
            "Return ONLY valid JSON matching this schema exactly: " +
            "{{ \"overallSummary\":\"\", \"overallMood\":\"\", \"physicalCondition\":\"\", \"behaviorAnalysis\":\"\", " +
            "\"questionAnalysis\":[ {{ \"question\":\"...\", \"answer\":\"...\", \"imageAnalysis\":\"...\", \"supportsAnswer\":true, \"confidence\":\"High\" }} ], " +
            "\"recommendations\":[] }}";

        // Dog Check-in — with FitBark activity data (subscribed users with device)
        private const string DogCheckInWithFitBarkPromptBase =
            "You are a professional canine wellness expert and a gentle wellness coach, not a veterinarian. Analyze ALL of the following information together. " +
            "The user answered these check-in questions about their dog: {0}. {1} " +
            "Additionally, here is automated activity data from the dog's wearable device over the last 24-48 hours: {2}. " +
            "IMPORTANT: You must NEVER recommend veterinary consultation, NEVER use words like 'medical issue,' 'illness,' 'diagnosis,' 'symptom,' or 'condition,' and NEVER tell the user to see a vet, even if the answers suggest the dog may be off. " +
            "Instead, if the dog seems to be having a harder day, respond with supportive, observational language only — note that the dog seems less relaxed or energetic, encourage calm presence and comfort, and suggest continuing to watch how things unfold. " +
            "You are a wellness coach offering observations and comfort, not a medical authority. Do not suggest or imply any medical urgency. " +
            "If no photo was provided, do not include any photo analysis or confidence placeholder text. " +
            "If a photo was provided, analyze it deeply: describe what the image appears to show, explain how it relates to the question, and say what it suggests about the dog's mood, movement, posture, environment, or comfort. " +
            "Analyze every question individually. Correlate each uploaded image with its corresponding question and the owner's response when a photo exists. Do not skip any question. " +
            "For every question, describe what you observe, whether the answer seems consistent, any helpful supportive notes, and your confidence level only when photo evidence is present. " +
            "Use varied phrasing across questions and sections: avoid repeating the same sentence structure or tone. Each paragraph should feel different and specific to this check-in. Do not reuse the same opening sentence or framing for every question. " +
            "If a photo is present, explicitly mention the visual cues and how they influence your insight. " +
            "After completing all questions, provide an overall wellbeing summary, behavioral reflection, positive observations, gentle concerns, and recommendations written in a coach-like, calming tone. Do not include veterinary or professional medical advice. " +
            "In your overall summaries and recommendations, heavily factor in the provided wearable activity data. " +
            "Return ONLY valid JSON matching this schema exactly: " +
            "{{ \"overallSummary\":\"\", \"overallMood\":\"\", \"physicalCondition\":\"\", \"behaviorAnalysis\":\"\", " +
            "\"questionAnalysis\":[ {{ \"question\":\"...\", \"answer\":\"...\", \"imageAnalysis\":\"...\", \"supportsAnswer\":true, \"confidence\":\"High\" }} ], " +
            "\"recommendations\":[] }}";

        // Environment & Flow Check-in
        private const string EnvironmentPromptBase =
            "You are a warm, supportive wellness coach, not an inspector. " +
            "The user answered these check-in questions about their space: {0}. {1} " +
            "Combine the answers and photo to assess comfort, safety, and flow (clutter, " +
            "obstructions, navigability). If a photo is provided, analyze the visible details deeply: describe what the scene looks like, what the spatial layout suggests, and how the visual cues influence your comfort and flow assessment. " +
            "Respond in JSON: flowObservations (array of strings), " +
            "comfortObservations (string), enrichmentOpportunities (array of strings), " +
            "overallTone (string, max 2 sentences), recommendedHoundHeartActivity (string). " +
            "Use different phrasing and energy for each field. Make the analysis feel distinct from the dog check-in style by focusing on the space, movement, and environment, with varied wording that feels specific to this room or area. " +
            "Do not make the output sound like a repeated template.";
        private const string DogEnvironmentCombinedPromptBase =
            "You are a warm, supportive wellness coach for dog owners, not a veterinarian. " +
            "Here is today's Dog Check-in: answers {0}, and the wellness reflection already generated: {1}. " +
            "{2} " +
            "Here is the user's most recent Environment & Flow Check-in for the space their dog spends time in: answers {3}, and its wellness reflection: {4}. " +
            "{5} " +
            "Considering the answers, prior reflections, AND any photos provided, give a combined overview in JSON: connectionObservations (how the dog's current state may relate to their environment), overallSummary (max 3 sentences, warm and supportive tone), recommendedHoundHeartActivity. " +
            "Never use clinical or diagnostic language, never recommend veterinary consultation.";

        // Progress comparison
        private const string ProgressPrompt =
            "You are a warm, supportive wellness coach. Compare this dog's/space's previous " +
            "check-in (answers: {0}, photo available: {1}) with today's check-in " +
            "(answers: {2}, photo available: {3}). Identify what has changed, highlight positive " +
            "progress, and gently note anything to continue focusing on. Use a different style than the main check-in response so this feels like a fresh comparison, not a repeated summary. " +
            "Respond in JSON: changesObserved (array of strings), positiveProgress (string), " +
            "areasToContinueFocusOn (string), overallImpression (string, max 2 sentences).";
        public WellnessCheckService(
            AppDbContext context,
            BlobStorageService blobService,
            IGeminiService geminiService,
            IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _blobService = blobService;
            _geminiService = geminiService;
            _scopeFactory = scopeFactory;
        }

        // ── Public entry point ───────────────────────────────────────────────

        public async Task<WellnessCheckResponseDto> SubmitAsync(
            Guid userId, WellnessCheckCreateDto dto, bool isSubscribed = false)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) throw new Exception("User not found.");

            string type = dto.Type;
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

            // 1. Upload optional photos
            string? photoUrl = null;
            var questionImages = new System.Collections.Generic.Dictionary<string, string>();

            if (!string.IsNullOrEmpty(dto.PhotoBase64))
            {
                byte[] photoBytes = ConvertBase64ToBytes(dto.PhotoBase64);
                photoUrl = await _blobService.UploadWellnessPhotoAsync(
                    photoBytes, userId.ToString(), type, $"photo1_{timestamp}.jpg");
                // Note: The main photo is for backward compatibility or when there are no individual questions
            }

            if (dto.PhotosBase64 != null && dto.PhotosBase64.Count > 0)
            {
                int index = 1;
                foreach (var kvp in dto.PhotosBase64)
                {
                    if (!string.IsNullOrEmpty(kvp.Value))
                    {
                        byte[] photoBytes = ConvertBase64ToBytes(kvp.Value);
                        // Use safe index for filename
                        string url = await _blobService.UploadWellnessPhotoAsync(
                            photoBytes, userId.ToString(), type, $"photo_{index}_{timestamp}.jpg");
                        
                        questionImages[kvp.Key] = url;
                        
                        if (photoUrl == null) photoUrl = url;
                        index++;
                    }
                }
            }
            string? photoUrlsJson = questionImages.Count > 0 ? JsonSerializer.Serialize(questionImages) : null;

            // 2. Serialize form answers
            string answersJson = JsonSerializer.Serialize(dto.Answers);

            // 3. FitBark enrichment — subscribed users + Dog Check-in only
            string? fitBarkSnapshot = null;
            if (isSubscribed && type == "DogCheckIn")
            {
                fitBarkSnapshot = await FetchFitBarkSnapshotAsync(userId);
            }

            // 4. Create DB record
            var check = new WellnessCheck
            {
                UserId = userId,
                Type = type,
                PhotoUrl = photoUrl,
                PhotoUrlsJson = photoUrlsJson,
                AnswersJson = answersJson,
                FitBarkDataSnapshotJson = fitBarkSnapshot,
                Status = "Pending"
            };
            _context.WellnessChecks.Add(check);
            await _context.SaveChangesAsync();

            // 5. Build Gemini prompt
            string photoText = questionImages.Count > 0
                ? $"They have also shared {questionImages.Count} photo(s) corresponding to their answers."
                : "They did not share a photo.";

            string prompt;
            if (type == "DogCheckIn")
            {
                prompt = !string.IsNullOrEmpty(fitBarkSnapshot)
                    ? string.Format(DogCheckInWithFitBarkPromptBase, answersJson, photoText, fitBarkSnapshot)
                    : string.Format(DogCheckInPromptBase, answersJson, photoText);
            }
            else
            {
                prompt = string.Format(EnvironmentPromptBase, answersJson, photoText);
            }

            // 6. Execute AI analysis
            if (type == "DogCheckIn")
            {
                // Synchronous — return immediately with result
                try
                {
                    string json = await _geminiService.AnalyzeWithContextAsync(prompt, dto.Answers, questionImages);
                    check.AiResponseJson = json;
                    check.Status = "Complete";
                    await _context.SaveChangesAsync();

                    // Create combined detailed overview if a matching environment check exists
                    var lastEnvironmentCheck = await _context.WellnessChecks
                        .Where(w => w.UserId == userId && w.Type == "EnvironmentFlow" && w.Status == "Complete")
                        .OrderByDescending(w => w.CreatedAt)
                        .FirstOrDefaultAsync();

                    if (lastEnvironmentCheck != null)
                    {
                        try
                        {
                            var envQuestionImages = new System.Collections.Generic.Dictionary<string, string>();
                            if (!string.IsNullOrEmpty(lastEnvironmentCheck.PhotoUrlsJson))
                            {
                                try
                                {
                                    envQuestionImages = JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, string>>(lastEnvironmentCheck.PhotoUrlsJson)
                                        ?? new System.Collections.Generic.Dictionary<string, string>();
                                }
                                catch
                                {
                                    var list = JsonSerializer.Deserialize<System.Collections.Generic.List<string>>(lastEnvironmentCheck.PhotoUrlsJson);
                                    if (list != null)
                                    {
                                        for (int i = 0; i < list.Count; i++)
                                        {
                                            envQuestionImages[$"env_photo_{i + 1}"] = list[i];
                                        }
                                    }
                                }
                            }
                            else if (!string.IsNullOrEmpty(lastEnvironmentCheck.PhotoUrl))
                            {
                                envQuestionImages["env_photo_1"] = lastEnvironmentCheck.PhotoUrl;
                            }

                            var combinedPrompt = string.Format(
                                DogEnvironmentCombinedPromptBase,
                                answersJson,
                                json,
                                questionImages.Count > 0 ? "Here is the photo shared with that check-in — please consider it directly." : string.Empty,
                                lastEnvironmentCheck.AnswersJson ?? "{}",
                                lastEnvironmentCheck.AiResponseJson ?? "{}",
                                envQuestionImages.Count > 0 ? "Here is the photo shared with that check-in — please consider it directly." : string.Empty
                            );

                            var combinedImages = new System.Collections.Generic.Dictionary<string, string>(questionImages);
                            foreach (var kvp in envQuestionImages)
                            {
                                if (!combinedImages.ContainsKey(kvp.Key))
                                {
                                    combinedImages[kvp.Key] = kvp.Value;
                                }
                                else
                                {
                                    combinedImages[$"Environment Photo ({kvp.Key})"] = kvp.Value;
                                }
                            }

                            if (!string.IsNullOrEmpty(check.PhotoUrl) && combinedImages.Count == 0)
                            {
                                combinedImages["Dog Photo"] = check.PhotoUrl;
                            }
                            if (!string.IsNullOrEmpty(lastEnvironmentCheck.PhotoUrl) && !combinedImages.ContainsKey("Environment Photo") && envQuestionImages.Count == 0)
                            {
                                combinedImages["Environment Photo"] = lastEnvironmentCheck.PhotoUrl;
                            }

                            string detailJson = await _geminiService.AnalyzeWithContextAsync(
                                combinedPrompt,
                                dto.Answers,
                                combinedImages
                            );

                            check.DetailedOverviewJson = detailJson;
                            check.EnvironmentCheckReferenceId = lastEnvironmentCheck.Id;
                            await _context.SaveChangesAsync();
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[WellnessCheckService] Detailed overview generation failed: {ex.Message}");
                        }
                    }

                    // Queue background progress comparison
                    QueueAutoProgressCheck(check.Id, userId, type);

                    return MapToDto(check, false, "Analysis complete.", lastEnvironmentCheck?.CreatedAt);
                }
                catch (Exception ex)
                {
                    check.Status = "Failed";
                    await _context.SaveChangesAsync();
                    throw new Exception("Failed to analyze dog check-in.", ex);
                }
            }
            else
            {
                // Asynchronous — queue and return immediately
                WellnessBackgroundWorker.QueueBackgroundWorkItem(async () =>
                {
                    using var scope = _scopeFactory.CreateScope();
                    var scopedContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var scopedGemini = scope.ServiceProvider.GetRequiredService<IGeminiService>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                    var dbCheck = await scopedContext.WellnessChecks.FindAsync(check.Id);
                    if (dbCheck == null) return;

                    try
                    {
                        System.Collections.Generic.Dictionary<string, string>? dbImages = null;
                        
                        if (!string.IsNullOrEmpty(dbCheck.PhotoUrlsJson))
                        {
                            try
                            {
                                // Try parsing as Dictionary
                                dbImages = JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, string>>(dbCheck.PhotoUrlsJson);
                            }
                            catch
                            {
                                // Fallback to list for older checks
                                var list = JsonSerializer.Deserialize<System.Collections.Generic.List<string>>(dbCheck.PhotoUrlsJson);
                                if (list != null && list.Count > 0)
                                {
                                    dbImages = new System.Collections.Generic.Dictionary<string, string>();
                                    // Just map to dummy keys for older checks
                                    for (int i = 0; i < list.Count; i++) dbImages[$"old_photo_{i}"] = list[i];
                                }
                            }
                        }

                        if ((dbImages == null || dbImages.Count == 0) && !string.IsNullOrEmpty(dbCheck.PhotoUrl))
                        {
                            dbImages = new System.Collections.Generic.Dictionary<string, string> { { "main", dbCheck.PhotoUrl } };
                        }
                        
                        var answersDict = !string.IsNullOrEmpty(dbCheck.AnswersJson) 
                            ? JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, string>>(dbCheck.AnswersJson) 
                            : new System.Collections.Generic.Dictionary<string, string>();

                        string json = await scopedGemini.AnalyzeWithContextAsync(prompt, answersDict ?? new System.Collections.Generic.Dictionary<string, string>(), dbImages);
                        dbCheck.AiResponseJson = json;
                        dbCheck.Status = "Complete";
                        await scopedContext.SaveChangesAsync();

                        await notificationService.SendNotificationAsync(
                            dbCheck.UserId,
                            "Wellness Check Complete",
                            "Your environment analysis is ready to view.",
                            "WellnessCheck");

                        await RunAutoProgressCheckAsync(
                            scopedContext, scopedGemini, dbCheck.Id, userId, type);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[WellnessCheckService] Async processing failed: {ex.Message}");
                        dbCheck.Status = "Failed";
                        await scopedContext.SaveChangesAsync();
                    }
                });

                return MapToDto(check, true, "We're reviewing this — we'll notify you when it's ready.");
            }
        }

        // ── FitBark data fetcher ─────────────────────────────────────────────

        /// <summary>
        /// Looks up the user's dog, matches it against FitBarkDogs by name,
        /// then fetches up to 48h of activity from FitBarkActivityLogs.
        /// Returns null silently if no device or data is found.
        /// </summary>
        private async Task<string?> FetchFitBarkSnapshotAsync(Guid userId)
        {
            try
            {
                // Find the user's active dog
                var dog = await _context.Dogs
                    .Where(d => d.UserId == userId && d.IsActive && !d.IsDeleted)
                    .FirstOrDefaultAsync();

                if (dog == null) return null;

                // Match dog to a FitBark device by name
                var fitBarkDog = await _context.FitBarkDogs
                    .Where(fb => fb.Name.ToLower() == dog.DogName.ToLower())
                    .FirstOrDefaultAsync();

                if (fitBarkDog == null) return null;

                // Pull last 48 hours of activity
                var cutoff = DateTime.UtcNow.AddHours(-48);
                var logs = await _context.FitBarkActivityLogs
                    .Where(a => a.DogSlug == fitBarkDog.DogSlug && a.ActivityDate >= cutoff)
                    .OrderByDescending(a => a.ActivityDate)
                    .Take(5)
                    .ToListAsync();

                if (logs == null || logs.Count == 0) return null;

                // Minimal, AI-friendly summary
                var snapshot = logs.Select(l => new
                {
                    date = l.ActivityDate.ToString("yyyy-MM-dd"),
                    activityValue = l.ActivityValue,
                    minutesPlay = l.MinPlay,
                    minutesActive = l.MinActive,
                    minutesRest = l.MinRest,
                    napTime = l.NapTime
                });

                return JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { WriteIndented = false });
            }
            catch (Exception ex)
            {
                // Non-fatal — never surface FitBark errors to the user
                Console.WriteLine($"[WellnessCheckService] FitBark fetch failed (non-fatal): {ex.Message}");
                return null;
            }
        }

        // ── Auto-Progress helpers ────────────────────────────────────────────

        private void QueueAutoProgressCheck(Guid currentCheckId, Guid userId, string type)
        {
            WellnessBackgroundWorker.QueueBackgroundWorkItem(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var scopedContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var scopedGemini = scope.ServiceProvider.GetRequiredService<IGeminiService>();
                await RunAutoProgressCheckAsync(scopedContext, scopedGemini, currentCheckId, userId, type);
            });
        }

        private async Task RunAutoProgressCheckAsync(
            AppDbContext context, IGeminiService gemini,
            Guid currentCheckId, Guid userId, string type)
        {
            try
            {
                var currentCheck = await context.WellnessChecks.FindAsync(currentCheckId);
                if (currentCheck == null) return;

                var previousCheck = await context.WellnessChecks
                    .Where(w => w.UserId == userId && w.Type == type
                             && w.Id != currentCheckId && w.Status == "Complete")
                    .OrderByDescending(w => w.CreatedAt)
                    .FirstOrDefaultAsync();

                if (previousCheck == null) return;

                string oldPhotoStr = previousCheck.PhotoUrl != null ? "Yes" : "No";
                string newPhotoStr = currentCheck.PhotoUrl != null ? "Yes" : "No";

                string comparePrompt = string.Format(ProgressPrompt,
                    previousCheck.AnswersJson ?? "None", oldPhotoStr,
                    currentCheck.AnswersJson ?? "None", newPhotoStr);

                string progressJson = await gemini.CompareChecksAsync(
                    comparePrompt, previousCheck.PhotoUrl, currentCheck.PhotoUrl);

                currentCheck.ProgressInsightJson = progressJson;
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WellnessCheckService] Auto-Progress check failed: {ex.Message}");
            }
        }

        // ── CRUD ─────────────────────────────────────────────────────────────

        public async Task<IEnumerable<WellnessCheckResponseDto>> GetHistoryAsync(Guid userId)
        {
            var checks = await _context.WellnessChecks
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.CreatedAt)
                .ToListAsync();

            var referenceIds = checks
                .Where(c => c.EnvironmentCheckReferenceId.HasValue)
                .Select(c => c.EnvironmentCheckReferenceId!.Value)
                .Distinct()
                .ToList();

            var referencedDates = referenceIds.Count > 0
                ? await _context.WellnessChecks
                    .Where(w => referenceIds.Contains(w.Id))
                    .ToDictionaryAsync(w => w.Id, w => w.CreatedAt)
                : new System.Collections.Generic.Dictionary<Guid, DateTime>();

            return checks.Select(c => MapToDto(
                c,
                false,
                null,
                c.EnvironmentCheckReferenceId.HasValue && referencedDates.TryGetValue(c.EnvironmentCheckReferenceId.Value, out var envCreatedAt)
                    ? envCreatedAt
                    : null));
        }

        public async Task<WellnessCheckResponseDto> GetByIdAsync(Guid userId, Guid checkId)
        {
            var check = await _context.WellnessChecks
                .FirstOrDefaultAsync(w => w.UserId == userId && w.Id == checkId);

            if (check == null) throw new Exception("Wellness check not found.");

            DateTime? envCreatedAt = null;
            if (check.EnvironmentCheckReferenceId.HasValue)
            {
                var envCheck = await _context.WellnessChecks
                    .Where(w => w.Id == check.EnvironmentCheckReferenceId.Value)
                    .Select(w => new { w.CreatedAt })
                    .FirstOrDefaultAsync();
                envCreatedAt = envCheck?.CreatedAt;
            }

            return MapToDto(check, false, null, envCreatedAt);
        }

        public async Task DeleteAsync(Guid userId, Guid checkId)
        {
            var check = await _context.WellnessChecks
                .FirstOrDefaultAsync(w => w.UserId == userId && w.Id == checkId);

            if (check == null) throw new Exception("Wellness check not found or access denied.");

            _context.WellnessChecks.Remove(check);
            await _context.SaveChangesAsync();
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private byte[] ConvertBase64ToBytes(string base64)
        {
            var base64Data = base64.Contains(",") ? base64.Split(',')[1] : base64;
            return Convert.FromBase64String(base64Data);
        }

        private WellnessCheckResponseDto MapToDto(WellnessCheck c, bool isAsync, string? msg, DateTime? environmentReferenceCreatedAt = null)
        {
            return new WellnessCheckResponseDto
            {
                Id = c.Id,
                Type = c.Type,
                PhotoUrl = c.PhotoUrl,
                PhotoUrlsJson = c.PhotoUrlsJson,
                AnswersJson = c.AnswersJson,
                AiResponseJson = c.AiResponseJson,
                DetailedOverviewJson = c.DetailedOverviewJson,
                EnvironmentCheckReferenceId = c.EnvironmentCheckReferenceId,
                EnvironmentReferenceCreatedAt = c.EnvironmentCheckReferenceId == null ? null : environmentReferenceCreatedAt,
                ProgressInsightJson = c.ProgressInsightJson,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                IsAsync = isAsync,
                Message = msg
            };
        }
    }
}
