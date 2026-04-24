using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class StudentExam
    {
        public int StudentExamId { get; set; }
        public int ExamId { get; set; }
        public int StudentId { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public decimal? TotalScore { get; set; }
        public string Status { get; set; } = "Pending";

        public virtual Exam Exam { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
        public virtual ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
    }
}
