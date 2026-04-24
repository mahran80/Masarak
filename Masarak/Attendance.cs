using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Attendance
    {
        public int AttendanceId { get; set; }
        public int SessionId { get; set; }
        public int StudentId { get; set; }
        public string Status { get; set; } = "Present";
        public DateTime? JoinedAt { get; set; }
        public DateTime? LeftAt { get; set; }

        public virtual Session Session { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}
