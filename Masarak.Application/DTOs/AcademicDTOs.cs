using System.ComponentModel.DataAnnotations;
using Masarak.Domain.Enums;

namespace Masarak.Application.DTOs
{
    // ═══════════════════════════════════════════════════════════════════════════
    // Response DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    public record GradeDto(
        int GradeId, string Name, string? NameAr,
        GradeStage Stage, int Order, bool IsActive);

    public record GradeDetailDto(
        int GradeId, string Name, string? NameAr,
        IEnumerable<SubjectDto> Subjects, IEnumerable<ClassDto> Classes);

    public record SubjectDto(
        int SubjectId, int GradeId, string Name, string? NameAr,
        string Code, bool IsActive);

    public record ClassDto(
        int ClassId, int GradeId, string GradeName, string Name,
        int MaxCapacity, int AcademicYear, int EnrollmentCount, bool IsActive);

    public record TeachingAssignmentDto(
        int Id, int TeacherId, string TeacherName,
        string ClassName, string SubjectName, int AcademicYear, bool IsActive);

    public record StudentClassDto(
        int StudentClassId, int StudentId, string StudentName,
        int ClassId, string ClassName);

    public record StudentInClassDto(
        int StudentId, string FullName, string Email);

    public record SessionDto(
        int SessionId, string Title, string? Description,
        DateTime ScheduledAt, int DurationMinutes, DateTime EndsAt,
        string? EmbedUrl, SessionStatus Status,
        string SubjectName, string ClassName, string TeacherName);

    public record WeeklyScheduleDto(
        DateTime WeekStart, DateTime WeekEnd,
        IEnumerable<SessionDto> Sessions);

    public record StudentEnrollmentDto(
        int ClassId, string ClassName, string GradeName, int AcademicYear);

    // ═══════════════════════════════════════════════════════════════════════════
    // Request DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    public class CreateGradeRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [MaxLength(100)]
        public string? NameAr { get; set; }

        [Required]
        public GradeStage Stage { get; set; }

        [Required, Range(1, 100)]
        public int Order { get; set; }
    }

    public class UpdateGradeRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [MaxLength(100)]
        public string? NameAr { get; set; }

        public bool IsActive { get; set; }
    }

    public class CreateSubjectRequest
    {
        [Required]
        public int GradeId { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = null!;

        [MaxLength(150)]
        public string? NameAr { get; set; }

        [Required, MaxLength(20)]
        public string Code { get; set; } = null!;
    }

    public class UpdateSubjectRequest
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = null!;

        [MaxLength(150)]
        public string? NameAr { get; set; }

        public bool IsActive { get; set; }
    }

    public class CreateClassRequest
    {
        [Required]
        public int GradeId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Required, Range(1, 500)]
        public int MaxCapacity { get; set; } = 30;

        [Required, Range(2020, 2100)]
        public int AcademicYear { get; set; }
    }

    public class UpdateClassRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Required, Range(1, 500)]
        public int MaxCapacity { get; set; }

        public bool IsActive { get; set; }
    }

    public class AssignTeacherRequest
    {
        [Required]
        public int TeacherId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public int SubjectId { get; set; }

        [Required, Range(2020, 2100)]
        public int AcademicYear { get; set; }
    }

    public class EnrollStudentRequest
    {
        [Required]
        public int StudentId { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required, Range(2020, 2100)]
        public int AcademicYear { get; set; }
    }

    public class ScheduleSessionRequest
    {
        [Required]
        public int TeachingAssignmentId { get; set; }

        [Required, MaxLength(255)]
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        public DateTime ScheduledAt { get; set; }

        [Required, Range(15, 300)]
        public int DurationMinutes { get; set; }

        [MaxLength(500)]
        public string? EmbedUrl { get; set; }
    }

    public class UpdateSessionRequest
    {
        [Required, MaxLength(255)]
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        [Required]
        public DateTime ScheduledAt { get; set; }

        [Required, Range(15, 300)]
        public int DurationMinutes { get; set; }

        [MaxLength(500)]
        public string? EmbedUrl { get; set; }
    }
}
