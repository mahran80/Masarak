using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    public interface ITeacherLessonService
    {
        // ── Teacher: Lesson Management ──────────────────────────────────────
        Task<LessonDto> CreateLessonAsync(int teacherUserId, CreateLessonRequest request, CancellationToken ct = default);
        Task<LessonDto> UpdateLessonAsync(int teacherUserId, int lessonId, UpdateLessonRequest request, CancellationToken ct = default);
        Task DeleteLessonAsync(int teacherUserId, int lessonId, CancellationToken ct = default);
        Task<IEnumerable<LessonDto>> GetTeacherLessonsAsync(int teacherUserId, int teachingAssignmentId, CancellationToken ct = default);
        Task<LessonDetailDto> GetTeacherLessonDetailAsync(int teacherUserId, int lessonId, CancellationToken ct = default);
        Task PublishLessonAsync(int teacherUserId, int lessonId, CancellationToken ct = default);
        Task ReorderLessonsAsync(int teacherUserId, int teachingAssignmentId, ReorderLessonsRequest request, CancellationToken ct = default);
        
        // ── Teacher: Clone Lesson ───────────────────────────────────────────
        Task CloneLessonAsync(int teacherUserId, int lessonId, CloneLessonRequest request, CancellationToken ct = default);

        // ── Teacher: Attach/Detach ──────────────────────────────────────────
        Task AttachContentToLessonAsync(int teacherUserId, int lessonId, int contentItemId, CancellationToken ct = default);
        Task DetachContentFromLessonAsync(int teacherUserId, int contentItemId, CancellationToken ct = default);
        Task AttachExamToLessonAsync(int teacherUserId, int lessonId, int examId, CancellationToken ct = default);
        Task DetachExamFromLessonAsync(int teacherUserId, int examId, CancellationToken ct = default);
        Task AttachAssignmentToLessonAsync(int teacherUserId, int lessonId, int assignmentId, CancellationToken ct = default);
        Task DetachAssignmentFromLessonAsync(int teacherUserId, int assignmentId, CancellationToken ct = default);
    }
}
