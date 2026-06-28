using Masarak.Domain.Enums;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Phase 4: Content item in the Content Library.
    /// Teachers upload videos, PDFs, notes, and exercise sheets per subject.
    /// Linked to a TeachingAssignment and optionally to a specific Session.
    /// Uses soft delete via IsActive flag.
    /// </summary>
    public class ContentItem
    {
        public int               ContentItemId        { get; private set; }
        public int               TeachingAssignmentId { get; private set; }  // FK → teaching_assignments.AssignmentId
        public int?              SessionId            { get; private set; }  // optional link to a specific session
        public ContentType       Type                 { get; private set; }  // Video, PDF, Notes, ExerciseSheet
        public ContentSourceType SourceType           { get; private set; }  // YouTubeUrl, VimeoUrl, AzureBlob
        public string            Title                { get; private set; } = null!;
        public string?           Description          { get; private set; }
        public string            ResourceUrl          { get; private set; } = null!;  // YouTube/Vimeo URL or blob URL
        public string?           BlobName             { get; private set; }           // set only for AzureBlob source
        public long?             FileSizeBytes        { get; private set; }
        public bool              IsActive             { get; private set; }
        public DateTime          CreatedAt            { get; private set; }

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual TeachingAssignment TeachingAssignment { get; private set; } = null!;
        public virtual Session?          Session            { get; private set; }

        // ── Private parameterless constructor (for EF Core) ─────────────────
        private ContentItem() { }

        // ── Factory Methods ─────────────────────────────────────────────────
        /// <summary>
        /// Creates a URL-based content item (YouTube or Vimeo).
        /// </summary>
        public static ContentItem CreateUrlBased(
            int teachingAssignmentId, int? sessionId,
            ContentType type, ContentSourceType sourceType,
            string title, string? description, string url)
        {
            return new ContentItem
            {
                TeachingAssignmentId = teachingAssignmentId,
                SessionId            = sessionId,
                Type                 = type,
                SourceType           = sourceType,
                Title                = title,
                Description          = description,
                ResourceUrl          = url,
                IsActive             = true,
                CreatedAt            = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Creates a blob-based content item (uploaded file stored in Azure Blob).
        /// </summary>
        public static ContentItem CreateBlobBased(
            int teachingAssignmentId, int? sessionId,
            ContentType type, string title, string? description,
            string blobName, string blobUrl, long fileSizeBytes)
        {
            return new ContentItem
            {
                TeachingAssignmentId = teachingAssignmentId,
                SessionId            = sessionId,
                Type                 = type,
                SourceType           = ContentSourceType.AzureBlob,
                Title                = title,
                Description          = description,
                ResourceUrl          = blobUrl,
                BlobName             = blobName,
                FileSizeBytes        = fileSizeBytes,
                IsActive             = true,
                CreatedAt            = DateTime.UtcNow
            };
        }

        // ── Domain Methods ──────────────────────────────────────────────────
        public void Deactivate() => IsActive = false;

        public void Update(string title, string? description)
        {
            Title       = title;
            Description = description;
        }
    }
}
