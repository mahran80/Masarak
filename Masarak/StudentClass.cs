using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class StudentClass
    {
        public int StudentId { get; set; }
        public int ClassId { get; set; }
        public string AcademicYear { get; set; } = null!;
        public bool IsCurrent { get; set; }

        public virtual Student Student { get; set; } = null!;
        public virtual Class Class { get; set; } = null!;
    }
}
