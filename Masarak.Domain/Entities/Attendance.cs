using Masarak.Domain.Enums;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Records a Student's presence in a Session.
    /// Unique per (SessionId, StudentUserId).
    ///
    /// Phase 4 changes:
    ///   • StudentUserId replaces StudentId (links to User directly, matching Phase 4 spec)
    ///   • Status uses AttendanceStatus enum instead of string
    ///   • Added TeacherNote for manual overrides
    ///   • Added RecordedAt timestamp
    ///   • Factory methods: RecordPresent(), RecordAbsent()
    ///   • Domain method: Override()
    ///   • Private parameterless constructor for EF Core
    /// </summary>
    public class Attendance
    {
        public int              AttendanceId  { get; private set; }
        public int              SessionId     { get; private set; }   // FK → sessions.SessionId
        public int              StudentUserId { get; private set; }   // FK → users.UserId (student)
        public AttendanceStatus Status        { get; private set; }   // Present, Absent, Excused
        public DateTime?        JoinedAt      { get; private set; }   // UTC timestamp of join event
        public string?          TeacherNote   { get; private set; }   // populated on manual override
        public DateTime         RecordedAt    { get; private set; }

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Session Session { get; private set; } = null!;
        public virtual User    Student { get; private set; } = null!;

        // ── Private parameterless constructor (for EF Core) ─────────────────
        private Attendance() { }

        // ── Factory Methods ─────────────────────────────────────────────────
        public static Attendance RecordPresent(int sessionId, int studentUserId, DateTime joinedAt)
            => new()
            {
                SessionId     = sessionId,
                StudentUserId = studentUserId,
                Status        = AttendanceStatus.Present,
                JoinedAt      = joinedAt,
                RecordedAt    = DateTime.UtcNow
            };

        public static Attendance RecordAbsent(int sessionId, int studentUserId)
            => new()
            {
                SessionId     = sessionId,
                StudentUserId = studentUserId,
                Status        = AttendanceStatus.Absent,
                RecordedAt    = DateTime.UtcNow
            };

        // ── Domain Methods ──────────────────────────────────────────────────
        /// <summary>
        /// Teacher manually overrides an attendance record.
        /// </summary>
        public void Override(AttendanceStatus newStatus, string? note)
        {
            Status      = newStatus;
            TeacherNote = note;
        }
    }
}
