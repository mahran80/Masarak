using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Session
    {
        public int SessionId { get; set; }
        public int AssignmentId { get; set; }
        public string Title { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? MeetingLink { get; set; }
        public string? RecordingUrl { get; set; }
        public string Status { get; set; } = "Scheduled";

        public virtual TeachingAssignment TeachingAssignment { get; set; } = null!;
        public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}
