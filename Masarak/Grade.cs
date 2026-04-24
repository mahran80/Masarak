using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Grade
    {
        public int GradeId { get; set; }
        public string Name { get; set; } = null!;
        public int Level { get; set; }

        public virtual ICollection<Student> Students { get; set; } = new List<Student>();
        public virtual ICollection<Class> Classes { get; set; } = new List<Class>();
        public virtual ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    }
}
