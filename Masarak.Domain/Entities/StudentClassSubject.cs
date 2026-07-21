namespace Masarak.Domain.Entities
{
    public class StudentClassSubject
    {
        public int StudentClassId { get; set; }
        public int SubjectId { get; set; }

        public virtual StudentClass StudentClass { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
    }
}
