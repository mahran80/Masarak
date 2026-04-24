using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Class
    {
        public int ClassId { get; set; }
        public int GradeId { get; set; }
        public string Name { get; set; } = null!;
        public int Capacity { get; set; }

        public virtual Grade Grade { get; set; } = null!;
        public virtual ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
        public virtual ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
    }
}
