namespace Masarak.Domain.Entities
{
    /// <summary>
    /// A classroom grouping within a Grade (e.g. "5A", "5B").
    ///
    /// Phase 2 Academic Core:
    ///   • Added MaxCapacity, AcademicYear (int), IsActive
    ///   • Added Sessions navigation
    ///   • Factory method Create() for controlled instantiation
    /// </summary>
    public class Class
    {
        public int    ClassId      { get; set; }
        public int    GradeId      { get; set; }                   // FK → grades.GradeId
        public string Name         { get; set; } = null!;          // "5A", "5B"
        public int    MaxCapacity  { get; set; } = 30;
        public int    AcademicYear { get; set; }                   // e.g. 2026
        public bool   IsActive     { get; set; } = true;

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Grade  Grade  { get; set; } = null!;
        public virtual ICollection<StudentClass>       StudentClasses       { get; set; } = new List<StudentClass>();
        public virtual ICollection<TeachingAssignment>  TeachingAssignments  { get; set; } = new List<TeachingAssignment>();
        public virtual ICollection<Session>             Sessions             { get; set; } = new List<Session>();

        // ── Factory ─────────────────────────────────────────────────────────
        public static Class Create(int gradeId, string name, int maxCapacity, int academicYear)
        {
            return new Class
            {
                GradeId      = gradeId,
                Name         = name,
                MaxCapacity  = maxCapacity,
                AcademicYear = academicYear,
                IsActive     = true
            };
        }
    }
}
