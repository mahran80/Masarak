using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Submission
    {
        public int SubmissionId { get; set; }
        public int AssignmentId { get; set; }
        public int StudentId { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string? FileUrl { get; set; }
        public string? AnswerText { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public string Status { get; set; } = "Submitted";

        public virtual Assignment Assignment { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}
