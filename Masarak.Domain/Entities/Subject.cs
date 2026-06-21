namespace Masarak.Domain.Entities
{
    /// <summary>
    /// An academic subject belonging to a Grade (e.g. "Mathematics", "الرياضيات").
    ///
    /// Phase 2 Academic Core:
    ///   • Added NameAr, IsActive
    ///   • Factory method Create() for controlled instantiation
    /// </summary>
    public class Subject
    {
        public int     SubjectId   { get; set; }
        public int     GradeId     { get; set; }                   // FK → grades.GradeId
        public string  Name        { get; set; } = null!;          // "Mathematics"
        public string? NameAr      { get; set; }                   // "الرياضيات"
        public string  Code        { get; set; } = null!;          // unique, e.g. "MATH-G5"
        public string? Description { get; set; }
        public bool    IsActive    { get; set; } = true;

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Grade  Grade  { get; set; } = null!;
        public virtual ICollection<TeachingAssignment>  TeachingAssignments  { get; set; } = new List<TeachingAssignment>();
        public virtual ICollection<StudentPerformance>  StudentPerformances  { get; set; } = new List<StudentPerformance>();

        // ── Factory ─────────────────────────────────────────────────────────
        public static Subject Create(int gradeId, string name, string? nameAr, string code)
        {
            return new Subject
            {
                GradeId  = gradeId,
                Name     = name,
                NameAr   = nameAr,
                Code     = code,
                IsActive = true
            };
        }
    }
}
