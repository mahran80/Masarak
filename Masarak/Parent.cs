using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Parent
    {
        public int ParentId { get; set; }
        public int UserId { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual ICollection<ParentStudent> ParentStudents { get; set; } = new List<ParentStudent>();
    }
}
