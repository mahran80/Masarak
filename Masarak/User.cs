using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class User
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Country { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }

        public virtual Role Role { get; set; } = null!;
        public virtual Student? Student { get; set; }
        public virtual Teacher? Teacher { get; set; }
        public virtual Parent? Parent { get; set; }
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
