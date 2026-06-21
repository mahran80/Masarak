using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Session management for teachers and schedule queries for students.
    /// </summary>
    public interface ISessionService
    {
        // ── Teacher ─────────────────────────────────────────────────────────
        Task<IEnumerable<TeachingAssignmentDto>> GetTeacherAssignmentsAsync(int userId, int academicYear, CancellationToken ct = default);
        Task<SessionDto> ScheduleSessionAsync(int userId, ScheduleSessionRequest request, CancellationToken ct = default);
        Task<SessionDto> UpdateSessionAsync(int userId, int sessionId, UpdateSessionRequest request, CancellationToken ct = default);
        Task CancelSessionAsync(int userId, int sessionId, CancellationToken ct = default);
        Task<IEnumerable<SessionDto>> GetTeacherSessionsAsync(int userId, DateTime from, DateTime to, CancellationToken ct = default);

        // ── Student ─────────────────────────────────────────────────────────
        Task<StudentEnrollmentDto?> GetStudentEnrollmentAsync(int userId, int academicYear, CancellationToken ct = default);
        Task<WeeklyScheduleDto> GetStudentScheduleAsync(int userId, int academicYear, DateTime weekStart, CancellationToken ct = default);
    }
}
