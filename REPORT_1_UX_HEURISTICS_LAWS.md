# REPORT 1: UX HEURISTICS & LAWS AUDIT
## Masarak — AI-Based Online Egyptian School Platform
### Audit Date: 2026-09-30 | Auditor: Senior UX Auditor (Codebase-Only)

---

## Executive Summary

The Masarak platform is a comprehensive multi-role online school system serving Students, Parents, Teachers, and Admins. The codebase demonstrates a well-structured Angular frontend with role-based routing, signal-based state management, and a .NET Core backend. However, the audit reveals **significant UX gaps** across heuristic principles, particularly in navigation architecture, error recovery, destructive action safeguards, and accessibility.

**Key Findings:**
- **36 unique issues** identified across Nielsen, Shneiderman, Norman, and UX Laws
- **4 P0 (Critical)** issues affecting core educational workflows
- **9 P1 (High)** issues affecting daily production use
- **Navigation architecture** relies entirely on a user-menu dropdown with no persistent sidebar
- **Exam submission** uses browser `confirm()` instead of a proper modal
- **No breadcrumb system** on most pages despite deep nesting
- **Inconsistent error/empty state handling** across features

---

## System Coverage

### Pages Inventoried (44+ unique screens)

| Role | Pages |
|------|-------|
| **Public** | Landing, Login, Signup, Forgot Password, Reset Password, Plans, Checkout Success/Cancel |
| **Student (13)** | Dashboard, Courses, Content/Library, Lessons, Assignments, Exams, Exam Result, Grades, Attendance, Performance, Schedule, Insights, Profile |
| **Teacher (14)** | Dashboard, Courses, Students, Exams, Sessions, Lessons Manager, Assignment Creator, Exam Creator, Question Bank, Grading Dashboard, Exam Grader, Performance Analysis, Parent Summary, Class Analytics |
| **Parent (9)** | Dashboard, Children, Link Student, Smart Report, Child Alerts, Attendance, Schedule, Profile, Subscriptions |
| **Admin (10)** | Dashboard, Users, Teachers Directory, Academic Management, Schedule, Performance, Content Moderation, Subscriptions, Plans, Platform Analytics, Heatmap, Prompt Editor |
| **Shared** | Profile, Chat, Live Room, Change Password |

### Shared Components Inventoried
- `IconComponent`, `BreadcrumbComponent`, `ButtonComponent`, `LoadingOverlayComponent`, `NotificationBellComponent`, `NotificationPanelComponent`, `ToastContainerComponent`

---

## NIELSEN'S 10 HEURISTICS AUDIT

### H1: Visibility of System Status

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N1-01 | All pages with API calls | All | **No global loading overlay for route transitions.** The `LoadingOverlayComponent` exists as a shared component but is not integrated into the `DashboardLayoutComponent` or router events. Users navigating between pages have no system-level loading indicator. | [dashboard-layout.html](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html) — no `<app-loading-overlay>` in template | P2 |
| N1-02 | Exam Taking | Student | **No autosave indicator visible to user.** `ExamAttemptStore` implements `forceSaveNow()` but there is no visible UI element showing save status (saving/saved/failed). Students have no confidence that their answers are being preserved. | [exams.component.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L178) — `store.forceSaveNow()` called only before submit | P0 |
| N1-03 | Academic Management | Admin | **Grades tab shows "0 مرحلة مسجلة" during loading.** The `grades().length` is evaluated before data loads, showing `0` instead of a loading skeleton. | [academic-management.html:119](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html#L119) | P3 |

### H2: Match Between System and the Real World

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N2-01 | Navigation Menu | All | **Brand name "Masarak" is in English** while the entire UI is Arabic. This mismatch forces bilingual context switching. | [dashboard-layout.html:11](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L11) — `<span class="...">Masarak</span>` | P3 |
| N2-02 | Registration | Parent/Student | **Registration form mode terminology inconsistent.** Form says "تسجيل بيانات الطالب" (Register Student Data) in Student mode, but "إنشاء حساب ولي أمر" (Create Parent Account) — two different verbs and patterns for the same action. | [signup.html:17](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.html#L17) | P3 |
| N2-03 | Admin Navigation | Admin | **"حالة النظام" (System Health) link exists in nav** but no route `admin/system-health` is defined. Dead link. | [dashboard-layout.html:137](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L137) vs [app.routes.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L111-L129) — route not defined | P1 |

### H3: User Control and Freedom

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N3-01 | Exam Submission | Student | **No undo/back after exam submission.** Once `submitActiveExam()` is called and succeeds, `store.clearExam()` immediately destroys all state. No review period exists. | [exams.component.ts:182-186](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L182-L186) | P1 |
| N3-02 | Student Enrollment | Admin | **Unenroll action immediately triggers** after single confirmation. No grace period, no bulk undo. | [academic-management.ts:256-263](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.ts#L256-L263) | P2 |
| N3-03 | Navigation | All | **No breadcrumb on most pages.** `BreadcrumbComponent` exists as shared component but is only imported in the exam page. Deep pages like `teacher/assessment/grading/exam/:studentExamId` have no navigation context. | [exams.component.ts:37](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L37) — only exam imports it | P1 |

### H4: Consistency and Standards

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N4-01 | Route Casing | All | **Inconsistent URL casing.** Auth routes use PascalCase (`/auth/ForgotPassword`, `/auth/ResetPassword`) while all other routes use kebab-case (`/student/exam-result`). | [app.routes.ts:48,56](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L48-L56) | P2 |
| N4-02 | Teacher Navigation | Teacher | **Teacher sidebar shows "الواجبات" (Assignments) link** pointing to `teacher/assignments` but no such route exists in teacher children. Route is missing. | [dashboard-layout.html:91](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L91) vs [app.routes.ts:86-108](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L86-L108) | P1 |

### H5: Error Prevention

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N5-01 | Exam Submission | Student | **Uses browser `confirm()` for final exam submission.** This native dialog is non-styled, cannot be internationalized to match the Arabic UI, and is easily dismissed. For an action with irreversible academic consequences, this is insufficient. | [exams.component.ts:171](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L171) — `if (!force && !confirm('هل أنت متأكد...'))` | P0 |
| N5-02 | Registration | Parent | **No confirm-password mismatch validation visible.** The signup form has `confirmPassword` field but no cross-field validation error message for mismatch is shown in HTML. | [signup.html:154-161](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.html#L154-L161) — only checks `required`, not `mismatch` | P1 |
| N5-03 | Login Form | All | **Form can be submitted while invalid.** No `[disabled]="loginForm.invalid"` on submit button; only `authState.isLoading()` disables. Invalid submissions hit the backend. | [login.html:86](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/login/login.html#L86) | P2 |

### H6: Recognition Rather Than Recall

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N6-01 | Navigation | All | **All navigation is hidden in a single user-avatar dropdown.** No persistent sidebar exists. Users must click avatar → remember menu structure to navigate. Student has 12+ items in one dropdown with no grouping dividers. | [dashboard-layout.html:44-77](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L44-L77) | P1 |
| N6-02 | Academic Management Tabs | Admin | **Class and Roster tabs require previous selection context** (Grade → Class) but no visual indicator of the currently selected Grade/Class persists across tab switches. | [academic-management.html:243-244](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html#L243-L244) — shows "يرجى اختيار المرحلة" without indicating prior selection | P2 |

### H7: Flexibility and Efficiency of Use

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N7-01 | Admin User Management | Admin | **No keyboard shortcuts for frequent admin actions.** User Management, Academic Management pages have no accelerators. | INFERRED — no `@HostListener('keydown')` or keyboard shortcut code found in admin components | P3 |

### H8: Aesthetic and Minimalist Design

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N8-01 | Teacher Navigation | Teacher | **Teacher dropdown has 15+ items** including a nested "التقييمات" section. Excessive density for a dropdown that disappears on outside click. | [dashboard-layout.html:78-117](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L78-L117) | P2 |

### H9: Help Users Recognize, Diagnose, and Recover from Errors

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N9-01 | Exam Start Error | Student | **Generic error message on exam start failure.** Uses `resolveErrorMessage(error)` which may return technical messages. No specific guidance (e.g., "Exam not available yet" vs "Already attempted"). | [exams.component.ts:153-155](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L153-L155) | P2 |
| N9-02 | Academic Management CRUD | Admin | **Error feedback auto-dismisses after 4 seconds.** `showFeedback()` uses `setTimeout` at 4000ms. If user is scrolled away or momentarily distracted, they miss the error. | [academic-management.ts:165](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.ts#L165) | P2 |

### H10: Help and Documentation

| ID | Page/Feature | Role | Problem | Evidence | Severity |
|----|-------------|------|---------|----------|----------|
| N10-01 | All | All | **No help system, tooltips, or contextual help anywhere in the application.** No `title` attributes, no help icons, no documentation links. | VERIFIED — grep for "help", "tooltip", "title=" across frontend yields no contextual help patterns | P2 |

---

## SHNEIDERMAN'S 8 GOLDEN RULES

### S1: Strive for Consistency
- **ISSUE (P2):** Route casing inconsistency (PascalCase auth vs kebab-case elsewhere) — see N4-01
- **ISSUE (P2):** Button styles are mostly consistent (blue-600 primary) but Academic Management uses inline class definitions while some pages use `ButtonComponent`.

### S2: Seek Universal Usability
- **ISSUE (P1):** No RTL-aware responsive design validation. Layout uses `dir="rtl"` on root elements but CSS is primarily utility-based (Tailwind). Tables and horizontal scroll areas may overflow in RTL on mobile. UNVERIFIED — requires runtime testing.

### S3: Offer Informative Feedback
- **ISSUE (P0):** Exam autosave has no visible indicator — see N1-02
- **ISSUE (P2):** Feedback messages auto-dismiss at 4s — see N9-02

### S4: Design Dialogs to Yield Closure
- **ISSUE (P2):** Academic Management modals provide success feedback but auto-dismiss. No "View created item" or "Create another" option after successful creation.

### S5: Prevent Errors
- **ISSUE (P0):** Exam submission uses browser `confirm()` — see N5-01
- **ISSUE (P1):** No password mismatch validation in signup — see N5-02

### S6: Permit Easy Reversal of Actions
- **ISSUE (P1):** No undo for exam submission, enrollment removal, or teacher unassignment.
- **ISSUE (P2):** Logout has no confirmation dialog despite being a destructive navigation action.

### S7: Keep Users in Control
- **ISSUE (P1):** Navigation entirely via dropdown menu. Users cannot bookmark/pin frequent pages. No sidebar for persistent navigation.

### S8: Reduce Short-Term Memory Load
- **ISSUE (P2):** Academic Management flow requires remembering selected Grade → Class → Student across 6 tabs. Selection context is stored in signals but not visually prominent.

---

## NORMAN'S PRINCIPLES

### Affordance
- **ISSUE (P2):** Grade cards in Academic Management look like informational cards but are actually navigation buttons to the Subjects tab. No visual distinction between cards and buttons. Evidence: [academic-management.html:131](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html#L131)

### Signifiers
- **ISSUE (P2):** The edit pencil icon on grade cards is hidden by default (`opacity-0 group-hover:opacity-100`). Users on touch devices cannot discover this action.

### Feedback
- **ISSUE (P0):** Missing autosave feedback during exams — see N1-02
- **ISSUE (P2):** Toast container component exists but usage is UNVERIFIED across all pages.

### Mapping
- **ISSUE (P3):** "الخطط والاشتراكات" in student nav navigates to `/plans` (outside dashboard layout), losing the navigation context. Users leave the dashboard and may not know how to return.

### Constraints
- **ISSUE (P2):** Academic Management "إضافة مادة" button only appears when a Grade is selected (`selectedGrade()` guard). Good constraint, but no tooltip explaining WHY it's hidden.

### Discoverability
- **ISSUE (P1):** Teacher assessment tools (Create Exam, Question Bank, Grading) are buried 2 levels deep in the dropdown menu under "التقييمات" section. Critical daily tools are not discoverable.

---

## UX LAWS AUDIT

### Fitts's Law
- **ISSUE (P2):** The user avatar button (9×9 = ~36px) is the sole navigation entry point. This small target carries enormous responsibility.
- **ISSUE (P3):** Mobile navigation relies on this same small avatar. No hamburger menu alternative.

### Hick's Law
- **ISSUE (P1):** Student dropdown has 12 items, Teacher has 15+ items, Admin has 14+ items — all in one flat list. Decision time is excessive. Evidence: [dashboard-layout.html:44-174](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html)

### Miller's Law
- **ISSUE (P2):** Academic Management has 6 tabs (المراحل، المواد، الفصول، تسكين الطلاب، تعيين المعلمين، تخصصات المعلمين) visible simultaneously in horizontal scroll. Exceeds 7±2 for immediate comprehension.

### Jakob's Law
- **ISSUE (P1):** Navigation via avatar dropdown instead of a persistent sidebar violates expectations set by every major LMS/school platform (Google Classroom, Moodle, Canvas, Edmodo). Users must relearn navigation.

### Tesler's Law
- **ISSUE (P2):** Creating a Grade requires manually entering "Order" — a number the system could auto-calculate from existing grades. Unnecessary complexity pushed to admin.

### Doherty Threshold
- **ISSUE (P0):** During exam-taking, if the network drops, `forceSaveNow()` may silently fail. No retry mechanism or offline indicator visible. Students could lose answers without knowing.

---

## Top Critical UX Findings

| Rank | ID | Issue | Severity |
|------|----|-------|----------|
| 1 | N1-02 | No autosave indicator during exams | P0 |
| 2 | N5-01 | Exam submission uses browser `confirm()` | P0 |
| 3 | Doherty | No offline/save-failure indicator during exams | P0 |
| 4 | S3 | Missing save status feedback during timed assessments | P0 |
| 5 | N2-03 | Dead "System Health" link in admin nav | P1 |
| 6 | N4-02 | Dead "Assignments" link in teacher nav | P1 |
| 7 | N3-03 | No breadcrumbs on deeply nested pages | P1 |
| 8 | N6-01 | All navigation hidden in single dropdown | P1 |
| 9 | N5-02 | No password mismatch validation | P1 |
| 10 | Jakob | Navigation pattern violates LMS conventions | P1 |

---

## Prioritized Recommendations

1. **P0: Implement exam save status indicator** — Add a visible "حفظ تلقائي ✓" chip that updates on every autosave cycle
2. **P0: Replace `confirm()` with proper Arabic confirmation modal** — Use the existing `confirmAction` pattern from Academic Management
3. **P0: Add network-failure detection during exams** — Show a warning banner if save requests fail
4. **P1: Add persistent sidebar navigation** — Replace the dropdown with a collapsible sidebar for roles with 10+ nav items
5. **P1: Fix dead navigation links** — Remove or implement `admin/system-health` and `teacher/assignments` routes
6. **P1: Add breadcrumb navigation** — Extend `BreadcrumbComponent` usage to all pages
7. **P1: Add confirm-password mismatch validation** — Cross-field validator with Arabic error message
8. **P2: Normalize URL casing** — Convert `ForgotPassword` and `ResetPassword` to kebab-case
9. **P2: Add help tooltips** — Start with exam and assessment workflows
10. **P2: Persist feedback messages for errors** — Don't auto-dismiss error messages; only auto-dismiss success
