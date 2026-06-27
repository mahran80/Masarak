# Phase 6 — Notifications, Admin Dashboard & Platform Shell

**Developer:** Dev 6  
**Complexity:** Medium-High  
**Dependencies:** All phases (consumes events from Phases 1–5); must be integrated last but notification infrastructure can be built in parallel with Phase 2+

---

## Objective

Deliver the notifications system, the admin control panel, and the Angular platform shell (navigation, layout, routing guards, role-based menus). Notifications are push-delivered via SignalR for real-time in-app alerts and persisted to DB for the notification inbox. This phase also owns the global admin dashboard (user management, content moderation, subscription oversight) and the Angular application scaffolding that all other phases plug into.

---

## 1. Functional Requirements

### Notifications
- Real-time in-app notifications delivered via SignalR to the correct user(s)
- Notification types:
  - Student: new assignment posted, exam opening soon (24h before), exam graded, attendance below threshold, new content uploaded, subscription expiring (7 days before)
  - Teacher: new student enrolled in their class, submission received, all exams graded confirmation
  - Parent: monthly smart report ready, student attendance drop alert, student exam result
  - Admin: new user registration, subscription payment failed, platform error alerts
- Notifications are persisted to DB and visible in an in-app notification inbox
- Users can mark individual notifications as read or mark all as read
- Unread count shown in navbar badge
- Notifications consumed from RabbitMQ events published by all other phases

### Admin Dashboard
- User management: view all users, filter by role, activate/deactivate accounts, reset passwords
- Subscription management: view all subscriptions, manually activate/cancel
- Content moderation: view all content items, deactivate inappropriate content
- Platform KPIs surfaced from Phase 5 analytics snapshots
- System health panel: queue depth, active connections, job status

### Angular Platform Shell
- Responsive layout: sidebar navigation + top navbar + main content area
- Navigation items are role-aware: different menus for Student, Teacher, Parent, Admin
- Arabic/English language toggle (i18n via ngx-translate)
- Dark/light mode toggle
- Global error handling interceptor: maps API error codes to user-friendly messages
- Loading state overlay for async operations
- Toast notification service (wraps ngx-toastr or Angular Material snackbar)

---

## 2. Domain Layer (`Masarak.Domain`)

### Entities

```csharp
public class Notification
{
    public int NotificationId { get; private set; }
    public int UserId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Title { get; private set; }
    public string Body { get; private set; }
    public string? ActionUrl { get; private set; }      // deep link: "/student/exams/42"
    public NotificationChannel Channel { get; private set; } // InApp, (Email stub for Phase 7)
    public bool IsRead { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public User User { get; private set; }

    public static Notification Create(int userId, NotificationType type, string title,
        string body, string? actionUrl = null) { ... }
    public void MarkRead() { IsRead = true; ReadAt = DateTime.UtcNow; }
}
```

### Enums

```csharp
public enum NotificationType
{
    NewAssignment, ExamOpening, ExamGraded, AttendanceAlert,
    NewContent, SubscriptionExpiring, SubscriptionExpired,
    NewEnrollment, SubmissionReceived, ExamFullyGraded,
    MonthlyReportReady, StudentAttendanceAlert, StudentExamResult,
    NewUserRegistered, PaymentFailed, LowPerformanceAlert
}

public enum NotificationChannel { InApp, Email } // Email = Phase 7 stub only
```

---

## 3. Application Layer (`Masarak.Application`)

### Interfaces

```csharp
public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, int page, int pageSize, bool unreadOnly, CancellationToken ct);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct);
    Task AddAsync(Notification notification, CancellationToken ct);
    Task MarkReadAsync(int notificationId, int userId, CancellationToken ct);
    Task MarkAllReadAsync(int userId, CancellationToken ct);
}

public interface INotificationPushService
{
    // Sends real-time notification to specific user via SignalR
    Task PushToUserAsync(int userId, NotificationDto notification, CancellationToken ct);
    // Sends to all users with specific role
    Task PushToRoleAsync(string role, NotificationDto notification, CancellationToken ct);
}

public interface IAdminUserRepository
{
    Task<PagedResult<AdminUserDto>> GetAllAsync(string? roleFilter, string? searchTerm, int page, int pageSize, CancellationToken ct);
    Task<User?> GetByIdWithDetailsAsync(int userId, CancellationToken ct);
    Task ActivateAsync(int userId, CancellationToken ct);
    Task DeactivateAsync(int userId, CancellationToken ct);
}
```

### Commands

```csharp
// Notifications (internal — called by RabbitMQ consumers, not exposed directly)
public record CreateAndPushNotificationCommand(int UserId, NotificationType Type,
    string Title, string Body, string? ActionUrl) : IRequest<Unit>;
public record MarkNotificationReadCommand(int UserId, int NotificationId) : IRequest<Unit>;
public record MarkAllNotificationsReadCommand(int UserId) : IRequest<Unit>;

// Admin user management
public record DeactivateUserCommand(int AdminId, int TargetUserId, string Reason) : IRequest<Unit>;
public record ActivateUserCommand(int AdminId, int TargetUserId) : IRequest<Unit>;
public record AdminResetPasswordCommand(int AdminId, int TargetUserId) : IRequest<string>; // returns temp password

// Admin content moderation
public record ModerateContentItemCommand(int AdminId, int ContentItemId, string Reason) : IRequest<Unit>;
```

### Queries

```csharp
public record GetMyNotificationsQuery(int UserId, int Page, int PageSize, bool UnreadOnly) : IRequest<PagedResult<NotificationDto>>;
public record GetUnreadCountQuery(int UserId) : IRequest<int>;
public record GetAdminUsersQuery(string? RoleFilter, string? SearchTerm, int Page, int PageSize) : IRequest<PagedResult<AdminUserDto>>;
public record GetAdminUserDetailQuery(int AdminId, int TargetUserId) : IRequest<AdminUserDetailDto>;
public record GetSystemHealthQuery() : IRequest<SystemHealthDto>;
```

### DTOs

```csharp
public record NotificationDto(int NotificationId, NotificationType Type, string Title, string Body, string? ActionUrl, bool IsRead, DateTime CreatedAt);
public record AdminUserDto(int UserId, string FullName, string Email, string Role, bool IsActive, DateTime CreatedAt, bool HasActiveSubscription);
public record AdminUserDetailDto(int UserId, string FullName, string Email, string Role, bool IsActive, SubscriptionDto? ActiveSubscription, int ExamsTaken, int AssignmentsSubmitted, decimal AttendancePercentage);
public record SystemHealthDto(int RabbitMqQueueDepth, int SignalRConnections, int ActiveBackgroundJobs, IEnumerable<string> RecentErrors);
```

### RabbitMQ Event Consumers (Phase 6 owns all notification triggers)

```csharp
// Each consumer follows the same pattern:
// 1. Handle event
// 2. Determine target user(s)
// 3. Dispatch CreateAndPushNotificationCommand via IMediator

// Consumers implemented in Phase 6:
public class SubscriptionActivatedNotificationConsumer : IConsumer<SubscriptionActivatedEvent>
// → notify student: "Your subscription is now active!"

public class SubscriptionExpiringNotificationConsumer : IConsumer<SubscriptionExpiringEvent>
// → notify student 7 days before: "Your subscription expires in 7 days"

public class ExamFullyGradedNotificationConsumer : IConsumer<ExamFullyGradedEvent>
// → notify student: "Your exam has been graded. Score: X/Y"
// → notify parent(s) linked to student

public class AssignmentGradedNotificationConsumer : IConsumer<AssignmentGradedEvent>
// → notify student: "Your assignment has been graded"

public class SessionScheduledNotificationConsumer : IConsumer<SessionScheduledEvent>
// → notify all enrolled students in the class

public class AlertCreatedNotificationConsumer : IConsumer<AlertCreatedEvent>
// → notify student + linked parent(s): attendance or performance alert

public class ParentReportReadyNotificationConsumer : IConsumer<ParentReportReadyEvent>
// → notify parent: "Your monthly report for {student} is ready"

public class PaymentFailedNotificationConsumer : IConsumer<PaymentFailedEvent>
// → notify admin
```

### CreateAndPushNotificationHandler

```csharp
public class CreateAndPushNotificationHandler : IRequestHandler<CreateAndPushNotificationCommand, Unit>
{
    // 1. Create Notification entity
    // 2. Persist via INotificationRepository
    // 3. Call INotificationPushService.PushToUserAsync (SignalR)
    // 4. Return Unit
}
```

---

## 4. Infrastructure Layer

### SignalR Notification Hub

```csharp
// Separate from ChatHub — purpose: push notifications only
[Authorize]
public class NotificationHub : Hub
{
    // On connection: add user to personal group "user:{userId}"
    // No client-invokable methods — server-push only
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User.GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        await base.OnConnectedAsync();
    }
}

// INotificationPushService implementation:
public class SignalRNotificationPushService : INotificationPushService
{
    public async Task PushToUserAsync(int userId, NotificationDto notification, CancellationToken ct)
        => await _hubContext.Clients.Group($"user:{userId}").SendAsync("ReceiveNotification", notification, ct);

    public async Task PushToRoleAsync(string role, NotificationDto notification, CancellationToken ct)
        => await _hubContext.Clients.Group($"role:{role}").SendAsync("ReceiveNotification", notification, ct);
}
```

### EF Core Configuration

```csharp
// Table: notifications
builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt }); // inbox query
builder.HasIndex(n => new { n.UserId, n.IsRead }).HasFilter("[is_read] = 0"); // unread count
builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(40);
builder.Property(n => n.Channel).HasConversion<string>().HasMaxLength(10);
builder.Property(n => n.ActionUrl).HasMaxLength(500);
```

### MassTransit Registration

```csharp
// All consumers from all phases registered here in one place
// Program.cs or DI extension:
services.AddMassTransit(x =>
{
    // Phase 3 consumers
    x.AddConsumer<PerformanceRecalculationConsumer>();
    x.AddConsumer<ExamAutoExpireConsumer>();

    // Phase 5 consumers
    x.AddConsumer<PerformanceRecalculatedConsumer>();

    // Phase 6 notification consumers (all of them)
    x.AddConsumer<SubscriptionActivatedNotificationConsumer>();
    x.AddConsumer<ExamFullyGradedNotificationConsumer>();
    x.AddConsumer<AssignmentGradedNotificationConsumer>();
    x.AddConsumer<SessionScheduledNotificationConsumer>();
    x.AddConsumer<AlertCreatedNotificationConsumer>();
    x.AddConsumer<ParentReportReadyNotificationConsumer>();
    x.AddConsumer<PaymentFailedNotificationConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(Configuration["RabbitMQ:Host"], h =>
        {
            h.Username(Configuration["RabbitMQ:Username"]);
            h.Password(Configuration["RabbitMQ:Password"]);
        });
        cfg.ConfigureEndpoints(ctx);
    });
});
```

---

## 5. API Endpoints

```
// Notifications
GET    /api/notifications                    → GetMyNotificationsQuery [AnyAuthenticated]
GET    /api/notifications/unread-count       → GetUnreadCountQuery [AnyAuthenticated]
PUT    /api/notifications/{id}/read          → MarkNotificationReadCommand [AnyAuthenticated]
PUT    /api/notifications/read-all           → MarkAllNotificationsReadCommand [AnyAuthenticated]

// SignalR hubs
WS     /hubs/notifications                   → NotificationHub (already configured in Phase 4 for Chat)

// Admin — Users
GET    /api/admin/users                      → GetAdminUsersQuery (role, search, page, pageSize)
GET    /api/admin/users/{id}                 → GetAdminUserDetailQuery
PUT    /api/admin/users/{id}/deactivate      → DeactivateUserCommand
PUT    /api/admin/users/{id}/activate        → ActivateUserCommand
POST   /api/admin/users/{id}/reset-password  → AdminResetPasswordCommand

// Admin — Content moderation
PUT    /api/admin/content/{id}/moderate      → ModerateContentItemCommand

// Admin — System
GET    /api/admin/system/health              → GetSystemHealthQuery
```

---

## 6. Database Migration

```
Migration name: Phase6_Notifications

New table: notifications

Key indexes:
- notifications(user_id, is_read, created_at) — inbox paginated query
- notifications(user_id, is_read) FILTERED (WHERE is_read = 0) — unread count
```

---

## 7. Angular Platform Shell & Notifications

### Module Structure

```
app/
  core/
    layout/
      shell/                    ← root shell component (sidebar + navbar + router-outlet)
      sidebar/                  ← role-aware nav items
      navbar/                   ← user avatar, notification bell, language toggle
      notification-panel/       ← slide-out panel with notification list
    interceptors/
      auth.interceptor.ts       ← attaches Bearer token
      refresh.interceptor.ts    ← auto-refresh on 401
      error.interceptor.ts      ← maps API error codes to toast messages
      loading.interceptor.ts    ← shows/hides global loading overlay
    guards/
      auth.guard.ts
      role.guard.ts             ← base class
      admin.guard.ts
      teacher.guard.ts
      student.guard.ts
      parent.guard.ts
      subscription.guard.ts
    services/
      notification-hub.service.ts  ← SignalR NotificationHub connection
      toast.service.ts
      loading.service.ts
      i18n.service.ts
    store/
      notification.state.ts
      notification.actions.ts
      notification.effects.ts
      notification.selectors.ts

  features/
    admin/
      pages/
        user-management/         ← data table: search, filter, activate/deactivate
        user-detail/             ← full user detail with history
        content-moderation/      ← list flaggable content items
        system-health/           ← queue depth, connection counts, job status
      services/
        admin.service.ts
```

### Navigation Config (role-aware menu)

```typescript
// nav-items.config.ts
export const NAV_ITEMS: Record<string, NavItem[]> = {
  Student: [
    { label: 'nav.schedule', icon: 'calendar', route: '/student/schedule' },
    { label: 'nav.assignments', icon: 'clipboard', route: '/student/assignments' },
    { label: 'nav.exams', icon: 'pencil', route: '/student/exams' },
    { label: 'nav.content', icon: 'book', route: '/student/content' },
    { label: 'nav.attendance', icon: 'check-circle', route: '/student/attendance' },
    { label: 'nav.insights', icon: 'lightbulb', route: '/student/insights' },
  ],
  Teacher: [
    { label: 'nav.assignments', icon: 'assignments', route: '/teacher/assignments' },
    { label: 'nav.sessions', icon: 'video', route: '/teacher/sessions/new' },
    { label: 'nav.content', icon: 'upload', route: '/teacher/content' },
    { label: 'nav.grading', icon: 'star', route: '/teacher/grading/pending' },
    { label: 'nav.analytics', icon: 'chart', route: '/teacher/analytics' },
  ],
  Parent: [
    { label: 'nav.children', icon: 'users', route: '/parent/linked-students' },
    { label: 'nav.reports', icon: 'document', route: '/parent/reports' },
    { label: 'nav.attendance', icon: 'check', route: '/parent/attendance' },
    { label: 'nav.chat', icon: 'chat', route: '/chat' },
  ],
  Admin: [
    { label: 'nav.dashboard', icon: 'grid', route: '/admin/analytics' },
    { label: 'nav.users', icon: 'users', route: '/admin/users' },
    { label: 'nav.subscriptions', icon: 'credit-card', route: '/admin/subscriptions' },
    { label: 'nav.grades', icon: 'book-open', route: '/admin/grades' },
    { label: 'nav.content', icon: 'flag', route: '/admin/content-moderation' },
    { label: 'nav.ai', icon: 'cpu', route: '/admin/ai/templates' },
    { label: 'nav.health', icon: 'activity', route: '/admin/system/health' },
  ],
};
```

### Notification Store (NgRx)

```typescript
// notification.state.ts
export interface NotificationState {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  panelOpen: boolean;
}

// notification.effects.ts
// - connectHub$: on login success, start SignalR NotificationHub connection
// - onReceiveNotification$: push to store, increment unreadCount, show toast
// - loadNotifications$: GET /api/notifications
// - markRead$: PUT /api/notifications/{id}/read
```

### i18n Setup

```typescript
// TranslateModule with ngx-translate
// Languages: 'en' and 'ar'
// RTL: apply dir="rtl" on <html> when Arabic selected
// Translation files: assets/i18n/en.json, assets/i18n/ar.json
// Loaded lazily: TranslateHttpLoader
// All nav labels, button text, error messages fully translated
```

### Angular Models

```typescript
export interface NotificationDto { notificationId: number; type: string; title: string; body: string; actionUrl?: string; isRead: boolean; createdAt: string; }
export interface AdminUser { userId: number; fullName: string; email: string; role: string; isActive: boolean; hasActiveSubscription: boolean; }
export interface SystemHealth { rabbitMqQueueDepth: number; signalRConnections: number; activeBackgroundJobs: number; recentErrors: string[]; }
```

---

## 8. Definition of Done

- [ ] RabbitMQ notification consumers receive events from all other phases and create notifications
- [ ] SignalR NotificationHub delivers real-time notification to logged-in user within 1 second of event
- [ ] Unread count badge in navbar updates in real-time without page refresh
- [ ] Notification panel shows paginated list with mark-read functionality
- [ ] Angular shell renders correct nav items for each role
- [ ] Arabic/English toggle switches language and RTL/LTR layout correctly
- [ ] Admin user management: search, filter by role, activate/deactivate all work
- [ ] Admin content moderation deactivates a content item and it disappears from student view
- [ ] All Angular interceptors operational: auth, refresh, error-to-toast, loading overlay
- [ ] Integration test: exam graded → `ExamFullyGradedEvent` → RabbitMQ → consumer → notification in DB → SignalR push → Angular store updated
- [ ] MassTransit retry and dead-letter queue verified for all consumers

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Phase 6 has hard dependencies on events from all other phases | Dev 6 defines all event contracts (interfaces + records) on Day 1; other devs implement publishing against these contracts |
| SignalR NotificationHub conflicts with Chat Hub (Phase 4) | Two separate Hub classes on two endpoints: `/hubs/chat` and `/hubs/notifications` — no conflict |
| Notification volume at scale (thousands of students) | `PushToRoleAsync` uses SignalR groups — efficient; DB inserts batched when broadcasting to a class |
| RTL layout breaks Angular Material or PrimeNG components | Validate all components with both LTR and RTL during development; use CSS logical properties (`margin-inline-start` instead of `margin-left`) |
