using System.ComponentModel.DataAnnotations;

namespace Masarak.Application.DTOs
{
    // ═══════════════════════════════════════════════════════════════════════════
    // Teacher & Student - Lesson DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    public record LessonDto(
        int LessonId,
        int TeachingAssignmentId,
        string Title,
        string? Description,
        int OrderNum,
        bool IsPublished,
        DateTime CreatedAt,
        int ContentCount,
        int ExamCount,
        int AssignmentCount
    );

    public record LessonDetailDto(
        int LessonId,
        int TeachingAssignmentId,
        string Title,
        string? Description,
        int OrderNum,
        bool IsPublished,
        DateTime CreatedAt,
        IEnumerable<ContentItemDto> ContentItems,
        IEnumerable<ExamDto> Exams,
        IEnumerable<AssignmentDto> Assignments
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // Teacher - Requests
    // ═══════════════════════════════════════════════════════════════════════════

    public class CreateLessonRequest
    {
        [Required] public int TeachingAssignmentId { get; set; }
        [Required, MaxLength(255)] public string Title { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class UpdateLessonRequest
    {
        [Required, MaxLength(255)] public string Title { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class ReorderLessonsRequest
    {
        [Required]
        public IEnumerable<int> LessonIdsInOrder { get; set; } = new List<int>();
    }

    public class CloneLessonRequest
    {
        [Required]
        public IEnumerable<int> TargetTeachingAssignmentIds { get; set; } = new List<int>();
    }
}
