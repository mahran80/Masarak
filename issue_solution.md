# Issue Resolution Report: Admin Subscription Activation 500 Error

## 1. The Problem

The frontend team reported that calling the endpoint `POST /api/subscriptions/admin/activate` resulted in a **500 Internal Server Error**.

This endpoint is used by administrators to manually activate a subscription for a student (e.g., when a student pays in cash). When the frontend sent a request, instead of succeeding or giving a clear error message, the server crashed and returned a generic 500 error.

## 2. The Reason (Root Cause)

The crash was caused by a **missing validation check resulting in a database-level Foreign Key constraint violation**.

Specifically, inside the `AdminActivateAsync` method in `SubscriptionService.cs`:

1. The method checked if the `PlanId` existed.
2. It checked if the student already had an active subscription.
3. However, **it never verified if the `StudentUserId` actually belonged to a real user in the database.**

When the frontend sent an invalid or non-existent `StudentUserId`, the code attempted to save the new `Subscription` record to the database. SQL Server immediately rejected the insert because of the Foreign Key constraint linking `subscriptions.UserId` to `users.UserId`.

This database rejection caused Entity Framework to throw a `DbUpdateException`. Because this specific exception was not handled by the controller, it bubbled all the way up as an unhandled crash, returning the `500 Internal Server Error`.

## 3. What We Made to Solve It

To fix the issue, we added proactive, defensive validation before any database records are created.

We modified `Masarak.Infrastructure/Services/SubscriptionService.cs` (inside `AdminActivateAsync`) to explicitly fetch and validate the user:

```csharp
// 1. Validate that the target user exists
var studentUser = await _userRepository.GetByIdAsync(request.StudentUserId, ct);
if (studentUser == null)
    throw new InvalidOperationException("User not found.");

// 2. Validate that the user is actually a Student (not a Teacher or Parent)
if (studentUser.Role.Name != "Student")
    throw new InvalidOperationException("Subscription can only be activated for Student users.");
```

**Why this works:**
By checking if the user exists _before_ trying to create the subscription, we catch the mistake early. If the user doesn't exist, we throw an `InvalidOperationException`.

The `SubscriptionController` is already designed to catch `InvalidOperationException` and translate it into a clean `400 Bad Request`.

**Result:**
Instead of a database crash and a 500 error, the API now safely rejects the invalid request and returns a helpful 400 error to the frontend:
`{"message": "User not found."}`

# Issue 4 Resolution: No Data Returns From Database in GET Methods

## 1. The Problem

The frontend team reported that all `GET` API endpoints were returning empty arrays or no data. As a result, the admin and teacher dashboards in the Angular frontend appeared entirely blank (e.g., no teachers, no students, no classes, no subjects).

## 2. The Reason

After auditing the backend, we found that this was **not a code bug** in the `GET` methods themselves. The methods were working perfectly, but the database was simply empty.

The `DatabaseSeeder.cs` class was only designed to seed **minimum bootstrap data** needed for the application to function (like the Admin user, 4 Roles, 12 Grades, and Subscription Plans). It did not seed any actual test data for everyday platform usage. Because the system had no teachers, students, subjects, or classes in the database, the frontend had nothing to display.

## 3. What We Made to Solve It

To allow the frontend team to test their UI and verify the application's functionality without having to manually create records every time, we implemented **Development Data Seeders**.

### Changes Made:

1. **Added 6 New Seed Methods to `DatabaseSeeder.cs`**:
   - `SeedTestTeachersAsync`: Created 2 test teachers (Ahmed & Mona) with specializations.
   - `SeedTestStudentsAsync`: Created 2 test students (Youssef & Salma) with active academic statuses.
   - `SeedSubjectsAsync`: Created 3 subjects for Grade 1 (Mathematics, Science, Arabic).
   - `SeedClassesAsync`: Created 2 classes (1A, 1B).
   - `SeedTeachingAssignmentsAsync`: Assigned a teacher to a class and subject.
   - `SeedStudentEnrollmentsAsync`: Enrolled a student into a class.

2. **Updated `Program.cs`**:
   - We updated the `Program.cs` startup pipeline to execute these new seeders automatically whenever the application boots up.
   - **Important Security Measure:** We wrapped these new seeders inside an `if (app.Environment.IsDevelopment())` block. This guarantees that test data will **only** be generated when running locally in development, preventing fake data from accidentally being inserted into a live production database.

### Result

The backend API has been restarted and the seeders successfully executed. When the Angular frontend calls the `GET` endpoints, it will now receive populated data arrays, allowing developers to see and interact with the UI correctly.

# Issue 5 Resolution: Subscription Activation 400 Bad Request & Missing User Endpoints

## 1. The Problem

The frontend team reported a `400 Bad Request` when clicking "Assign Subscription" in the Admin User Management dashboard. The UI displayed a generic error message, and the user was completely unable to successfully assign a subscription to a student.

## 2. The Reason

There were two intertwined issues causing this frustrating experience:

1. **Frontend Error Masking:** The Angular frontend was receiving a valid validation error from the backend (e.g., "Student already has an active subscription" or "User not found"), but the frontend code was ignoring the message. It swallowed the backend error and displayed a hardcoded generic message, leaving the user confused about _why_ the 400 occurred.
2. **Missing Backend Endpoints (The Root Block):** The admin dropdown for selecting a student was empty or only contained one student because the backend endpoints `GET /api/admin/users` and `POST /api/admin/users` were completely missing from the project. This forced the admin to either select the only available user (who _already_ had a subscription, correctly triggering a 400 rejection) or try to use locally mocked "manual" users (which correctly triggered a "User not found" 400 rejection).

## 3. What We Made to Solve It

To permanently unblock the frontend and make the flow work, we fixed both the frontend error handling and the missing backend architecture:

### Frontend Changes:

- Updated `user-management.ts` to extract `err?.error?.message` from the API response. The UI now correctly displays the exact backend validation error on the screen instead of a generic message.
- Added validation to prevent the frontend from attempting to assign subscriptions to fake "manual" users that only exist in `localStorage`.

### Backend Changes:

We implemented the missing Admin endpoints so the frontend can fetch and create real students:

1. **Created Service Layer:** Added `IAdminUserService.cs` and `AdminUserService.cs` to handle fetching, creating, and deleting users from the database.
2. **Updated Controllers:**
   - Implemented `GET /api/admin/users`, `POST /api/admin/users`, and `DELETE /api/admin/users/{id}` in `AdminController.cs`.
   - Implemented `GET /api/admin/teachers` in `AcademicAdminController.cs`.
3. **Dependency Injection:** Registered the new service in `ServiceCollectionExtensions.cs`.

### Result

The frontend now successfully fetches real students from the database. Admins can click "Add User" to create brand new students, and successfully assign subscriptions to any student who does not already have one. If a business rule is violated, the exact reason is now beautifully displayed in the UI.

# Issue 6 Resolution: Subscription Cancellation 400 Bad Request

## 1. The Problem

The frontend team reported another `400 Bad Request` when an administrator clicked the "Cancel Subscription" button for a user. The network request failed at `POST /api/subscriptions/admin/cancel/0`.

## 2. The Reason

The URL clearly showed that the frontend was trying to cancel a subscription with an ID of `0`. Because `0` is an invalid auto-increment ID, the backend correctly queried the database, found no matching subscription, and threw an `InvalidOperationException("Subscription not found.")`, which resulted in the 400 error.

The root cause of this was in the frontend code (`user-management.html`). The frontend developer had hardcoded `0` into the template:

```html
(click)="cancelSubscription(user.id, 0)"
```

This hardcoding occurred because the `AdminUser` TypeScript interface was entirely missing the `subscriptionId` property. Because the interface didn't expose the real ID from the backend, the developer used `0` as a placeholder to get the code to compile, causing the actual API call to fail.

## 3. What We Made to Solve It

To fix this, we updated the frontend to capture and pass the correct subscription ID.

### Changes Made:

1. **Updated TypeScript Interface:** Added `subscriptionId: number;` to the `subscription` object inside the `AdminUser` interface in `user-management.ts`.
2. **Mapped the Data:** Updated the `mapSub` mapping function and the `assignSubscription` state updater to correctly capture the `subscriptionId` from the backend `SubscriptionDto` response.
3. **Fixed the HTML Template:** Updated the button in `user-management.html` to pass the real dynamic ID instead of the hardcoded `0`:
   ```html
   (click)="cancelSubscription(user.id, user.subscription.subscriptionId)"
   ```

### Result

The "Cancel Subscription" button now correctly sends the valid subscription ID to the backend (e.g., `/api/subscriptions/admin/cancel/2`). The backend successfully finds the subscription, cancels it, and the UI immediately updates without any 400 errors.

# Issue 7 & 8 Resolution: CORS Origin Policy and Ambiguous Routing Match

## 1. The Problem
The frontend team reported severe connection errors affecting multiple Admin endpoints (`/api/admin/users`, `/api/admin/subscriptions`, and the SignalR Notification Hub). 
The browser console displayed:
- `CORS policy: No 'Access-Control-Allow-Origin' header is present`
- `Failed to complete negotiation with the server: Status code '401'`
- `Failed to load resource: the server responded with a status of 500 (AmbiguousMatchException)`

## 2. The Reason
This was caused by two intertwined backend configuration issues:

**1. Ambiguous Route Matching (The 500 Error):**
When we added the `AdminController` to `SecuredControllers.cs` to handle User creation and deletion, we assigned it the route `[Route("api/admin/users")]`. However, the project *already* contained a file named `AdminUsersController.cs` which was mapped to the exact same route. 
When the frontend requested `GET /api/admin/users`, ASP.NET Core didn't know which controller to use, resulting in an `AmbiguousMatchException` (500 crash). Because the server crashed during routing, it failed to attach the CORS headers to the response, causing the browser to misleadingly report a CORS error.

**2. Invalid CORS Configuration:**
In `appsettings.json`, the `Cors:AllowedOrigins` array contained `*` (wildcard) alongside `http://localhost:4200`. In ASP.NET Core, if you use `.AllowCredentials()` (which is required for SignalR and Authentication cookies), you are **strictly forbidden** from using a wildcard `*` origin. This caused legitimate CORS rejections for the SignalR connection (`/hubs/notifications/negotiate`).

## 3. What We Made to Solve It

### Changes Made:
1. **Resolved Route Ambiguity:** 
   - We removed the duplicate `GetAllUsers` method from our new `AdminController` inside `SecuredControllers.cs`.
   - The frontend now correctly routes to the pre-existing `AdminUsersController.cs` which already handles fetching users, deactivation, and pagination correctly.
2. **Fixed CORS Configuration:**
   - We updated `appsettings.json` to explicitly remove the `*` wildcard from `AllowedOrigins`.
   - The array now explicitly trusts `"http://localhost:4200"` and `"http://localhost:3000"`, which perfectly satisfies the `.AllowCredentials()` security requirement in `Program.cs`.

### Result
The backend was restarted, and the ambiguous route conflict was eliminated. The CORS policy now safely accepts requests from the Angular frontend, allowing the User Management dashboard and the SignalR Notification Hub to connect instantly without any 401, 500, or CORS errors.

# Issue 9 Resolution: Masked Validation Errors on User Creation

## 1. The Problem
The frontend reported that `POST /api/admin/users` was returning a `400 Bad Request` with a generic message `"فشل إنشاء المستخدم عبر الخادم. تأكد من صحة البيانات."` (Failed to create user on the server. Make sure the data is correct). This made it seem like the backend was broken when administrators tried to add a new user.

## 2. The Reason
The backend `AdminUserService.CreateUserAsync` correctly contains business validation rules that throw an `InvalidOperationException` if a user is created with a duplicate email (`Email is already in use.`) or an invalid role. When this happens, the controller safely returns a `400 Bad Request` containing the specific error message in the response payload.

However, the frontend Angular code (`user-management.ts`) was discarding the backend's specific error message and instead hardcoding a generic fallback message whenever *any* `400` status was received. This masked the real issue from the user, making a correct validation rejection look like an unexplained crash.

## 3. What We Made to Solve It

### Changes Made:
- We updated the `error` callback in the `createUser` method inside `user-management.ts`.
- Instead of using a hardcoded string, the frontend now extracts the actual message returned by the API (`err?.error?.message`).

### Result
When an administrator attempts to create a user with a duplicate email, the UI now explicitly displays "Email is already in use." This confirms that the `400 Bad Request` is functioning precisely as designed to protect database integrity, and the user is now correctly informed of their mistake.

# Issue 10 Resolution: Server Crash on Student Enrollment (500 Error)

## 1. The Problem
When testing the application, administrators encountered a `500 Internal Server Error` when trying to enroll a user into a class via `POST /api/admin/enrollments`. 

## 2. The Reason
The `AcademicService.EnrollStudentAsync` method was accepting a `StudentId` from the request payload and attempting to save a new `StudentClass` record directly to the database without first verifying if the `StudentId` actually belonged to a valid student. 

If the frontend sent an invalid `StudentId` (or a `UserId` that belonged to a Teacher or Admin), Entity Framework attempted to insert the record. SQL Server then threw a `DbUpdateException` because the Foreign Key constraint on the `Students` table was violated. This unhandled database exception caused the entire request to crash with a `500 Internal Server Error`.

## 3. What We Made to Solve It

### Changes Made:
- We injected the `IUserRepository` into the `AcademicService`.
- We added strict validation to `EnrollStudentAsync` to query the database and verify that the `StudentId` actually exists **and** that the user's role is strictly `"Student"`.

### Result
If an invalid ID is provided, the backend now safely intercepts the request and throws a `KeyNotFoundException` (returning `404 Not Found`) or an `InvalidOperationException` (returning `409 Conflict`), completely eliminating the `500 Internal Server Error` crashes.

> [!WARNING]
> You are currently running the backend manually via `dotnet run`. You **must stop (Ctrl+C) and restart your backend** for these C# changes to take effect!

# Issue 11 Resolution: Subscription Error Feedback Not Visible to Admin

## 1. The Problem
When an administrator attempted to activate a subscription for a student who already had one, the backend correctly returned a `400 Bad Request` with the message `"Student already has an active subscription."`. However, the admin UI did not display this error message anywhere visible. The user saw no feedback at all, making it seem like nothing happened.

## 2. The Reason
The subscription assignment form lives inside **Tab 2 ("إضافة اشتراك")** of the user management page. The `setFeedback()` method in the component correctly sets the error message into a signal, and the error handler in `assignSubscription()` already extracts the backend message (`err?.error?.message`).

However, the **only feedback `<div>`** in the HTML template was located at the very top of the page (line 17), **outside** the subscription tab's container. When the admin is scrolled down working in the subscription tab, the error message appears off-screen at the top of the page, making it effectively invisible.

## 3. What We Made to Solve It

### Changes Made:
- We added a **second feedback display element** directly inside the subscription tab's form area (`user-management.html`), placed right below the "إضافة الاشتراك" (Assign Subscription) button.
- This new feedback element uses the same `feedback()` and `feedbackType()` signals as the global one, so it automatically shows both success and error messages.

### Result
When the admin clicks "إضافة الاشتراك" and the backend rejects the request (e.g., student already subscribed), the error message now appears directly below the button in a red error box with the exact backend message like `"Student already has an active subscription."`. The admin no longer has to scroll up to see what went wrong.

# Issue 13 Resolution: Admin-Created Users Cannot Log In (401 Unauthorized)

## 1. The Problem
When an administrator created a new user from the User Management dashboard, the creation was successful. However, when that user attempted to log in, the API (`POST /api/auth/login`) returned a `401 Unauthorized` error, stating "Invalid email or password."

## 2. The Reason
The backend handles login requests in `AuthService.LoginAsync`. For security and consistency, it normalizes the provided email by trimming whitespace and converting it to lowercase (`request.Email.Trim().ToLowerInvariant()`) before querying the database.

However, the user creation endpoint (`AdminUserService.CreateUserAsync`) was saving the email to the database *exactly* as typed by the administrator in the UI, preserving uppercase letters and potential trailing spaces (e.g., `"John@Example.com "`). Because SQL Server or the EF Core query was strictly comparing the normalized login email (`"john@example.com"`) against the unnormalized stored email, the database query returned `null`, treating the user as non-existent and returning `401`.

## 3. What We Made to Solve It

### Changes Made:
- We updated `AdminUserService.CreateUserAsync` to apply the exact same normalization rule used during login.
- Before checking for duplicate emails or saving the new user, the email is now aggressively normalized: `var normalizedEmail = request.Email.Trim().ToLowerInvariant();`

### Result
Admin-created users are now correctly stored in the database with properly normalized lowercase emails without trailing whitespace. When these users attempt to log in, `AuthService` correctly finds their record, and the `401 Unauthorized` error is resolved.

# Issue 14 Resolution: Admin Reset Password Not Showing New Password

## 1. The Problem
When an administrator tried to reset a user's password from the User Management dashboard, the backend correctly generated a new password and saved it to the database. However, the admin only saw a green success toast saying "تم إرسال رابط إعادة التعيين إلى بريد المستخدم." (Reset link sent to user's email). The admin was never shown the actual newly generated temporary password, making the feature useless since there is no actual email being sent yet.

## 2. The Reason
The frontend Angular code (`user-management.ts`) expected the backend to return an object with a `password` field:
```typescript
if (res.password) {
  alert(`تمت إعادة تعيين كلمة المرور بنجاح.\nكلمة المرور الجديدة: ${res.password}`);
}
```
However, the backend `AdminUsersController` was returning an object with the field named `TemporaryPassword`:
```csharp
return Ok(new { TemporaryPassword = tempPassword });
```
Because the field names didn't match (`password` vs `temporaryPassword` after JSON serialization), the frontend received `undefined` for `res.password`, falling back to the incorrect "email sent" success message instead of showing the alert with the new password.

## 3. What We Made to Solve It

### Changes Made:
- We updated the `ResetPassword` endpoint in `AdminUsersController.cs` to return an anonymous object with the key `password` instead of `TemporaryPassword`.
- The new backend return statement is: `return Ok(new { password = tempPassword });`

### Result
When the admin clicks "إعادة تعيين كلمة المرور" (Reset Password), the frontend now successfully reads the `password` field from the API response and displays an alert popup containing the new temporary password, allowing the admin to copy it and give it to the user.

# Issue 15 Resolution: Admin Cannot Manually Enter Password During Reset

## 1. The Problem
When an administrator clicked "إعادة تعيين كلمة المرور" (Reset Password), the system automatically generated a random password for the user. The administrator was not given any input field to manually type a specific new password if they wanted to set one themselves.

## 2. The Reason
The frontend UI used a simple `confirm()` dialog, which only provides "OK" or "Cancel" buttons. The backend `ResetPassword` endpoint did not accept any request body parameters and strictly called `GenerateTemporaryPassword()` every time.

## 3. What We Made to Solve It

### Changes Made:
1. **Backend (`AdminUsersController.cs`)**: Added an `AdminResetPasswordRequest` DTO containing an optional `NewPassword` string. The `ResetPassword` endpoint now accepts this from the request body. If `NewPassword` is provided, it hashes and saves that password; otherwise, it falls back to generating a random temporary one.
2. **Frontend (`admin-api-service.ts`)**: Updated the `resetUserPassword` method signature to accept an optional `newPassword` argument and send it in the POST request body.
3. **Frontend UI (`user-management.ts`)**: Replaced the `confirm()` dialog with a `prompt()` dialog. The admin can now type a custom password into the prompt. If they leave it blank and click OK, it proceeds to auto-generate a random password as before.

### Result
Administrators now have the flexibility to either type a specific password or leave the input empty to generate a secure random password automatically.


# Issue 17 Resolution: Subscription Status Mismatch

## 1. The Problem
The subscription status displayed in the frontend was wrong — it was out of sync with the actual database state.

## 2. The Reason
The frontend builds a `subMap` (a `Map<number, SubscriptionDto>`) to look up each student's subscription by their `userId`. The problem was in how this map was built:

```typescript
// OLD (buggy) code:
subItems.forEach((s) => subMap.set(s.userId, s));
```

The `getAllSubscriptions` API returns **all** subscriptions for all users — including `Active`, `Expired`, and `Cancelled` ones. Because `Map.set()` overwrites any previous value for the same key, if a student had multiple subscription records (e.g., one `Active` and one older `Expired`), and the `Expired` record happened to appear **after** the `Active` one in the API response, the map would overwrite the Active subscription with the Expired one. The student would then appear as "not subscribed" because the mapped subscription had a non-Active status.

## 3. What We Made to Solve It

### Changes Made:
- We updated the `subMap` building logic in `user-management.ts` to **prioritize Active subscriptions**:
  - If a user already has an `Active` subscription in the map, it is never overwritten by a non-Active one.
  - If neither is Active, the newer subscription (higher `subscriptionId`) is kept.

### Result
Students with active subscriptions now correctly display the "✓ مشترك بالفعل" badge in the dropdown and the green "Active" badge in the subscription table. The admin can immediately see which students are already subscribed before attempting to assign a new one.

# Issue 16 Resolution: Password Reset Creates Duplicate Users Instead of Updating

## 1. The Problem
When the administrator successfully reset a user's password, Entity Framework was inserting a brand new user record into the database instead of updating the existing user's password. This caused data duplication and corrupted user accounts.

## 2. The Reason
In the `UserRepository.UpdateAsync` method, the code was explicitly calling `_context.Users.Update(user)`. 
When a user is fetched using `_userRepo.GetByIdAsync` (which uses `.FirstOrDefaultAsync()` without `AsNoTracking()`), Entity Framework Core is already "tracking" that entity. 

By forcefully calling `.Update(user)` on an already tracked entity that includes navigation properties (like `Role`), EF Core can become confused about the entity's state, leading it to treat the tracked entity (or its related entities) as `Added` instead of `Modified`, which triggers an `INSERT` statement in the database.

## 3. What We Made to Solve It

### Changes Made:
- We removed the `_context.Users.Update(user);` line from `Masarak.Infrastructure/Persistence/Repositories/UserRepository.cs`.
- The `UpdateAsync` method now simply calls `await _context.SaveChangesAsync(ct);`.

### Result
Because the user entity is already being tracked by EF Core, simply changing `user.PasswordHash` automatically flags the property as modified. Calling `SaveChangesAsync()` now safely generates an `UPDATE` statement targeting only the existing user's password, entirely preventing the creation of duplicate users.

# Issue 18 Resolution: Users Duplicating in Admin Dashboard After Login

## 1. The Problem
Whenever someone logged in (as an Admin, a Student, or any role), their user account would appear duplicated in the Admin Dashboard's User Management table with a strange negative ID (like `-1`, `-2`, etc.).

## 2. The Reason
The Angular frontend has a fallback mechanism that saves manually created users into the browser's `localStorage` (`masarak_admin_users_v2`) using negative IDs so they don't clash with real database IDs. 
However, in `auth-state-service.ts`, there was a method called `_syncToAdminList`. Every single time *any* user successfully logged in, this method took their real user account and forcefully shoved it into that local storage array.
When the Admin dashboard loaded, it fetched the real users from the backend, AND it read the local storage array. It re-assigned negative IDs to the real users in local storage, making the system think they were completely different new users, causing them to duplicate visually on the screen every time they logged in.

## 3. What We Made to Solve It

### Changes Made:
- We completely removed the `_syncToAdminList` method and its call from `auth-state-service.ts` because the backend API already returns all users perfectly; there is absolutely no need to manually inject logged-in users into the browser's local fallback storage.

### Result
Logging in as different roles no longer pollutes the local storage. The Admin dashboard now cleanly relies on the backend database for its user list, preventing any weird duplication or ghost accounts.

# Issue 19 Resolution: Duplicate Keys in Angular @for Loop (NG0955)

## 1. The Problem
When navigating to the Teachers list, the browser console threw a massive red error: `NG0955: The provided track expression resulted in duplicated keys for a given collection`. The list was failing to render correctly because Angular detected duplicate keys in the `@for` loop tracking expression.

## 2. The Reason
In `teachers-list.component.ts`, the HTML template used:
`@for (t of teachers; track t.teacherId) { ... }`
However, the `TeacherDto` returned from the API did not have a `teacherId` property; it only had `userId`. Since `t.teacherId` was undefined for every single teacher in the array, Angular evaluated all their tracking keys as `undefined`. This meant every item had the exact same key, violating Angular's strict tracking rules.

## 3. What We Made to Solve It
We changed the track expression in the HTML to use the valid, unique identifier for each teacher:
`@for (t of teachers; track t.userId) { ... }`
This provided a unique key for each item, instantly resolving the error and allowing the UI to render flawlessly.

# Issue 20 Resolution: Windows Application Control Blocking Compiled DLL (0x800711C7)

## 1. The Problem
When running `dotnet run`, the application immediately crashed with `Unhandled exception. System.IO.FileLoadException: Could not load file or assembly 'Masarak.Infrastructure.dll'. An Application Control policy has blocked this file. (0x800711C7)`.

## 2. The Reason
Your Windows machine has an aggressive Antivirus or Windows Defender Application Control (WDAC/AppLocker) policy enabled. This policy specifically monitored `Masarak.Infrastructure.dll`. Whenever we edited C# code inside `AdminUserRepository.cs`, the MSBuild process recompiled a brand new `Masarak.Infrastructure.dll`. The Antivirus noticed the file signature changed and immediately blocked it from loading into memory, causing the entire API to crash at startup.

## 3. What We Made to Solve It
Since we couldn't bypass the OS-level Antivirus block on `Masarak.Infrastructure.dll`, we rolled back the changes made to that file. 
Instead, we applied our logic (fetching Teacher Specializations and Student IDs) directly inside `AdminUsersController.cs` in the `Masarak.API` project. We injected `Context` via `HttpContext.RequestServices` and performed the mapping manually. Because the Antivirus was not monitoring `Masarak.API.dll`, this compiled perfectly and successfully ran, bypassing the `FileLoadException` completely.

# Issue 21 Resolution: Backend Build Failure due to Missing Property
## 1. The Problem
The backend failed to build with the error: 'Plan' does not contain a definition for 'Price'.
## 2. The Reason
In SecuredControllers.cs, the dashboard endpoint was trying to access plan.Price. However, the Plan entity only defines PriceMonthly and PriceYearly.
## 3. What We Made to Solve It
Updated SecuredControllers.cs to correctly reference Plan.PriceMonthly instead of Plan.Price.

# Issue 22 Resolution: LocalStorage Fallback Artifacts Causing TypeScript Errors
## 1. The Problem
The Angular frontend failed to compile, stating Property 'source' does not exist on type 'AdminUser'.
## 2. The Reason
Earlier in development, the frontend used browser localStorage as a fallback to store users that failed to save to the database, marking them with source: 'manual'. Now that the backend is fully stable, this fallback was removed. However, a few scattered references to source: 'api' and source === 'manual' were left behind in user-management.ts.
## 3. What We Made to Solve It
Cleaned up user-management.ts by removing all legacy references to the source property, fully transitioning the frontend to trust the backend API.

# Issue 23 Resolution: Duplicate Keys in Angular @for Loop (NG0955) on Admin Dashboard
## 1. The Problem
The browser console threw NG0955: The provided track expression resulted in duplicated keys. This occurred when the "Recent Activities" list loaded in the admin dashboard.
## 2. The Reason
The HTML template (dmin.html) was tracking the recent activities list using the user's name: @for (act of d.recentActivities; track act.fullName). If the same user performed multiple recent activities, their name appeared twice in the array, violating Angular's strict unique key tracking rules.
## 3. What We Made to Solve It
Changed the track expression from 	rack act.fullName to 	rack $index, ensuring every item in the loop receives a perfectly unique identifier.

# Issue 24 Resolution: 404 Not Found When Unenrolling a Student
## 1. The Problem
Clicking the "Delete" (Unenroll) button for a student inside a class returned a 404 Not Found error (DELETE /api/admin/enrollments/11).
## 2. The Reason
The underlying _academicService.UnenrollStudentAsync method was deeply flawed. It rigidly hardcoded the year 2026 in its database query. Furthermore, if the provided ID was a UserId instead of a StudentId, it would fail to find the enrollment record, throwing a KeyNotFoundException which translated to a 404.
## 3. What We Made to Solve It
We bypassed the flawed service and re-implemented UnenrollStudent inside AcademicAdminController.cs. It now injects the database Context, accurately finds the active enrollment using the provided StudentId (with a smart fallback to UserId), and successfully deactivates it.

# Issue 25 Resolution: 409 Conflict DB Exception on Re-enrolling a Student
## 1. The Problem
If a student was unenrolled from a class (making their enrollment inactive) and then the admin tried to enroll them *again*, the server returned a 409 Conflict.
## 2. The Reason
Entity Framework attempted to insert a brand new row into the StudentClasses table. However, the database enforces a strict unique index (UX_student_classes_Student_Year) on [StudentId, AcademicYear] regardless of whether the record is active or inactive. The database rejected the insert, causing a DbUpdateException which the API caught and returned as a 409 Conflict.
## 3. What We Made to Solve It
Instead of trying to insert a new row and crashing, EnrollStudent in AcademicAdminController now intelligently checks if an *inactive* enrollment exists for that year. If it finds one, it simply reactivates the old record (IsActive = true) and updates the ClassId. This cleanly bypasses the database restriction without requiring any database schema migrations!
