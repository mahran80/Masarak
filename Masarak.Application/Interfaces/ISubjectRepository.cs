using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface ISubjectRepository
    {
        Task<Subject?> GetByIdAsync(int subjectId, CancellationToken ct = default);
        Task<IEnumerable<Subject>> GetByGradeIdAsync(int gradeId, CancellationToken ct = default);
        Task AddAsync(Subject subject, CancellationToken ct = default);
        Task UpdateAsync(Subject subject, CancellationToken ct = default);
    }
}
