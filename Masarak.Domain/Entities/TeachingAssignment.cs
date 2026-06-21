namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Assigns a Teacher to teach a Subject to a Class in a given AcademicYear.
    /// Unique constraint: (TeacherId, SubjectId, ClassId, AcademicYear).
    ///
    /// Phase 2 Academic Core:
    ///   • AcademicYear changed from string to int
    ///   • Added IsActive flag
    ///   • Factory method Create() for controlled instantiation
    /// </summary>
    public class TeachingAssignment
    {
        public int      AssignmentId { get; set; }
        public int      TeacherId    { get; set; }                 // FK → teachers.TeacherId
        public int      SubjectId    { get; set; }                 // FK → subjects.SubjectId
        public int      ClassId      { get; set; }                 // FK → classes.ClassId
        public int      AcademicYear { get; set; }                 // e.g. 2026
        public bool     IsActive     { get; set; } = true;
        public DateTime CreatedAt    { get; set; }

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Teacher Teacher { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
        public virtual Class   Class   { get; set; } = null!;
        public virtual ICollection<Session>    Sessions    { get; set; } = new List<Session>();
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Exam>       Exams       { get; set; } = new List<Exam>();

        // ── Factory ─────────────────────────────────────────────────────────
        public static TeachingAssignment Create(int teacherId, int classId, int subjectId, int academicYear)
        {
            return new TeachingAssignment
            {
                TeacherId    = teacherId,
                SubjectId    = subjectId,
                ClassId      = classId,
                AcademicYear = academicYear,
                IsActive     = true,
                CreatedAt    = DateTime.UtcNow
            };
        }
    }
}
