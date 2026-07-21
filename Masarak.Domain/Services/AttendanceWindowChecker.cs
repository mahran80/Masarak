using Masarak.Domain.Entities;

namespace Masarak.Domain.Services
{
    /// <summary>
    /// Phase 4: Determines whether the current time falls within the
    /// attendance join window for a session.
    /// Window = [ScheduledAt - 15 min, ScheduledAt + DurationMinutes + 15 min]
    /// </summary>
    public class AttendanceWindowChecker
    {
        private static readonly TimeSpan JoinWindow = TimeSpan.FromMinutes(15);

        /// <summary>
        /// Returns true if the given time is within the join window.
        /// </summary>
        public bool IsWithinJoinWindow(Session session, DateTime now)
        {
            var windowStart = session.ScheduledAt.Subtract(JoinWindow);
            var windowEnd   = session.ScheduledAt.AddMinutes(session.DurationMinutes).Add(JoinWindow);
            return now >= windowStart && now <= windowEnd;
        }
    }
}
