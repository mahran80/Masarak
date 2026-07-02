# Implement Permanent Delete (Hard Delete)

The frontend currently provides a "??? ?????" (Permanent Delete) button, but the backend implementation only performs a "Soft Delete" (setting IsActive = false).
Because the database is strictly configured with DeleteBehavior.Restrict on all Foreign Keys, we cannot simply tell Entity Framework to Remove(user). Doing so will cause a database crash if the user has any related records (like a Student profile, subscriptions, or classes).

To fulfill the requirement of supporting **both** Deactivate and Permanent Delete, we need to implement a manual cascade delete process in the backend.

## Proposed Changes

### 1. Backend (SecuredControllers.cs)

We will rewrite the [HttpDelete("users/{id}")] endpoint in SecuredControllers.cs. Instead of delegating to the AdminUserService (which we cannot modify due to Antivirus blocking Masarak.Infrastructure.dll), we will inject the Context directly.

We will use EF Core 7+ bulk delete capabilities (ExecuteDeleteAsync) to efficiently and safely wipe the user's data from the bottom up to respect foreign key constraints.

The deletion order will be:

1. ChatMessages (where sender is the user)
2. Notifications and RefreshTokens
3. Payments -> Subscriptions
4. If Student: StudentAnswers -> StudentExams -> Submissions -> StudentPerformances -> StudentClasses -> ParentStudents -> Student
5. If Teacher: TeachingAssignments (Warning: this might require deleting related Sessions and Attendances first, we will carefully check this)
6. If Parent: ParentStudents -> Parent
7. Finally, delete the User record.

### 2. Frontend (user-management.ts)

The frontend is already configured to call DELETE /api/admin/users/{id} when clicking "??? ?????".
The "?????" (Deactivate) button correctly calls PUT /api/admin/users/{id}/deactivate.
No frontend changes are strictly required, but we will double check that both buttons are functioning and providing clear feedback.

> [!WARNING]
> Hard-deleting a teacher who has already conducted sessions and graded exams might corrupt historical data for students. Are you sure you want a true Hard Delete? If so, please click "Proceed" to authorize this implementation.
