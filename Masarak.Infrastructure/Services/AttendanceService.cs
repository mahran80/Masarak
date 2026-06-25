using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Domain.Services;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Phase 4: Service implementation for Attendance operations.
    /// </summary>
    public class AttendanceService : IAttendanceService
    {
        private readonly IAttendanceRepository _attendanceRepo;
        private readonly ISessionRepository _sessionRepo;
        private readonly IStudentClassRepository _studentClassRepo;
        private readonly ITeachingAssignmentRepository _taRepo;
        private readonly IParentStudentLinkRepository _parentLinkRepo;
        private readonly AttendanceWindowChecker _windowChecker;
        private readonly Context _context;

        public AttendanceService(
            IAttendanceRepository attendanceRepo,
            ISessionRepository sessionRepo,
            IStudentClassRepository studentClassRepo,
            ITeachingAssignmentRepository taRepo,
            IParentStudentLinkRepository parentLinkRepo,
            AttendanceWindowChecker windowChecker,
            Context context)
        {
            _attendanceRepo   = attendanceRepo;
            _sessionRepo      = sessionRepo;
            _studentClassRepo = studentClassRepo;
            _taRepo           = taRepo;
            _parentLinkRepo   = parentLinkRepo;
            _windowChecker    = windowChecker;
            _context          = context;
        }

        public async Task<AttendanceDto> RecordAttendanceAsync(int studentUserId, int sessionId, CancellationToken ct = default)
        {
            // 1. Load session, verify it exists and is not cancelled
            var session = await _sessionRepo.GetByIdWithDetailsAsync(sessionId, ct)
                ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

            if (session.Status == SessionStatus.Cancelled)
                throw new InvalidOperationException("Cannot join a cancelled session.");

            // 2. Verify join window
            var now = DateTime.UtcNow;
            if (!_windowChecker.IsWithinJoinWindow(session, now))
                throw new InvalidOperationException("Session join window has expired or has not started yet.");

            // 3. Verify student is enrolled in the session's class
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == studentUserId, ct)
                ?? throw new KeyNotFoundException("Student profile not found.");

            var isEnrolled = await _studentClassRepo.IsEnrolledAsync(student.StudentId, session.ClassId, ct);
            if (!isEnrolled)
                throw new UnauthorizedAccessException("Student is not enrolled in this class.");

            // 4. Check for existing attendance (idempotent)
            var existing = await _attendanceRepo.GetBySessionAndStudentAsync(sessionId, studentUserId, ct);
            if (existing != null && existing.Status == AttendanceStatus.Present)
            {
                return MapToDto(existing, session.Title, student.User?.FullName ?? "");
            }

            // 5. Create and persist attendance record
            var attendance = Attendance.RecordPresent(sessionId, studentUserId, now);
            await _attendanceRepo.AddAsync(attendance, ct);

            var user = await _context.Users.FindAsync(new object[] { studentUserId }, ct);
            return MapToDto(attendance, session.Title, user?.FullName ?? "");
        }

        public async Task<AttendanceDto> OverrideAttendanceAsync(int teacherUserId, int attendanceId, AttendanceStatus newStatus, string? note, CancellationToken ct = default)
        {
            var attendance = await _context.Attendances
                .Include(a => a.Session)
                    .ThenInclude(s => s.TeachingAssignment)
                .Include(a => a.Student)
                .FirstOrDefaultAsync(a => a.AttendanceId == attendanceId, ct)
                ?? throw new KeyNotFoundException($"Attendance record {attendanceId} not found.");

            // Verify teacher owns this session
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found.");

            if (attendance.Session.TeachingAssignment.TeacherId != teacher.TeacherId)
                throw new UnauthorizedAccessException("You are not the teacher for this session.");

            attendance.Override(newStatus, note);
            await _attendanceRepo.UpdateAsync(attendance, ct);

            return MapToDto(attendance, attendance.Session.Title, attendance.Student?.FullName ?? "");
        }

        public async Task<SessionAttendanceDto> GetSessionAttendanceAsync(int teacherUserId, int sessionId, CancellationToken ct = default)
        {
            var session = await _sessionRepo.GetByIdWithDetailsAsync(sessionId, ct)
                ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

            // Verify teacher owns this session
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found.");

            if (session.TeachingAssignment.TeacherId != teacher.TeacherId)
                throw new UnauthorizedAccessException("You are not the teacher for this session.");

            var records = await _attendanceRepo.GetBySessionIdAsync(sessionId, ct);
            var recordsList = records.ToList();

            // Get total enrolled students
            var enrolledStudents = await _studentClassRepo.GetByClassIdAsync(session.ClassId, ct);
            var totalEnrolled = enrolledStudents.Count();

            var presentCount = recordsList.Count(r => r.Status == AttendanceStatus.Present);
            var absentCount  = recordsList.Count(r => r.Status == AttendanceStatus.Absent);
            var excusedCount = recordsList.Count(r => r.Status == AttendanceStatus.Excused);

            return new SessionAttendanceDto(
                SessionId:     sessionId,
                SessionTitle:  session.Title,
                ScheduledAt:   session.ScheduledAt,
                TotalEnrolled: totalEnrolled,
                PresentCount:  presentCount,
                AbsentCount:   absentCount,
                ExcusedCount:  excusedCount,
                Records:       recordsList.Select(r => MapToDto(r, session.Title, r.Student?.FullName ?? ""))
            );
        }

        public async Task<IEnumerable<SubjectAttendanceDto>> GetStudentAttendanceAsync(int studentUserId, int academicYear, CancellationToken ct = default)
        {
            return await BuildSubjectAttendance(studentUserId, academicYear, ct);
        }

        public async Task<IEnumerable<SubjectAttendanceDto>> GetStudentAttendanceForParentAsync(int parentUserId, int studentUserId, int academicYear, CancellationToken ct = default)
        {
            // Verify parent-student link
            var isLinked = await _parentLinkRepo.LinkExistsAsync(parentUserId, studentUserId, ct);
            if (!isLinked)
                throw new UnauthorizedAccessException("You are not linked to this student.");

            return await BuildSubjectAttendance(studentUserId, academicYear, ct);
        }

        // ── Private Helpers ─────────────────────────────────────────────────

        private async Task<IEnumerable<SubjectAttendanceDto>> BuildSubjectAttendance(int studentUserId, int academicYear, CancellationToken ct)
        {
            var student = await _context.Students
                .Include(s => s.StudentClasses)
                .FirstOrDefaultAsync(s => s.UserId == studentUserId, ct)
                ?? throw new KeyNotFoundException("Student profile not found.");

            // Get all teaching assignments for student's enrolled classes
            var enrolledClass = student.StudentClasses
                .FirstOrDefault(sc => sc.AcademicYear == academicYear && sc.IsActive);

            if (enrolledClass == null)
                return Enumerable.Empty<SubjectAttendanceDto>();

            var teachingAssignments = await _taRepo.GetByClassIdAsync(enrolledClass.ClassId, academicYear, ct);
            var result = new List<SubjectAttendanceDto>();

            foreach (var ta in teachingAssignments)
            {
                var subject = await _context.Subjects.FindAsync(new object[] { ta.SubjectId }, ct);
                if (subject == null) continue;

                // Get total sessions for this subject
                var sessions = await _sessionRepo.GetByTeachingAssignmentIdAsync(ta.AssignmentId, ct);
                var sessionList = sessions.Where(s => s.Status != SessionStatus.Cancelled).ToList();
                var totalSessions = sessionList.Count;

                if (totalSessions == 0)
                {
                    result.Add(new SubjectAttendanceDto(
                        SubjectId: ta.SubjectId, SubjectName: subject.Name,
                        TotalSessions: 0, PresentCount: 0, AbsentCount: 0, ExcusedCount: 0,
                        AttendancePercentage: 100m));
                    continue;
                }

                // Get attendance records for this student in this subject
                var attendanceRecords = await _attendanceRepo.GetByStudentAndSubjectAsync(
                    studentUserId, ta.SubjectId, academicYear, ct);
                var attendanceList = attendanceRecords.ToList();

                var presentCount = attendanceList.Count(a => a.Status == AttendanceStatus.Present);
                var absentCount  = attendanceList.Count(a => a.Status == AttendanceStatus.Absent);
                var excusedCount = attendanceList.Count(a => a.Status == AttendanceStatus.Excused);

                // AttendancePercentage = (Present + Excused) / Total Sessions × 100
                var percentage = totalSessions > 0
                    ? Math.Round((presentCount + excusedCount) / (decimal)totalSessions * 100, 2)
                    : 100m;

                result.Add(new SubjectAttendanceDto(
                    SubjectId: ta.SubjectId, SubjectName: subject.Name,
                    TotalSessions: totalSessions, PresentCount: presentCount,
                    AbsentCount: absentCount, ExcusedCount: excusedCount,
                    AttendancePercentage: percentage));
            }

            return result;
        }

        private static AttendanceDto MapToDto(Attendance a, string sessionTitle, string studentName)
            => new(
                AttendanceId: a.AttendanceId,
                SessionId:    a.SessionId,
                SessionTitle: sessionTitle,
                StudentUserId: a.StudentUserId,
                StudentName:  studentName,
                Status:       a.Status,
                JoinedAt:     a.JoinedAt,
                TeacherNote:  a.TeacherNote);
    }
}
