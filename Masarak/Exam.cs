using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Exam
    {
        public int ExamId { get; set; }
        public int AssignmentId { get; set; }
        public string Title { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int DurationMins { get; set; }
        public decimal MaxScore { get; set; }
        public string ExamType { get; set; } = "Quiz";

        public virtual TeachingAssignment TeachingAssignment { get; set; } = null!;
        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
        public virtual ICollection<StudentExam> StudentExams { get; set; } = new List<StudentExam>();
    }
}
