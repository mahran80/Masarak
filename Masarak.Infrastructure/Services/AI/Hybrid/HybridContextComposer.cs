using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class HybridContextComposer
    {
        private readonly Context _context;

        public HybridContextComposer(Context context)
        {
            _context = context;
        }

        public string SanitizeForPrompt(string input)
        {
            if (string.IsNullOrEmpty(input)) return input;
            
            // Strip prompt control characters and injection attempts
            return input
                .Replace("{", "")
                .Replace("}", "")
                .Replace("\n", " ")
                .Replace("\r", "")
                .Replace("ignore previous instructions", "", StringComparison.OrdinalIgnoreCase)
                .Trim()[..Math.Min(input.Length, 200)]; // hard cap on length
        }

        // Phase 2 Retrieval Enrichment: Injecting content items into context for weak lessons
        public async Task<object> EnrichContextWithContentItemsAsync(List<int> weakLessonIds, CancellationToken ct)
        {
            if (weakLessonIds == null || !weakLessonIds.Any())
                return new List<object>();

            var relevantItems = await _context.ContentItems
                .Where(c => c.LessonId.HasValue && weakLessonIds.Contains(c.LessonId.Value) && c.IsActive)
                .OrderBy(c => c.Type == Domain.Enums.ContentType.Video ? 0 : 1) // Prioritize videos
                .Take(5)
                .Select(c => new { c.ContentItemId, c.Title, c.Description, Type = c.Type.ToString() })
                .ToListAsync(ct);

            return relevantItems;
        }
    }
}
