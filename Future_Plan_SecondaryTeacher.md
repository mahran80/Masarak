# Add Secondary Teachers and Enable Session Editing

This plan implements two new features requested for the platform:
1. The ability for admins to **edit existing scheduled sessions** (e.g., change the date, time, title, duration).
2. The addition of a **Secondary Teacher** (backup teacher) to every class's subject (Teaching Assignment), so that if the primary teacher is unavailable, the secondary teacher can take over.

## User Review Required

> [!WARNING]
> This requires a database migration to alter the `TeachingAssignments` table to add the `SecondaryTeacherId` column.

## Open Questions

> [!IMPORTANT]
> 1. Should the **Secondary Teacher** have the exact same permissions as the Primary Teacher for the class (e.g., grading exams, uploading assignments, starting live sessions)?
> 2. When editing a session, do you want to allow changing the "Teacher" of that specific session, or should it just be edited for Time/Date/Title? (Right now, sessions are tied to the `TeachingAssignment`, which has the primary and secondary teachers).

## Proposed Changes

---

### Database & Domain (Backend)

#### [MODIFY] [TeachingAssignment.cs](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/Masarak.Domain/Entities/TeachingAssignment.cs)
- Add `public int? SecondaryTeacherId { get; set; }`
- Add navigation property `public virtual Teacher? SecondaryTeacher { get; set; }`
- Update the `Create()` factory method to accept `int? secondaryTeacherId`.

#### [MODIFY] Context Configuration
- Configure the relationship in `OnModelCreating` to map `SecondaryTeacherId` to the `Teachers` table with `DeleteBehavior.Restrict` to avoid multiple cascade paths.

#### [NEW] EF Core Migration
- Run `dotnet ef migrations add AddSecondaryTeacher` and `dotnet ef database update`.

---

### Backend API Services

#### [MODIFY] [SessionAdminService.cs](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/Masarak.Infrastructure/Services/SessionAdminService.cs)
- Add an `EditSessionAsync` method that allows updating the `Title`, `Description`, `ScheduledAt`, and `DurationMinutes` of an existing session.

#### [MODIFY] [AdminSessionsController.cs](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/Masarak.API/Controllers/AdminSessionsController.cs)
- Expose `PUT /api/admin/sessions/{id}` to call the edit logic.

---

### Frontend Features

#### [MODIFY] [admin-session.service.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/services/admin-session.service.ts)
- Add the `updateSession(id: number, data: any)` HTTP method.

#### [MODIFY] [admin-schedule.component.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-schedule/admin-schedule.component.ts)
- Add logic to open the existing `Schedule Modal` in "Edit Mode" when an admin clicks the "Edit" button on a session.
- Pass the session's existing data into the form fields.
- Call the `updateSession` API endpoint upon submission.

#### [MODIFY] [admin-schedule.component.html](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-schedule/admin-schedule.component.html)
- Add an **Edit (تعديل)** button next to the Cancel/Reactivate buttons for scheduled sessions.
- Modify the modal title to say "تعديل الحصة" (Edit Session) when in edit mode.

## Verification Plan

### Automated Tests
- Run `dotnet build` to verify no compilation errors in the API.
- Ensure Angular compiles successfully via `ng serve`.

### Manual Verification
- Deploy the database migration.
- Verify through the UI that an admin can click "Edit" on a session, change its time to tomorrow, and save it successfully.
- Verify that the database successfully registers `SecondaryTeacherId` when assigning teachers.
