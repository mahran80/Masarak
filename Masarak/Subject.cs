using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Subject
    {
        public int SubjectId { get; set; }
        public int GradeId { get; set; }
        public string Name { get; set; } = null!;
        public string Code { get; set; } = null!;
        public string? Description { get; set; }

        public virtual Grade Grade { get; set; } = null!;
        public virtual ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
        public virtual ICollection<StudentPerformance> StudentPerformances { get; set; } = new List<StudentPerformance>();
    }
}
