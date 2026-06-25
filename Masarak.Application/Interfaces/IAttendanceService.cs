using Masarak.Application.DTOs;
using Masarak.Domain.Enums;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Service interface for Attendance operations.
    /// </summary>
    public interface IAttendanceService
    {
        /// <summary>Records student presence when joining a live session.</summary>
        Task<AttendanceDto> RecordAttendanceAsync(int studentUserId, int sessionId, CancellationToken ct = default);

        /// <summary>Teacher overrides an attendance record.</summary>
        Task<AttendanceDto> OverrideAttendanceAsync(int teacherUserId, int attendanceId, AttendanceStatus newStatus, string? note, CancellationToken ct = default);

        /// <summary>Gets attendance roster for a specific session (teacher view).</summary>
        Task<SessionAttendanceDto> GetSessionAttendanceAsync(int teacherUserId, int sessionId, CancellationToken ct = default);

        /// <summary>Gets student's attendance summary per subject (student view).</summary>
        Task<IEnumerable<SubjectAttendanceDto>> GetStudentAttendanceAsync(int studentUserId, int academicYear, CancellationToken ct = default);

        /// <summary>Gets attendance summary for a linked student (parent view).</summary>
        Task<IEnumerable<SubjectAttendanceDto>> GetStudentAttendanceForParentAsync(int parentUserId, int studentUserId, int academicYear, CancellationToken ct = default);
    }
}
