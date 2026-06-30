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
