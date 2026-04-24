using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class ParentStudent
    {
        public int ParentId { get; set; }
        public int StudentId { get; set; }
        public string? Relationship { get; set; }

        public virtual Parent Parent { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}
