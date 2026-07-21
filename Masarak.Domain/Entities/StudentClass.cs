namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Enrolls a Student in a Class for a given academic year.
    /// Unique constraint: (StudentId, AcademicYear) — one class per student per year.
    ///
    /// Phase 2 Academic Core:
    ///   • Added surrogate PK (StudentClassId)
    ///   • AcademicYear changed from string to int
    ///   • Added EnrolledAt, IsActive
    ///   • Factory method Enroll() for controlled instantiation
    /// </summary>
    public class StudentClass
    {
        public int      StudentClassId { get; set; }               // Surrogate PK
        public int      StudentId      { get; set; }               // FK → students.StudentId
        public int      ClassId        { get; set; }               // FK → classes.ClassId
        public int      AcademicYear   { get; set; }               // e.g. 2026
        public Masarak.Domain.Enums.EnrollmentType EnrollmentType { get; set; } = Masarak.Domain.Enums.EnrollmentType.FullClass;
        public DateTime EnrolledAt     { get; set; }
        public bool     IsActive       { get; set; } = true;

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Student Student { get; set; } = null!;
        public virtual Class   Class   { get; set; } = null!;
        public virtual ICollection<StudentClassSubject> StudentClassSubjects { get; set; } = new List<StudentClassSubject>();

        // ── Factory ─────────────────────────────────────────────────────────
        public static StudentClass Enroll(int studentId, int classId, int academicYear, Masarak.Domain.Enums.EnrollmentType enrollmentType = Masarak.Domain.Enums.EnrollmentType.FullClass)
        {
            return new StudentClass
            {
                StudentId    = studentId,
                ClassId      = classId,
                AcademicYear = academicYear,
                EnrollmentType = enrollmentType,
                EnrolledAt   = DateTime.UtcNow,
                IsActive     = true
            };
        }
    }
}
