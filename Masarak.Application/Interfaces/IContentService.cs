using Masarak.Application.DTOs;
using Masarak.Domain.Enums;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Service interface for Content Library operations.
    /// </summary>
    public interface IContentService
    {
        /// <summary>Teacher uploads a URL-based content item (YouTube/Vimeo).</summary>
        Task<ContentItemDto> UploadContentUrlAsync(int teacherUserId, UploadContentUrlRequest request, CancellationToken ct = default);

        /// <summary>Teacher uploads a file-based content item to blob storage.</summary>
        Task<ContentItemDto> UploadContentFileAsync(int teacherUserId, int teachingAssignmentId, int? sessionId,
            ContentType type, string title, string? description,
            Stream fileStream, string fileName, CancellationToken ct = default);

        /// <summary>Deletes (deactivates) a content item. Teacher can delete own, admin can delete any.</summary>
        Task DeleteContentItemAsync(int actorUserId, string actorRole, int contentItemId, CancellationToken ct = default);

        /// <summary>Gets all content for a teaching assignment (teacher view).</summary>
        Task<IEnumerable<ContentItemDto>> GetTeacherContentAsync(int teacherUserId, int teachingAssignmentId, CancellationToken ct = default);

        /// <summary>Gets content for a subject the student is enrolled in (student view).</summary>
        Task<IEnumerable<ContentItemDto>> GetContentForSubjectAsync(int studentUserId, int subjectId, CancellationToken ct = default);

        /// <summary>Generates a signed download URL for a content item.</summary>
        Task<string> GetContentDownloadUrlAsync(int userId, int contentItemId, CancellationToken ct = default);
    }
}
