using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface IClassRepository
    {
        Task<Class?> GetByIdAsync(int classId, CancellationToken ct = default);
        Task<Class?> GetByIdWithGradeAsync(int classId, CancellationToken ct = default);
        Task<IEnumerable<Class>> GetByGradeIdAsync(int gradeId, int academicYear, CancellationToken ct = default);
        Task<int> GetEnrollmentCountAsync(int classId, CancellationToken ct = default);
        Task AddAsync(Class cls, CancellationToken ct = default);
        Task UpdateAsync(Class cls, CancellationToken ct = default);
    }
}
