using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Student
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
        public int GradeId { get; set; }
        public DateTime EnrollmentDate { get; set; }
        public string AcademicStatus { get; set; } = "Active";

        public virtual User User { get; set; } = null!;
        public virtual Grade Grade { get; set; } = null!;
        public virtual ICollection<ParentStudent> ParentStudents { get; set; } = new List<ParentStudent>();
        public virtual ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();
        public virtual ICollection<StudentExam> StudentExams { get; set; } = new List<StudentExam>();
        public virtual ICollection<StudentPerformance> StudentPerformances { get; set; } = new List<StudentPerformance>();
        public virtual ICollection<AiRecommendation> AiRecommendations { get; set; } = new List<AiRecommendation>();
    }
}
