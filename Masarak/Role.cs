using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Role
    {
        public int RoleId { get; set; }
        public string Name { get; set; } = null!;

        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
