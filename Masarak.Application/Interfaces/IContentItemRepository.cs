using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Repository interface for ContentItem entity.
    /// </summary>
    public interface IContentItemRepository
    {
        Task<ContentItem?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<IEnumerable<ContentItem>> GetByTeachingAssignmentIdAsync(int taId, CancellationToken ct = default);
        Task<IEnumerable<ContentItem>> GetBySubjectAndClassAsync(int subjectId, int classId, CancellationToken ct = default);
        Task AddAsync(ContentItem item, CancellationToken ct = default);
        Task UpdateAsync(ContentItem item, CancellationToken ct = default);
    }
}
