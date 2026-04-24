using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Assignment
    {
        public int AssignmentId { get; set; }
        public int AssignmentRef { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime DueDate { get; set; }
        public decimal MaxScore { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual TeachingAssignment TeachingAssignment { get; set; } = null!;
        public virtual ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    }
}
