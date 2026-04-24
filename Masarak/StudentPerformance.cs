using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class StudentPerformance
    {
        public int PerformanceId { get; set; }
        public int StudentId { get; set; }
        public int SubjectId { get; set; }
        public string AcademicYear { get; set; } = null!;
        public decimal AvgAssignment { get; set; }
        public decimal AvgExam { get; set; }
        public decimal AttendanceRate { get; set; }
        public decimal? FinalGrade { get; set; }
        public string? GradeLetter { get; set; }
        public string? Remarks { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual Student Student { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
    }
}
