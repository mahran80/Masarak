using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface ITeachingAssignmentRepository
    {
        Task<TeachingAssignment?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<TeachingAssignment?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default);
        Task<bool> AssignmentExistsAsync(int teacherId, int classId, int subjectId, int academicYear, CancellationToken ct = default);
        Task<IEnumerable<TeachingAssignment>> GetByTeacherIdAsync(int teacherId, int academicYear, CancellationToken ct = default);
        Task<IEnumerable<TeachingAssignment>> GetByClassIdAsync(int classId, int academicYear, CancellationToken ct = default);
        Task AddAsync(TeachingAssignment assignment, CancellationToken ct = default);
        Task UpdateAsync(TeachingAssignment assignment, CancellationToken ct = default);
    }
}
