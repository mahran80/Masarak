using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Teacher
    {
        public int TeacherId { get; set; }
        public int UserId { get; set; }
        public string? Specialization { get; set; }
        public DateTime HiringDate { get; set; }
        public string? Bio { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual ICollection<TeachingAssignment> TeachingAssignments { get; set; } = new List<TeachingAssignment>();
    }
}
