using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Domain.ValueObjects;

namespace Masarak.Domain.Services
{
    /// <summary>
    /// Domain service that checks if a proposed session time slot conflicts
    /// with any existing sessions for the same class.
    /// </summary>
    public class ScheduleConflictChecker
    {
        /// <summary>
        /// Checks if a proposed time slot overlaps with any existing non-cancelled session
        /// for the same class.
        /// </summary>
        /// <param name="existingSessions">Existing sessions for the class.</param>
        /// <param name="proposed">The proposed time slot.</param>
        /// <returns>True if there is a conflict; false otherwise.</returns>
        public bool HasConflict(IEnumerable<Session> existingSessions, TimeSlot proposed)
        {
            return existingSessions
                .Where(s => s.Status != SessionStatus.Cancelled)
                .Any(s => new TimeSlot(s.ScheduledAt, s.DurationMinutes).OverlapsWith(proposed));
        }
    }
}
