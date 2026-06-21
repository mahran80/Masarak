using Masarak.Domain.Enums;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// A live or recorded class session within a TeachingAssignment.
    ///
    /// Phase 2 Academic Core:
    ///   • Added ClassId FK for direct class lookup
    ///   • ScheduledAt + DurationMinutes replace StartTime/EndTime
    ///   • EmbedUrl replaces MeetingLink (Zoom/Teams URL provided by teacher)
    ///   • Status uses SessionStatus enum instead of string
    ///   • Added Description, CreatedAt, EndsAt computed property
    ///   • Domain methods: Cancel(), MarkLive(), Complete()
    ///   • Factory method Schedule() for controlled instantiation
    /// </summary>
    public class Session
    {
        public int            SessionId            { get; set; }
        public int            AssignmentId         { get; set; }   // FK → teaching_assignments.AssignmentId
        public int            ClassId              { get; set; }   // FK → classes.ClassId
        public string         Title                { get; set; } = null!;
        public string?        Description          { get; set; }
        public DateTime       ScheduledAt          { get; set; }
        public int            DurationMinutes      { get; set; }
        public string?        EmbedUrl             { get; set; }   // Zoom/Teams URL provided by teacher
        public SessionStatus  Status               { get; set; } = SessionStatus.Scheduled;
        public DateTime       CreatedAt            { get; set; }

        // ── Computed ─────────────────────────────────────────────────────────
        public DateTime EndsAt => ScheduledAt.AddMinutes(DurationMinutes);

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual TeachingAssignment TeachingAssignment { get; set; } = null!;
        public virtual Class              Class              { get; set; } = null!;
        public virtual ICollection<Attendance> Attendances   { get; set; } = new List<Attendance>();

        // ── Domain Methods ──────────────────────────────────────────────────
        public void Cancel()   { Status = SessionStatus.Cancelled; }
        public void MarkLive() { Status = SessionStatus.Live; }
        public void Complete() { Status = SessionStatus.Completed; }

        // ── Factory ─────────────────────────────────────────────────────────
        public static Session Schedule(int assignmentId, int classId, string title,
            string? description, DateTime scheduledAt, int durationMinutes, string? embedUrl)
        {
            return new Session
            {
                AssignmentId    = assignmentId,
                ClassId         = classId,
                Title           = title,
                Description     = description,
                ScheduledAt     = scheduledAt,
                DurationMinutes = durationMinutes,
                EmbedUrl        = embedUrl,
                Status          = SessionStatus.Scheduled,
                CreatedAt       = DateTime.UtcNow
            };
        }
    }
}
