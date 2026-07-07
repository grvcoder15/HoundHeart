using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _apiKey;

       private const string FlashModel = "gemini-2.5-flash";
private const string ProModel   = "gemini-2.5-flash";
        private const string BaseUrl    = "https://generativelanguage.googleapis.com/v1beta/models";

        public GeminiService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini:ApiKey is not configured.");
        }

        // ── Main Check-in: answers + optional image, Gemini Flash ─────────────
        public async Task<string> AnalyzeWithContextAsync(string prompt, System.Collections.Generic.Dictionary<string, string> answers, System.Collections.Generic.Dictionary<string, string>? questionImages = null)
        {
            return await CallGeminiAsync(FlashModel, prompt, answers, questionImages);
        }

        // ── Auto-Progress: old data + new data, Gemini Pro ─────────────
        public async Task<string> CompareChecksAsync(string prompt, string? oldImageUrl, string? newImageUrl)
        {
            var images = new System.Collections.Generic.Dictionary<string, string>();
            if (!string.IsNullOrEmpty(oldImageUrl)) images["Old Check"] = oldImageUrl;
            if (!string.IsNullOrEmpty(newImageUrl)) images["New Check"] = newImageUrl;
            
            var answers = new System.Collections.Generic.Dictionary<string, string>();
            // Since we're just comparing, we can pass images in the dictionary, but the text prompt will handle the reasoning
            // We just need to attach the images.
            
            // Re-implement the base CallGeminiAsync to support raw image appends if no answers provided
            return await CallGeminiAsync(ProModel, prompt, null, images);
        }

        // ── Core API Call ─────────────────────────────────────────────────────
        private async Task<string> CallGeminiAsync(string modelName, string systemPrompt, System.Collections.Generic.Dictionary<string, string>? answers = null, System.Collections.Generic.Dictionary<string, string>? questionImages = null)
        {
            var requestUrl = $"{BaseUrl}/{modelName}:generateContent?key={_apiKey}";
            using var client = _httpClientFactory.CreateClient("gemini");

            var parts = new System.Collections.Generic.List<object>();
            
            // Start with the main system instruction/prompt
            parts.Add(new { text = systemPrompt });

            if (answers != null)
            {
                foreach (var kvp in answers)
                {
                    string qText = kvp.Key;
                    string aText = kvp.Value;
                    
                    parts.Add(new { text = $"Question: {qText}\nAnswer: {aText}" });

                    if (questionImages != null && questionImages.TryGetValue(qText, out string? imgUrl) && !string.IsNullOrEmpty(imgUrl))
                    {
                        try
                        {
                            byte[] imageBytes = await client.GetByteArrayAsync(imgUrl);
                            string base64 = Convert.ToBase64String(imageBytes);
                            string mimeType = imgUrl.ToLower().EndsWith(".png") ? "image/png" : "image/jpeg";

                            parts.Add(new
                            {
                                inlineData = new
                                {
                                    mimeType = mimeType,
                                    data = base64
                                }
                            });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[GeminiService] Failed to download image for question '{qText}' from {imgUrl}: {ex.Message}");
                        }
                    }
                }
            }
            else if (questionImages != null && questionImages.Count > 0)
            {
                // Fallback for CompareChecksAsync where we just append images
                foreach (var kvp in questionImages)
                {
                    try
                    {
                        byte[] imageBytes = await client.GetByteArrayAsync(kvp.Value);
                        string base64 = Convert.ToBase64String(imageBytes);
                        string mimeType = kvp.Value.ToLower().EndsWith(".png") ? "image/png" : "image/jpeg";

                        parts.Add(new { text = $"[Image: {kvp.Key}]" });
                        parts.Add(new
                        {
                            inlineData = new
                            {
                                mimeType = mimeType,
                                data = base64
                            }
                        });
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[GeminiService] Failed to download image for '{kvp.Key}' from {kvp.Value}: {ex.Message}");
                    }
                }
            }

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = parts.ToArray()
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            var json    = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(requestUrl, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[GeminiService] Error {response.StatusCode}: {responseBody}");
                throw new Exception($"Gemini API error: {response.StatusCode}");
            }

            // Extract the text content from Gemini's response envelope
            using var doc = JsonDocument.Parse(responseBody);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? "{}";
        }
    }
}
