# Masarak Education Platform: Domain Layer Documentation

## Table of Contents
1. [Layer Overview](#1-layer-overview)
2. [Folder Structure](#2-folder-structure)
3. [Core Entities & Aggregates](#3-core-entities--aggregates)
4. [Value Objects](#4-value-objects)
5. [Enums](#5-enums)
6. [Domain Services (Pure Logic)](#6-domain-services-pure-logic)
7. [Domain Events](#7-domain-events)

---

## 1. Layer Overview

The **Masarak.Domain** project sits at the absolute center of the Clean Architecture. It contains the enterprise logic and rules of the Masarak Education platform. 
It has **zero dependencies** on any other layer, database, or external library.

### Purpose
- **Encapsulation**: Entities maintain their own validity. Properties have `private set;` and state is mutated only through specific, named methods (e.g., `Submission.Grade(score, feedback)` rather than `Submission.Score = score`).
- **Ubiquitous Language**: Class names exactly match the business language (e.g., `TeachingAssignment`, `StudentLinkageCode`).
- **Domain Events**: Entities raise events to notify other parts of the system when critical actions occur.

---

## 2. Folder Structure

```text
Masarak.Domain/
â”œâ”€â”€ Constants/        # Static strings for Roles (Admin, Teacher, etc.)
â”œâ”€â”€ Entities/         # Aggregate Roots and child entities
â”œâ”€â”€ Enums/            # Business enumerations (Status flags)
â”œâ”€â”€ Events/           # Records representing facts that happened
â”œâ”€â”€ Services/         # Pure domain services for multi-entity logic
â””â”€â”€ ValueObjects/     # Immutable objects defined by their properties
```

---

## 3. Core Entities & Aggregates

The system comprises dozens of entities representing the 6 phases of the platform.

### Identity & Subscriptions (Phase 1)
- **`User.cs`**: The root aggregate for a person. Extended via inheritance or relationships to `Teacher.cs`, `Student.cs`, and `Parent.cs`. 
- **`Subscription.cs` / `Plan.cs`**: Manages the billing lifecycle. Includes methods like `Activate()`, `Cancel()`, `Expire()`.
- **`ParentStudentLink.cs`**: Represents the many-to-many relationship where a parent binds to a student using a secure code.

### Academic Core (Phase 2)
- **`Grade.cs`**: (e.g., 10th Grade, 11th Grade). Contains multiple `Class` entities.
- **`Class.cs`**: A virtual or physical classroom holding multiple `Student`s.
- **`Subject.cs` / `SubjectCategory.cs`**: Curriculum definitions.
- **`TeachingAssignment.cs`**: The crucial link between a `Teacher`, a `Class`, a `Subject`, and an `AcademicYear`.
- **`Session.cs`**: A scheduled time block on the calendar (timetable).

### Assessment & Grading (Phase 3)
- **`Exam.cs`**: Contains a collection of `Question` and `QuestionOption`. Manages total marks and time limits.
- **`StudentExam.cs`**: Represents a student taking an exam. Tracks time remaining and contains `StudentAnswer`s.
- **`Assignment.cs`**: A task requiring a file upload or text.
- **`Submission.cs`**: A student's response to an assignment.
- **`StudentPerformance.cs`**: Aggregates a student's total score over a semester.

### Attendance, Content & Chat (Phase 4)
- **`Attendance.cs`**: Tracks if a student was present at a `Session`.
- **`ContentItem.cs`**: A PDF, Link, or Video tied to a `Lesson` or `TeachingAssignment`.
- **`Lesson.cs`**: A logical grouping of Content, Assignments, and Exams.
- **`ChatRoom.cs` / `ChatMessage.cs`**: SignalR persistence entities.

### AI & Analytics (Phase 5)
- **`AiRecommendation.cs`**: AI-generated advice for a student.
- **`PerformanceAlert.cs`**: Flags students who are falling behind.
- **`AiPromptTemplate.cs`**: Standardized prompts for calling LLMs.
- **`AnalyticsDashboardSnapshot.cs`**: Materialized view data for fast Admin dashboard loading.

### Notifications (Phase 6)
- **`Notification.cs`**: An in-app alert targeted at a specific `User`.

---

## 4. Value Objects

Value objects are immutable. Two value objects with identical properties are considered equal.
- **`AcademicYear.cs`**: Enforces rules around school years (e.g., 2026-2027).
- **`Money.cs`**: Prevents floating-point errors by encapsulating currency and decimal precision for Stripe payments.
- **`StudentLinkageCode.cs`**: Encapsulates the logic for generating and formatting the 6-digit code parents use.
- **`TimeSlot.cs`**: Represents a Start and End time, used in scheduling to prevent overlaps.

---

## 5. Enums

Enums dictate finite states across the application.
- **`SubscriptionStatus`**: `Active`, `Expired`, `Canceled`, `PendingPayment`.
- **`SessionStatus`**: `Scheduled`, `Live`, `Completed`, `Canceled`.
- **`AttendanceStatus`**: `Present`, `Absent`, `Excused`.
- **`ContentType`**: `Video`, `Document`, `Link`.
- **`ChatRoomType`**: `Classroom`, `Private`.

---

## 6. Domain Services (Pure Logic)

When a business rule requires interacting with multiple aggregate roots, but should not be tied to a specific entity, it lives here. They do **not** inject databases.
- **`ScheduleConflictChecker.cs`**: Given a list of existing `Session`s and a proposed `Session`, determines if a teacher or class is double-booked.
- **`AutoGradingService.cs`**: Compares a `StudentAnswer` against a `QuestionOption.IsCorrect` flag to assign marks.
- **`ExamTimerEnforcer.cs`**: Calculates exact expiration times accounting for network latency and pause requests.
- **`AttendanceWindowChecker.cs`**: Determines if a student joined a live session within the acceptable "Present" window (e.g., first 15 minutes) or if they should be marked "Late".
- **`ChatRoomAccessPolicy.cs`**: Validates if User A is allowed to message User B based on their roles and class enrollments.

---

## 7. Domain Events

Domain Events (`DomainEvents.cs`) are C# `record` types that implement `INotification` (MediatR). 
Entities raise these events internally (e.g., `this.AddDomainEvent(new SubscriptionActivatedEvent(...))`).

### Examples:
- `SubscriptionActivatedEvent`
- `ExamSubmittedEvent`
- `SessionScheduledEvent`
- `ParentStudentLinkedEvent`

The Infrastructure EF Core `DbContext` extracts these events right before saving to SQL and dispatches them, ensuring side-effects (like sending an email or recalculating AI stats) only happen if the database transaction succeeds.
