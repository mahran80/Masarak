using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    public interface IStudentLessonService
    {
        // ── Student: Lesson Viewing ─────────────────────────────────────────
        Task<IEnumerable<LessonDto>> GetStudentLessonsAsync(int studentUserId, int subjectId, CancellationToken ct = default);
        Task<LessonDetailDto> GetStudentLessonDetailAsync(int studentUserId, int lessonId, CancellationToken ct = default);
    }
}
