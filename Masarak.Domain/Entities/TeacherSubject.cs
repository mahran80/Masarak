namespace Masarak.Domain.Entities
{
    public class TeacherSubject
    {
        public int TeacherId { get; set; }
        public int SubjectCategoryId { get; set; }

        public virtual Teacher Teacher { get; set; } = null!;
        public virtual SubjectCategory SubjectCategory { get; set; } = null!;
    }
}
