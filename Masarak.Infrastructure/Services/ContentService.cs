using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Phase 4: Service implementation for Content Library operations.
    /// </summary>
    public class ContentService : IContentService
    {
        private readonly IContentItemRepository _contentRepo;
        private readonly ITeachingAssignmentRepository _taRepo;
        private readonly IStudentClassRepository _studentClassRepo;
        private readonly IFileStorageService _fileStorage;
        private readonly Context _context;

        private const string VideoContainer = "content-videos";
        private const string DocumentContainer = "content-documents";
        private const long MaxVideoSizeBytes = 500 * 1024 * 1024;     // 500 MB
        private const long MaxDocumentSizeBytes = 50 * 1024 * 1024;   // 50 MB

        public ContentService(
            IContentItemRepository contentRepo,
            ITeachingAssignmentRepository taRepo,
            IStudentClassRepository studentClassRepo,
            IFileStorageService fileStorage,
            Context context)
        {
            _contentRepo      = contentRepo;
            _taRepo           = taRepo;
            _studentClassRepo = studentClassRepo;
            _fileStorage      = fileStorage;
            _context          = context;
        }

        public async Task<ContentItemDto> UploadContentUrlAsync(int teacherUserId, UploadContentUrlRequest request, CancellationToken ct = default)
        {
            await VerifyTeacherOwnership(teacherUserId, request.TeachingAssignmentId, ct);

            // Validate URL for allowed domains
            if (request.SourceType == ContentSourceType.YouTubeUrl)
                ValidateUrlDomain(request.Url, "youtube.com", "youtu.be");
            else if (request.SourceType == ContentSourceType.VimeoUrl)
                ValidateUrlDomain(request.Url, "vimeo.com");

            var item = ContentItem.CreateUrlBased(
                request.TeachingAssignmentId,
                request.SessionId,
                request.Type,
                request.SourceType,
                request.Title,
                request.Description,
                request.Url);

            await _contentRepo.AddAsync(item, ct);
            return MapToDto(item);
        }

        public async Task<ContentItemDto> UploadContentFileAsync(
            int teacherUserId, int teachingAssignmentId, int? sessionId,
            ContentType type, string title, string? description,
            Stream fileStream, string fileName, CancellationToken ct = default)
        {
            await VerifyTeacherOwnership(teacherUserId, teachingAssignmentId, ct);

            // Determine container and validate file size
            var container = type == ContentType.Video ? VideoContainer : DocumentContainer;
            var maxSize = type == ContentType.Video ? MaxVideoSizeBytes : MaxDocumentSizeBytes;

            if (fileStream.Length > maxSize)
                throw new InvalidOperationException($"File exceeds maximum size of {maxSize / (1024 * 1024)} MB.");

            // Upload to storage
            var (blobName, publicUrl) = await _fileStorage.UploadAsync(fileStream, fileName, container, ct);

            var item = ContentItem.CreateBlobBased(
                teachingAssignmentId, sessionId,
                type, title, description,
                blobName, publicUrl, fileStream.Length);

            await _contentRepo.AddAsync(item, ct);
            return MapToDto(item);
        }

        public async Task DeleteContentItemAsync(int actorUserId, string actorRole, int contentItemId, CancellationToken ct = default)
        {
            var item = await _contentRepo.GetByIdAsync(contentItemId, ct)
                ?? throw new KeyNotFoundException($"Content item {contentItemId} not found.");

            if (actorRole != AppRoles.Admin)
            {
                // Verify teacher ownership
                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == actorUserId, ct)
                    ?? throw new UnauthorizedAccessException("Teacher profile not found.");

                if (item.TeachingAssignment.TeacherId != teacher.TeacherId)
                    throw new UnauthorizedAccessException("You can only delete your own content.");
            }

            item.Deactivate();
            await _contentRepo.UpdateAsync(item, ct);
        }

        public async Task<IEnumerable<ContentItemDto>> GetTeacherContentAsync(int teacherUserId, int teachingAssignmentId, CancellationToken ct = default)
        {
            await VerifyTeacherOwnership(teacherUserId, teachingAssignmentId, ct);

            var items = await _contentRepo.GetByTeachingAssignmentIdAsync(teachingAssignmentId, ct);
            return items.Select(MapToDto);
        }

        public async Task<IEnumerable<ContentItemDto>> GetContentForSubjectAsync(int studentUserId, int subjectId, CancellationToken ct = default)
        {
            var student = await _context.Students
                .Include(s => s.StudentClasses)
                .FirstOrDefaultAsync(s => s.UserId == studentUserId, ct)
                ?? throw new KeyNotFoundException("Student profile not found.");

            // Find the student's active class
            var enrollment = student.StudentClasses
                .FirstOrDefault(sc => sc.IsActive);

            if (enrollment == null)
                throw new InvalidOperationException("Student is not enrolled in any class.");

            // Verify subject is for this class (via teaching assignment)
            var items = await _contentRepo.GetBySubjectAndClassAsync(subjectId, enrollment.ClassId, ct);
            return items.Select(MapToDto);
        }

        public async Task<string> GetContentDownloadUrlAsync(int userId, int contentItemId, CancellationToken ct = default)
        {
            var item = await _contentRepo.GetByIdAsync(contentItemId, ct)
                ?? throw new KeyNotFoundException($"Content item {contentItemId} not found.");

            if (!item.IsActive)
                throw new KeyNotFoundException("Content item is not available.");

            // For URL-based content, return the URL directly
            if (item.SourceType != ContentSourceType.AzureBlob)
                return item.ResourceUrl;

            // For blob-stored content, generate a signed URL
            var container = item.Type == ContentType.Video ? VideoContainer : DocumentContainer;
            var expiry = item.Type == ContentType.Video ? TimeSpan.FromHours(2) : TimeSpan.FromHours(1);

            return await _fileStorage.GenerateSignedDownloadUrlAsync(item.BlobName!, container, expiry, ct);
        }

        // ── Private Helpers ─────────────────────────────────────────────────

        private async Task VerifyTeacherOwnership(int teacherUserId, int teachingAssignmentId, CancellationToken ct)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found.");

            var ta = await _taRepo.GetByIdAsync(teachingAssignmentId, ct)
                ?? throw new KeyNotFoundException($"Teaching assignment {teachingAssignmentId} not found.");

            if (ta.TeacherId != teacher.TeacherId)
                throw new UnauthorizedAccessException("You are not assigned to this teaching assignment.");
        }

        private static void ValidateUrlDomain(string url, params string[] allowedDomains)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                throw new InvalidOperationException("Invalid URL format.");

            var host = uri.Host.ToLowerInvariant();
            if (!allowedDomains.Any(d => host.Contains(d, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException($"URL must be from: {string.Join(", ", allowedDomains)}");
        }

        private static ContentItemDto MapToDto(ContentItem item)
            => new(
                ContentItemId: item.ContentItemId,
                Type:          item.Type,
                SourceType:    item.SourceType,
                Title:         item.Title,
                Description:   item.Description,
                ResourceUrl:   item.ResourceUrl,
                FileSizeBytes: item.FileSizeBytes,
                CreatedAt:     item.CreatedAt,
                IsActive:      item.IsActive);
    }
}
