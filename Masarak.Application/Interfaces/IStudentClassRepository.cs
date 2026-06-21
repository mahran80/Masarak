using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface IStudentClassRepository
    {
        Task<StudentClass?> GetByIdAsync(int studentClassId, CancellationToken ct = default);
        Task<bool> IsEnrolledAsync(int studentId, int classId, CancellationToken ct = default);
        Task<StudentClass?> GetByStudentAndYearAsync(int studentId, int academicYear, CancellationToken ct = default);
        Task<IEnumerable<StudentClass>> GetByStudentIdAsync(int studentId, int academicYear, CancellationToken ct = default);
        Task<IEnumerable<StudentClass>> GetByClassIdAsync(int classId, CancellationToken ct = default);
        Task AddAsync(StudentClass studentClass, CancellationToken ct = default);
        Task UpdateAsync(StudentClass studentClass, CancellationToken ct = default);
    }
}
