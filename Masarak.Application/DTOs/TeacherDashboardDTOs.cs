namespace Masarak.Application.DTOs
{
    public class TeacherDashboardStatsDto
    {
        public int TotalStudents { get; set; }
        public int ActiveCourses { get; set; }
        public int ActiveClasses { get; set; }
        public int AssignmentsToGrade { get; set; }
        public int PublishedAssignments { get; set; }
        public int PublishedExams { get; set; }
        public decimal AveragePerformance { get; set; }
        public int AttendancePresent { get; set; }
        public int AttendanceAbsent { get; set; }
        public int AttendanceExcused { get; set; }
        public int TotalAttendanceRecords { get; set; }
        public decimal AttendanceRate { get; set; }
    }

    public class TeacherActivityDto
    {
        public string Title { get; set; } = null!;
        public string Time { get; set; } = null!;
        public DateTime OccurredAt { get; set; }
        public string Type { get; set; } = null!;
        public string Icon { get; set; } = null!;
        public string Color { get; set; } = null!;
    }

    public class TeacherChartDataDto
    {
        public string[] Labels { get; set; } = Array.Empty<string>();
        public ChartDatasetDto[] Datasets { get; set; } = Array.Empty<ChartDatasetDto>();
    }

    public class ChartDatasetDto
    {
        public string Label { get; set; } = null!;
        public decimal[] Data { get; set; } = Array.Empty<decimal>();
        public string BorderColor { get; set; } = null!;
        public string BackgroundColor { get; set; } = null!;
        public decimal Tension { get; set; } = 0.4m;
        public bool Fill { get; set; }
    }
}