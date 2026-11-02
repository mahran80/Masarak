# Masarak Education Platform: Application Layer Documentation

## Table of Contents
1. [Layer Overview](#1-layer-overview)
2. [Folder Structure](#2-folder-structure)
3. [Data Transfer Objects (DTOs)](#3-data-transfer-objects-dtos)
4. [Interfaces & Contracts](#4-interfaces--contracts)
5. [Business Logic & Mapping](#5-business-logic--mapping)
6. [Design Patterns & Behaviors](#6-design-patterns--behaviors)

---

## 1. Layer Overview

The **Masarak.Application** project is the core orchestrator of the Masarak Education Platform. Following Clean Architecture and Domain-Driven Design (DDD) principles, this layer sits directly above the Domain layer and has **no dependencies** on external frameworks, databases, or infrastructure (UI, EF Core, SQL Server).

### Purpose
- **Use Case Orchestration**: Defines the exact business use cases (commands and queries) the system can perform.
- **Data Transfer**: Defines all Input (Requests) and Output (Responses) shapes via DTOs to ensure domain entities are never leaked to the presentation layer.
- **Contract Definition**: Contains all interface definitions (`IRepository`, `IService`) that the Infrastructure layer must implement.

### Dependencies
- **Depends On**: `Masarak.Domain`
- **Used By**: `Masarak.API`, `Masarak.Infrastructure`

---

## 2. Folder Structure

```text
Masarak.Application/
â”œâ”€â”€ DTOs/            # Request/Response objects mapping to use cases (Phase 1-6)
â”œâ”€â”€ Interfaces/      # Abstractions for Repositories, External Services, and Application Services
â”œâ”€â”€ Mapping/         # AutoMapper profiles (or manual mapping extensions) translating Entities <-> DTOs
â””â”€â”€ Services/        # Concrete implementations of Application-specific logic (if any)
```

---

## 3. Data Transfer Objects (DTOs)

The DTOs are grouped by feature phase. They represent the exact payload schemas for the API controllers.

### 3.1. `AuthDTOs.cs` (Phase 1 - Identity)
**Purpose**: Handles authentication, registration, and user management payloads.
- **`RegisterRequest`**: (Properties: `FullName`, `Email`, `Password`, `ConfirmPassword`, `Role`, `GradeId`). Validates user registration data.
- **`LoginRequest`**: (Properties: `Email`, `Password`).
- **`AuthResponse`**: (Properties: `Success`, `AccessToken`, `RefreshToken`, `User`). Returned upon successful authentication.
- **`UserInfoDto`**: Stripped-down user representation for the frontend state.

### 3.2. `SubscriptionDTOs.cs` (Phase 1 - Subscriptions)
**Purpose**: Manages payment plans, Stripe integration payloads, and parent-student linkages.
- **`PlanDto`**: Represents available subscription tiers.
- **`SubscriptionDto`**: Represents an active or expired subscription for a user.
- **`ParentStudentLinkDto`**: DTO used when a parent links to a student using a unique linkage code.

### 3.3. `AcademicDTOs.cs` (Phase 2 - Core Academic)
**Purpose**: Core school management (Grades, Subjects, Classes, Teachers).
- **`GradeDto` / `GradeDetailDto`**: Maps to educational grades (e.g., Grade 10).
- **`SubjectDto`**: Represents a subject (e.g., Mathematics, Science).
- **`ClassDto`**: Represents a physical or virtual classroom capacity and enrollment.
- **`TeachingAssignmentDto`**: Joins a Teacher, Class, Subject, and Academic Year.
- **`SessionDto` / `WeeklyScheduleDto`**: Represents timetable slots and live sessions.

### 3.4. `AssessmentDTOs.cs` (Phase 3 - Grading)
**Purpose**: Exams, Questions, Assignments, and automated grading.
- **`ExamDto` / `CreateExamRequest`**: Payloads for scheduling and defining exam parameters (Duration, Start/End time).
- **`QuestionDto` / `QuestionOptionDto`**: Represents MCQ, True/False, or text questions.
- **`SubmissionDetailDto`**: Represents a student's uploaded assignment file and current grading status.
- **`StudentExamGradeDto`**: Contains final calculated scores (Auto-score + Manual score).

### 3.5. `Phase4DTOs.cs` (Attendance & Content)
**Purpose**: Attendance tracking, content library, and live chat features.
- **`AttendanceDto` / `SessionAttendanceDto`**: Records if a student was Present, Absent, or Excused for a specific session.
- **`ContentItemDto`**: Represents uploaded PDFs, Videos, or Links. (Properties: `ResourceUrl`, `ContentType`, `SizeBytes`).
- **`ChatRoomDto` / `ChatMessageDto`**: Payloads for SignalR chat history.

### 3.6. `Phase5DTOs.cs` (AI & Analytics)
**Purpose**: AI-generated insights, weakness analysis, and parent reports.
- **`WeaknessAnalysisDto`**: (Properties: `SubjectName`, `WeakTopics`, `NarrativeSummary`).
- **`ContentRecommendationDto`**: AI-suggested content based on student performance.
- **`ParentReportDto`**: A comprehensive monthly aggregation of attendance, grades, and AI narratives sent to parents.

### 3.7. `Phase6DTOs.cs` & `AdminDTOs.cs` (Notifications & Shell)
- **`NotificationDto`**: Real-time alert payloads (e.g., "Exam Graded", "Session Starting").
- **`AdminCreateUserRequest`**: Super-admin payload for bypassing standard registration (e.g., direct teacher creation).

---

## 4. Interfaces & Contracts

The Application layer defines the contracts. The Infrastructure layer implements them. This fulfills the Dependency Inversion Principle.

### 4.1. Application Services
These services coordinate business logic that spans multiple repositories but doesn't belong in a single entity.
- **`IAuthService`**: Handles JWT generation, password hashing, and user validation.
- **`ISubscriptionService`**: Orchestrates Stripe payments, creates subscription records, and emits `SubscriptionActivatedEvent`.
- **`IAcademicService`**: Manages the complex logic of enrolling students, validating class capacities, and assigning teachers.
- **`IAssessmentService`**: Contains the complex algorithm for auto-grading MCQs and calculating final student performance aggregates.
- **`IAttendanceService`**: Processes bulk attendance tracking and calculates attendance percentages for Phase 5 Analytics.
- **`IContentService`**: Manages metadata for uploaded files, linking them to Lessons or Classes.
- **`IChatService`**: Handles persisting SignalR messages and verifying room access permissions.
- **`IAiAnalyticsService`**: Orchestrates sending student performance data to the `IAiProvider` and formatting the LLM response into `WeaknessAnalysisDto`.

### 4.2. External Infrastructure Interfaces
- **`IJwtService`**: Contract for generating and validating JWT tokens.
- **`IStripeService`**: Contract for interacting with the Stripe API (Payment Intents, Webhooks).
- **`IFileStorageService`**: Contract for uploading/downloading from Azure Blob Storage.
- **`IAiProvider`**: Factory contract abstracting OpenAI / Claude / Gemini API calls.
- **`IEmailService`**: Contract for sending transactional emails (e.g., Password Reset).
- **`INotificationPushService`**: Contract for pushing events to the SignalR Hub.

### 4.3. Repositories (Data Access)
Every aggregate root / main entity has a dedicated repository interface. No generic `IRepository<T>` is used, ensuring explicit data access patterns.
- **`IUserRepository`**: `GetByIdAsync`, `GetByStudentLinkageCodeAsync`.
- **`IClassRepository`**: `GetWithEnrollmentsAsync`, `GetAvailableClassesAsync`.
- **`IExamRepository`**: `GetActiveExamsForStudentAsync`, `GetPendingGradingAsync`.
- **`ISubmissionRepository`**: `GetStudentSubmissionsAsync`.
- **`ITeachingAssignmentRepository`**: `GetAssignmentBySubjectClassYearAsync`.
- **`IStudentPerformanceRepository`**: Aggregation queries for AI analytics.

---

## 5. Business Logic & Workflow

While Domain Entities handle internal state changes (e.g., `Submission.Grade()`), the **Application Services** handle the workflow. 

### Example Workflow: Auto-Grading an Exam (`IAssessmentService.SubmitExamAsync`)
1. **Validate**: Checks if the exam is active and if the student hasn't already submitted.
2. **Fetch**: Retrieves the `StudentExam` entity and the `Exam` entity (with correct answers) via `IExamRepository`.
3. **Calculate**: Iterates through `StudentAnswers`. Compares them to `Question.CorrectAnswer`.
4. **Mutate**: Calls `StudentExam.CalculateScore()` (Domain Logic).
5. **Persist**: Calls `IExamRepository.UpdateAsync()` and `IUnitOfWork.SaveChangesAsync()`.
6. **Publish Event**: Emits an `ExamSubmittedEvent` to RabbitMQ/MediatR so the Notification system can alert the Teacher (if manual grading is needed) or the Student.

---

## 6. Design Patterns & Behaviors

- **CQRS (Command Query Responsibility Segregation)**: While MediatR might be used for cross-layer events, the Application layer strictly separates read models (Queries returning DTOs directly from DB views/projections) from write models (Commands mutating Domain Entities).
- **Result Pattern**: Application services return `Result<T>` or custom response objects to gracefully handle business errors (e.g., "Class Full", "Exam Expired") without relying on throwing expensive HTTP Exceptions.
- **Fail-Fast Validation**: All DTOs utilize DataAnnotations (or FluentValidation) to ensure invalid payloads never reach the Application Services.

> [!TIP]
> **New Developer Note**: If you need to add a new feature, start here in `Masarak.Application`. Define your Request/Response DTOs, define your Service Interface, and map out the workflow before touching the API or Database layers.
