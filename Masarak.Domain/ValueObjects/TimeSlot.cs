namespace Masarak.Domain.ValueObjects
{
    /// <summary>
    /// Represents a time slot with a start time and duration.
    /// Supports overlap detection for schedule conflict checking.
    /// </summary>
    public record TimeSlot(DateTime Start, int DurationMinutes)
    {
        public DateTime End => Start.AddMinutes(DurationMinutes);

        /// <summary>
        /// Returns true if this time slot overlaps with another.
        /// Two slots overlap if one starts before the other ends and ends after the other starts.
        /// </summary>
        public bool OverlapsWith(TimeSlot other) =>
            Start < other.End && End > other.Start;
    }
}
