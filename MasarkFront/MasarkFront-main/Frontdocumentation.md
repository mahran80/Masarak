# Masarak Education Platform: Frontend Documentation

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Folder Structure](#2-folder-structure)
3. [Core Module (Services, Interceptors, Guards)](#3-core-module-services-interceptors-guards)
4. [Features (Pages & Modules)](#4-features-pages--modules)
5. [Shared & Layouts](#5-shared--layouts)
6. [Routing & Navigation](#6-routing--navigation)
7. [State & Data Flow](#7-state--data-flow)

---

## 1. Application Overview

The **MasarkFront** project is an Angular 17+ single-page application (SPA). It acts as the primary user interface for Students, Teachers, Parents, and Administrators.

### Key Technologies
- **Framework**: Angular 17+ (using standalone components and signals).
- **Styling**: Tailwind CSS & SCSS.
- **Real-time**: `@microsoft/signalr` for Chat and Notifications.
- **Payments**: Stripe Elements (`@stripe/stripe-js`).
- **Icons**: Heroicons (via `app-icon` component).

---

## 2. Folder Structure

The application strictly adheres to the Feature-Module / LIFT principle.

```text
MasarkFront/MasarkFront-main/src/app/
â”œâ”€â”€ core/        # Singleton services, interceptors, and route guards
â”œâ”€â”€ features/    # The business logic grouped by domain (e.g., /student, /teacher)
â”œâ”€â”€ layouts/     # Shell components (Main layout, Sidebar, Header)
â”œâ”€â”€ models/      # TypeScript interfaces mapping exactly to Backend DTOs
â””â”€â”€ shared/      # Reusable dumb components (Buttons, Cards, Inputs) and Pipes
```

---

## 3. Core Module (Services, Interceptors, Guards)

The `core/` folder contains logic that is instantiated once (Singletons) and used globally.

### 3.1. Interceptors (`core/interceptors/`)
- **`AuthInterceptor`**: 
  - **Purpose**: Intercepts every outgoing `HttpClient` request and attaches the `Authorization: Bearer <token>` header if a token exists in `localStorage`.
- **`ErrorInterceptor`**:
  - **Purpose**: Catches HTTP 401s to trigger a refresh token flow. Catches HTTP 403s to redirect to unauthorized pages. Catches HTTP 402s to redirect to the `/subscription/plans` page. Parses the custom `{ "errorCode": "...", "message": "..." }` envelope and displays Toastr notifications.

### 3.2. Guards (`core/guards/`)
Route guards implement `CanActivate` to protect routes before they load.
- **`AuthGuard`**: Checks if the user is logged in. If not, redirects to `/auth/login`.
- **`AdminGuard`, `TeacherGuard`, `StudentGuard`, `ParentGuard`**: Checks the user's `Role` claim inside the decoded JWT. Prevents a Student from manually navigating to `/teacher/dashboard`.

### 3.3. Services (`core/services/`)
- **`AuthService.ts`**: Handles login (`POST /api/auth/login`), stores JWTs in `localStorage`, and exposes a `currentUser$` BehaviorSubject so the UI reacts instantly to login/logout.
- **`ThemeService.ts`**: Manages light/dark mode toggling.

---

## 4. Features (Pages & Modules)

The `features/` directory is where the actual screens live. Each folder often represents a lazy-loaded route.

### 4.1. `auth/`
- **Components**: `LoginComponent`, `RegisterComponent`, `ForgotPasswordComponent`.
- **Logic**: Form validation using `FormBuilder`. Passwords must match. Role selection during registration.

### 4.2. `subscription/`
- **Components**: `PlansComponent`, `CheckoutComponent`.
- **Logic**: Integrates Stripe Elements. Handles the `402 Payment Required` redirect flow.

### 4.3. `student/`
- **Pages**: 
  - `StudentDashboardComponent`: Shows upcoming classes and unread notifications.
  - `StudentExamsComponent`: The exam-taking interface. Handles a strict countdown timer. If the timer hits zero, it forcefully calls `submitExam()`.
  - `InsightsComponent`: Displays the AI-generated weakness analysis (Phase 5).

### 4.4. `teacher/`
- **Pages**:
  - `TeacherDashboardComponent`: Displays pending grading tasks.
  - `LessonManagerComponent`: Allows teachers to upload PDFs/Videos to Azure blob storage and organize them.
  - `GradingComponent`: Interface for reviewing student submissions and issuing marks.

### 4.5. `admin/`
- **Pages**: `UserManagementComponent`, `SystemHealthComponent`, `ContentModerationComponent`.

### 4.6. `signalR/`
- **Services**: `SignalRService.ts`
  - Initializes the connection to `/hubs/chat` and `/hubs/notification`.
  - Subscribes to events like `ReceiveMessage` and updates a local `messages` Signal/BehaviorSubject.

---

## 5. Shared & Layouts

### 5.1. `layouts/`
- **`MainLayoutComponent`**: The wrapper for authenticated users. Contains the `<router-outlet>`.
- **`SidebarComponent`**: Dynamically renders navigation links based on the user's `Role`. (e.g., Hides "Grading" if the user is a Student).
- **`HeaderComponent`**: Shows the user's avatar, name, and a notification bell dropdown.

### 5.2. `shared/`
- **`components/app-icon`**: A standardized SVG icon wrapper to replace emojis.
- **`components/modal`**: Reusable popup dialogs.
- **`pipes/TranslatePipe`**: (If applicable) used for internal localization.

---

## 6. Routing & Navigation

Routing is defined in `app.routes.ts` (or individual feature routing modules) using **Lazy Loading**.

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) 
  },
  { 
    path: 'student', 
    canActivate: [AuthGuard, StudentGuard],
    component: MainLayoutComponent,
    loadChildren: () => import('./features/student/student.routes').then(m => m.STUDENT_ROUTES) 
  },
  // ... teacher, admin, parent routes ...
];
```
*Note: Lazy loading ensures the user only downloads the JavaScript required for their specific role, vastly improving initial load times.*

---

## 7. State & Data Flow

### Example Business Flow (Student taking an Exam)
1. **User Action**: Student clicks "Start Exam" in `StudentExamsComponent.html`.
2. **Component State**: `StudentExamsComponent.ts` calls `this.assessmentService.startExam(examId)`.
3. **HTTP Request**: A `POST` is sent. The `AuthInterceptor` attaches the JWT.
4. **Response**: The Backend returns the `ExamAttemptDto`.
5. **UI Update**: The component stores the questions in an Angular Signal (or variable) and starts the `setInterval` timer.
6. **Background Task**: Every time a student selects an answer, the component debounces the input and calls `saveAnswer()` in the background to prevent data loss if the browser crashes.
7. **Submission**: The student clicks "Submit". The `submitExam()` API is called. The router navigates to `/student/exams/result/{id}`.

> [!TIP]
> **Performance Best Practice**: When creating new components, utilize `ChangeDetectionStrategy.OnPush` where possible, and strictly use `takeUntilDestroyed()` or `AsyncPipe` to prevent memory leaks from dangling RxJS Subscriptions.
