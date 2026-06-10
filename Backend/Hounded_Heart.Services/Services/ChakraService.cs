using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class ChakraService
    {
        private readonly AppDbContext _context;

        public ChakraService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Calculate Harmony Score (average of all 7 chakra scores)
        /// </summary>
        public float CalculateHarmonyScore(int root, int sacral, int solarPlexus, int heart, int throat, int thirdEye, int crown)
        {
            var scores = new List<int> { root, sacral, solarPlexus, heart, throat, thirdEye, crown };
            return (float)scores.Average();
        }

        /// <summary>
        /// Identify the weakest (lowest score) chakra
        /// Tie-breaker: Prioritize lower/foundational chakras (Root > Sacral > Solar Plexus > Heart > Throat > Third Eye > Crown)
        /// </summary>
        public string GetDominantBlockage(int root, int sacral, int solarPlexus, int heart, int throat, int thirdEye, int crown)
        {
            var chakraMap = new Dictionary<string, int>
            {
                { "Root", root },
                { "Sacral", sacral },
                { "Solar Plexus", solarPlexus },
                { "Heart", heart },
                { "Throat", throat },
                { "Third Eye", thirdEye },
                { "Crown", crown }
            };

            // Find minimum score
            int minScore = chakraMap.Values.Min();

            // Get all chakras with the minimum score (in case of ties)
            var weakestChakras = chakraMap.Where(x => x.Value == minScore).Select(x => x.Key).ToList();

            // Priority order (lower chakras first)
            var priorityOrder = new List<string> { "Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third Eye", "Crown" };

            // Return the first chakra in priority order that has the minimum score
            return priorityOrder.First(chakra => weakestChakras.Contains(chakra));
        }

        /// <summary>
        /// Get the audio URL for a specific chakra from the database
        /// </summary>
        public async Task<string?> GetChakraAudioUrlAsync(string chakraName)
        {
            var chakra = await _context.Chakras
                .Where(c => c.ChakraName == chakraName && c.IsActive && !c.IsDeleted)
                .FirstOrDefaultAsync();

            return chakra?.AudioUrl;
        }

        /// <summary>
        /// Save or update audio URL for a specific chakra
        /// </summary>
        public async Task<bool> UpdateChakraAudioUrlAsync(string chakraName, string audioUrl)
        {
            var chakra = await _context.Chakras
                .Where(c => c.ChakraName == chakraName && !c.IsDeleted)
                .FirstOrDefaultAsync();

            if (chakra == null)
                return false;

            chakra.AudioUrl = audioUrl;
            chakra.UpdatedOn = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Get all chakras with their audio URLs
        /// </summary>
        public async Task<List<Chakra>> GetAllChakrasAsync()
        {
            return await _context.Chakras
                .Where(c => c.IsActive && !c.IsDeleted)
                .OrderBy(c => c.ChakraName)
                .ToListAsync();
        }
    }
}
