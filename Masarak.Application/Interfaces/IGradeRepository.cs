using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface IGradeRepository
    {
        Task<Grade?> GetByIdAsync(int gradeId, CancellationToken ct = default);
        Task<IEnumerable<Grade>> GetAllActiveAsync(CancellationToken ct = default);
        Task<IEnumerable<Grade>> GetAllAsync(CancellationToken ct = default);
        Task AddAsync(Grade grade, CancellationToken ct = default);
        Task UpdateAsync(Grade grade, CancellationToken ct = default);
    }
}
