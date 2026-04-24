using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class StudentAnswer
    {
        public int AnswerId { get; set; }
        public int StudentExamId { get; set; }
        public int QuestionId { get; set; }
        public string? AnswerText { get; set; }
        public bool? IsCorrect { get; set; }
        public decimal? MarksAwarded { get; set; }

        public virtual StudentExam StudentExam { get; set; } = null!;
        public virtual Question Question { get; set; } = null!;
    }
}
