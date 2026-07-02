using System.Collections.Generic;

namespace Masarak.Domain.Entities
{
    public class SubjectCategory
    {
        public int SubjectCategoryId { get; set; }
        public string Name { get; set; } = null!;
        public string? NameAr { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<Subject> Subjects { get; set; } = new List<Subject>();
        public virtual ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
    }
}
