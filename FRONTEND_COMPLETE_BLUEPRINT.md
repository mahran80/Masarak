# Masarak Frontend: Complete UI & Functionality Inventory
**Ground Truth Blueprint for Google Stitch Visual Redesign**
*Audited & Code-Grounded from `MasarkFront/MasarkFront-main/src/app` (Phases 1–4)*

---

## 1. Shared Shell & Global Overlays

### 1.1 Root Overlay Host & Bootstrap
- **Route Path & Guards**: Root Angular bootstrap component (`app.ts` / `app.html`). Hosts top-level layout, notifications, and modal injection containers.
- **File Paths**:
  - TS: `src/app/app.ts`
  - Template: `src/app/app.html`
- **UI Sections & Visual States**:
  - Global Non-Modal Toast Host: `<app-toast-container />` fixed at top-left.
  - Global Blocking Loading Overlay: `<app-loading-overlay />` rendered via `loadingService.isLoading()` signal.
  - Global Confirmation Modal: `<app-confirm-dialog />` rendered via `confirmDialogService.state()` signal with backdrop blur.
  - Viewport Outlet: `<router-outlet />` hosting the activated route.
- **Interactive Elements & Actions**:
  - Listens to global router transitions and overlay service events.
- **State & Signals**:
  - Injected Services: `ToastService`, `LoadingService`, `ConfirmDialogService`.
- **Known UI/Layout Pain Points**:
  - Root host has minimal styling; all z-index stacking layers (toasts = 9999, confirm dialog = 9998, loading overlay = 9990) must be respected in Stitch components.

---

### 1.2 Dashboard Layout Shell (`DashboardLayoutComponent`)
- **Route Path & Guards**: Wraps all protected routes under `/dashboard`. Guarded by `authGuard`.
- **File Paths**:
  - TS: `src/app/layouts/dashboard-layout/dashboard-layout.ts`
  - Template: `src/app/layouts/dashboard-layout/dashboard-layout.html`
- **UI Sections & Visual States**:
  - **Top Navigation Bar**: Fixed header with platform branding (Masarak icon + name), dynamic breadcrumb `<app-breadcrumb />`, notification trigger `<app-notification-bell />`, and user profile dropdown pill.
  - **Desktop Collapsible Sidebar**: Responsive sidebar with `sidebarCollapsed()` toggle (expanded vs icon-only 80px rail), role badge ("مدير النظام", "معلم", "طالب", "ولي أمر"), and grouped navigation items dynamically computed per role (`computed(() => this.navGroups())`).
  - **Mobile Drawer**: Slide-over drawer with backdrop overlay (`isMobileMenuOpen()`), CDK focus trap (`cdkTrapFocus`), and ESC key handling.
  - **User Dropdown Menu**: Accessible dropdown with user avatar, name, email, role badge, navigation links to `/dashboard/profile` & `/dashboard/change-password`, and red Logout button.
  - **Main Content Host**: `<router-outlet />` with smooth fade-in routing transition and responsive margins (`mr-64` / `mr-20` on RTL desktop).
- **Interactive Elements & Actions**:
  - Mobile Menu Toggle: `(click)="toggleMobileMenu()"`
  - Sidebar Collapse Toggle: `(click)="toggleSidebar()"`
  - User Dropdown Toggle: `(click)="toggleUserDropdown()"` / `(click)="closeUserDropdown()"`
  - Logout Trigger: `(click)="logout()"` -> calls `authState.clearAuth()` and navigates to `/auth/login`.
  - Notification Trigger: `(click)="toggleNotifications()"` toggles `isNotificationsOpen()`.
- **State & Signals**:
  - Signals: `sidebarCollapsed = signal(false)`, `isMobileMenuOpen = signal(false)`, `isUserDropdownOpen = signal(false)`, `isNotificationsOpen = signal(false)`.
  - Computed: `navGroups = computed(...)` (resolves items based on `authState.userRole()`).
  - Injected Services: `AuthStateService`, `Router`, `Renderer2`.
- **Known UI/Layout Pain Points**:
  - Hardcoded width classes (`w-64`, `w-20`) in RTL mode need smooth CSS transition curves during collapse.
  - Ensure high z-index on mobile drawer backdrop to prevent bleed-through from embedded charts or Agora video players.

---

### 1.3 Breadcrumb Component (`BreadcrumbComponent`)
- **Route Path & Guards**: Reusable component embedded in headers and individual routed pages.
- **File Paths**:
  - TS: `src/app/shared/components/breadcrumb/breadcrumb.component.ts`
  - Template: `src/app/shared/components/breadcrumb/breadcrumb.component.html`
- **UI Sections & Visual States**:
  - Static mode (via `@Input() items` array) vs Automatic Route-derived mode (parses Angular `ActivatedRoute.snapshot.data['breadcrumb']`).
  - Renders horizontal breadcrumb trail separated by RTL chevrons (`chevron-left`), with active crumb styled as bold/dark and parent crumbs styled as subtle interactive links.
- **Interactive Elements & Actions**:
  - Parent crumbs: `[routerLink]="item.route"` / `item.url`.
- **State & Signals**:
  - `breadcrumbs = signal<BreadcrumbItem[]>([])`.
  - Injected Services: `Router`, `ActivatedRoute`.
- **Known UI/Layout Pain Points**:
  - When deeply nested (e.g. `/dashboard/teacher/assessment/grading/exam/:id`), breadcrumbs can truncate or wrap on mobile screens without horizontal scroll.

---

### 1.4 Notification Bell & Slide-Over Panel (`NotificationBellComponent` & `NotificationPanelComponent`)
- **Route Path & Guards**: Embedded inside `DashboardLayoutComponent` navbar.
- **File Paths**:
  - Bell TS: `src/app/shared/components/notification-bell/notification-bell.component.ts` & `.html`
  - Panel TS: `src/app/shared/components/notification-panel/notification-panel.component.ts` & `.html`
- **UI Sections & Visual States**:
  - **Bell Icon**: Displays animated badge counter with unread count `unreadCount()` (pulsing emerald/sky pill, capped at 99+).
  - **Slide-over Panel**: Right-side drawer (`dir="rtl"`) with backdrop blur.
  - **Filter Tabs**: Toggle between "الكل" (All) and "غير المقروءة" (Unread).
  - **States**:
    - Loading skeleton pulses while notifications are being fetched.
    - Empty state: Illustration with text "لا توجد إشعارات جديدة".
    - List state: Categorized cards with category icons (Exam, Attendance, Alert, System, Message) and time-ago timestamps.
- **Interactive Elements & Actions**:
  - Bell Button: `(click)="toggle()"` -> emits to parent.
  - Close Drawer: `(click)="close()"`
  - Mark All As Read: `(click)="markAllAsRead()"` -> calls `notificationService.markAllAsRead()`.
  - Click Single Notification: `(click)="onNotificationClick(item)"` -> marks as read, executes deep link navigation if `targetUrl` is present.
  - Delete Notification: `(click)="deleteNotification(item, $event)"` -> removes from state.
- **State & Signals**:
  - `unreadCount = signal(0)`, `notifications = signal<NotificationItem[]>([])`, `filter = signal<'all' | 'unread'>('all')`.
  - Injected Services: `NotificationService`, `Router`.
- **Known UI/Layout Pain Points**:
  - Dense card layout; needs clear visual contrast between read (`bg-white`) and unread (`bg-blue-50/50`) states.

---

### 1.5 Confirmation Dialog Overlay (`ConfirmDialogComponent`)
- **Route Path & Guards**: Rendered globally in `app.html` via `ConfirmDialogService`.
- **File Paths**:
  - TS: `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
  - Template: `src/app/shared/components/confirm-dialog/confirm-dialog.component.html`
- **UI Sections & Visual States**:
  - Centered modal dialog with backdrop blur (`z-[9998]`).
  - Dynamic severity themes:
    - `danger` (Red icon & red confirmation button, e.g. deleting questions or submitting exams).
    - `warning` (Amber icon & amber button).
    - `info` (Sky/blue icon & blue button).
- **Interactive Elements & Actions**:
  - Confirm Button: `(click)="onConfirm()"` -> resolves promise to `true`.
  - Cancel Button / Backdrop click: `(click)="onCancel()"` -> resolves promise to `false`.
- **State & Signals**:
  - `state = confirmDialogService.state` signal (`{ isOpen, title, message, confirmText, cancelText, type }`).
- **Known UI/Layout Pain Points**:
  - Focus trapping and ESC key dismissal must be preserved during visual styling.

---

### 1.6 Child Context Bar (`ChildContextBarComponent`)
- **Route Path & Guards**: Embedded at the top of all parent student-specific views (`/dashboard/parent/reports/:studentId`, `/alerts/:studentId`, `/attendance/:studentId`, `/schedule/:studentId`).
- **File Paths**:
  - TS: `src/app/features/parent/components/child-context-bar/child-context-bar.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Compact sticky top bar displaying current student avatar, name, grade/class tag, and active subscription status indicator.
  - Inline child switcher dropdown to jump between siblings without leaving the current view.
  - Sub-navigation links: "التقارير الذكية" (Reports), "الجدول" (Schedule), "التنبيهات" (Alerts), "الحضور" (Attendance).
- **Interactive Elements & Actions**:
  - Child select dropdown: `(change)="onChildSelect($event)"` -> navigates to same sub-route with new `:studentId`.
  - Nav tabs: RouterLinks with `routerLinkActive="bg-white text-blue-700 shadow-sm"`.
- **State & Signals**:
  - `@Input() studentId!: number`.
  - `parentService.linkedStudents()`, `parentService.selectedStudent()`.
- **Known UI/Layout Pain Points**:
  - Needs sticky positioning (`sticky top-0 z-20`) so the parent always knows which child's data is currently on screen.

---

### 1.7 Toast Container (`ToastContainerComponent`)
- **Route Path & Guards**: Mounted globally in `app.html`.
- **File Paths**:
  - TS: `src/app/shared/components/toast-container/toast-container.component.ts`
  - Template: `src/app/shared/components/toast-container/toast-container.component.html`
- **UI Sections & Visual States**:
  - Fixed container at `top-4 left-4 z-[9999]`.
  - Four toast styles: `success` (green), `error` (red), `warning` (amber), `info` (blue).
  - Individual toast animations: slide-in, progress bar timeout countdown, dismiss cross button.
- **Interactive Elements & Actions**:
  - Dismiss: `(click)="toastService.remove(toast.id)"`.
- **State & Signals**:
  - `toasts = toastService.toasts` signal.

---

## 2. Public & Auth Perspective

### 2.1 Landing Page (`LandingPageComponent`)
- **Route Path & Guards**: `/`, public, unguarded.
- **File Paths**:
  - TS: `src/app/features/landing/landing.ts`
  - Template: `src/app/features/landing/landing.html`
- **UI Sections & Visual States**:
  - **Public Header**: Logo, navigation anchor links (المميزات, كيف يعمل, الباقات, تواصل معنا), and Auth buttons ("تسجيل الدخول", "إنشاء حساب").
  - **Hero Section**: Value proposition headline ("منظومة تعليمية متكاملة مدعومة بالذكاء الاصطناعي"), call-to-action button ("ابدأ تجربتك المجانية"), and dashboard preview mockup.
  - **Feature Showcase Grid**: 4 key value pillars (الذكاء الاصطناعي التكيفي, الفصول الافتراضية المباشرة, بنك الأسئلة والتقييم الآلي, تقارير أولياء الأمور).
  - **Persona Cards**: 3 interactive tabs/cards highlighting benefits for Student, Teacher, and Parent.
  - **Pricing Tier Summary**: Previews Basic, Standard, and Premium subscription plans with monthly/annual toggle.
  - **Footer**: Platform links, social icons, copyright, and accreditation badges.
- **Interactive Elements & Actions**:
  - "ابدأ الآن" / "إنشاء حساب": Navigates to `/auth/register`.
  - "تسجيل الدخول": Navigates to `/auth/login`.
  - Pricing Plan selection: Navigates to `/auth/register?plan=:id` or `/dashboard/plans`.
- **State & Signals**:
  - `billingCycle = signal<'monthly' | 'yearly'>('monthly')`.
  - `activeFeatureTab = signal<'student' | 'teacher' | 'parent'>('student')`.
- **Known UI/Layout Pain Points**:
  - High-resolution hero graphics and SVG vectors must remain responsive across ultra-wide monitors and small mobile viewports.

---

### 2.2 Login Page (`Login`)
- **Route Path & Guards**: `/auth/login`, unguarded. Redirects authenticated users to role dashboard.
- **File Paths**:
  - TS: `src/app/features/auth/login/login.ts`
  - Template: `src/app/features/auth/login/login.html`
- **UI Sections & Visual States**:
  - Split screen layout: Left decorative brand graphic/features showcase, right card with login form.
  - Error alert banner: Displays backend validation errors or "بيانات الدخول غير صحيحة".
  - Password visibility toggle icon inside input.
  - "تذكرني" (Remember Me) checkbox and "نسيت كلمة المرور؟" link.
- **Interactive Elements & Actions**:
  - Submit: `(ngSubmit)="onSubmit()"` -> calls `authApi.login(form.value)`. On success, writes JWT tokens to `localStorage` and triggers `router.navigate([redirectUrl])`.
  - Toggle Password: `(click)="showPassword.set(!showPassword())"`.
  - Links: "نسيت كلمة المرور؟" -> `/auth/forgot-password`; "إنشاء حساب جديد" -> `/auth/register`.
- **State & Signals**:
  - `loginForm: FormGroup` (controls: `email`, `password`, `rememberMe`).
  - `isLoading = signal(false)`, `errorMessage = signal<string | null>(null)`, `showPassword = signal(false)`.
- **Known UI/Layout Pain Points**:
  - Ensure input autofill colors match the custom dark/light theme background.

---

### 2.3 Registration / Signup Page (`Signup`)
- **Route Path & Guards**:
  - Public Route: `/auth/register` (Default mode: `Parent`).
  - Parent Onboarding Route: `/dashboard/parent/onboarding/add-student` (Guarded by `authGuard`, `roleGuard(['Parent'])`, route data `{ mode: 'Student' }`).
- **File Paths**:
  - TS: `src/app/features/auth/signup/signup.ts`
  - Template: `src/app/features/auth/signup/Signup.html`
- **UI Sections & Visual States**:
  - **Dual Mode Switching**:
    - In `Parent` mode: Prompts for parent full name, email, phone, country, and password. Displays link to `/auth/login`.
    - In `Student` mode: Prompts for child full name, email, grade selection (`academicGradeId`), username, password, and parent linkage code. Displays "إلغاء والعودة للأبناء" link.
  - Grades Dropdown: Populated via `academicApi.getGrades()`.
  - Live Validation: Shows red helper text under invalid form controls on touched/dirty.
- **Interactive Elements & Actions**:
  - Submit: `(ngSubmit)="register()"`:
    - If `mode === 'Parent'`: calls `authApi.registerParent(...)`, redirects to `/auth/login`.
    - If `mode === 'Student'`: calls `authApi.registerStudent(...)`, links child to parent account, redirects to `/dashboard/parent/children`.
- **State & Signals**:
  - `registerForm: FormGroup` (controls: `fullName`, `email`, `password`, `confirmPassword`, `phone`, `country`, `academicGradeId`).
  - `isStudentMode = signal(false)`, `grades = signal<GradeDto[]>([])`, `isLoading = signal(false)`, `errorMessage = signal<string | null>(null)`.
- **Known UI/Layout Pain Points**:
  - File is named `Signup.html` (capital S). Form field spacing in 2-column grid must adapt cleanly to single column on mobile.

---

### 2.4 Forgot Password Page (`ForgotPasswordComponent`)
- **Route Path & Guards**: `/auth/forgot-password`, unguarded.
- **File Paths**:
  - TS: `src/app/features/auth/forgot-password-component/forgot-password-component.ts`
  - Template: `src/app/features/auth/forgot-password-component/forgot-password-component.html`
- **UI Sections & Visual States**:
  - Step 1 (Request Form): Prompts for registered email address.
  - Step 2 (Success Confirmation): Displays checkmark animation and message "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني".
- **Interactive Elements & Actions**:
  - Submit: `(ngSubmit)="onSubmit()"` -> calls `authApi.forgotPassword(email)`.
  - Back Link: Navigates to `/auth/login`.
- **State & Signals**:
  - `forgotForm: FormGroup` (`email`), `isSubmitted = signal(false)`, `isLoading = signal(false)`.

---

### 2.5 Reset Password Page (`ResetPasswordComponent`)
- **Route Path & Guards**: `/auth/reset-password`, query params: `?email=...&token=...`.
- **File Paths**:
  - TS: `src/app/features/auth/reset-password-component/reset-password-component.ts`
  - Template: `src/app/features/auth/reset-password-component/reset-password-component.html`
- **UI Sections & Visual States**:
  - Form prompts for `newPassword` and `confirmPassword` with strength indicator rules.
  - Invalid token state: Displays alert with "الرابط منتهي الصلاحية" and button to request a new link.
- **Interactive Elements & Actions**:
  - Submit: `(ngSubmit)="onSubmit()"` -> calls `authApi.resetPassword({ email, token, newPassword })`.
- **State & Signals**:
  - `resetForm: FormGroup`, `token = signal('')`, `email = signal('')`, `isSuccess = signal(false)`.

---

### 2.6 Change Password Page (`ChangePasswordComponent`)
- **Route Path & Guards**: `/dashboard/change-password`, guarded by `authGuard`. Accessible across all logged-in roles.
- **File Paths**:
  - TS: `src/app/features/auth/change-password-component/change-password-component.ts`
  - Template: `src/app/features/auth/change-password-component/change-password-component.html`
- **UI Sections & Visual States**:
  - In-dashboard settings card with current password, new password, and confirm new password fields.
  - Success banner with auto-dismiss or redirect.
- **Interactive Elements & Actions**:
  - Submit: `(ngSubmit)="onSubmit()"` -> calls `authApi.changePassword(...)`.
- **State & Signals**:
  - `changeForm: FormGroup` (`currentPassword`, `newPassword`, `confirmPassword`).

---

## 3. Admin Perspective

### 3.1 Admin Overview Dashboard (`AdminComponent`)
- **Route Path & Guards**: `/dashboard/admin`, guarded by `authGuard`, `roleGuard(['Admin'])`. `data: { breadcrumb: 'لوحة الإدارة' }`.
- **File Paths**:
  - TS: `src/app/features/admin/adminComponent/admin.ts`
  - Template: `src/app/features/admin/adminComponent/admin.html`
- **UI Sections & Visual States**:
  - **Metrics KPI Grid**: 4 stat cards (إجمالي الطلاب, المعلمين, الاشتراكات الفعالة, الإيرادات الشهرية).
  - **Quick Action Links**: Quick cards to "إدارة المستخدمين", "الهيكل الأكاديمي", "الخطط والأسعار", "الرقابة والمحتوى".
  - **Recent Registrations Table**: Mini table displaying latest user signups with status pills.
  - **System Health & LLM Status Widget**: Status pills for AI microservices, Database, and Storage.
- **Interactive Elements & Actions**:
  - Refresh Data: `(click)="loadOverviewMetrics()"`.
  - Navigation cards: Link directly to `/dashboard/admin/users`, `/dashboard/admin/academic`, etc.
- **State & Signals**:
  - `metrics = signal<AdminOverviewMetrics | null>(null)`, `isLoading = signal(true)`.
  - Injected Services: `AdminService`, `ToastService`.
- **Known UI/Layout Pain Points**:
  - KPI cards use inline gradient classes that should be standardized into design tokens.

---

### 3.2 User Management (`UserManagement`)
- **Route Path & Guards**: `/dashboard/admin/users`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/user-management/user-management.ts`
  - Template: `src/app/features/admin/components/user-management/user-management.html`
- **UI Sections & Visual States**:
  - **Filter Bar**: Search input (by name or email), Role filter dropdown (All, Student, Teacher, Parent, Admin), Status filter (Active, Suspended).
  - **Users Data Table**: Columns: User (avatar, name, email), Role badge, Date joined, Status toggle, Actions menu.
  - **Pagination Controls**: Previous/Next page buttons, page size selector (10, 25, 50).
  - **Edit/Create User Modal**: Slide-over drawer with user role assignment and activation toggle.
- **Interactive Elements & Actions**:
  - Search/Filter: `(input)="onSearchChange($event)"`, `(change)="onRoleFilterChange($event)"`.
  - Toggle User Status: `(click)="toggleUserActive(user)"` -> triggers confirmation dialog.
  - Reset Password: `(click)="sendPasswordReset(user)"`.
- **State & Signals**:
  - `users = signal<UserDto[]>([])`, `totalCount = signal(0)`, `currentPage = signal(1)`.
  - Injected Services: `AdminUserService`, `ConfirmDialogService`.
- **Known UI/Layout Pain Points**:
  - Very wide table; columns need fixed widths with sticky actions column on the left (RTL) for horizontal scrolling.

---

### 3.3 Teachers Directory (`TeachersDirectoryComponent`)
- **Route Path & Guards**: `/dashboard/admin/teachers`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/academic/pages/admin/teachers-list/teachers-list.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Grid of Teacher profile cards with avatar, specialization, assigned subjects/classes count, and contact email.
  - "تعيين معلم جديد" (Assign Teacher) button opening assignment modal.
- **Interactive Elements & Actions**:
  - Assign to Class/Subject: `(click)="openAssignModal(teacher)"`.
  - View Performance: `(click)="viewTeacherAnalytics(teacher.id)"`.
- **State & Signals**:
  - `teachers = signal<TeacherDto[]>([])`, `isLoading = signal(true)`.

---

### 3.4 Academic Management (`AcademicManagementComponent`)
- **Route Path & Guards**: `/dashboard/admin/academic`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/academic-management/academic-management.ts`
  - Template: `src/app/features/admin/components/academic-management/academic-management.html`
- **UI Sections & Visual States**:
  - **Multi-Tab Navigation**:
    - Tab 1: "المراحل الدراسية" (Grades).
    - Tab 2: "المواد الدراسية" (Subjects).
    - Tab 3: "الفصول" (Classes).
    - Tab 4: "التخصصات" (Specializations).
  - **CRUD Modals**: Add/Edit Grade modal, Add/Edit Subject modal with specialization linkage, Add/Edit Class modal.
- **Interactive Elements & Actions**:
  - Tab Switcher: `(click)="activeTab.set('grades' | 'subjects' | 'classes' | 'specializations')"`.
  - Create/Edit Triggers: `openCreateModal()`, `openEditModal(item)`.
  - Delete Trigger: `deleteItem(item)` with `ConfirmDialogService`.
- **State & Signals**:
  - `activeTab = signal('grades')`, `grades = signal([])`, `subjects = signal([])`, `classes = signal([])`.
  - Injected Services: `AcademicApiService`.
- **Known UI/Layout Pain Points**:
  - Deep nested relations (Grade -> Subject -> Class) can cause confusing modals if not structured in a clean wizard.

---

### 3.5 Class Performance Analytics (`AdminPerformanceComponent`)
- **Route Path & Guards**: `/dashboard/admin/performance`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/admin-performance/admin-performance.ts`
  - Template: `src/app/features/admin/components/admin-performance/admin-performance.html`
- **UI Sections & Visual States**:
  - Dropdowns for Grade and Class selection.
  - Overall class grade distribution chart, pass/fail ratios, and subject average bars.
  - At-risk students summary list with warning badges.
- **Interactive Elements & Actions**:
  - Filter Select: `(change)="onClassChange($event)"`.
  - Export CSV: `(click)="exportReport()"`.
- **State & Signals**:
  - `selectedClassId = signal<number | null>(null)`, `performanceData = signal(null)`.

---

### 3.6 Content Moderation (`AdminContentComponent`)
- **Route Path & Guards**: `/dashboard/admin/content-moderation`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/content-moderation/content.component.ts`
  - Template: `src/app/features/admin/components/content-moderation/content.component.html`
- **UI Sections & Visual States**:
  - Moderation queue for uploaded PDFs, teacher lesson plans, and chat flagged messages.
  - Preview drawer for inspecting uploaded documents or flagged text.
  - Status badges: "قيد المراجعة", "معتمد", "مرفوض".
- **Interactive Elements & Actions**:
  - Approve Content: `(click)="approve(item.id)"`.
  - Reject Content: `(click)="reject(item.id, reason)"`.
- **State & Signals**:
  - `flaggedItems = signal<ModerationItem[]>([])`, `isLoading = signal(true)`.

---

### 3.7 Subscriptions & Payments (`AdminSubscriptionsComponent`)
- **Route Path & Guards**: `/dashboard/admin/subscriptions`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/subscriptions/subscriptions.component.ts`
  - Template: `src/app/features/admin/components/subscriptions/subscriptions.component.html`
- **UI Sections & Visual States**:
  - Filterable transaction history: Student name, Parent name, Plan, Amount, Stripe Transaction ID, Date, Status (Paid, Refunded, Failed).
  - Manual Subscription Activation modal (allows admin to manually grant access without Stripe checkout).
- **Interactive Elements & Actions**:
  - Manual Activate: `openManualSubModal()` -> submits student ID + plan ID.
  - Refund Action: `(click)="refund(sub.id)"`.
- **State & Signals**:
  - `transactions = signal<TransactionDto[]>([])`, `searchFilter = signal('')`.

---

### 3.8 Subscription Plans Manager (`AdminPlansComponent`)
- **Route Path & Guards**: `/dashboard/admin/plans`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/admin-plans/admin-plans.ts`
  - Template: `src/app/features/admin/components/admin-plans/admin-plans.html`
- **UI Sections & Visual States**:
  - List of active Stripe product plans (Monthly, Subject-based, Full Year).
  - Create / Edit Plan modal: inputs for Plan Name (Arabic/English), Price, Currency, Duration Days, Feature flags (`hasLiveClass`, `maxSubjects`).
- **Interactive Elements & Actions**:
  - Add Plan: `openCreatePlanModal()`.
  - Edit Plan: `openEditPlanModal(plan)`.
  - Toggle Plan Active: `togglePlanStatus(plan)`.
- **State & Signals**:
  - `plans = signal<PlanDto[]>([])`, `planForm: FormGroup`.

---

### 3.9 School Schedule Manager (`AdminScheduleComponent`)
- **Route Path & Guards**: `/dashboard/admin/schedule`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/components/admin-schedule/admin-schedule.component.ts`
  - Template: `src/app/features/admin/components/admin-schedule/admin-schedule.component.html`
- **UI Sections & Visual States**:
  - Weekly master schedule grid by grade and class.
  - Session slot modal: selects Subject, Teacher, Day of week, Start Time, and Duration.
- **Interactive Elements & Actions**:
  - Add Session Slot: `openSlotModal(day, time)`.
  - Remove Slot: `deleteSlot(slotId)`.
- **State & Signals**:
  - `classes = signal([])`, `scheduleSlots = signal([])`.

---

### 3.10 Platform AI Analytics (`PlatformAnalyticsComponent`)
- **Route Path & Guards**: `/dashboard/admin/platform-analytics`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/pages/platform-analytics/platform-analytics.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Platform-wide AI utilization KPIs: Total LLM tokens consumed, average prompt latency, AI suggestions generated, weak topics flagged.
  - Token consumption chart broken down by feature (Question Generator, Parent Report, Student Insights).
- **Interactive Elements & Actions**:
  - Date Range Toggle: 7 Days / 30 Days / All Time.
- **State & Signals**:
  - `analyticsData = signal(null)`, `isLoading = signal(true)`.

---

### 3.11 Grade Heatmap (`GradeHeatmapComponent`)
- **Route Path & Guards**: `/dashboard/admin/heatmap/:gradeId`, route param: `:gradeId`.
- **File Paths**:
  - TS: `src/app/features/admin/pages/grade-heatmap/grade-heatmap.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - 2D Matrix Heatmap: Rows = Classes in grade, Columns = Subjects.
  - Color-coded cells: Red (<50%), Amber (50-70%), Green (>70%) indicating average mastery.
  - Tooltip on cell hover showing top weak topics in that class-subject intersection.
- **Interactive Elements & Actions**:
  - Cell click: Navigates to `/dashboard/teacher/analytics/:classId/:subjectId`.
- **State & Signals**:
  - `gradeId = signal(0)`, `heatmapMatrix = signal([])`.

---

### 3.12 Prompt Editor (`PromptEditorComponent`)
- **Route Path & Guards**: `/dashboard/admin/prompt-editor`, guarded by `roleGuard(['Admin'])`.
- **File Paths**:
  - TS: `src/app/features/admin/pages/prompt-editor/prompt-editor.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - System Prompt template editor for AI services: Parent Monthly Report Prompt, Question Generator Prompt, Teaching Suggestion Prompt.
  - Variable tokens helper sidebar (e.g. `{{student_name}}`, `{{weak_topics}}`, `{{attendance_rate}}`).
  - Test sandbox runner: Preview output against a test student ID.
- **Interactive Elements & Actions**:
  - Save Prompt: `savePromptTemplate()`.
  - Test Run: `runTestPrompt()`.
- **State & Signals**:
  - `promptKey = signal('ParentMonthlyReport')`, `templateText = signal('')`, `testOutput = signal('')`.

---

## 4. Teacher Perspective

### 4.1 Teacher Home Dashboard (`TeacherComponent`)
- **Route Path & Guards**: `/dashboard/teacher`, guarded by `authGuard`, `roleGuard(['Teacher'])`. `data: { breadcrumb: 'لوحة المعلم' }`.
- **File Paths**:
  - TS: `src/app/features/teacher/teacherComponent/teacher.ts`
  - Template: `src/app/features/teacher/teacherComponent/teacher.html`
- **UI Sections & Visual States**:
  - **Quick Stats Banner**: Total assigned classes, active students, pending exam submissions for grading, upcoming live sessions.
  - **Today's Live Sessions Card**: Card highlighting the next live class with countdown timer and prominent "بدء الجلسة" (Start Session) button.
  - **Action Tiles**: Direct jump to "بنك الأسئلة", "تصحيح الاختبارات", "إنشاء اختبار جديد", "إدارة الدروس".
- **Interactive Elements & Actions**:
  - Join/Start Live Session: Navigates to `/dashboard/teacher/sessions/:id/live`.
  - Go to Grading: Navigates to `/dashboard/teacher/assessment/grading`.
- **State & Signals**:
  - `teacherDashboardData = signal(null)`, `isLoading = signal(true)`.

---

### 4.2 Courses & Content Management (`TeacherCourses`)
- **Route Path & Guards**: `/dashboard/teacher/courses`, guarded by `roleGuard(['Teacher'])`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/teacher-courses/teacher-courses.ts`
  - Template: `src/app/features/teacher/components/teacher-courses/teacher-courses.html`
- **UI Sections & Visual States**:
  - Subject selector tabs.
  - Upload Content Card: Drag-and-drop file upload for PDF lesson materials or YouTube/Vimeo video embed links.
  - Published Content Table: Title, Content Type (PDF/Video), Upload date, Download link, Delete button.
- **Interactive Elements & Actions**:
  - File Drop / Select: `onFileChange($event)`.
  - Submit Upload: `uploadContent()` -> calls Azure Blob upload or external link save.
  - Delete Content: `deleteContent(id)`.
- **State & Signals**:
  - `courses = signal([])`, `isUploading = signal(false)`, `selectedSubjectId = signal(null)`.

---

### 4.3 Enrolled Students Directory (`TeacherStudents`)
- **Route Path & Guards**: `/dashboard/teacher/students`, guarded by `roleGuard(['Teacher'])`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/teacher-students/teacher-students.ts`
  - Template: `src/app/features/teacher/components/teacher-students/teacher-students.html`
- **UI Sections & Visual States**:
  - Class filter dropdown.
  - Students Table: Student avatar, name, attendance percentage, last exam score, and "عرض التفاصيل" (View AI Insights) action.
- **Interactive Elements & Actions**:
  - Filter Class: `(change)="onClassSelect($event)"`.
  - View AI Insight: Navigates to `/dashboard/teacher/students/:studentId/subjects/:subjectId/insight`.
- **State & Signals**:
  - `students = signal([])`, `selectedClassId = signal(null)`.

---

### 4.4 AI Performance Analysis (`PerformanceAnalysisComponent`)
- **Route Path & Guards**: `/dashboard/teacher/analytics/:classId/:subjectId`, route params: `:classId`, `:subjectId`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/performance-analysis/performance-analysis.component.ts`
  - Template: `src/app/features/teacher/components/performance-analysis/performance-analysis.component.html`
- **UI Sections & Visual States**:
  - Class average score card, completion percentage of scheduled syllabus.
  - Score distribution histogram (0-20, 20-40, 40-60, 60-80, 80-100%).
  - Top 5 performing students vs Bottom 5 at-risk students needing intervention.
- **Interactive Elements & Actions**:
  - Student Click: Jumps to student individual AI insight.
- **State & Signals**:
  - `data = signal<ClassAnalyticsDashboardDto | null>(null)`, `maxDistCount = signal(1)`.

---

### 4.5 Parent Report Summary (`ParentSummaryComponent`)
- **Route Path & Guards**: `/dashboard/teacher/parent-report/:studentId/:month`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/parent-summary/parent-summary.component.ts`
  - Template: `src/app/features/teacher/components/parent-summary/parent-summary.component.html`
- **UI Sections & Visual States**:
  - Preview of the monthly AI parent report from the teacher's perspective.
  - Allows teacher to add custom notes or endorse the AI-generated recommendations before parents view it.
- **Interactive Elements & Actions**:
  - Edit/Endorse: `saveTeacherNotes()`.
- **State & Signals**:
  - `report = signal(null)`, `teacherNotes = signal('')`.

---

### 4.6 Teacher Exams List (`TeacherExamsComponent`)
- **Route Path & Guards**: `/dashboard/teacher/exams`, guarded by `roleGuard(['Teacher'])`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/teacher-exams/teacher-exams.ts`
  - Template: `src/app/features/teacher/components/teacher-exams/teacher-exams.html`
- **UI Sections & Visual States**:
  - Table of created exams: Title, Subject, Duration, Scheduled Start/End, Submission Count, Status (Draft, Published, Closed).
  - "إنشاء اختبار جديد" button.
- **Interactive Elements & Actions**:
  - Create Exam: Navigates to `/dashboard/teacher/assessment/exams/create`.
  - View Submissions: Navigates to `/dashboard/teacher/assessment/grading`.
- **State & Signals**:
  - `exams = signal([])`, `isLoading = signal(true)`.

---

### 4.7 Assignment Creator (`AssignmentCreatorComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/assignments/create`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/assignment-creator/assignment-creator.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/assignment-creator/assignment-creator.component.html`
- **UI Sections & Visual States**:
  - Form: Assignment title, subject dropdown, associated lesson dropdown, due date & time, max score, instructions textarea, attachment file upload.
- **Interactive Elements & Actions**:
  - Submit: `createAssignment()` -> posts to `TeacherAssignmentService`.
- **State & Signals**:
  - `assignmentForm: FormGroup`, `lessons = signal([])`.

---

### 4.8 Assignment Submissions & Grading (`AssignmentSubmissionsComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/assignments/:id/submissions`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component.html`
- **UI Sections & Visual States**:
  - Table of student submissions: Student Name, Submission Date, File attachment link / text answer preview, Score input, Feedback textarea, Submit Grade button.
- **Interactive Elements & Actions**:
  - Grade Submission: `gradeSubmission(submissionId, score, feedback)`.
- **State & Signals**:
  - `submissions = signal([])`, `gradingForms = signal({})`.

---

### 4.9 Exam Creator (`ExamCreatorComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/exams/create`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/exam-creator/exam-creator.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/exam-creator/exam-creator.component.html`
- **UI Sections & Visual States**:
  - **Step 1: Exam Settings**: Title, description, subject, duration minutes, start/end dates, total marks.
  - **Step 2: Question Assembly**: Add question from Question Bank modal OR write new question directly (Multiple Choice, True/False, Essay/Short Answer).
  - Selected questions order list with points per question.
- **Interactive Elements & Actions**:
  - Open Question Bank Selector: `openBankModal()`.
  - Save as Draft: `saveExam(false)`.
  - Publish Exam: `saveExam(true)`.
- **State & Signals**:
  - `examForm: FormGroup`, `selectedQuestions = signal<QuestionDto[]>([])`.

---

### 4.10 Question Bank (`QuestionBankComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/question-bank`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/question-bank/question-bank.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/question-bank/question-bank.component.html`
- **UI Sections & Visual States**:
  - Filter bar: Subject, Question Type, Difficulty (Easy, Medium, Hard), Topic tag.
  - Questions List with collapsible choices and correct answer indicator.
  - **AI Question Generator Drawer**: Input prompt topic + number of questions -> AI generates questions instantly with answers for teacher review and addition.
- **Interactive Elements & Actions**:
  - Generate with AI: `generateAiQuestions()` -> calls `AiAnalyticsService.generateQuestions(...)`.
  - Add to Bank: `saveQuestion()`.
  - Delete Question: `deleteQuestion(id)`.
- **State & Signals**:
  - `questions = signal([])`, `isGeneratingAi = signal(false)`, `aiPrompt = signal('')`.

---

### 4.11 Grading Dashboard (`GradingDashboardComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/grading`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component.html`
- **UI Sections & Visual States**:
  - Summary cards of pending exam submissions requiring manual essay grading.
  - Filter by exam or class.
  - Submissions list showing student name, submission timestamp, auto-graded score, and "تصحيح الأسئلة المقالية" button.
- **Interactive Elements & Actions**:
  - Grade Student: Navigates to `/dashboard/teacher/assessment/grading/exam/:studentExamId`.
- **State & Signals**:
  - `pendingGradingList = signal([])`, `isLoading = signal(true)`.

---

### 4.12 Exam Grader (`ExamGraderComponent`)
- **Route Path & Guards**: `/dashboard/teacher/assessment/grading/exam/:studentExamId`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/exam-grader/exam-grader.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/exam-grader/exam-grader.component.html`
- **UI Sections & Visual States**:
  - Student exam submission review: Iterates through all questions.
  - Shows student's selected answer, model answer, and marks input box for essay questions.
  - Total score live recalculation bar.
- **Interactive Elements & Actions**:
  - Save Final Grade: `submitFinalGrading()`.
- **State & Signals**:
  - `examSubmission = signal(null)`, `gradingMap = signal({})`.

---

### 4.13 Lessons Manager (`LessonsManagerComponent`)
- **Route Path & Guards**: `/dashboard/teacher/lessons`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/assessment/lessons-manager/lessons-manager.component.ts`
  - Template: `src/app/features/teacher/pages/assessment/lessons-manager/lessons-manager.component.html`
- **UI Sections & Visual States**:
  - Subject selector dropdown.
  - Units and Lessons tree hierarchy.
  - Unit/Lesson creation modal (title, description, order index).
  - Linked resources badges per lesson (PDFs count, Videos count, Exams count, Assignments count).
- **Interactive Elements & Actions**:
  - Add Unit: `createUnit()`.
  - Add Lesson: `createLesson(unitId)`.
  - Reorder Lessons: drag & drop or order inputs.
- **State & Signals**:
  - `units = signal([])`, `selectedSubjectId = signal(null)`.

---

### 4.14 Live Sessions Calendar (`TeacherSessionsComponent`)
- **Route Path & Guards**: `/dashboard/teacher/sessions`.
- **File Paths**:
  - TS: `src/app/features/teacher/components/teacher-sessions/teacher-sessions.component.ts`
  - Template: `src/app/features/teacher/components/teacher-sessions/teacher-sessions.component.html`
- **UI Sections & Visual States**:
  - Embedded weekly calendar component `<app-weekly-calendar />`.
  - Schedule Live Session Modal: Select Subject, Class, Title, Date, Start Time, Duration.
  - Session details card with "دخول البث" (Join Room) and "سجل الحضور" (Attendance History) buttons.
- **Interactive Elements & Actions**:
  - Open Schedule Modal: `openScheduleModal()`.
  - Enter Live Room: Navigates to `/dashboard/teacher/sessions/:id/live`.
  - View Attendance: Navigates to `/dashboard/teacher/sessions/:id/attendance`.
- **State & Signals**:
  - `calendarSessions = signal([])`, `selectedWeek = signal('')`.

---

### 4.15 Live Room (`LiveRoomComponent`)
- **Route Path & Guards**:
  - Teacher Route: `/dashboard/teacher/sessions/:id/live`, data: `{ role: 'teacher', breadcrumb: 'الحصة المباشرة' }`.
  - Student Route: `/dashboard/student/sessions/:id/live`, data: `{ role: 'student', breadcrumb: 'الحصة المباشرة' }`.
  - Guard: `canDeactivateGuard` to prevent accidental disconnects.
- **File Paths**:
  - TS: `src/app/features/shared/components/live-room/live-room.component.ts`
  - Template: `src/app/features/shared/components/live-room/live-room.component.html`
- **UI Sections & Visual States**:
  - **Header**: Live connection pill ("متصل" vs "جاري الاتصال..."), Session title.
  - **Video Grid**:
    - Local Player tile with camera on/off avatar fallback.
    - Remote participants tiles (students & teacher).
    - Group hover controls: Teacher can grant or revoke whiteboard access per remote student.
  - **Interactive Whiteboard Area**: Embedded `<app-whiteboard />` active when whiteboard mode is toggled.
  - **Controls Footer**: Mic mute/unmute toggle, Camera on/off toggle, Whiteboard toggle (Teacher only), Screen share toggle (Teacher only), Leave Session red button.
- **Interactive Elements & Actions**:
  - Toggle Mic: `(click)="toggleMic()"`.
  - Toggle Camera: `(click)="toggleCamera()"`.
  - Toggle Whiteboard: `(click)="toggleWhiteboard()"`.
  - Toggle Screen Share: `(click)="toggleScreenShare()"`.
  - Grant/Revoke Whiteboard: `grantWhiteboardAccess(uid)` / `revokeWhiteboardAccess(uid)`.
  - Leave: `leaveSession()` -> cleans Agora tracks, navigates to sessions calendar.
- **State & Signals**:
  - `isLoading = signal(true)`, `isMuted = signal(false)`, `isCameraOff = signal(false)`, `isWhiteboardActive = signal(false)`, `isScreenSharing = signal(false)`, `remoteUsers = signal([])`.
  - Injected Services: `LiveSessionService`, `AuthStateService`, Agora RTC Client SDK.
- **Known UI/Layout Pain Points**:
  - Full-screen dark container (`fixed inset-0 z-50 bg-slate-950`). Video tiles need consistent aspect ratios to avoid layout shifts when participants join.

---

### 4.16 Live Session Attendance (`TeacherSessionAttendanceComponent`)
- **Route Path & Guards**: `/dashboard/teacher/sessions/:id/attendance`, route param: `:id`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/live-session/attendance/session-attendance.component.ts`
  - Template: `src/app/features/teacher/pages/live-session/attendance/session-attendance.component.html`
- **UI Sections & Visual States**:
  - Session meta banner (Title, scheduled date, duration).
  - 4 Stats Cards: إجمالي الطلاب, حاضر (Present), غائب (Absent), بعذر (Excused).
  - Student Attendance Records Table: Student Name, Status Pill (Green/Red/Amber), Join Timestamp, Teacher Note, "تعديل الحالة" button.
  - Override Status Modal: Select new status (Present, Absent, Excused) and optional note.
- **Interactive Elements & Actions**:
  - Open Override: `openOverrideModal(record)`.
  - Submit Override: `submitOverride()` -> updates record in `TeacherAttendanceService`.
- **State & Signals**:
  - `sessionAttendance = signal<SessionAttendanceDto | null>(null)`, `isModalOpen = signal(false)`, `overrideStatus = signal('Present')`.

---

### 4.17 Class Analytics (`ClassAnalyticsComponent`)
- **Route Path & Guards**: `/dashboard/teacher/analytics/:classId/:subjectId`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/class-analytics/class-analytics.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Class Average KPI, Scheduled vs Completed Sessions rate, Score distribution chart, Top 5 & Bottom 5 students cards.
- **Interactive Elements & Actions**:
  - Reload: `loadAnalytics()`.
- **State & Signals**:
  - `data = signal<ClassAnalyticsDashboardDto | null>(null)`.

---

### 4.18 Student Insight Details (`StudentInsightComponent`)
- **Route Path & Guards**: `/dashboard/teacher/students/:studentId/subjects/:subjectId/insight`.
- **File Paths**:
  - TS: `src/app/features/teacher/pages/student-insight/student-insight.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Student Information Card.
  - Weak Topics Analysis with error rate percentage bars and recommended teacher actions.
  - Active Performance Alerts.
  - Latest AI Teaching Suggestion with step-by-step action items.
- **Interactive Elements & Actions**:
  - Generate New Suggestion: `generateSuggestion()` -> calls AI analytics service to create personalized pedagogical advice.
- **State & Signals**:
  - `data = signal<StudentInsightDto | null>(null)`, `suggestion = signal(null)`, `isGenerating = signal(false)`.

---

## 5. Student Perspective

### 5.1 Student Dashboard Overview (`StudentDashboardPageComponent`)
- **Route Path & Guards**: `/dashboard/student`, guarded by `authGuard`, `roleGuard(['Student'])`. `data: { breadcrumb: 'لوحة الطالب' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/dashboard/dashboard.component.ts`
  - Template: `src/app/features/student/pages/dashboard/dashboard.component.html`
- **UI Sections & Visual States**:
  - Header with student greeting and manual "تحديث" (Refresh) button.
  - Dashboard Cards (`<app-student-dashboard-cards />`): Profile summary, Class info, Attendance rate, Average score.
  - Attendance Summary widget (`<app-student-attendance-summary />`).
  - Upcoming Schedule widget (`<app-student-schedule-card />`): Next 3 upcoming sessions with direct "انضمام للحصة" (Join Session) button.
  - Recent Courses grid (`<app-student-course-card />`): Latest 4 enrolled subjects.
- **Interactive Elements & Actions**:
  - Join Session: `joinSession(session)` -> navigates to `/dashboard/student/sessions/:id/live`.
  - View All Courses: Link to `/dashboard/student/courses`.
  - View All Schedule: Link to `/dashboard/student/schedule`.
- **State & Signals**:
  - `data = signal<StudentDashboardData | null>(null)`, `recentCourses = computed(...)`, `upcomingSchedule = computed(...)`.
  - Injected Services: `StudentService`, `Router`.

---

### 5.2 Exam Result Details (`StudentExamResultPageComponent`)
- **Route Path & Guards**: `/dashboard/student/exams/result/:id`, route param: `:id`.
- **File Paths**:
  - TS: `src/app/features/student/pages/exam-result/exam-result.component.ts`
  - Template: `src/app/features/student/pages/exam-result/exam-result.component.html`
- **UI Sections & Visual States**:
  - Score Summary Circular Gauge (Green if >=50%, Red if <50%) displaying total score vs max score.
  - Pending Manual Review Alert: Shown if essay questions are pending teacher evaluation.
  - Answers Breakdown List: Question text, student's answer vs correct answer, grading status badge (Correct, Incorrect, Pending Review, Partially Correct), and teacher feedback note.
- **Interactive Elements & Actions**:
  - Back Button: `(click)="goBack()"`.
- **State & Signals**:
  - `result = signal<StudentExamResult | null>(null)`, `isLoading = signal(true)`.

---

### 5.3 Student Courses (`StudentCoursesPageComponent`)
- **Route Path & Guards**: `/dashboard/student/courses`, `data: { breadcrumb: 'دروسي' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/courses/courses.component.ts`
  - Template: `src/app/features/student/pages/courses/courses.component.html`
- **UI Sections & Visual States**:
  - 2-Column layout:
    - Left column: Grid of course cards (`<app-student-course-card />`).
    - Right aside: Selected course detail panel (Subject name, Arabic name, assigned teacher, and quick links to Content, Assignments, Exams).
- **Interactive Elements & Actions**:
  - Course selection: `selectCourse(course)`.
  - Action buttons: Jump to `/dashboard/student/content`, `/dashboard/student/assignments`, `/dashboard/student/exams`.
- **State & Signals**:
  - `courses = signal<StudentCourse[]>([])`, `selectedCourse = computed(...)`.

---

### 5.4 Content Library (`StudentContentPageComponent`)
- **Route Path & Guards**: `/dashboard/student/content` (and alias `/dashboard/student/library`), `data: { breadcrumb: 'مكتبة الدروس' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/content/content.component.ts`
  - Template: `src/app/features/student/pages/content/content.component.html`
- **UI Sections & Visual States**:
  - Grouped by subject: Counters for total PDFs, Videos, and Resources.
  - Resource cards: Title, description, date added, content type badge.
  - **Embedded Video Modal**: Modal overlay playing YouTube/Vimeo embed or HTML5 Azure Blob storage video with close button.
- **Interactive Elements & Actions**:
  - Open Resource: `(click)="openResource(item)"` -> opens video modal or triggers secure Azure Blob download URL in new tab.
  - Close Video: `(click)="closeVideo()"`.
- **State & Signals**:
  - `groups = signal<StudentContentGroup[]>([])`, `isVideoModalOpen = signal(false)`, `selectedVideoUrl = signal(null)`.

---

### 5.5 Student Lessons & Units (`StudentLessonsComponent`)
- **Route Path & Guards**: `/dashboard/student/lessons`, `data: { breadcrumb: 'الدروس والوحدات' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/student-lessons/student-lessons.component.ts`
  - Template: `src/app/features/student/pages/student-lessons/student-lessons.component.html`
- **UI Sections & Visual States**:
  - Subject selector dropdown.
  - Accordion list of lessons: Shows title, description, content count, exam count, assignment count.
  - Expanded view: Sub-sections for Educational Content, Associated Exams, and Associated Assignments.
- **Interactive Elements & Actions**:
  - Expand/Collapse Lesson: `toggleDetails(lesson.lessonId)`.
  - Open content item: `openContent(item.resourceUrl)`.
  - Links to Exams and Assignments.
- **State & Signals**:
  - `subjects = []`, `selectedSubjectId = null`, `lessons = []`, `expandedLessonId = null`.

---

### 5.6 Student Assignments (`StudentAssignmentsPageComponent`)
- **Route Path & Guards**: `/dashboard/student/assignments`, `data: { breadcrumb: 'الواجبات' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/assignments/assignments.component.ts`
  - Template: `src/app/features/student/pages/assignments/assignments.component.html`
- **UI Sections & Visual States**:
  - Left column: Paginated groups of assignments categorized by subject. Cards show title, description snippet, and status pill (Pending, Submitted, Graded).
  - Right aside: Selected assignment details (Due date, max score, current score).
  - Submission Form: Textarea for text answer, file attachment upload, and "تسليم الواجب" (Submit Assignment) button. Disabled if already submitted.
- **Interactive Elements & Actions**:
  - Select Assignment: `(click)="selectAssignment(assignment)"`.
  - Submit: `(click)="submitSelectedAssignment()"`.
  - Pagination: `nextPage()`, `prevPage()`.
- **State & Signals**:
  - `groups = signal([])`, `selectedAssignment = computed(...)`, `answerText = signal('')`, `selectedFile = signal(null)`.

---

### 5.7 Student Exams & Live Attempt (`StudentExamsPageComponent`)
- **Route Path & Guards**: `/dashboard/student/exams`, `data: { breadcrumb: 'الاختبارات' }`. Guarded by `canDeactivateGuard` when an exam attempt is active.
- **File Paths**:
  - TS: `src/app/features/student/pages/exams/exams.component.ts`
  - Template: `src/app/features/student/pages/exams/exams.component.html`
- **UI Sections & Visual States**:
  - **State A: Available Exams List**: Paginated subjects and exam cards showing start/end dates, duration minutes, and "ابدأ الاختبار" button.
  - **State B: Pre-Exam Instructions Modal**: Displays warnings (auto-save every 30s, no returning after submit, auto-submit on timeout) with "بدء الاختبار" confirm button.
  - **State C: Active Exam Test Environment**:
    - Floating banner with active glowing pulse, countdown timer (`<app-exam-timer />`), and timeout warning banner (<1 min).
    - Question Renderer (`<app-question-renderer />`): Renders question text, choices/inputs based on question type.
    - Navigation footer: Previous / Next buttons and question progress bar.
    - Right Sidebar Question Navigator: Grid of numbered buttons (1, 2, 3...) color-coded: Blue (current), Green (answered), Grey (unanswered).
    - Auto-save indicator: Spinning "جاري الحفظ التلقائي..." vs "تم الحفظ (hh:mm)".
    - Red Final Submit button.
  - **State D: Submit Confirmation Dialog**: Custom modal replacing native browser confirm dialog, displaying count of answered vs unanswered questions.
  - **State E: Result Card**: Displays circular score badge, grade letter, and link to performance report.
- **Interactive Elements & Actions**:
  - Instructions Modal: `showInstructions.set(true)`.
  - Start Exam: `startSelectedExam()` -> initializes `ExamAttemptStore`.
  - Change Answer: `onAnswerChange(answer)` -> stores answer and triggers 30s debounced auto-save.
  - Question Navigator Jump: `store.goToQuestion(index)`.
  - Final Submit: `submitActiveExam()` -> prompts confirmation modal, then forces save and executes submission.
- **State & Signals**:
  - `store = inject(ExamAttemptStore)`, `showInstructions = signal(false)`, `showSubmitConfirm = signal(false)`, `showTimerWarning = signal(false)`.
- **Known UI/Layout Pain Points**:
  - Crucial UX area! Clean glassmorphism backdrop and sticky question navigator sidebar must remain fixed during long question scrolls.

---

### 5.8 Student Exam Grades (`StudentGradesPageComponent`)
- **Route Path & Guards**: `/dashboard/student/grades`, `data: { breadcrumb: 'الدرجات' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/grades/grades.component.ts`
  - Template: `src/app/features/student/pages/grades/grades.component.html`
- **UI Sections & Visual States**:
  - Grid of graded exam cards: Subject pill, Exam title, Submission date, Final score / Total marks, or "قيد التصحيح" (Pending Review) badge.
  - "عرض التفاصيل" (View Details) button.
- **Interactive Elements & Actions**:
  - View Details: `(click)="viewDetails(grade.studentExamId)"` -> navigates to `/dashboard/student/exams/result/:id`.
- **State & Signals**:
  - `grades = signal<StudentExamGrade[]>([])`, `isLoading = signal(true)`.

---

### 5.9 Student Attendance History (`StudentAttendancePageComponent`)
- **Route Path & Guards**: `/dashboard/student/attendance`, `data: { breadcrumb: 'سجل الحضور' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/attendance/attendance.component.ts`
  - Template: `src/app/features/student/pages/attendance/attendance.component.html`
- **UI Sections & Visual States**:
  - Summary widget `<app-student-attendance-summary />` showing overall present/absent/excused counts and attendance percentage.
  - Subjects Attendance Table: Subject name, Present count, Absent count, Excused count, Total sessions, Attendance percentage badge.
- **Interactive Elements & Actions**:
  - Refresh: `(click)="loadAttendance()"`.
- **State & Signals**:
  - `summary = signal<StudentAttendanceSummary | null>(null)`, `subjects = computed(...)`.

---

### 5.10 Student Academic Performance (`StudentPerformancePageComponent`)
- **Route Path & Guards**: `/dashboard/student/performance`, `data: { breadcrumb: 'الأداء الأكاديمي' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/performance/performance.component.ts`
  - Template: `src/app/features/student/pages/performance/performance.component.html`
- **UI Sections & Visual States**:
  - 3 KPI Cards: متوسط الدرجات (Average Grade), سجلات الدرجات (Grades Count), مواد الأداء (Subjects Count).
  - Subject performance horizontal comparison chart (`<app-performance-chart />`).
  - Current grades list widget.
  - Detailed performance table (`<app-student-performance-table />`).
  - AI Learning Insights promotional banner linking to `/dashboard/student/insights`.
- **Interactive Elements & Actions**:
  - Refresh: `(click)="loadPerformance()"`.
- **State & Signals**:
  - `grades = signal([])`, `performance = signal([])`, `averageGrade = computed(...)`, `chartData = computed(...)`.

---

### 5.11 Student Weekly Schedule (`StudentSchedulePageComponent`)
- **Route Path & Guards**: `/dashboard/student/schedule`, `data: { breadcrumb: 'الجدول الأسبوعي' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/schedule/schedule.component.ts`
  - Template: `src/app/features/student/pages/schedule/schedule.component.html`
- **UI Sections & Visual States**:
  - Academic Week selector dropdown (Week 1 through 52 with date intervals).
  - Weekly calendar matrix (`<app-weekly-calendar />`): Days of the week as columns, scheduled class slots as interactive blocks showing subject, teacher, time, and live indicator.
- **Interactive Elements & Actions**:
  - Week Select: `(change)="onWeekChange($event)"`.
  - Join Live Session: `(join)="joinSessionFromCalendar($event)"` -> navigates to live room.
- **State & Signals**:
  - `selectedWeek = signal(...)`, `calendarSessions = signal([])`, `weekStart = computed(...)`.

---

### 5.12 Student Profile Summary (`StudentProfilePageComponent`)
- **Route Path & Guards**: `/dashboard/student/profile`, `data: { breadcrumb: 'الملف الشخصي' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/profile/profile.component.ts`
  - Template: `src/app/features/student/pages/profile/profile.component.html`
- **UI Sections & Visual States**:
  - Student card: Full name, email, academic status badge, enrolled Grade name.
  - Class information card: Class name, academic year.
  - Top Grade badge: Highlights the student's highest graded subject.
- **Interactive Elements & Actions**:
  - Refresh: `(click)="loadProfile()"`.
- **State & Signals**:
  - `profile = signal(null)`, `classInfo = signal(null)`, `topGrade = computed(...)`.

---

### 5.13 AI Learning Insights (`LearningInsightsComponent`)
- **Route Path & Guards**: `/dashboard/student/insights`, `data: { breadcrumb: 'رؤى التعلم' }`.
- **File Paths**:
  - TS: `src/app/features/student/pages/learning-insights/learning-insights.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Header with link back to Academic Performance report.
  - **Active Performance Alerts**: Cards for low exam scores, attendance drops, or missed assignments.
  - **Weakness Analysis by Subject**: Topic cards showing error rate progress bar (Red/Amber/Blue) and AI recommended action items.
  - **Recommended Content Grid**: Tailored videos, documents, or quizzes with relevance score percentage bar.
  - **Performance Trend Graphs**: Mini bar visual trends of scores over time.
- **Interactive Elements & Actions**:
  - Refresh: `(click)="loadInsights()"`.
- **State & Signals**:
  - `data = signal<LearningInsightsDashboardDto | null>(null)`, `isLoading = signal(true)`.

---

## 6. Parent Perspective

### 6.1 Parent Dashboard Overview (`ParentDashboardComponent`)
- **Route Path & Guards**: `/dashboard/parent`, guarded by `authGuard`, `roleGuard(['Parent'])`. `data: { breadcrumb: 'لوحة ولي الأمر' }`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/dashboard/parent-dashboard.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Greeting header with "إضافة طالب جديد" (Add Student) CTA button.
  - 3 Overview Cards: عدد الأبناء المرتبطين (Linked Children count), الاشتراكات الفعالة (Active Subscriptions count), الاشتراكات المنتهية (Expired count).
  - **Active Child Section**:
    - Embedded `<app-child-selector />` dropdown.
    - **If selected child has active subscription**: Displays 3 direct feature cards ("التقارير الذكية", "تنبيهات الأداء", "سجل الحضور").
    - **If selected child has NO active subscription**: Displays lock illustration, warning text, and "تفعيل اشتراك للطالب" (Subscribe for Student) button.
  - **Empty State**: Shown if no children are linked yet, guiding the parent to add or link a student.
- **Interactive Elements & Actions**:
  - "إضافة طالب جديد": Navigates to `/dashboard/parent/onboarding/add-student`.
  - "تفعيل اشتراك للطالب": `subscribeForSelectedChild()` -> navigates to `/dashboard/parent/subscriptions`.
- **State & Signals**:
  - `parentService.linkedStudents()`, `parentService.selectedStudent()`, `isSubscribing = signal(false)`.

---

### 6.2 Children Directory (`ChildrenListComponent`)
- **Route Path & Guards**: `/dashboard/parent/children`, `data: { breadcrumb: 'أبنائي' }`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/children/children-list.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Top action buttons: "إنشاء حساب طالب جديد" (New Child Account) and "ربط طالب موجود بالكود" (Link Existing Child).
  - Grid of Child Cards: Avatar/Initials, Full name, email, subscription status pill (اشتراك فعال vs غير فعال).
  - Quick access footer icons on each card: التقارير (Reports), الجدول (Schedule), التنبيهات (Alerts), الحضور (Attendance). Disabled with opacity if child is not subscribed.
  - Empty state with dual CTAs.
- **Interactive Elements & Actions**:
  - Click any child feature icon: Navigates to `/dashboard/parent/:feature/:studentId`.
- **State & Signals**:
  - `combinedStudents = computed(...)` (merges subscription status with avatar profile).
  - Injected Services: `ParentService`, `ProfileService`.

---

### 6.3 Smart Monthly Report (`SmartReportComponent`)
- **Route Path & Guards**:
  - Base: `/dashboard/parent/reports/:studentId`
  - With Month: `/dashboard/parent/reports/:studentId/:month`
- **File Paths**:
  - TS: `src/app/features/parent/pages/smart-report/smart-report.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Embedded `<app-child-context-bar />` at the top.
  - Month Selector Dropdown (January through December 2026).
  - "توليد التقرير" (Generate Report) button with spinning loading indicator.
  - **Loaded Report Layout**:
    - Overall Score circular gauge & attendance percentage bar.
    - AI Summary Banner: Gradient card containing natural language assessment narrative.
    - Subject Breakdown Cards: Performance level tag (ممتاز, جيد, يحتاج تحسين, في خطر), average score, attendance rate, AI subject critique, weak skills needing reinforcement, and proposed improvement plan.
  - Empty state if report hasn't been generated for the selected month yet.
- **Interactive Elements & Actions**:
  - Change Month: `(change)="onMonthChange($event)"` -> updates route param.
  - Generate Report: `(click)="generateReport()"` -> triggers AI analytics generation.
- **State & Signals**:
  - `studentId = signal(0)`, `selectedMonth = signal('2026-04')`, `report = signal<ParentReportDto | null>(null)`, `isGenerating = signal(false)`.

---

### 6.4 Child Performance Alerts (`ChildAlertsComponent`)
- **Route Path & Guards**: `/dashboard/parent/alerts/:studentId`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/child-alerts/child-alerts.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Sticky child context bar `<app-child-context-bar />`.
  - Severity-coded alert cards (High = Red strip, Medium = Orange strip, Low = Amber strip).
  - Alert types: غياب متكرر (Low Attendance), درجة منخفضة في اختبار (Low Exam Score), واجبات ناقصة (Missed Assignments).
  - Details: Subject name and date logged.
  - Empty state with green star: "أداء ممتاز، لا توجد تنبيهات!".
- **Interactive Elements & Actions**:
  - Retry: `(click)="loadAlerts()"`.
- **State & Signals**:
  - `studentId = signal(0)`, `alerts = signal<PerformanceAlertDto[]>([])`.

---

### 6.5 Child Attendance Records (`ParentAttendanceComponent`)
- **Route Path & Guards**: `/dashboard/parent/attendance/:studentId`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/attendance/parent-attendance.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Sticky child context bar `<app-child-context-bar />`.
  - Academic Year dropdown.
  - Overall Attendance Rate circular meter banner based on total recorded sessions across all subjects.
  - Subject cards with circular SVG progress gauge, attended count, missed/absent count, and total sessions.
- **Interactive Elements & Actions**:
  - Year selector: `(change)="onYearChange($event)"`.
- **State & Signals**:
  - `studentId = signal(0)`, `selectedYear = signal(2026)`, `attendanceData = signal([])`.

---

### 6.6 Child Weekly Schedule (`ParentScheduleComponent`)
- **Route Path & Guards**: `/dashboard/parent/schedule/:studentId`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/parent-schedule/parent-schedule.ts`
  - Template: `src/app/features/parent/pages/parent-schedule/parent-schedule.html`
- **UI Sections & Visual States**:
  - Sticky child context bar `<app-child-context-bar />`.
  - Week navigator (Previous Week, Date Range Label, Next Week).
  - 4-Column responsive day cards (Sunday through Thursday).
  - Session cards showing start time, subject name, and assigned teacher name.
- **Interactive Elements & Actions**:
  - `(click)="prevWeek()"`, `(click)="nextWeek()"`.
- **State & Signals**:
  - `studentId = signal(0)`, `currentWeekStart = signal<Date>(...)`, `schedule = signal(null)`.

---

### 6.7 Parent Profile & Settings (`ParentProfileComponent`)
- **Route Path & Guards**: `/dashboard/parent/profile`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/profile/parent-profile.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Personal Information card: Avatar initials, full name, email, phone, country.
  - Linked Children Summary chips with active/inactive indicators.
  - Navigation options sidebar: "تغيير كلمة المرور", "الاشتراكات والباقات", "التواصل والدعم (الشات)".
  - Danger zone card: "تسجيل الخروج" (Logout).
- **Interactive Elements & Actions**:
  - Logout: `(click)="logout()"` -> clears auth and navigates to login.
- **State & Signals**:
  - Injected Services: `AuthStateService`, `ParentService`.

---

### 6.8 Link Existing Student by Code (`LinkStudentComponent`)
- **Route Path & Guards**: `/dashboard/parent/link`, query param: `?code=...`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/link-student/link-student.component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Centered card handling 4 visual states:
    - `validating`: Spinner with "جاري ربط حساب الطالب...".
    - `success`: Green checkmark, success text, and animated 2-second progress bar before auto-redirecting to dashboard.
    - `error`: Red error box showing backend error reason (e.g. invalid code or already linked) with back button.
    - `invalid_link`: Orange link icon indicating no code was provided in URL.
- **Interactive Elements & Actions**:
  - Automatic validation triggered on route load.
- **State & Signals**:
  - `status = signal<'validating' | 'success' | 'error' | 'invalid_link'>('validating')`, `errorMessage = signal('')`.

---

### 6.9 Parent Subscriptions Manager (`ParentSubscriptionsComponent`)
- **Route Path & Guards**: `/dashboard/parent/subscriptions`, `data: { breadcrumb: 'الخطط والاشتراكات' }`.
- **File Paths**:
  - TS: `src/app/features/parent/pages/subscriptions/parent-subscriptions.component.ts`
  - Template: `src/app/features/parent/pages/subscriptions/parent-subscriptions.component.html`
- **UI Sections & Visual States**:
  - Child selection dropdown with `(مشترك)` indicator for subscribed children.
  - **Active Subscription Card**: Current plan name, expiration date, upgrade/downgrade rules alert box, and "تغيير الخطة" (Change Plan) button.
  - **Plan Selection Grid**: Embedded `<plans-component [handleCheckout]="false" />` enabling parent to choose a new plan or upgrade/downgrade.
- **Interactive Elements & Actions**:
  - Change Student: `onStudentChange($event)`.
  - Start/Cancel Change Plan: `startChangePlan()`, `cancelChangePlan()`.
  - Select Plan: `onPlanSelected(plan)` -> initiates Stripe checkout for child or performs instant upgrade.
- **State & Signals**:
  - `activeSubscription = signal(null)`, `isChangingPlan = signal(false)`, `processingPlanId = signal(null)`.

---

## 7. Cross-Role Perspective

### 7.1 Real-Time SignalR Community Chat (`Chat`)
- **Route Path & Guards**: `/dashboard/chat`, guarded by `authGuard`. Accessible to all roles.
- **File Paths**:
  - TS: `src/app/features/signalR/Component/chat/chat.ts`
  - Template: `src/app/features/signalR/Component/chat/chat.html`
  - Styles: `src/app/features/signalR/Component/chat/chat.css`
- **UI Sections & Visual States**:
  - **Channels Sidebar (320px)**:
    - Grouped channels (e.g. "مجتمع المرحلة الدراسية", "غرفة المعلمين").
    - Channel pills with unread count badges.
  - **Chat Main Area**:
    - Header: Channel title and description.
    - Message Stream: Bubble list. Sent messages (blue bubble on left in RTL), received messages (white bubble with sender name & time on right).
    - Empty channel illustration: "لا توجد رسائل سابقة. كن أول من يشارك!".
    - Bottom Input Box: Auto-resizing textarea, paperclip attachment icon, Send button, and keyboard shortcut hint (Enter to send, Shift+Enter for new line).
- **Interactive Elements & Actions**:
  - Select Channel: `(click)="selectRoom(room.chatRoomId)"` -> joins SignalR group room and fetches message history.
  - Send Message: `(click)="send()"` or `(keydown.enter)="handleEnter($event)"` -> broadcasts message over SignalR hub.
- **State & Signals**:
  - `store = inject(ChatStore)` (`rooms`, `selectedRoomId`, `messages`, `groupedRooms`).
  - `message = ''`.
  - Injected Services: `ChatSignalRService`, `ChatApiService`, `AuthStateService`.
- **Known UI/Layout Pain Points**:
  - Critical RTL alignment: `mr-auto` pushes sent bubbles to left; `ml-auto` pushes received bubbles to right. Custom scrollbar must auto-scroll to bottom on new incoming message.

---

### 7.2 Unified User Profile (`ProfilePageComponent`)
- **Route Path & Guards**:
  - Own Profile: `/dashboard/profile`
  - Child Profile: `/dashboard/parent/child-profile/:id` (Parent viewing/editing child)
- **File Paths**:
  - TS: `src/app/features/profile/pages/profile-page.component.ts`
  - Template: `src/app/features/profile/pages/profile-page.component.html`
- **UI Sections & Visual States**:
  - **Left Column**: Large circular avatar with hover camera upload overlay, Full Name, Role badge, and "إزالة الصورة" (Remove Avatar) button.
  - **Right Column**:
    - **Read-Only Mode** (when viewing student or restricted): Displays clean view cards for full name, email, academic status pill, and bio.
    - **Editable Mode** (own profile or parent editing child): Reactive Form with Full Name, Email (read-only), Phone, Country, Headline/Specialization, and Bio textarea.
  - **Linked Children Card** (for Parents): List of children cards with avatars and active subscription dots.
- **Interactive Elements & Actions**:
  - Avatar Upload: `onFileSelected($event)` -> validates <5MB image, uploads to blob storage.
  - Remove Avatar: `removeAvatar()`.
  - Save Profile: `onSave()` -> updates profile in backend.
- **State & Signals**:
  - `profile = signal<UserProfileDto | null>(null)`, `isReadOnly = computed(...)`, `profileForm: FormGroup`, `isSaving = signal(false)`, `isUploading = signal(false)`.

---

### 7.3 Subscription Plans Catalog (`PlansPageComponent` & `PlansComponent`)
- **Route Path & Guards**: `/dashboard/plans`, public or authenticated.
- **File Paths**:
  - Page TS: `src/app/features/subscription/pages/plans/plans.component.ts`
  - Component TS: `src/app/features/subscription/components/plans-component/plans-component.ts`
  - Component Template: `src/app/features/subscription/components/plans-component/plans-component.html`
- **UI Sections & Visual States**:
  - Back link to `/dashboard`.
  - Header: "الاشتراكات الدراسية - إدارة وتتبع باقاتك الحالية".
  - Active Plans dashed container (shown if no active subscription).
  - **Plans Row Cards (75% / 25% Split)**:
    - 75% Text & Actions side: Plan Title, "الخيار الأفضل" badge, feature checklist items with green checkmarks or grey crosses (`plan.hasLiveClass`), and "اشترك الآن" button.
    - 25% Visual Feature Banner: Dotted grid background with price and currency tag.
- **Interactive Elements & Actions**:
  - Subscribe: `onSelectPlan(plan)`:
    - If unauthenticated: redirects to login.
    - If authenticated: calls `initiateCheckout(plan.planId)` and redirects browser to Stripe checkout URL (`window.location.href = result.checkoutUrl`).
- **State & Signals**:
  - `plans = signal<PlanDto[]>([])`, `loading = signal(true)`, `checkingOutPlanId = signal<number | null>(null)`.

---

### 7.4 My Subscription Status (`MySubscriptionPageComponent` & `MySubscriptionComponent`)
- **Route Path & Guards**: `/dashboard/my-subscription`, guarded by `authGuard`.
- **File Paths**:
  - Page TS: `src/app/features/subscription/pages/my-subscription/my-subscription.component.ts`
  - Component TS: `src/app/features/subscription/components/my-subscription-component/my-subscription-component.ts`
  - Component Template: `src/app/features/subscription/components/my-subscription-component/my-subscription-component.html`
- **UI Sections & Visual States**:
  - **State A: Active Subscription Card**:
    - Gradient accent bar, "نشط" status pill, Plan name, Plan type pill.
    - Expiration date and dynamic countdown tag ("X أيام متبقية").
    - Start date and end date cards.
  - **State B: Student Linkage Code Widget** (for Students only):
    - Monospace code display box and "نسخ" (Copy Code) button with "تم النسخ" confirmation state.
  - **State C: No Active Subscription Card**:
    - Academic cap icon, message "لا توجد اشتراكات نشطة", and "عرض الخطط" button linking to `/dashboard/plans`.
- **Interactive Elements & Actions**:
  - Copy Code: `copyCode()` -> writes code to clipboard with 2s timeout.
  - Retry: `loadStatus()`.
- **State & Signals**:
  - `status = signal<SubscriptionStatusResponse | null>(null)`, `linkageCode = signal<string | null>(null)`, `copied = signal(false)`.

---

### 7.5 Stripe Checkout Success (`CheckoutSuccessPageComponent` & `CheckoutSuccessComponent`)
- **Route Path & Guards**: `/dashboard/checkout-success`, query params: `?session_id=...`.
- **File Paths**:
  - Page TS: `src/app/features/subscription/pages/checkout-success/checkout-success.component.ts`
  - Component TS: `src/app/features/subscription/components/checkout-success-component/checkout-success-component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Centered card handling 3 states:
    - `isVerifying`: Spinning blue icon, "جاري تأكيد الدفع... يرجى الانتظار بينما نقوم بتأكيد اشتراكك مع البنك...".
    - `verificationSuccess`: Green checkmark icon, "تم الدفع بنجاح!", auto-redirecting countdown.
    - Failure: Red cross icon, "فشل التأكيد", and manual "العودة للوحة التحكم" button.
- **Interactive Elements & Actions**:
  - On init: sends HTTP POST to verify Stripe session ID.
  - Go Back: `goBack()` -> routes to `/dashboard/parent/subscriptions` for Parents or `/dashboard/my-subscription` for Students.
- **State & Signals**:
  - `isVerifying = true`, `verificationSuccess = false`.

---

### 7.6 Stripe Checkout Cancel (`CheckoutCancelPageComponent` & `CheckoutCancelComponent`)
- **Route Path & Guards**: `/dashboard/checkout-cancel`.
- **File Paths**:
  - Page TS: `src/app/features/subscription/pages/checkout-cancel/checkout-cancel.component.ts`
  - Component TS: `src/app/features/subscription/components/checkout-cancel-component/checkout-cancel-component.ts` (Inline template)
- **UI Sections & Visual States**:
  - Centered card with grey cross icon.
  - Headline: "تم إلغاء عملية الدفع".
  - Explanation: "لم يتم خصم أي مبالغ. يمكنك العودة لصفحة الخطط والاشتراك في أي وقت."
  - Action buttons: "عرض الخطط المتاحة" (links to `/dashboard/plans`) and "العودة للوحة التحكم" (links to `/dashboard`).
- **Interactive Elements & Actions**:
  - Static navigation links.
- **State & Signals**:
  - Stateless standalone component.
