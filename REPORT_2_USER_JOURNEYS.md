# REPORT 2: END-TO-END USER JOURNEY AUDIT
## Masarak — AI-Based Online Egyptian School Platform
### Audit Date: 2026-09-30 | Auditor: Senior UX Auditor (Codebase-Only)

---

## STUDENT JOURNEYS

### Journey 1: Registration → Login → Dashboard

```
Landing Page (/) → Register (/auth/register) → [Success] → Login (/auth/login) → Dashboard (/dashboard/student)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Registration Success | **No success confirmation page.** After successful registration, user behavior is UNVERIFIED — the TS `onSubmit()` likely navigates directly to login but no success message is shown. | [signup.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.ts) — need to verify navigation after success | User may not realize account was created | P2 |
| Registration | **Password mismatch not validated in UI.** `confirmPassword` field shows only `required` error, not a mismatch error. User could submit mismatched passwords. | [signup.html:154-161](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.html#L154-L161) | Account creation failure with unclear error | P1 |
| Registration (Student mode) | **Grade dropdown shows `nameAr` only.** If `nameAr` is null, `{{ grade.nameAr }}` renders empty/blank. | [signup.html:176](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.html#L176) | Empty dropdown items, cannot select grade | P1 |
| Login | **No "remember me" option.** Token storage mechanism (localStorage vs sessionStorage) is not user-controllable. | INFERRED from absence in [login.html](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/login/login.html) | Forces re-login on every session | P3 |
| Login → Dashboard | **guestGuard blocks authenticated users from landing.** Correct behavior, but if token expires mid-session, user is redirected to `/` landing page, not `/auth/login`. Confusing. | [app.routes.ts:29-32](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L29-L32) — landing has `guestGuard` | User sees landing page after session expiry instead of login | P2 |

**Dead Ends:** None identified in this journey.
**Missing Recovery:** No way to resend verification email if one is required.

---

### Journey 2: Dashboard → Weekly Schedule → Live Class

```
Dashboard (/dashboard/student) → Schedule (/dashboard/student/schedule) → Live Session (/dashboard/student/sessions/:id/live)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Dashboard → Schedule | **No direct link from dashboard cards to schedule.** Dashboard component would need to have a schedule widget. PARTIAL — dashboard HTML needs inspection. | [dashboard.component.html](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/dashboard/dashboard.component.html) — 6KB, likely contains schedule preview | UNVERIFIED | P3 |
| Schedule → Live Session | **Live session route exists** at `sessions/:id/live` with `data: { role: 'student' }`. Proper role data is passed. | [student.routes.ts:76-80](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/routes/student.routes.ts#L76-L80) | No issue | — |
| Live Session Exit | **No confirmation before leaving a live session.** If student accidentally navigates away, they leave the session without warning. No `canDeactivate` guard. | No `canDeactivate` guard on live session route | Student accidentally leaves class | P1 |

---

### Journey 3: Lesson → Assignment → Submission → Result

```
Lessons (/dashboard/student/lessons) → [Select Lesson] → Assignments (/dashboard/student/assignments) → [Submit] → Result
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Lessons → Assignments | **No direct navigation from a lesson to its related assignments.** Lessons and Assignments are separate top-level routes with no contextual link between them. | [student.routes.ts:35-44](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/routes/student.routes.ts#L35-L44) — separate routes, no lesson ID parameter on assignments | Student must manually navigate to assignments and find the right one | P2 |
| Assignment Submission | **UNVERIFIED** — assignment page HTML not inspected in detail. Submission confirmation and result feedback need runtime verification. | [assignments.component.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/assignments) | UNVERIFIED | — |

---

### Journey 4: Exam → Submit → Grade → Performance Report

```
Exams (/dashboard/student/exams) → [Start Exam] → [Answer Questions] → [Submit] → Result → Performance (/dashboard/student/performance)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Start Exam | **No exam instructions page.** `startSelectedExam()` immediately calls `startExam()` API. No pre-exam screen showing duration, question count, rules. | [exams.component.ts:134-158](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L134-L158) | Student starts exam without knowing rules/duration | P1 |
| During Exam | **No question navigation sidebar.** Questions appear to be rendered sequentially by `QuestionRendererComponent` but there is no jump-to-question functionality visible. | [exams.component.ts:37](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L37) — imports but no navigation UI in TS | Student cannot skip/review questions easily | P1 |
| Submit Exam | **Browser `confirm()` for irreversible academic action.** Already documented as P0. | [exams.component.ts:171](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts#L171) | Accidental submission risk | P0 |
| Exam Result | **Result page exists at `exams/result/:id`** with dedicated component. Proper routing. | [student.routes.ts:15-18](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/routes/student.routes.ts#L15-L18) | No issue | — |
| Result → Performance | **No direct link from exam result to performance page.** Student must navigate back through menu. | INFERRED — separate route with no linking pattern | Disconnected user journey | P2 |

---

### Journey 5: Performance Report → Weak Area → AI Recommendation

```
Performance (/dashboard/student/performance) → Insights (/dashboard/student/insights)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Performance → Insights | **Two separate pages for related data.** Performance page and Learning Insights page exist as independent routes. No cross-linking is visible from route definitions. | [student.routes.ts:64-97](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/routes/student.routes.ts#L64-L97) | Student may not discover AI insights | P2 |

---

### Journey 6: Subscription → Access to Content

```
Plans (/plans) → [Select Plan] → Checkout → Success (/checkout-success) or Cancel (/checkout-cancel)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Plans Page | **Plans page is OUTSIDE the dashboard layout.** Route is at root level, not under `/dashboard`. User loses header navigation. | [app.routes.ts:154-159](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L154-L159) — no parent `DashboardLayoutComponent` | User has no navigation back to dashboard from plans page | P1 |
| Checkout Cancel | **Cancel page exists** at `/checkout-cancel`. Proper routing. | [app.routes.ts:177-183](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L177-L183) | No issue | — |
| Post-Checkout | **Success/Cancel pages are also outside dashboard layout.** No easy return path. | Same evidence as above | User stranded after checkout | P1 |

---

### Journey 7: Student Subscription Redirect

```
Student clicks "Subscription" → Redirected to Profile
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Subscription Redirect | **`/dashboard/student/subscription` redirects to `profile`.** Misleading — subscription info may or may not be on the profile page. No dedicated subscription management for students. | [student.routes.ts:87-90](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/routes/student.routes.ts#L87-L90) | Confusing redirect, subscription not easily managed | P2 |

---

## PARENT JOURNEYS

### Journey 1: Parent Login → Dashboard → Child Selection

```
Login → Dashboard (/dashboard/parent) → Children List (/dashboard/parent/children) → Child Actions
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Dashboard | **Parent dashboard exists.** Route loads `ParentDashboardComponent`. | [parent.routes.ts:5-7](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L5-L7) | No issue | — |
| Children List | **Children list is a separate page from dashboard.** Parent must navigate to "أبنائي" to see children. Dashboard may or may not show children summary — UNVERIFIED. | [parent.routes.ts:9-11](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L9-L11) | Extra navigation step for primary task | P2 |
| Add Student | **"Add Student" uses the Signup component** with `data: { mode: 'Student' }`. Parent creates student accounts through the same registration form. | [parent.routes.ts:13-16](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L13-L16) | Reuses signup form — may confuse parent who thinks they're linking, not creating | P2 |

### Journey 2: Child → Grades / Performance

```
Children → Smart Report (/dashboard/parent/reports/:studentId) → Alerts (/dashboard/parent/alerts/:studentId)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Smart Report | **Exists with optional month parameter.** Both `/reports/:studentId` and `/reports/:studentId/:month` are handled. Good routing. | [parent.routes.ts:18-24](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L18-L24) | No issue | — |
| Alerts | **Child alerts page exists.** Separate route for alerts per student. | [parent.routes.ts:26-28](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L26-L28) | No issue | — |
| Navigation Context | **Parent navigating between child pages (reports, alerts, attendance, schedule) must go through Children List each time** — no per-child navigation context bar. | Routes are isolated by `:studentId` parameter only | High friction between child-related pages | P2 |

### Journey 3: Parent → Child Attendance

```
Children → Attendance (/dashboard/parent/attendance/:studentId)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Attendance | **Route exists.** `ParentAttendanceComponent` loaded per student. | [parent.routes.ts:30-32](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L30-L32) | No issue | — |

### Journey 4: Parent → Link Existing Student

```
Dashboard → Link Student (/dashboard/parent/link)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Link Student | **Separate from "Add Student" (which creates).** `LinkStudentComponent` exists for linking existing accounts. | [parent.routes.ts:42-44](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L42-L44) | Good — separate workflows | — |
| Discoverability | **"Link" vs "Add" student distinction may be confusing.** Parent nav only shows "أبنائي" — the link/add actions are presumably on that page. | PARTIAL — nav items in [dashboard-layout.html:168-170](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L168-L170) show only "أبنائي" | Parent may not find Link vs Add | P2 |

### Journey 5: Parent Subscriptions

```
Dashboard → Subscriptions (/dashboard/parent/subscriptions)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Subscriptions | **Parent-specific subscription page exists** plus nav link "الخطط والاشتراكات". | [parent.routes.ts:46-48](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/routes/parent.routes.ts#L46-L48) | No issue | — |
| Parent Navigation | **Only 3 items in parent dropdown** (Subscriptions, Home, Children, Chat). Clean and manageable. | [dashboard-layout.html:161-174](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L161-L174) | Good | — |

---

## TEACHER JOURNEYS

### Journey 1: Teacher Login → Dashboard → Create Content

```
Login → Dashboard (/dashboard/teacher) → Courses (/dashboard/teacher/courses) → Lessons Manager (/dashboard/teacher/lessons)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Dashboard → Courses | **Courses and Lessons are separate pages.** Course shows classes/subjects; Lessons shows lesson content management. | [app.routes.ts:90,102](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L90-L102) | No issue — reasonable separation | — |

### Journey 2: Create Assignment

```
Nav Dropdown → "إنشاء واجب" → Assignment Creator (/dashboard/teacher/assessment/assignments/create)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Navigation | **Buried 2 levels deep under "التقييمات" dropdown section.** Teacher must: click avatar → scroll down → find "التقييمات" section → click "إنشاء واجب". | [dashboard-layout.html:105-107](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L105-L107) | Core daily action is hard to reach | P1 |
| After Creation | **UNVERIFIED** — where does the teacher go after creating an assignment? No route evidence of success page. | Assignment creator component not fully inspected | UNVERIFIED | — |

### Journey 3: Create & Grade Exam

```
Create Exam (/dashboard/teacher/assessment/exams/create) → Grading Dashboard (/dashboard/teacher/assessment/grading) → Grade Exam (/dashboard/teacher/assessment/grading/exam/:studentExamId)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Exam Creation | **Route exists.** `ExamCreatorComponent` loaded lazily. | [app.routes.ts:98](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L98) | No issue | — |
| Grading Dashboard → Individual Exam | **Deep nesting:** `/dashboard/teacher/assessment/grading/exam/:studentExamId` is 5 levels deep. No breadcrumb. | [app.routes.ts:101](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L101) | Teacher loses navigation context | P1 |

### Journey 4: Monitor Students

```
Dashboard → Students (/dashboard/teacher/students) → Student Insight (/dashboard/teacher/student-insight/:studentId/:subjectId)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Student Insight | **Requires both studentId and subjectId in URL.** Teacher must select both a student and a subject to access insights. | [app.routes.ts:107](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L107) | No issue — reasonable constraint | — |

### Journey 5: Live Sessions

```
Nav → "الحصص المباشرة" → Sessions (/dashboard/teacher/sessions) → Live Room (/dashboard/teacher/sessions/:id/live)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Session Management | **Sessions and attendance pages exist.** Teacher can manage sessions and view attendance. | [app.routes.ts:103-105](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L103-L105) | No issue | — |
| Leave Live Room | **No `canDeactivate` guard on teacher live room either.** Same risk as student. | No guard on live session routes | Accidental exit during class | P1 |

### Journey 6: Teacher Assignments Dead Link

```
Nav → "الواجبات" → /dashboard/teacher/assignments → ???
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Dead Link | **`teacher/assignments` has no route defined.** Nav link at [dashboard-layout.html:91](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L91) points to a nonexistent route. Wildcard `**` would redirect to teacher dashboard. | Route not in [app.routes.ts:86-108](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L86-L108) | Teacher cannot view assignments list | P1 |

---

## ADMIN JOURNEYS

### Journey 1: Manage Academic Structure

```
Dashboard → Academic (/dashboard/admin/academic) → [Grades → Subjects → Classes → Enrollment → Assignments → Specializations]
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| 6-Tab Academic Flow | **All academic management in one mega-component with 6 tabs.** Complex but functional. Tabs depend on sequential selection (Grade → Subject → Class). | [academic-management.html](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html) — 663+ lines | High cognitive load, but centralized | P2 |
| Tab Dependencies | **Subjects/Classes tabs show "يرجى اختيار المرحلة" if no grade selected.** Good constraint, but no indication of WHICH grade is currently selected in the tab header. | [academic-management.html:243](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html#L243) | Admin must remember selected grade | P2 |

### Journey 2: Admin → Dead System Health Link

```
Nav → "حالة النظام" → /dashboard/admin/system-health → ???
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Dead Link | **No `admin/system-health` route exists.** Will redirect to admin dashboard via wildcard. | [dashboard-layout.html:137-139](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html#L137-L139) vs [app.routes.ts:111-129](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L111-L129) | Admin feature unavailable | P1 |

### Journey 3: Admin Destructive Actions

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| User Management | **UNVERIFIED** — user deletion/deactivation safeguards need component-level inspection. | [AdminUsersController.cs](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/Masarak.API/Controllers/AdminUsersController.cs) — 13KB, needs detailed review | UNVERIFIED | — |
| Academic CRUD | **Modal-based creation/update uses inline feedback with auto-dismiss.** No confirmation for updates. | [academic-management.ts](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.ts) | Update mistakes have no undo | P2 |

### Journey 4: Admin Subscription Management

```
Nav → "إدارة الاشتراكات" → Subscriptions (/dashboard/admin/subscriptions)
```

| Step | Observed Issue | Evidence | User Impact | Severity |
|------|---------------|----------|-------------|----------|
| Subscriptions | **Admin subscription management component exists.** `AdminSubscriptionsComponent` loaded. | [app.routes.ts:122](file:///d:/ITI/MVC/final%20project/Masarak/Masarak/MasarkFront/MasarkFront-main/src/app/app.routes.ts#L122) | No issue | — |

---

## Cross-Journey Summary of Dead Ends & Broken Links

| Navigation Item | Target Route | Status | Affected Role |
|----------------|--------------|--------|---------------|
| حالة النظام | `admin/system-health` | **DEAD — no route** | Admin |
| الواجبات (Teacher) | `teacher/assignments` | **DEAD — no route** | Teacher |
| Plans/Checkout pages | `/plans`, `/checkout-*` | **Outside dashboard layout — loses nav** | Student, Parent |
| Student exam individual view | `exams/:id` | **Redirects to exams list** — can't deep-link to a specific exam | Student |

---

## High-Friction Workflows

1. **Teacher creating assessments:** 4+ clicks to reach creation forms (avatar → scroll → التقييمات → create)
2. **Student exam flow:** No pre-exam instructions → No question navigation → Browser confirm() → No post-result actionable links
3. **Parent child monitoring:** Must return to children list to switch between child pages (reports, attendance, schedule)
4. **Admin academic management:** 6 tabs with implicit sequential dependencies and no persistent context indicator
