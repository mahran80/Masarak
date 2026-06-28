# Phase 4 — Attendance, Content Library & Live Session Infrastructure

**Developer:** Dev 4  
**Complexity:** High  
**Dependencies:** Phase 1 (Auth, Subscription), Phase 2 (Session, TeachingAssignment, StudentClass entities)

---

## Objective

Deliver two parallel vertical slices owned by Dev 4. First: attendance tracking — when a student navigates to their session embed URL the system automatically records presence; teachers can view per-session and per-student attendance reports. Second: the content library — teachers upload videos (recorded sessions), PDFs, notes, and sheets per subject; students browse and access these materials filtered by their enrolled class and subject. SignalR is configured in this phase for the community chat rooms (grade community, teacher community), which are reused by Phase 6 for notifications.

---

## 1. Functional Requirements

### Attendance
- When a student clicks "Join Live Class" and the session is within its scheduled window (±15 minutes), the system records an `Attendance` entry with status `Present`
- If a student has no attendance record by session end + 15 minutes, a background job marks them `Absent`
- Teacher can manually override an attendance record (e.g., mark absent student as `Excused`)
- Teacher views per-session attendance roster (present/absent/excused)
- Student views their own attendance percentage per subject
- Parent views attendance summary for each linked student
- Attendance percentage is computed: `(Present + Excused) / Total Sessions` × 100

### Content Library
- Teacher uploads a video (YouTube URL, Vimeo URL, or Azure Blob-stored video file) linked to a subject and optionally to a specific session
- Teacher uploads files: PDF, Notes (PDF/DOCX), Exercise Sheets (PDF)
- Each content item is tagged with: subject, grade, content type, title, description, and optional session link
- Students browse content filtered by their enrolled class and subject
- Students can watch recorded videos inline (embed for YouTube/Vimeo; HTML5 player for blob-stored)
- Content is only accessible to students enrolled in the relevant class (enforced server-side)
- Teachers can update or delete their own content items
- Admin can remove any content item

### SignalR Community Chat
- One chat room per grade (e.g., "Grade 5 Community")
- One chat room for all teachers
- Messages are persisted to DB (not ephemeral)
- Users can only join rooms matching their role and grade/class
- Maximum message history: 100 most recent per room, paginated
- No direct messaging in this phase

---

## 2. Domain Layer (`Masarak.Domain`)

### Entities

```csharp
public class Attendance
{
    public int AttendanceId { get; private set; }
    public int SessionId { get; private set; }
    public int StudentUserId { get; private set; }
    public AttendanceStatus Status { get; private set; }  // Present, Absent, Excused
    public DateTime? JoinedAt { get; private set; }       // UTC timestamp of join event
    public string? TeacherNote { get; private set; }      // populated on manual override
    public DateTime RecordedAt { get; private set; }
    public Session Session { get; private set; }

    public static Attendance RecordPresent(int sessionId, int studentUserId, DateTime joinedAt)
        => new() { SessionId = sessionId, StudentUserId = studentUserId,
                   Status = AttendanceStatus.Present, JoinedAt = joinedAt,
                   RecordedAt = DateTime.UtcNow };

    public static Attendance RecordAbsent(int sessionId, int studentUserId)
        => new() { SessionId = sessionId, StudentUserId = studentUserId,
                   Status = AttendanceStatus.Absent, RecordedAt = DateTime.UtcNow };

    public void Override(AttendanceStatus newStatus, string? note)
    {
        Status = newStatus;
        TeacherNote = note;
    }
}

public class ContentItem
{
    public int ContentItemId { get; private set; }
    public int TeachingAssignmentId { get; private set; }
    public int? SessionId { get; private set; }          // optional link to a specific session
    public ContentType Type { get; private set; }        // Video, PDF, Notes, ExerciseSheet
    public ContentSourceType SourceType { get; private set; } // YouTubeUrl, VimeoUrl, AzureBlob
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public string ResourceUrl { get; private set; }      // YouTube/Vimeo URL or blob URL
    public string? BlobName { get; private set; }        // set only for AzureBlob source
    public long? FileSizeBytes { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public TeachingAssignment TeachingAssignment { get; private set; }

    public static ContentItem CreateUrlBased(int teachingAssignmentId, int? sessionId,
        ContentType type, ContentSourceType sourceType, string title, string? description,
        string url) { ... }

    public static ContentItem CreateBlobBased(int teachingAssignmentId, int? sessionId,
        ContentType type, string title, string? description,
        string blobName, string blobUrl, long fileSizeBytes) { ... }

    public void Deactivate() => IsActive = false;
}

public class ChatRoom
{
    public int ChatRoomId { get; private set; }
    public string Name { get; private set; }               // "Grade 5 Community", "Teachers Community"
    public ChatRoomType RoomType { get; private set; }     // GradeCommunity, TeachersCommunity
    public int? GradeId { get; private set; }              // set for GradeCommunity rooms
    public bool IsActive { get; private set; }
    public ICollection<ChatMessage> Messages { get; private set; }
}

public class ChatMessage
{
    public int ChatMessageId { get; private set; }
    public int ChatRoomId { get; private set; }
    public int SenderUserId { get; private set; }
    public string Content { get; private set; }           // max 1000 chars
    public DateTime SentAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public ChatRoom ChatRoom { get; private set; }
    public User Sender { get; private set; }

    public static ChatMessage Create(int chatRoomId, int senderUserId, string content)
        => new() { ChatRoomId = chatRoomId, SenderUserId = senderUserId,
                   Content = content, SentAt = DateTime.UtcNow };
    public void SoftDelete() => IsDeleted = true;
}
```

### Domain Services

```csharp
public class AttendanceWindowChecker
{
    private static readonly TimeSpan JoinWindow = TimeSpan.FromMinutes(15);

    // Returns true if the current time is within the join window
    // Window = [ScheduledAt - 15 min, ScheduledAt + DurationMinutes + 15 min]
    public bool IsWithinJoinWindow(Session session, DateTime now)
    {
        var windowStart = session.ScheduledAt.Subtract(JoinWindow);
        var windowEnd = session.ScheduledAt.AddMinutes(session.DurationMinutes).Add(JoinWindow);
        return now >= windowStart && now <= windowEnd;
    }
}

public class ChatRoomAccessPolicy
{
    // Student: can join GradeCommunity rooms for their enrolled grade only
    // Teacher: can join TeachersCommunity + GradeCommunity for grades they teach
    // Parent: read-only access to GradeCommunity for their linked students' grades
    // Admin: all rooms
    public bool CanJoin(User user, ChatRoom room) { ... }
}
```

### Enums

```csharp
public enum AttendanceStatus { Present, Absent, Excused }
public enum ContentType { Video, PDF, Notes, ExerciseSheet }
public enum ContentSourceType { YouTubeUrl, VimeoUrl, AzureBlob }
public enum ChatRoomType { GradeCommunity, TeachersCommunity }
```

---

## 3. Application Layer (`Masarak.Application`)

### Interfaces

```csharp
public interface IAttendanceRepository
{
    Task<Attendance?> GetBySessionAndStudentAsync(int sessionId, int studentUserId, CancellationToken ct);
    Task<IEnumerable<Attendance>> GetBySessionIdAsync(int sessionId, CancellationToken ct);
    Task<IEnumerable<Attendance>> GetByStudentAndSubjectAsync(int studentUserId, int subjectId, int academicYear, CancellationToken ct);
    Task<IEnumerable<int>> GetStudentsWithoutAttendanceAsync(int sessionId, IEnumerable<int> enrolledStudentIds, CancellationToken ct);
    Task AddAsync(Attendance attendance, CancellationToken ct);
    Task UpdateAsync(Attendance attendance, CancellationToken ct);
    Task BulkAddAbsentAsync(IEnumerable<Attendance> absences, CancellationToken ct);
}

public interface IContentItemRepository
{
    Task<ContentItem?> GetByIdAsync(int id, CancellationToken ct);
    Task<IEnumerable<ContentItem>> GetByTeachingAssignmentIdAsync(int taId, CancellationToken ct);
    Task<IEnumerable<ContentItem>> GetBySubjectAndClassAsync(int subjectId, int classId, CancellationToken ct);
    Task AddAsync(ContentItem item, CancellationToken ct);
    Task UpdateAsync(ContentItem item, CancellationToken ct);
}

public interface IChatRoomRepository
{
    Task<ChatRoom?> GetByIdAsync(int roomId, CancellationToken ct);
    Task<ChatRoom?> GetGradeRoomAsync(int gradeId, CancellationToken ct);
    Task<ChatRoom?> GetTeachersRoomAsync(CancellationToken ct);
    Task<IEnumerable<ChatRoom>> GetRoomsForUserAsync(int userId, string role, CancellationToken ct);
    Task AddAsync(ChatRoom room, CancellationToken ct);
}

public interface IChatMessageRepository
{
    Task<IEnumerable<ChatMessage>> GetRecentAsync(int chatRoomId, int count, int skip, CancellationToken ct);
    Task AddAsync(ChatMessage message, CancellationToken ct);
    Task UpdateAsync(ChatMessage message, CancellationToken ct);
}
```

### Commands

```csharp
// Attendance
public record RecordAttendanceCommand(int StudentUserId, int SessionId) : IRequest<AttendanceDto>;
public record OverrideAttendanceCommand(int TeacherUserId, int AttendanceId, AttendanceStatus NewStatus, string? Note) : IRequest<AttendanceDto>;

// Content Library (Teacher)
public record UploadContentUrlCommand(int TeacherUserId, int TeachingAssignmentId, int? SessionId,
    ContentType Type, ContentSourceType SourceType, string Title, string? Description, string Url) : IRequest<ContentItemDto>;
public record UploadContentFileCommand(int TeacherUserId, int TeachingAssignmentId, int? SessionId,
    ContentType Type, string Title, string? Description, Stream FileStream, string FileName) : IRequest<ContentItemDto>;
public record DeleteContentItemCommand(int ActorUserId, string ActorRole, int ContentItemId) : IRequest<Unit>;

// Chat
public record SendChatMessageCommand(int SenderUserId, int ChatRoomId, string Content) : IRequest<ChatMessageDto>;
public record DeleteChatMessageCommand(int ActorUserId, string ActorRole, int MessageId) : IRequest<Unit>;
```

### Queries

```csharp
// Attendance
public record GetSessionAttendanceQuery(int TeacherUserId, int SessionId) : IRequest<SessionAttendanceDto>;
public record GetStudentAttendanceQuery(int StudentUserId, int AcademicYear) : IRequest<IEnumerable<SubjectAttendanceDto>>;
public record GetStudentAttendanceForParentQuery(int ParentUserId, int StudentUserId, int AcademicYear) : IRequest<IEnumerable<SubjectAttendanceDto>>;

// Content Library
public record GetContentForSubjectQuery(int StudentUserId, int SubjectId) : IRequest<IEnumerable<ContentItemDto>>;
public record GetTeacherContentQuery(int TeacherUserId, int TeachingAssignmentId) : IRequest<IEnumerable<ContentItemDto>>;
public record GetContentDownloadUrlQuery(int UserId, int ContentItemId) : IRequest<string>; // signed blob URL

// Chat
public record GetMyRoomsQuery(int UserId, string Role) : IRequest<IEnumerable<ChatRoomDto>>;
public record GetRoomMessagesQuery(int UserId, int ChatRoomId, int Page, int PageSize) : IRequest<PagedResult<ChatMessageDto>>;
```

### DTOs

```csharp
public record AttendanceDto(int AttendanceId, int SessionId, string SessionTitle, int StudentUserId, string StudentName, AttendanceStatus Status, DateTime? JoinedAt, string? TeacherNote);
public record SessionAttendanceDto(int SessionId, string SessionTitle, DateTime ScheduledAt, int TotalEnrolled, int PresentCount, int AbsentCount, int ExcusedCount, IEnumerable<AttendanceDto> Records);
public record SubjectAttendanceDto(int SubjectId, string SubjectName, int TotalSessions, int PresentCount, int AbsentCount, int ExcusedCount, decimal AttendancePercentage);
public record ContentItemDto(int ContentItemId, ContentType Type, ContentSourceType SourceType, string Title, string? Description, string ResourceUrl, long? FileSizeBytes, DateTime CreatedAt, bool IsActive);
public record ChatRoomDto(int ChatRoomId, string Name, ChatRoomType RoomType, int? GradeId, int UnreadCount);
public record ChatMessageDto(int MessageId, int ChatRoomId, int SenderUserId, string SenderName, string Content, DateTime SentAt, bool IsDeleted);
```

### Handler Logic Notes

**`RecordAttendanceHandler`**
1. Load `Session` by id, verify it exists and `Status != Cancelled`
2. Use `AttendanceWindowChecker.IsWithinJoinWindow(session, DateTime.UtcNow)` — return `409` if outside window
3. Verify student is enrolled in the session's class
4. Check no existing `Attendance` record — if `Present` already exists, return idempotently
5. Create `Attendance.RecordPresent(...)`, persist

**`AbsentMarkingBackgroundJob`**
- Runs every 5 minutes
- Queries sessions where `ScheduledAt + DurationMinutes + 15 min < UtcNow` and `Status != Cancelled`
- For each session: get enrolled student IDs, get existing attendance IDs
- Students with no record → bulk-create `Attendance.RecordAbsent(...)`
- Marks session `Status = Completed` after processing

**`SendChatMessageHandler`**
1. Validate `ChatRoomAccessPolicy.CanJoin(user, room)` — return `403` if not allowed
2. Validate content length ≤ 1000 chars
3. Create `ChatMessage.Create(...)`, persist
4. Push to SignalR hub group named `room:{chatRoomId}`

---

## 4. Infrastructure Layer

### EF Core Configurations

```csharp
// Tables: attendance, content_items, chat_rooms, chat_messages

// AttendanceConfiguration
builder.HasIndex(a => new { a.SessionId, a.StudentUserId }).IsUnique();
builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(10);

// ContentItemConfiguration
builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
builder.Property(c => c.SourceType).HasConversion<string>().HasMaxLength(20);
builder.HasIndex(c => new { c.TeachingAssignmentId, c.Type, c.IsActive });

// ChatRoomConfiguration
builder.Property(r => r.RoomType).HasConversion<string>().HasMaxLength(30);
builder.HasIndex(r => r.GradeId).IsUnique().HasFilter("[grade_id] IS NOT NULL"); // SQL Server filtered index

// ChatMessageConfiguration
builder.HasIndex(m => new { m.ChatRoomId, m.SentAt }); // pagination query
builder.Property(m => m.Content).HasMaxLength(1000);
builder.HasQueryFilter(m => !m.IsDeleted);
```

### SignalR Hub

```csharp
// NuGet: Microsoft.AspNetCore.SignalR (built-in)
// Redis backplane: NuGet: Microsoft.AspNetCore.SignalR.StackExchangeRedis
// Configured in Program.cs: builder.Services.AddSignalR().AddStackExchangeRedis(connectionString)

[Authorize]
public class ChatHub : Hub
{
    // JoinRoom(int chatRoomId): validates access, adds to group "room:{chatRoomId}"
    // LeaveRoom(int chatRoomId): removes from group
    // SendMessage(int chatRoomId, string content): calls SendChatMessageCommand, broadcasts to group
    // Client methods: ReceiveMessage(ChatMessageDto), UserJoined(string userName), UserLeft(string userName)
}
```

### Azure Blob — Video Storage

```csharp
// Container: "content-videos" (private, served via signed URLs)
// Container: "content-documents" (private, served via signed URLs)
// Signed URL expiry: 2 hours for videos, 1 hour for documents
// Max file sizes enforced in command validators:
//   Videos: 500 MB
//   PDFs/Docs: 50 MB
```

### Seeder — Chat Rooms

```csharp
// SeedChatRooms.cs — runs on startup
// Creates one GradeCommunity room per grade (seeded in Phase 2)
// Creates one TeachersCommunity room
// Idempotent — only creates if not exists
```

---

## 5. API Endpoints

```
// Attendance
POST   /api/student/sessions/{sessionId}/join            → RecordAttendanceCommand
PUT    /api/teacher/attendance/{attendanceId}/override   → OverrideAttendanceCommand
GET    /api/teacher/sessions/{sessionId}/attendance      → GetSessionAttendanceQuery
GET    /api/student/attendance                           → GetStudentAttendanceQuery
GET    /api/parent/children/{studentId}/attendance       → GetStudentAttendanceForParentQuery

// Content Library
POST   /api/teacher/content/url                          → UploadContentUrlCommand
POST   /api/teacher/content/file                         → UploadContentFileCommand (multipart)
DELETE /api/teacher/content/{id}                         → DeleteContentItemCommand [Teacher or Admin]
GET    /api/teacher/content/{taId}                       → GetTeacherContentQuery
GET    /api/student/content/{subjectId}                  → GetContentForSubjectQuery [SubscriptionGuard]
GET    /api/content/{id}/download-url                    → GetContentDownloadUrlQuery [AnyAuthenticated]

// Chat (REST for history load + SignalR for real-time)
GET    /api/chat/rooms                                   → GetMyRoomsQuery
GET    /api/chat/rooms/{roomId}/messages                 → GetRoomMessagesQuery (page, pageSize)
DELETE /api/chat/messages/{messageId}                    → DeleteChatMessageCommand

// SignalR hub
WS     /hubs/chat                                        → ChatHub
```

---

## 6. Database Migration

```
Migration name: Phase4_AttendanceContentChat

New tables: attendance, content_items, chat_rooms, chat_messages

Key indexes:
- attendance(session_id, student_user_id) UNIQUE
- content_items(teaching_assignment_id, type, is_active)
- chat_messages(chat_room_id, sent_at) — pagination
- chat_rooms(grade_id) UNIQUE FILTERED (WHERE grade_id IS NOT NULL)

Seeder: SeedChatRoomsData.cs
```

---

## 7. Angular Frontend

### Module Structure

```
features/
  attendance/
    pages/
      teacher/
        session-attendance/      ← roster view for a session
        student-attendance-report/
      student/
        my-attendance/           ← per-subject attendance with percentage bar
      parent/
        child-attendance/        ← read-only view for linked student
    components/
      attendance-badge/          ← Present/Absent/Excused chip
      attendance-summary-card/
    services/
      attendance.service.ts

  content-library/
    pages/
      teacher/
        content-uploader/        ← upload form: URL or file, type selector
        my-content/              ← list/manage uploaded content
      student/
        subject-content/         ← browse content for a subject
        video-player/            ← inline YouTube/Vimeo embed or HTML5 player
    components/
      content-card/              ← thumbnail, type badge, title, download/watch button
      video-embed/               ← wraps iframe (YouTube/Vimeo) or <video> (blob)
    services/
      content.service.ts

  chat/
    pages/
      chat-room/                 ← full chat UI
    components/
      message-bubble/
      message-input/
      room-list/                 ← sidebar listing accessible rooms
    services/
      chat.service.ts            ← wraps SignalR HubConnection
    store/
      chat.state.ts
      chat.actions.ts
      chat.effects.ts
      chat.selectors.ts
```

### SignalR Angular Service

```typescript
// chat.service.ts
import * as signalR from '@microsoft/signalr';

export class ChatService {
  private hubConnection: signalR.HubConnection;

  startConnection(token: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();
    this.hubConnection.start();
  }

  joinRoom(roomId: number): void { this.hubConnection.invoke('JoinRoom', roomId); }
  leaveRoom(roomId: number): void { this.hubConnection.invoke('LeaveRoom', roomId); }
  sendMessage(roomId: number, content: string): void { this.hubConnection.invoke('SendMessage', roomId, content); }

  onReceiveMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      this.hubConnection.on('ReceiveMessage', (msg) => observer.next(msg));
    });
  }
}
```

### Angular Models

```typescript
export interface AttendanceRecord { attendanceId: number; sessionTitle: string; status: 'Present' | 'Absent' | 'Excused'; joinedAt?: string; teacherNote?: string; }
export interface SubjectAttendance { subjectName: string; totalSessions: number; presentCount: number; attendancePercentage: number; }
export interface ContentItem { contentItemId: number; type: string; sourceType: string; title: string; description?: string; resourceUrl: string; fileSizeBytes?: number; }
export interface ChatRoom { chatRoomId: number; name: string; roomType: string; unreadCount: number; }
export interface ChatMessage { messageId: number; senderName: string; content: string; sentAt: string; }
```

### Angular Routing

```typescript
{ path: 'teacher/sessions/:id/attendance', component: SessionAttendancePage, canActivate: [AuthGuard, TeacherGuard] },
{ path: 'student/attendance', component: MyAttendancePage, canActivate: [AuthGuard, StudentGuard, SubscriptionGuard] },
{ path: 'parent/children/:studentId/attendance', component: ChildAttendancePage, canActivate: [AuthGuard, ParentGuard] },
{ path: 'teacher/content', component: MyContentPage, canActivate: [AuthGuard, TeacherGuard] },
{ path: 'student/content/:subjectId', component: SubjectContentPage, canActivate: [AuthGuard, StudentGuard, SubscriptionGuard] },
{ path: 'chat/:roomId', component: ChatRoomPage, canActivate: [AuthGuard] },
```

---

## 8. Definition of Done

- [ ] Student join event within window records `Present` attendance — idempotent
- [ ] Background job correctly marks `Absent` after session ends + 15 min
- [ ] Teacher can override attendance status with a note
- [ ] Attendance percentage computed correctly per subject
- [ ] Teacher can upload a video URL (YouTube/Vimeo) and it renders inline for students
- [ ] Teacher can upload a PDF file to Azure Blob; student can download via signed URL
- [ ] Students can only access content for their enrolled class (enforced server-side)
- [ ] SignalR chat: messages sent in one browser appear in another browser in real-time
- [ ] Chat room access policy enforced (student can't join teacher community)
- [ ] Redis backplane for SignalR configured and verified in integration test
- [ ] All background jobs tested with controlled DateTime injection (no `DateTime.Now` direct calls)

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Student joins session but API call fails (network) | Make `RecordAttendance` endpoint idempotent; frontend retries on error |
| Large video file uploads timeout | Use chunked upload or direct Azure Blob SAS upload from client; backend only stores the resulting blob name |
| SignalR connection lost | `withAutomaticReconnect()` in Angular client; server keeps group membership in Redis |
| Content URL injection (malicious iframe src) | Validate URL is from allowlisted domains (youtube.com, vimeo.com) for URL-based content |
