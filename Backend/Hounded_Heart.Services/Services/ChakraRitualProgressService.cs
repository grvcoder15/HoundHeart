using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class ChakraRitualProgressService
    {
        private readonly AppDbContext _context;

        public ChakraRitualProgressService(AppDbContext context) => _context = context;

        public async Task<ChakraProgressResponse?> GetProgress(Guid userId, Guid chakraId)
        {
            var p = await _context.ChakraRitualProgresses
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ChakraId == chakraId);

            if (p == null) return null;

            var minutes = (int)((p.LastPlayedPosition ?? 0) / 60);
            var seconds = (int)((p.LastPlayedPosition ?? 0) % 60);

            return new ChakraProgressResponse
            {
                ChakraId = p.ChakraId,
                LastPlayedPosition = p.LastPlayedPosition ?? 0,
                TotalDuration = p.TotalDuration ?? 0,
                IsCompleted = p.IsCompleted ?? false,
                FormattedTime = $"{minutes}:{seconds:D2}",
                Message = $"I had completed this {minutes} min:{seconds:D2} sec"
            };
        }

        public async Task SaveProgress(SaveChakraProgressRequest r)
        {
            const decimal epsilon = 0.50m; // half a second tolerance
            var existing = await _context.ChakraRitualProgresses
                .FirstOrDefaultAsync(x => x.UserId == r.UserId && x.ChakraId == r.ChakraId);

            var markCompleted = r.IsCompleted || (r.TotalDuration > 0 && r.CurrentPosition + epsilon >= r.TotalDuration);

            if (existing != null)
            {
                // Only advance position
                var newPosition = Math.Max(existing.LastPlayedPosition ?? 0, r.CurrentPosition);

                existing.LastPlayedPosition = newPosition;
                existing.TotalDuration = Math.Max(existing.TotalDuration ?? 0, r.TotalDuration);
                existing.IsCompleted = existing.IsCompleted == true || markCompleted;
                existing.LastPlayedDate = DateTime.UtcNow;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.ChakraRitualProgresses.Add(new ChakraRitualProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = r.UserId,
                    ChakraId = r.ChakraId,
                    LastPlayedPosition = r.CurrentPosition,
                    TotalDuration = r.TotalDuration,
                    IsCompleted = markCompleted,
                    LastPlayedDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            // Sync with ChakraLog for Dashboard if completed
            if (markCompleted)
            {
                // Extract date part only for LogDate
                var targetDate = r.Date?.Date ?? DateTime.UtcNow.Date;
                await SyncWithChakraLog(r.UserId, r.ChakraId, targetDate);
            }

            await _context.SaveChangesAsync();
        }

        private async Task SyncWithChakraLog(Guid userId, Guid chakraId, DateTime clientDate)
        {
            var chakra = await _context.Chakras.FirstOrDefaultAsync(c => c.ChakraId == chakraId);
            if (chakra == null) return;

            var today = clientDate.Date;
            var log = await _context.ChakraLogs
                .Where(x => x.UserId == userId && (x.LogDate == today || (x.LogDate == null && x.CreatedAt.Date == today)))
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (log == null)
            {
                log = new ChakraLog
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    LogDate = today
                };
                _context.ChakraLogs.Add(log);
            }

            // Map chakra name to specific field
            // Note: Dashboard logic counts scores >= 7
            switch (chakra.ChakraName)
            {
                case "Root Chakra": log.RootScore = 10; break;
                case "Sacral Chakra": log.SacralScore = 10; break;
                case "Solar Plexus": log.SolarPlexusScore = 10; break;
                case "Heart Chakra": log.HeartScore = 10; break;
                case "Throat Chakra": log.ThroatScore = 10; break;
                case "Third Eye": log.ThirdEyeScore = 10; break;
                case "Crown Chakra": log.CrownScore = 10; break;
            }
        }

        public async Task<IEnumerable<ChakraProgressResponse>> GetAllUserProgress(Guid userId)
        {
            var list = await _context.ChakraRitualProgresses
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return list.Select(p =>
            {
                var minutes = (int)((p.LastPlayedPosition ?? 0) / 60);
                var seconds = (int)((p.LastPlayedPosition ?? 0) % 60);
                return new ChakraProgressResponse
                {
                    ChakraId = p.ChakraId,
                    LastPlayedPosition = p.LastPlayedPosition ?? 0,
                    TotalDuration = p.TotalDuration ?? 0,
                    IsCompleted = p.IsCompleted ?? false,
                    FormattedTime = $"{minutes}:{seconds:D2}",
                    Message = $"I had completed this {minutes} min:{seconds:D2} sec"
                };
            });
        }
    }
}
