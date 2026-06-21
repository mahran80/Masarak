using Masarak.Domain.Enums;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Academic grade / year level (e.g. "Grade 5", "إعدادى أول").
    ///
    /// Phase 2 Academic Core:
    ///   • Added Stage (GradeStage enum), NameAr, Order, IsActive
    ///   • Order replaces Level for explicit sort ordering (1-12)
    ///   • Factory method Create() for controlled instantiation
    /// </summary>
    public class Grade
    {
        public int        GradeId  { get; set; }
        public string     Name     { get; set; } = null!;          // "Grade 5"
        public string?    NameAr   { get; set; }                   // "خامسة ابتدائي"
        public GradeStage Stage    { get; set; }                   // Primary, Preparatory, Secondary
        public int        Order    { get; set; }                   // 1-12 for sorting
        public bool       IsActive { get; set; } = true;

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual ICollection<Student> Students { get; set; } = new List<Student>();
        public virtual ICollection<Class>   Classes  { get; set; } = new List<Class>();
        public virtual ICollection<Subject> Subjects { get; set; } = new List<Subject>();

        // ── Factory ─────────────────────────────────────────────────────────
        public static Grade Create(string name, string? nameAr, GradeStage stage, int order)
        {
            return new Grade
            {
                Name     = name,
                NameAr   = nameAr,
                Stage    = stage,
                Order    = order,
                IsActive = true
            };
        }
    }
}
