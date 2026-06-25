using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    /// <summary>
    /// Phase 4: Repository implementation for ContentItem entity.
    /// </summary>
    public class ContentItemRepository : IContentItemRepository
    {
        private readonly Context _context;

        public ContentItemRepository(Context context)
        {
            _context = context;
        }

        public async Task<ContentItem?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.ContentItems
                .Include(c => c.TeachingAssignment)
                    .ThenInclude(ta => ta.Teacher)
                .FirstOrDefaultAsync(c => c.ContentItemId == id, ct);
        }

        public async Task<IEnumerable<ContentItem>> GetByTeachingAssignmentIdAsync(int taId, CancellationToken ct = default)
        {
            return await _context.ContentItems
                .Where(c => c.TeachingAssignmentId == taId && c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<ContentItem>> GetBySubjectAndClassAsync(int subjectId, int classId, CancellationToken ct = default)
        {
            return await _context.ContentItems
                .Include(c => c.TeachingAssignment)
                .Where(c => c.TeachingAssignment.SubjectId == subjectId
                    && c.TeachingAssignment.ClassId == classId
                    && c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task AddAsync(ContentItem item, CancellationToken ct = default)
        {
            await _context.ContentItems.AddAsync(item, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(ContentItem item, CancellationToken ct = default)
        {
            _context.ContentItems.Update(item);
            await _context.SaveChangesAsync(ct);
        }
    }
}
