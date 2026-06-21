using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Domain.Services;
using Masarak.Domain.ValueObjects;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Session management for teachers and schedule queries for students.
    /// Includes schedule conflict detection via ScheduleConflictChecker.
    /// </summary>
    public class SessionService : ISessionService
    {
        private readonly ISessionRepository _sessionRepo;
        private readonly ITeachingAssignmentRepository _assignmentRepo;
        private readonly IStudentClassRepository _studentClassRepo;
        private readonly ScheduleConflictChecker _conflictChecker;
        private readonly Context _context;

        public SessionService(
            ISessionRepository sessionRepo,
            ITeachingAssignmentRepository assignmentRepo,
            IStudentClassRepository studentClassRepo,
            ScheduleConflictChecker conflictChecker,
            Context context)
        {
            _sessionRepo     = sessionRepo;
            _assignmentRepo  = assignmentRepo;
            _studentClassRepo = studentClassRepo;
            _conflictChecker = conflictChecker;
            _context         = context;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // TEACHER OPERATIONS
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<TeachingAssignmentDto>> GetTeacherAssignmentsAsync(
            int userId, int academicYear, CancellationToken ct = default)
        {
            // Resolve TeacherId from UserId
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found for this user.");

            var assignments = await _assignmentRepo.GetByTeacherIdAsync(teacher.TeacherId, academicYear, ct);
            return assignments.Select(ta => new TeachingAssignmentDto(
                ta.AssignmentId,
                ta.TeacherId,
                ta.Teacher?.User?.FullName ?? "",
                ta.Class?.Name ?? "",
                ta.Subject?.Name ?? "",
                ta.AcademicYear,
                ta.IsActive));
        }

        public async Task<SessionDto> ScheduleSessionAsync(
            int userId, ScheduleSessionRequest request, CancellationToken ct = default)
        {
            // 1. Load teaching assignment and verify ownership
            var assignment = await _assignmentRepo.GetByIdWithDetailsAsync(request.TeachingAssignmentId, ct)
                ?? throw new KeyNotFoundException($"Teaching assignment {request.TeachingAssignmentId} not found.");

            if (assignment.Teacher.UserId != userId)
                throw new UnauthorizedAccessException("You are not assigned to this class-subject combination.");

            // 2. Check for schedule conflicts
            var classId = assignment.ClassId;
            var scheduledDate = request.ScheduledAt.Date;
            var existingSessions = await _sessionRepo.GetByClassIdAsync(
                classId,
                scheduledDate,
                scheduledDate.AddDays(1),
                ct);

            var proposed = new TimeSlot(request.ScheduledAt, request.DurationMinutes);
            if (_conflictChecker.HasConflict(existingSessions, proposed))
                throw new InvalidOperationException(
                    $"Schedule conflict: class already has a session at this time ({request.ScheduledAt:HH:mm} - {proposed.End:HH:mm}).");

            // 3. Create session
            var session = Session.Schedule(
                request.TeachingAssignmentId,
                classId,
                request.Title,
                request.Description,
                request.ScheduledAt,
                request.DurationMinutes,
                request.EmbedUrl);

            await _sessionRepo.AddAsync(session, ct);

            // 4. Reload with navigations for response
            var loaded = await _sessionRepo.GetByIdWithDetailsAsync(session.SessionId, ct);
            return MapSession(loaded!);
        }

        public async Task<SessionDto> UpdateSessionAsync(
            int userId, int sessionId, UpdateSessionRequest request, CancellationToken ct = default)
        {
            var session = await _sessionRepo.GetByIdWithDetailsAsync(sessionId, ct)
                ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

            // Verify ownership
            if (session.TeachingAssignment.Teacher.UserId != userId)
                throw new UnauthorizedAccessException("You can only update your own sessions.");

            if (session.Status == SessionStatus.Cancelled || session.Status == SessionStatus.Completed)
                throw new InvalidOperationException($"Cannot update a {session.Status} session.");

            // Check for conflicts (excluding this session)
            var scheduledDate = request.ScheduledAt.Date;
            var existingSessions = (await _sessionRepo.GetByClassIdAsync(
                session.ClassId, scheduledDate, scheduledDate.AddDays(1), ct))
                .Where(s => s.SessionId != sessionId);

            var proposed = new TimeSlot(request.ScheduledAt, request.DurationMinutes);
            if (_conflictChecker.HasConflict(existingSessions, proposed))
                throw new InvalidOperationException(
                    $"Schedule conflict: class already has a session at this time ({request.ScheduledAt:HH:mm} - {proposed.End:HH:mm}).");

            session.Title           = request.Title;
            session.Description     = request.Description;
            session.ScheduledAt     = request.ScheduledAt;
            session.DurationMinutes = request.DurationMinutes;
            session.EmbedUrl        = request.EmbedUrl;

            await _sessionRepo.UpdateAsync(session, ct);

            var loaded = await _sessionRepo.GetByIdWithDetailsAsync(sessionId, ct);
            return MapSession(loaded!);
        }

        public async Task CancelSessionAsync(int userId, int sessionId, CancellationToken ct = default)
        {
            var session = await _sessionRepo.GetByIdWithDetailsAsync(sessionId, ct)
                ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

            if (session.TeachingAssignment.Teacher.UserId != userId)
                throw new UnauthorizedAccessException("You can only cancel your own sessions.");

            session.Cancel();
            await _sessionRepo.UpdateAsync(session, ct);
        }

        public async Task<IEnumerable<SessionDto>> GetTeacherSessionsAsync(
            int userId, DateTime from, DateTime to, CancellationToken ct = default)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found for this user.");

            var sessions = await _sessionRepo.GetByTeacherIdAsync(teacher.TeacherId, from, to, ct);
            return sessions.Select(MapSession);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STUDENT OPERATIONS
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<StudentEnrollmentDto?> GetStudentEnrollmentAsync(
            int userId, int academicYear, CancellationToken ct = default)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Student profile not found for this user.");

            var enrollment = await _studentClassRepo.GetByStudentAndYearAsync(student.StudentId, academicYear, ct);
            if (enrollment == null) return null;

            return new StudentEnrollmentDto(
                enrollment.ClassId,
                enrollment.Class?.Name ?? "",
                enrollment.Class?.Grade?.Name ?? "",
                enrollment.AcademicYear);
        }

        public async Task<WeeklyScheduleDto> GetStudentScheduleAsync(
            int userId, int academicYear, DateTime weekStart, CancellationToken ct = default)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Student profile not found for this user.");

            var enrollment = await _studentClassRepo.GetByStudentAndYearAsync(student.StudentId, academicYear, ct)
                ?? throw new KeyNotFoundException("Student is not enrolled in any class for this academic year.");

            var weekEnd = weekStart.AddDays(7);
            var sessions = await _sessionRepo.GetByClassIdAsync(enrollment.ClassId, weekStart, weekEnd, ct);

            return new WeeklyScheduleDto(
                weekStart,
                weekEnd,
                sessions.Select(MapSession));
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════════════

        private static SessionDto MapSession(Session s) =>
            new(s.SessionId,
                s.Title,
                s.Description,
                s.ScheduledAt,
                s.DurationMinutes,
                s.EndsAt,
                s.EmbedUrl,
                s.Status,
                s.TeachingAssignment?.Subject?.Name ?? "",
                s.Class?.Name ?? "",
                s.TeachingAssignment?.Teacher?.User?.FullName ?? "");
    }
}
