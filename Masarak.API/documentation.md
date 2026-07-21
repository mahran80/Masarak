# Masarak Education Platform: API Layer Documentation

## Table of Contents
1. [Layer Overview](#1-layer-overview)
2. [Folder Structure](#2-folder-structure)
3. [Program.cs & Application Pipeline](#3-programcs--application-pipeline)
4. [Controllers & Endpoints](#4-controllers--endpoints)
5. [SignalR Hubs (Real-Time Comm)](#5-signalr-hubs-real-time-comm)
6. [Middleware & Security](#6-middleware--security)
7. [Dependency Injection](#7-dependency-injection)

---

## 1. Layer Overview

The **Masarak.API** project serves as the Presentation Layer. It is a RESTful API built on ASP.NET Core 9.0. It exposes the application's capabilities to the Angular frontend (and any future mobile apps) via HTTP Endpoints and WebSockets (SignalR).

### Purpose
- **Routing & HTTP**: Defines HTTP verbs, routes, and maps JSON payloads to DTOs.
- **Authentication/Authorization**: Enforces JWT validation and Role/Policy-based access control.
- **Real-Time Communication**: Hosts SignalR Hubs for Chat and Notifications.
- **Bootstrapping**: Serves as the entry point (`Program.cs`), wiring up all dependencies across the entire solution.

---

## 2. Folder Structure

```text
Masarak.API/
â”œâ”€â”€ Controllers/   # Grouped by Actor (Admin, Teacher, Student) or Domain
â”œâ”€â”€ Extensions/    # Middleware, DI registrations, and Swagger configs
â”œâ”€â”€ Hubs/          # SignalR websocket hubs
â”œâ”€â”€ Policies/      # Authorization requirement definitions
â”œâ”€â”€ Services/      # API-specific services (e.g., SignalR Push wrapper)
â””â”€â”€ Program.cs     # Application entry point
```

---

## 3. Program.cs & Application Pipeline

`Program.cs` builds the WebApplication and sets up the strict execution pipeline. 

### Bootstrapping Order:
1. **Load Configuration**: Reads `appsettings.json` and Azure KeyVault.
2. **Register Services**: Calls `builder.Services.AddMasarakInfrastructure()` and `AddMasarakApplication()` (from `ServiceCollectionExtensions.cs`).
3. **Configure Authentication**: Wires up JWT Bearer authentication.
4. **Configure CORS**: Allows `http://localhost:4200` (Angular Dev) and production URLs.
5. **Add SignalR**: Registers the WebSocket service.

### Middleware Pipeline Order (Crucial for Security):
```csharp
app.UseMiddleware<GlobalExceptionMiddleware>(); // 1. Catch unhandled errors first
app.UseHttpsRedirection();
app.UseCors("AllowAngularClient");
app.UseAuthentication();                        // 2. Identify the user
app.UseAuthorization();                         // 3. Check Role/Policy
app.UseMiddleware<SubscriptionAccessMiddleware>(); // 4. Check if Subscription is active (Phase 1)
app.MapControllers();                           // 5. Route to endpoint
app.MapHub<ChatHub>("/hubs/chat");              // 6. Route to WebSockets
```

---

## 4. Controllers & Endpoints

Controllers in Masarak are cleanly separated by **Actor** (who is calling it) to prevent confusing permissions and logic branches. All endpoints return standardized envelopes (usually `Result<T>` or direct `Ok(Dto)`).

### 4.1. Identity & Public
- **`AuthController.cs`**: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`. (AllowAnonymous).
- **`PlanController.cs`**: `GET /api/plans`. Public catalog of subscription tiers.

### 4.2. Admin Controllers
Requires `[Authorize(Roles = "Admin")]`
- **`AdminSystemController.cs` / `AdminUsersController.cs`**: CRUD operations for managing platform users, forcing password resets, and viewing system health.
- **`AdminContentModerationController.cs`**: Reviewing and taking down inappropriate teacher-uploaded content.
- **`AdminAnalyticsController.cs`**: Global platform insights (Revenue, Total active users).
- **`CurriculumController.cs`**: Defines the master list of Grades, Subject Categories, and Subjects.

### 4.3. Teacher Controllers
Requires `[Authorize(Roles = "Teacher")]`
- **`TeacherDashboardController.cs`**: `GET /api/teacher/dashboard` - Aggregates upcoming sessions and pending grading tasks.
- **`TeacherLessonsController.cs`**: CRUD for organizing curriculum into Chapters/Lessons.
- **`TeacherAssessmentController.cs`**: Creating exams, adding questions, creating assignments, and grading submissions (`POST /api/teacher/assessment/exams/{id}/grade`).
- **`SessionTeacherController.cs`**: Scheduling live sessions (`POST /api/teacher/sessions`).
- **`TeacherAnalyticsController.cs`**: AI insights on their specific class performance.

### 4.4. Student & Parent Controllers
Requires `[Authorize(Roles = "Student")]` or `Parent`
- **`StudentAcademicController.cs`**: Enrolling in classes, viewing the timetable.
- **`StudentAssessmentController.cs`**: Taking exams (`POST /api/student/exams/{id}/submit`), uploading assignment files.
- **`StudentLessonsController.cs`**: Viewing published lessons and downloading content.
- **`StudentInsightsController.cs`**: Viewing personal AI weakness analysis.
- **`ParentReportsController.cs`**: Requires `Parent` role. Fetches the monthly aggregate AI report.

### 4.5. Phase 1 Linkage
- **`SecuredControllers.cs` / `SubscriptionController.cs`**: Parent linking to a student using a unique code, and Stripe checkout initiation.

---

## 5. SignalR Hubs (Real-Time Comm)

Masarak uses WebSockets to push data to the Angular client instantly.

- **`ChatHub.cs`**: 
  - Allows Users to join rooms (`Groups.AddToGroupAsync`).
  - Broadcasts `ReceiveMessage` to connected clients in a specific class or private chat.
- **`NotificationHub.cs`**: 
  - Used for platform alerts.
  - Sends messages directly to `Context.UserIdentifier`.
- **`LiveSessionHub.cs`**: 
  - Coordinates whiteboarding or hand-raising events during a live Agora video call.

---

## 6. Middleware & Security

### `GlobalExceptionMiddleware.cs`
- Wraps every HTTP request in a `try/catch`.
- Catches `ValidationException`, `NotFoundException`, `UnauthorizedException` thrown from the Application layer.
- Formats them into a consistent JSON response: `{ "errorCode": "...", "message": "..." }`.
- Ensures **no stack traces** are ever leaked to the frontend.

### `SubscriptionAccessMiddleware.cs` (Phase 1)
- Intercepts requests to premium features (like `StudentAssessmentController`).
- Checks Redis/Database to see if the user's `SubscriptionStatus` is `Active`.
- If expired, short-circuits the pipeline and returns `402 Payment Required`, forcing the Angular app to redirect the user to the billing page.

### `AppPolicies.cs`
- Defines complex authorization rules beyond simple roles. For example, a policy that ensures a Parent can only view reports for a Student *if* that student is linked to their account in the `ParentStudentLinks` table.

---

## 7. Dependency Injection

Located in `Extensions/ServiceCollectionExtensions.cs`.
- Uses `IServiceCollection` extension methods to keep `Program.cs` clean.
- Automatically maps `IAuthService` to `AuthService`.
- Registers MassTransit, Redis, and Swagger configurations.

> [!IMPORTANT]
> **API Development Rule**: Controllers should contain **zero business logic**. A typical Masarak controller method simply takes the Request payload, extracts the `UserId` from the JWT claims, and passes both to an Application Service, returning `Ok()` on success.
