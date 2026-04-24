using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Body { get; set; } = null!;
        public string NotifType { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public bool IsRead { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReadAt { get; set; }

        public virtual User User { get; set; } = null!;
    }
}
