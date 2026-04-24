using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class TeachingAssignment
    {
        public int AssignmentId { get; set; }
        public int TeacherId { get; set; }
        public int SubjectId { get; set; }
        public int ClassId { get; set; }
        public string AcademicYear { get; set; } = null!;
        public DateTime CreatedAt { get; set; }

        public virtual Teacher Teacher { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
        public virtual Class Class { get; set; } = null!;
        public virtual ICollection<Session> Sessions { get; set; } = new List<Session>();
        public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
        public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();
    }
}
