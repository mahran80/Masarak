using Masarak.Domain.Entities;
using Masarak.Domain.Enums;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Repository interface for Attendance entity.
    /// </summary>
    public interface IAttendanceRepository
    {
        Task<Attendance?> GetBySessionAndStudentAsync(int sessionId, int studentUserId, CancellationToken ct = default);
        Task<IEnumerable<Attendance>> GetBySessionIdAsync(int sessionId, CancellationToken ct = default);
        Task<IEnumerable<Attendance>> GetByStudentAndSubjectAsync(int studentUserId, int subjectId, int academicYear, CancellationToken ct = default);
        Task<IEnumerable<int>> GetStudentsWithoutAttendanceAsync(int sessionId, IEnumerable<int> enrolledStudentUserIds, CancellationToken ct = default);
        Task AddAsync(Attendance attendance, CancellationToken ct = default);
        Task UpdateAsync(Attendance attendance, CancellationToken ct = default);
        Task BulkAddAbsentAsync(IEnumerable<Attendance> absences, CancellationToken ct = default);
    }
}
