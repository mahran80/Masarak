using Masarak.Domain.Enums;

namespace Masarak.Application.DTOs
{
    // ═══════════════════════════════════════════════════════════════════
    // Phase 4 — Attendance DTOs
    // ═══════════════════════════════════════════════════════════════════

    public record AttendanceDto(
        int AttendanceId,
        int SessionId,
        string SessionTitle,
        int StudentUserId,
        string StudentName,
        AttendanceStatus Status,
        DateTime? JoinedAt,
        string? TeacherNote);

    public record SessionAttendanceDto(
        int SessionId,
        string SessionTitle,
        DateTime ScheduledAt,
        int TotalEnrolled,
        int PresentCount,
        int AbsentCount,
        int ExcusedCount,
        IEnumerable<AttendanceDto> Records);

    public record SubjectAttendanceDto(
        int SubjectId,
        string SubjectName,
        int TotalSessions,
        int PresentCount,
        int AbsentCount,
        int ExcusedCount,
        decimal AttendancePercentage);

    // ═══════════════════════════════════════════════════════════════════
    // Phase 4 — Content Library DTOs
    // ═══════════════════════════════════════════════════════════════════

    public record ContentItemDto(
        int ContentItemId,
        ContentType Type,
        ContentSourceType SourceType,
        string Title,
        string? Description,
        string ResourceUrl,
        long? FileSizeBytes,
        DateTime CreatedAt,
        bool IsActive);

    public record UploadContentUrlRequest(
        int TeachingAssignmentId,
        int? SessionId,
        ContentType Type,
        ContentSourceType SourceType,
        string Title,
        string? Description,
        string Url);

    public record DeleteContentItemRequest(
        int ContentItemId);

    // ═══════════════════════════════════════════════════════════════════
    // Phase 4 — Chat DTOs
    // ═══════════════════════════════════════════════════════════════════

    public record ChatRoomDto(
        int ChatRoomId,
        string Name,
        ChatRoomType RoomType,
        int? GradeId,
        int MessageCount);

    public record ChatMessageDto(
        int MessageId,
        int ChatRoomId,
        int SenderUserId,
        string SenderName,
        string Content,
        DateTime SentAt,
        bool IsDeleted);

    // ═══════════════════════════════════════════════════════════════════
    // Phase 4 — Attendance Override Request
    // ═══════════════════════════════════════════════════════════════════

    public record OverrideAttendanceRequest(
        AttendanceStatus NewStatus,
        string? Note);
}
