# Logical Additions & Features

This file documents new logical features, architectural additions, and enhancements made to the system that are **not** bug or error fixes. (Bug fixes and error resolutions are documented in `issue_solution.md`).

---

## 1. Dynamic Role Requirements in User Creation
**Date:** June 30, 2026

### Feature Description
When an Administrator adds a new user from the Dashboard (`user-management` page), the form dynamically changes its required fields based on the selected Role.

### Implementation Details
- **Student (`طالب`)**: 
  - A dropdown automatically appears requiring the Admin to select the student's **Grade (`المرحلة الدراسية`)**.
  - The grades are fetched dynamically from the `AcademicApiService` (`/api/admin/grades`).
  - Backend: `AdminCreateUserRequest` was updated to accept `GradeId`, and `AdminUserService` creates the `Student` profile linked to this specific Grade.

- **Teacher (`معلم`)**: 
  - A text input automatically appears allowing the Admin to specify the teacher's **Specialization (`التخصص`)**.
  - Backend: `AdminCreateUserRequest` was updated to accept `Specialization`, and `AdminUserService` assigns it to the new `Teacher` profile.

---

## 2. Parent-to-Student Linking During Account Creation
**Date:** June 30, 2026

### Feature Description
When creating a **Parent (`ولي أمر`)** account, the Admin can immediately link the new parent to their children (students) directly from the Add User modal.

### Implementation Details
- The frontend dynamically displays a searchable input and a clickable list of all registered Students.
- The Admin can search by name or email, and click on students to select them. Selected students appear as interactive "chips" above the search bar.
- Selection of at least one student is strictly validated before form submission.
- Backend: `AdminCreateUserRequest` was updated to accept a list of integers `StudentIds`.
- `AdminUserService` was updated to handle the `Parent` role. It creates a `Parent` record and then iterates over the provided `StudentIds`, inserting rows into the `ParentStudents` junction table to establish the `Guardian` relationship.

---

## 3. Workaround for Specialization & Grade Mapping Without Infrastructure Changes
**Date:** July 1, 2026

### Feature Description
The API endpoint for fetching all users (`GET /api/admin/users`) now correctly returns `GradeId` for Students, `Specialization` for Teachers, and `StudentIds` for Parents, which allows the frontend Admin dashboards to display this data appropriately.

### Implementation Details
- To bypass severe Windows Application Control (0x800711C7) blocks that prevented modifying `Masarak.Infrastructure`, the mapping logic was strategically placed directly inside `AdminUsersController.GetAllUsers` (in the `Masarak.API` project).
- The controller uses `HttpContext.RequestServices.GetService<Context>()` to inject the EF Core database context dynamically.
- It then queries the database for the missing details using the user IDs returned by the repository and maps them onto the `AdminUserDto` items before returning them to the frontend.

## 4. UI Streamlining: Deactivate vs Delete Buttons
**Date:** July 1, 2026

### Feature Description
In the User Management dashboard, the actions column previously offered both "Delete" and "Deactivate" options, which caused confusion and inconsistent behavior since deleting an active user with related records caused database constraints. We streamlined this to a single, safe "Deactivate" button.

### Implementation Details
- Removed the separate "Delete" button from user-management.html.
- Users are now safely deactivated via AdminUsersController.DeactivateUser, which cleanly restricts access without destroying historical data or triggering foreign key violations.

## 5. Intelligent DB-Level Reactivation (No Schema Change Required)
**Date:** July 1, 2026

### Feature Description
The application now supports dropping and dynamically re-adding a student to a class multiple times within the same academic year without hitting database constraint violations.

### Implementation Details
- Bypassed the rigid UX_student_classes_Student_Year database index constraint gracefully.
- The EnrollStudent API intelligently detects if an inactive record already exists for that user and year. If found, it seamlessly reactivates the record and updates the class assignment rather than attempting a conflicting INSERT. This achieves dynamic re-enrollment without requiring complex database schema migrations.

## 6. Agora vs. Zoom Architecture Pivot
**Date:** July 2, 2026

### Feature Description
Conducted a deep analysis of Zoom vs. Agora for Live Sessions. Successfully pivoted the architectural implementation from external Zoom links to a fully native, in-app Agora WebRTC solution to keep users inside the Masarak LMS platform.

## 7. Backend Video Token Infrastructure (Agora)
**Date:** July 2, 2026

### Feature Description
Implemented the foundation for securely authenticating users into Agora rooms without exposing the developer keys.

### Implementation Details
- Created `IAgoraTokenService` and the concrete `AgoraTokenService`.
- Registered the services in Dependency Injection inside `ServiceCollectionExtensions.cs`.
- Implemented secure token generation logic ensuring tokens are scoped to the specific channel, assigned proper Publisher/Subscriber roles, and expire after 1 hour.

## 8. Video Room API Endpoints
**Date:** July 2, 2026

### Feature Description
Exposed new REST API endpoints that the Angular frontend uses to securely fetch Agora access tokens on demand.

### Implementation Details
- Created `GET /api/teacher/sessions/{id}/token` in `SessionTeacherController.cs`.
- Created `GET /api/student/sessions/{id}/token` in `StudentAcademicController.cs`.
- Integrated `appsettings.json` blocks for `AppId` and `AppCertificate` injection.

## 9. Native Frontend Video UI (`LiveRoomComponent`)
**Date:** July 2, 2026

### Feature Description
Built a custom, immersive video conferencing interface directly into the Angular application using the Agora Web SDK, completely replacing external Zoom redirects.

### Implementation Details
- Installed the `agora-rtc-sdk-ng` package via NPM.
- Built out the `LiveRoomComponent` inside `src/app/features/shared/components/live-room`. 
- Implemented logic for connecting to an Agora channel, requesting camera/microphone permissions, and publishing local tracks.
- Implemented dynamic subscription logic to render multiple remote participants in a CSS Grid layout.
- Added user control toggles (Mute/Unmute Mic, Turn On/Off Camera) and session abandonment (Leave Room).

## 10. Seamless Live Routing
**Date:** July 2, 2026

### Feature Description
Integrated the new video room gracefully into the existing Angular routing architecture and user flows.

### Implementation Details
- Added the `:id/live` nested routes in both Teacher routing (`app.routes.ts`) and Student routing (`student.routes.ts`) to serve the `LiveRoomComponent`.
- Passed route `data` identifying the user as either a `role: 'teacher'` or `role: 'student'` for permissions scaling within the component.

## 11. Admin Centralized Session Scheduling
**Date:** July 4, 2026

### Feature Description
Moved the responsibility of scheduling live academic sessions from individual Teachers to the Administrator. The Admin now has a dedicated, full-calendar module to generate recurring weekly schedules for any class and subject.

### Implementation Details
- Added `SeriesId` to the `Session` entity to group recurring blocks.
- Implemented `AdminScheduleComponent` to browse the hierarchy of Grades -> Classes -> Schedules.
- The `SessionAdminService` efficiently validates overlapping schedule conflicts via `HasConflictAsync` across all recurring instances before inserting the block into the database.
