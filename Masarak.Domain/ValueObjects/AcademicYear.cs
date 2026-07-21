namespace Masarak.Domain.ValueObjects
{
    /// <summary>
    /// Represents an academic year (e.g. 2026 for the 2026/2027 school year).
    /// The academic year starts in September.
    /// </summary>
    public record AcademicYear(int Year)
    {
        /// <summary>
        /// Returns the current academic year based on UTC time.
        /// If the current month is September or later, the academic year is the current calendar year.
        /// Otherwise, it is the previous calendar year.
        /// </summary>
        public static AcademicYear Current() =>
            new(DateTime.UtcNow.Year);
    }
}
