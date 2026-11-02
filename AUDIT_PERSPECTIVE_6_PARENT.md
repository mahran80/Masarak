# UI & Functionality Inventory — Perspective 6: Parent Perspective

> **Audit Scope**: Covers all routes, routed components, interactive states, signals, and templates within the Parent portal under `/dashboard/parent/*`. Grounded strictly in Angular 19+ standalone components, parent-child context bars, AI smart reports, and multi-child subscription management.

---

## 1. Parent Dashboard (`ParentDashboardComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent`
  - Guard: Parent route `AuthGuard` (`allowedRoles: ['Parent', 'Admin']`)
  - Breadcrumb: `'لوحة ولي الأمر'`
- **File Paths**:
  - TypeScript: [parent-dashboard.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/dashboard/parent-dashboard.component.ts)
  - Template: Inline template inside `parent-dashboard.component.ts`
- **UI Sections & Visual States**:
  - **Greeting Header**: Personalized greeting `"مرحباً بك، {{ parentName }}"`, subtitle, and top action button `"إضافة طالب جديد"` linking to `onboarding/add-student`.
  - **KPI Overview Cards (3 Cards)**:
    - Linked Children Count: Value `parentService.linkedStudents().length` with family icon.
    - Active Subscriptions: Value `activeSubscriptionsCount` with green check icon.
    - Inactive Subscriptions: Value `inactiveSubscriptionsCount` with credit card icon.
  - **Child-Specific Section**: `@if (parentService.hasStudents())`:
    - Header with child selector component `<app-child-selector>`.
    - **Active Subscription State** (`@if (parentService.selectedStudent()?.hasActiveSubscription)`):
      - 3 interactive feature cards with hover animations:
        - **التقارير الذكية (Smart Reports)**: Link to `['reports', parentService.selectedStudentId()]`.
        - **تنبيهات الأداء (Performance Alerts)**: Link to `['alerts', parentService.selectedStudentId()]`.
        - **سجل الحضور (Attendance Records)**: Link to `['attendance', parentService.selectedStudentId()]`.
    - **No Active Subscription State** (`@else`):
      - Lock illustration with title `"الطالب {{ fullName }} ليس لديه اشتراك فعال"`.
      - Guidance text explaining benefits of activating a plan.
      - Error container `@if (subscribingError())`.
      - CTA Button: `"تفعيل اشتراك للطالب"` (`subscribeForSelectedChild()`) redirecting to `/dashboard/parent/subscriptions`.
  - **Zero Children Empty State** (`@else`):
    - Full-width card with family icon, explanatory text, and `"إضافة طالب جديد"` primary button.
- **Interactive Elements & Actions**:
  - `(click)="subscribeForSelectedChild()"`: Navigates parent to `/dashboard/parent/subscriptions` for selected child.
  - `<app-child-selector>`: Toggles active student across all child-scoped views.
- **State & Signals**:
  - `isSubscribing = signal(false)`
  - `subscribingError = signal<string | null>(null)`
  - `parentName` (getter from `AuthStateService.user()?.fullName`)
  - `activeSubscriptionsCount`, `inactiveSubscriptionsCount` (getters computed from `parentService.linkedStudents()`)
  - Injected: `ParentService`, `AuthStateService`, `Router`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The feature cards use `group-hover:scale-110` on icons, which can cause micro-jittering without proper `will-change: transform`.
  - The locked state needs a clearer side-by-side plan comparison teaser to drive subscription conversions.

---

## 2. Children Directory (`ChildrenListComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/children`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'أبنائي'`
- **File Paths**:
  - TypeScript: [children-list.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/children/children-list.component.ts)
  - Template: Inline template inside `children-list.component.ts`
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"قائمة الأبناء"`, subtitle, and dual action buttons:
    - Primary Button: `"إنشاء حساب طالب جديد"` linking to `/dashboard/parent/onboarding/add-student`.
    - Secondary Button: `"ربط طالب موجود بالكود"` linking to `/dashboard/parent/link`.
  - **Children Cards Grid**: `@if (combinedStudents().length > 0)`:
    - Each child card displays:
      - Circular avatar (image or initial letter).
      - Status pill: Emerald `"اشتراك فعال"` vs Orange `"غير فعال"`.
      - Student full name and email (with `dir="ltr"`).
      - Bottom 4-column quick-action toolbar:
        - `التقارير` -> `/dashboard/parent/reports/:studentId`
        - `الجدول` -> `/dashboard/parent/schedule/:studentId`
        - `التنبيهات` -> `/dashboard/parent/alerts/:studentId`
        - `الحضور` -> `/dashboard/parent/attendance/:studentId`
        - *Note: Buttons are disabled (`opacity-50 cursor-not-allowed`) if subscription is inactive.*
  - **Empty State**: Illustrated dashed card explaining how to create a new child or link an existing code.
- **Interactive Elements & Actions**:
  - Action buttons navigate to child-scoped feature routes.
  - Subscriptions and profile sync initiated on `ngOnInit()`.
- **State & Signals**:
  - `profileChildren = signal<LinkedChildDto[]>([])`
  - `combinedStudents = computed(() => ...)`: Merges subscription data from `ParentService` with avatar and personal data from `ProfileService`.
  - Injected: `ParentService`, `ProfileService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The 4-column quick action toolbar in each card gets very cramped on narrow screens; needs vertical spacing or icon tooltips.

---

## 3. Child Onboarding & Account Creation (`Signup` Component in Student Mode)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/onboarding/add-student`
  - Guard: Parent `AuthGuard`
  - Route Data: `{ mode: 'Student', breadcrumb: 'إضافة طالب' }`
- **File Paths**:
  - TypeScript: [signup.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.ts)
  - Template: [Signup.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/Signup.html)
- **UI Sections & Visual States**:
  - **Pre-Configured Mode**: Detects `mode === 'Student'` from route data.
  - Automatically ties the new student registration to the logged-in parent's account upon completion.
  - Input fields for Student Name, Student Email, Password, Grade Level, and Class selection.
  - Success banner with auto-redirect back to parent children list.
- **Interactive Elements & Actions**:
  - Child form submission creates student user and automatically associates parent linkage in the backend.

---

## 4. AI Smart Monthly Report (`SmartReportComponent`)

- **Route Path & Guards**:
  - Routes: `/dashboard/parent/reports/:studentId` and `/dashboard/parent/reports/:studentId/:month`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'التقرير الذكي'`
- **File Paths**:
  - TypeScript: [smart-report.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/smart-report/smart-report.component.ts)
  - Template: Inline template inside `smart-report.component.ts`
- **UI Sections & Visual States**:
  - **Persistent Child Context Bar (`<app-child-context-bar>`): Displays currently inspected student's name, grade, avatar, and quick switcher.
  - **Header & Controls Bar**: Title `"التقارير الذكية"`, Month selector dropdown (`2026-01` to `2026-12`), and `"توليد التقرير"` AI generation button with spinner (`isGenerating()`).
  - **Loading Skeleton**: Pulsing 2-column skeleton grid.
  - **Error Banner**: Red alert box with retry button.
  - **Empty Report State**: Illustrated dashed container with prompt: `"لا يوجد تقرير لهذا الشهر. يمكنك توليد تقرير جديد باستخدام الزر أعلاه."`
  - **Active AI Report View (`@else if (report(); as r)`):
    - **AI Executive Summary Hero Banner**: Deep gradient (`from-blue-600 to-indigo-700`) card with sparkle icon, generation timestamp, and AI narrative paragraph (`r.aiNarrative`).
    - **Subject-by-Subject Analytical Breakdown**:
      - Subject card header: Name, average score percentage, attendance percentage, and performance pill (`Strong`, `Average`, `NeedsImprovement`, `AtRisk`).
      - AI Subject Opinion box (`r.subjects[i].aiSubjectNarrative`).
      - **Weaknesses Grid (`weakLessons`)**: Lesson title, mastery percentage, red border accent, and weak topic tag pills.
      - **Improvement Plan (`recommendations`)**: Bulleted recommendations with emerald checkmarks.
    - **Right Column Summary Widgets**:
      - Overall Average circular gauge chart (`r.overallScore%`) with color coding (Emerald, Blue, Orange, Red).
      - Overall Attendance bar chart (`r.attendancePercentage%`).
      - Report metadata card: Student name, report month.
- **Interactive Elements & Actions**:
  - `(change)="onMonthChange($event)"`: Changes month and updates route URL.
  - `(click)="generateReport()"`: Requests AI backend to generate new monthly analytical synthesis.
  - `(click)="loadReport()"`: Refreshes cached report.
- **State & Signals**:
  - `studentId = signal<number>(0)`
  - `selectedMonth = signal<string>('2026-04')`
  - `report = signal<ParentReportDto | null>(null)`
  - `isLoading = signal<boolean>(false)`
  - `isGenerating = signal<boolean>(false)`
  - `error = signal<string | null>(null)`
  - Injected: `ActivatedRoute`, `Router`, `AiAnalyticsService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Hardcoded month range in template (`2026-01` to `2026-12`); should be generated dynamically relative to current date and academic year.
  - Printable / Export PDF button is highly requested for parents to save reports locally.

---

## 5. Child Performance & Early Warning Alerts (`ChildAlertsComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/alerts/:studentId`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'تنبيهات الطالب'`
- **File Paths**:
  - TypeScript: [child-alerts.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/child-alerts/child-alerts.component.ts)
  - Template: Inline template inside `child-alerts.component.ts`
- **UI Sections & Visual States**:
  - **Child Context Bar**: `<app-child-context-bar [studentId]="studentId()" />`.
  - **Header Bar**: Rose warning icon, title `"تنبيهات الأداء"`, subtitle on early intervention.
  - **Loading Skeleton**: Pulsing alert cards.
  - **Zero Alerts Celebration Card**: Large emerald sparkle icon with `"أداء ممتاز، لا توجد تنبيهات!"`.
  - **Alerts Grid**:
    - Each alert card features a severity color strip at the top:
      - `High`: Red strip (`bg-red-500`), border `border-red-200`, badge `"هام جداً"`.
      - `Medium`: Orange strip (`bg-orange-500`), border `border-orange-200`, badge `"متوسط"`.
      - `Low`: Amber strip (`bg-amber-500`), border `border-amber-200`, badge `"عادي"`.
    - Alert Type Icon & Title:
      - `LowAttendance`: Clock icon, title `"غياب متكرر"`.
      - `LowExamScore`: Pencil icon, title `"درجة منخفضة في اختبار"`.
      - Default: Chart icon, title `"انخفاض في الأداء"`.
    - Alert narrative message (`alert.message`).
- **Interactive Elements & Actions**:
  - `(click)="loadAlerts()"`: Reloads student alerts from `AiAnalyticsService.getParentStudentAlerts(studentId)`.
- **State & Signals**:
  - `studentId = signal<number>(0)`
  - `alerts = signal<PerformanceAlertDto[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `error = signal<string | null>(null)`
  - Injected: `ActivatedRoute`, `AiAnalyticsService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Alerts are currently read-only; parent needs an action button like "تواصل مع المعلم" (contact teacher via chat) directly from the alert card.

---

## 6. Child Attendance History (`ParentAttendanceComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/attendance/:studentId`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'سجل حضور الطالب'`
- **File Paths**:
  - TypeScript: [parent-attendance.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/attendance/parent-attendance.component.ts)
  - Template: Inline template inside `parent-attendance.component.ts`
- **UI Sections & Visual States**:
  - **Child Context Bar**: `<app-child-context-bar [studentId]="studentId()" />`.
  - **Header Bar**: Title `"سجل الحضور والغياب"`, Academic Year selector dropdown (`2026`, `2025`).
  - **Overall Attendance Summary Hero Banner**:
    - Teal-emerald gradient container with circular percentage indicator badge (`getOverallAttendanceRate()%`).
    - Total recorded sessions count (`getTotalSessions()`).
  - **Subjects Attendance Grid**:
    - Subject card with circular SVG progress meter visualizing attendance percentage.
    - Attended sessions, absent sessions, and late sessions count.
- **Interactive Elements & Actions**:
  - `(change)="onYearChange($event)"`: Switches academic year and reloads.
  - `(click)="loadAttendance()"`: Queries `ParentService.getChildAttendance(...)`.
- **State & Signals**:
  - `studentId = signal<number>(0)`
  - `selectedYear = signal<number>(2026)`
  - `attendanceData = signal<any[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `error = signal<string | null>(null)`
  - Injected: `ActivatedRoute`, `ParentService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Academic year dropdown options are hardcoded; should be fetched dynamically from academic year configuration.

---

## 7. Child Weekly Timetable (`ParentScheduleComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/schedule/:studentId`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'جدول الطالب'`
- **File Paths**:
  - TypeScript: [parent-schedule.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/parent-schedule/parent-schedule.ts)
  - Template: [parent-schedule.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/parent-schedule/parent-schedule.html)
- **UI Sections & Visual States**:
  - **Child Context Bar**: `<app-child-context-bar [studentId]="studentId()" />`.
  - **Header & Week Navigation**: Title `"جدول الحصص الأسبوعي"`, previous week button (`prevWeek()`), current week range display, next week button (`nextWeek()`).
  - **Timetable View**:
    - Day-by-day column schedule showing sessions, subjects, start/end times, and teacher names.
    - Visual indicators for completed vs upcoming classes.
  - **Empty Week View**: Clean placeholder if no sessions are scheduled for the selected week.
- **Interactive Elements & Actions**:
  - `(click)="nextWeek()"`, `(click)="prevWeek()"`: Shifts current week by 7 days.
  - `loadSchedule()`: Queries `parentService.getChildSchedule(studentId, dateStr)`.
- **State & Signals**:
  - `studentId = signal<number>(0)`
  - `schedule = signal<any>(null)`
  - `isLoading = signal<boolean>(true)`
  - `currentWeekStart = signal<Date>(...)`
  - Injected: `ParentService`, `ActivatedRoute`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Can leverage the shared `<app-weekly-calendar>` component for full visual consistency with the student's schedule page.

---

## 8. Link Student via Invitation Code (`LinkStudentComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/link`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'ربط طالب'`
- **File Paths**:
  - TypeScript: [link-student.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/link-student/link-student.component.ts)
  - Template: Inline template inside `link-student.component.ts`
- **UI Sections & Visual States**:
  - **Centered Modal / Card Layout**: Clean centered container with subtle gradient header.
  - **State 1: Validating (`status() === 'validating'`)**:
    - Large animated spinner icon with title `"جاري ربط حساب الطالب..."`.
  - **State 2: Success (`status() === 'success'`)**:
    - Large emerald checkmark with title `"تم الربط بنجاح!"`, auto-progress bar animation (2-second timeout), and automatic redirection to parent dashboard.
  - **State 3: Error (`status() === 'error'`)**:
    - Red cross icon, detailed error description box (`errorMessage()`), and `"العودة للوحة التحكم"` button.
  - **State 4: Invalid Link (`status() === 'invalid_link'`)**:
    - Orange link icon, explanation that no `?code=` query parameter was provided, with return CTA.
- **Interactive Elements & Actions**:
  - Reads `code` from URL query parameter `?code=XYZ`.
  - Calls `parentService.linkStudent(code)`.
  - Automatically redirects to `/dashboard/parent` upon successful linkage.
- **State & Signals**:
  - `status = signal<'validating' | 'success' | 'error' | 'invalid_link'>('validating')`
  - `errorMessage = signal<string>('')`
  - Injected: `ActivatedRoute`, `Router`, `ParentService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - If parent navigates directly to `/dashboard/parent/link` without query parameters, it shows "invalid link". It should provide a manual text input field where the parent can paste the invitation code directly.

---

## 9. Child Subscriptions & Plan Management (`ParentSubscriptionsComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/subscriptions`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الخطط والاشتراكات'`
- **File Paths**:
  - TypeScript: [parent-subscriptions.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/subscriptions/parent-subscriptions.component.ts)
  - Template: [parent-subscriptions.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/subscriptions/parent-subscriptions.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"إدارة اشتراكات الأبناء"`, subtitle explaining access tiers.
  - **Child Selector Dropdown**: `<select (change)="onStudentChange($event)">` listing all linked children.
  - **Active Subscription Status Card**:
    - Current plan name, billing interval (monthly/annual), renewal date, price.
    - Status badge: Active, Trialing, Past Due, Canceled.
    - `"تغيير الخطة"` (Change Plan) toggle button.
  - **Available Plans Catalog (`<app-plans>`):
    - Displayed when student has no subscription OR when parent toggles `isChangingPlan()`.
    - Tiered pricing cards (Basic, Standard, Premium) with feature checkmarks.
    - Select button with processing spinner (`processingPlanId()`).
  - **Alerts**: Success notification banner (`successMsg()`) and error alert (`errorMsg()`).
- **Interactive Elements & Actions**:
  - `(change)="onStudentChange($event)"`: Switches active child context.
  - `(planSelected)="onPlanSelected(plan)"`: Initiates Stripe Checkout session via `subscribeForChild(...)` or immediate plan upgrade via `changeChildSubscription(...)`.
  - `(click)="startChangePlan()"` / `(click)="cancelChangePlan()"`.
- **State & Signals**:
  - `activeSubscription = signal<any>(null)`
  - `loadingSubscription = signal(false)`
  - `isChangingPlan = signal(false)`
  - `processingPlanId = signal<number | null>(null)`
  - `errorMsg = signal<string | null>(null)`
  - `successMsg = signal<string | null>(null)`
  - `effect()` reacts to `parentService.selectedStudentId()` changes.
  - Injected: `ParentService`, `ChangeDetectorRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Needs clear pro-rata billing explanation before confirming plan upgrades.
  - Integration with Stripe customer portal link for viewing historical invoices.

---

## 10. Parent Account Profile (`ParentProfileComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/profile`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الملف الشخصي'`
- **File Paths**:
  - TypeScript: [parent-profile.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/pages/profile/parent-profile.component.ts)
  - Template: Inline template inside `parent-profile.component.ts`
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"إعدادات الحساب"`, subtitle.
  - **Personal Info Card**:
    - Avatar initial block with gradient (`from-blue-500 to-indigo-600`), full name, `"ولي أمر"` role badge.
    - Field grid: Full name, Email, Phone number, Country.
  - **Linked Children Overview Card**:
    - Quick list of children avatars, names, and active/inactive subscription status dots.
    - `"إدارة الأبناء"` link to `/dashboard/parent/children`.
  - **Security Settings Card**:
    - Link to change password (`/change-password`).
- **Interactive Elements & Actions**:
  - Navigation links to password change and children management.
- **State & Properties**:
  - Reads `user` directly from `AuthStateService.user()`.
  - Reads `linkedStudents` from `ParentService.linkedStudents()`.
  - `userInitials` getter.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Profile edit form is currently static/read-only; parent needs ability to update phone number and emergency contacts directly.

---

## 11. Child Comprehensive Profile View (`ProfilePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/parent/child-profile/:id`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'ملف الطالب'`
- **File Paths**:
  - TypeScript: [profile-page.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/profile/pages/profile-page.component.ts)
  - Template: [profile-page.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/profile/pages/profile-page.component.html)
- **UI Sections & Visual States**:
  - Shows student's full profile view, enrollment status, linked parent records, and academic history.

---

## Perspective 6 Summary & Visual Redesign Matrix

| # | Route Path | Component Name | Key Visual State Highlights | Prime Stitch Redesign Opportunity |
|---|---|---|---|---|
| 1 | `/dashboard/parent` | `ParentDashboardComponent` | 3 KPI cards, Child selector, 3 feature cards or locked state | Teaser plan comparison on locked state; smooth icon hover |
| 2 | `/dashboard/parent/children` | `ChildrenListComponent` | Child cards with status badges and 4-action toolbars | More spacious action toolbar; card elevation on hover |
| 3 | `/dashboard/parent/onboarding/add-student` | `Signup (Student Mode)` | Pre-scoped registration form auto-linked to parent | Progress stepper for adding student + choosing plan |
| 4 | `/dashboard/parent/reports/:studentId` | `SmartReportComponent` | Gradient AI narrative hero, weakness cards, progress rings | PDF export button; dynamic academic month selector |
| 5 | `/dashboard/parent/alerts/:studentId` | `ChildAlertsComponent` | Colored severity strip cards (High/Med/Low), empty celebration | "Contact Teacher" direct action button on each alert |
| 6 | `/dashboard/parent/attendance/:studentId` | `ParentAttendanceComponent` | Emerald hero attendance banner, circular SVG meters per subject | Dynamic year selector; monthly attendance heat map |
| 7 | `/dashboard/parent/schedule/:studentId` | `ParentScheduleComponent` | Weekly navigation, session cards with teacher and time info | Unify with `<app-weekly-calendar>` component |
| 8 | `/dashboard/parent/link` | `LinkStudentComponent` | 4 validation states (validating, success, error, invalid) | Add manual code input box for direct manual entry |
| 9 | `/dashboard/parent/subscriptions` | `ParentSubscriptionsComponent` | Active sub card, change plan toggle, embedded plans catalog | Invoice history list and Stripe customer portal link |
| 10 | `/dashboard/parent/profile` | `ParentProfileComponent` | Personal details grid, linked children pills, security link | Editable contact fields with inline validation |
| 11 | `/dashboard/parent/child-profile/:id` | `ProfilePageComponent` | Child profile view, enrolled courses, academic standing | Visual student badge card with class timetable shortcut |
