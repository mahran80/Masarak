using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Question
    {
        public int QuestionId { get; set; }
        public int ExamId { get; set; }
        public string QuestionText { get; set; } = null!;
        public string QuestionType { get; set; } = null!;
        public string? Options { get; set; }
        public string? CorrectAns { get; set; }
        public decimal Marks { get; set; }
        public int OrderNum { get; set; }

        public virtual Exam Exam { get; set; } = null!;
        public virtual ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
    }
}
