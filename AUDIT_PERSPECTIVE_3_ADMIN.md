# Perspective 3: Admin Perspective Audit
**Masarak Platform — Code-Grounded UI & Functionality Blueprint**

---

## 3.1 Admin Overview Dashboard (`AdminComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'لوحة الإدارة' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/adminComponent/admin.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/adminComponent/admin.html`

### UI Sections & Visual States
- **Top Greeting & Quick Summary**:
  - Header with system administrator greeting and data refresh button.
- **KPI Metrics Cards Grid (4 Cards)**:
  - Total Students card (with growth % indicator).
  - Total Teachers card.
  - Active Subscriptions card.
  - Monthly Recurring Revenue (MRR) card.
- **Operational Quick Actions Panel**:
  - Fast-action buttons: "إدارة المستخدمين" -> `/dashboard/admin/users`, "الهيكل الأكاديمي" -> `/dashboard/admin/academic`, "مراجعة المحتوى" -> `/dashboard/admin/content-moderation`, "تحليلات الذكاء الاصطناعي" -> `/dashboard/admin/platform-analytics`.
- **Recent System Activity Table**:
  - Table of recent registrations, subscription upgrades, and flagged content items.
- **Infrastructure Status Widget**:
  - Status indicators for Database, Azure Blob Storage, Agora RTC Gateway, and OpenAI/LLM Service connectivity.

### Interactive Elements & Actions
- **Refresh Data**: `(click)="loadOverview()"` triggers API refresh.
- **Navigation Shortcuts**: Angular `[routerLink]` cards directing to specific management modules.

### State & Signals
- `metrics = signal<AdminOverviewMetrics | null>(null)`
- `isLoading = signal<boolean>(true)`
- `errorMessage = signal<string | null>(null)`
- **Injected Services**: `AdminApiService`, `ToastService`, `Router`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Metric cards use hardcoded gradient styles that should be unified into modern glassmorphism token variables.

---

## 3.2 User Management (`UserManagement`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/users`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'إدارة المستخدمين' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/user-management/user-management.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/user-management/user-management.html`

### UI Sections & Visual States
- **Filter & Search Bar**:
  - Search input: by name, email, or phone.
  - Role Filter dropdown: "الكل", "طالب", "معلم", "ولي أمر", "مدير".
  - Status Filter dropdown: "الكل", "نشط", "معلق / محظور".
- **Users Data Table**:
  - Columns: المستخدم (Avatar, Name, Email), الدور (Role Badge), تاريخ الانضمام (Joined Date), حالة الحساب (Status Toggle), الإجراءات (Actions Menu).
  - Empty search state: "لا يوجد مستخدمين يطابقون معايير البحث".
  - Loading skeleton pulse for table rows.
- **Pagination Bar**:
  - Current page, total records, page size selector (10, 25, 50), Previous/Next buttons.
- **User Edit / Status Modal**:
  - Slide-out drawer or centered modal to edit user role, reset password, or toggle account suspension.

### Interactive Elements & Actions
- **Search Change**: `(input)="onSearchChange($event)"` (debounced).
- **Role Filter**: `(change)="onRoleChange($event)"`.
- **Toggle User Status**: `(click)="toggleUserActive(user)"` -> prompts `ConfirmDialogService`.
- **Send Password Reset**: `(click)="resetUserPassword(user)"`.
- **Pagination**: `(click)="changePage(newPage)"`.

### State & Signals
- `users = signal<UserDto[]>([])`
- `totalCount = signal<number>(0)`
- `currentPage = signal<number>(1)`
- `pageSize = signal<number>(10)`
- `searchQuery = signal<string>('')`
- `selectedRole = signal<string>('all')`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `AdminUserService`, `ConfirmDialogService`, `ToastService`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Wide table in RTL needs horizontal scroll container with sticky left-side actions column.

---

## 3.3 Teachers Directory (`TeachersDirectoryComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/teachers`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'دليل المعلمين' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/academic/pages/admin/teachers-list/teachers-list.component.ts`

### UI Sections & Visual States
- **Header**: Directory title and "تعيين معلم جديد" (Assign Teacher) action button.
- **Teachers Grid**:
  - Teacher Card: Circular avatar/initials, full name, specialization headline, assigned subjects and classes chips, hiring date.
  - Card Action Footer: "تعيين لمادة/فصل", "عرض الأداء", "تعديل البيانات".
- **Assign Teacher to Class Modal**:
  - Form to link teacher ID to specific Grade, Subject, and Class.

### Interactive Elements & Actions
- **Open Assign Modal**: `(click)="openAssignModal(teacher)"`.
- **Submit Assignment**: `assignTeacherToClass(payload)`.
- **View Teacher Analytics**: Navigates to class analytics for teacher's subjects.

### State & Signals
- `teachers = signal<TeacherDto[]>([])`
- `isLoading = signal<boolean>(true)`
- `selectedTeacher = signal<TeacherDto | null>(null)`
- `isAssignModalOpen = signal<boolean>(false)`
- **Injected Services**: `AcademicApiService`, `ToastService`.

---

## 3.4 Academic Structure Management (`AcademicManagementComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/academic`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'الهيكل الأكاديمي' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/academic-management/academic-management.html`

### UI Sections & Visual States
- **4-Tab Navigation Header**:
  - Tab 1: "المراحل الدراسية" (Grades).
  - Tab 2: "المواد الدراسية" (Subjects).
  - Tab 3: "الفصول" (Classes).
  - Tab 4: "التخصصات" (Specializations).
- **Tab 1: Grades Table**:
  - Name, Arabic Name, Order index, Total subjects count, Action buttons (Edit, Delete).
- **Tab 2: Subjects Table**:
  - Subject Name, Arabic Name, Grade assignment, Specialization tag, Pass mark, Action buttons.
- **Tab 3: Classes Table**:
  - Class Name, Grade, Academic Year, Max Capacity, Enrolled Students count, Action buttons.
- **Tab 4: Specializations Table**:
  - Specialization Name, Assigned Teachers count, Action buttons.
- **CRUD Modals**:
  - Create / Edit Grade Modal.
  - Create / Edit Subject Modal.
  - Create / Edit Class Modal.
  - Create / Edit Specialization Modal.

### Interactive Elements & Actions
- **Switch Tab**: `(click)="activeTab.set('grades' | 'subjects' | 'classes' | 'specializations')"`.
- **Open Create Modal**: `openCreateModal()`.
- **Open Edit Modal**: `openEditModal(item)`.
- **Delete Item**: `deleteItem(item)` with `ConfirmDialogService` confirmation.
- **Modal Form Submissions**: `saveGrade()`, `saveSubject()`, `saveClass()`, `saveSpecialization()`.

### State & Signals
- `activeTab = signal<'grades' | 'subjects' | 'classes' | 'specializations'>('grades')`
- `grades = signal<GradeDto[]>([])`
- `subjects = signal<SubjectDto[]>([])`
- `classes = signal<ClassDto[]>([])`
- `specializations = signal<SpecializationDto[]>([])`
- `isModalOpen = signal<boolean>(false)`
- `editingItem = signal<any>(null)`
- **Injected Services**: `AcademicApiService`, `ConfirmDialogService`, `ToastService`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Form modal needs clear relational dependency validation (e.g. creating a class requires picking a grade first).

---

## 3.5 Class Performance Analytics (`AdminPerformanceComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/performance`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'أداء الفصول' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-performance/admin-performance.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-performance/admin-performance.html`

### UI Sections & Visual States
- **Selection Controls Bar**:
  - Grade selector dropdown.
  - Class selector dropdown.
  - Academic term selector dropdown.
- **Performance Overview Stats**:
  - Class GPA average.
  - Overall Pass Rate percentage.
  - Attendance Rate percentage.
- **Subject Mastery Bar Chart**:
  - Visual bars comparing average scores across all subjects for the chosen class.
- **At-Risk Students Table**:
  - Filtered list of students with scores below threshold (<50%) or low attendance (<75%).

### Interactive Elements & Actions
- **Change Class/Grade**: `(change)="onFilterChange()"`.
- **Export CSV Report**: `(click)="exportPerformanceCsv()"`.

### State & Signals
- `selectedGradeId = signal<number | null>(null)`
- `selectedClassId = signal<number | null>(null)`
- `performanceData = signal<any>(null)`
- `isLoading = signal<boolean>(false)`
- **Injected Services**: `AdminApiService`, `AcademicApiService`.

---

## 3.6 Content Moderation Queue (`AdminContentComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/content-moderation`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'مراقبة المحتوى' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/content-moderation/content.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/content-moderation/content.component.html`

### UI Sections & Visual States
- **Queue Filter Tabs**:
  - "المستندات والملفات" (Uploaded PDFs & Teacher materials).
  - "الرسائل المبلغ عنها" (Reported Chat Messages).
- **Items Review Table / Cards**:
  - Uploader / Sender information.
  - Upload Timestamp.
  - Content Preview (inline PDF viewer trigger or flagged text excerpt).
  - Moderation Reason tag (Auto-flagged AI, User Report, Suspicious Link).
  - Status Pills: "معلق", "معتمد", "مرفوض".
- **Rejection Reason Modal**:
  - Allows admin to provide an explanation sent back to the content creator.

### Interactive Elements & Actions
- **Approve Item**: `(click)="approveContent(item.id)"`.
- **Reject Item**: `(click)="openRejectModal(item)"` -> enters reason -> `confirmReject()`.
- **Preview Document**: `(click)="previewFile(item.fileUrl)"`.

### State & Signals
- `moderationQueue = signal<any[]>([])`
- `activeTab = signal<'files' | 'messages'>('files')`
- `selectedItem = signal<any>(null)`
- `isRejectModalOpen = signal<boolean>(false)`
- `rejectReason = signal<string>('')`
- **Injected Services**: `AdminApiService`, `ToastService`.

---

## 3.7 Subscriptions & Payments (`AdminSubscriptionsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/subscriptions`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'الاشتراكات والمدفوعات' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/subscriptions/subscriptions.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/subscriptions/subscriptions.component.html`

### UI Sections & Visual States
- **Transactions & Subscriptions Table**:
  - Columns: الطالب (Student Name), ولي الأمر (Parent Name), الباقة (Plan Name), المبلغ (Amount + Currency), طريقة الدفع (Stripe / Manual), المعرف المرجعي (Stripe Payment ID), تاريخ المعاملة (Date), الحالة (Paid, Refunded, Cancelled).
- **Search & Filter Controls**:
  - Search by student name or Stripe transaction ID.
  - Status filter dropdown.
- **Manual Grant Modal**:
  - Button "تفعيل اشتراك يدوي" (Manually Activate Subscription) opening modal to grant a student access without credit card charge (e.g. for scholarships).

### Interactive Elements & Actions
- **Manual Activation Form**: `(ngSubmit)="grantManualSubscription()"` submits student ID, plan ID, and duration.
- **Refund / Cancel Subscription**: `(click)="refundSubscription(item.id)"` prompts confirmation dialog.

### State & Signals
- `subscriptions = signal<any[]>([])`
- `isLoading = signal<boolean>(true)`
- `isManualModalOpen = signal<boolean>(false)`
- `manualForm: FormGroup`
- **Injected Services**: `AdminApiService`, `ConfirmDialogService`, `ToastService`.

---

## 3.8 Subscription Plans Configuration (`AdminPlansComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/plans`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'إدارة الباقات' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-plans/admin-plans.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-plans/admin-plans.html`

### UI Sections & Visual States
- **Plan Cards Grid**:
  - Plan Card: Title (Arabic & English), Price & Currency, Billing period (Monthly / Yearly), Stripe Price ID, Feature checklist items (`hasLiveClass`, max subjects).
  - Status toggle switch (Active / Inactive).
- **Plan Creator / Editor Modal**:
  - Inputs: Plan Name AR/EN, Price, Currency, Duration in Days, Feature checkboxes (`hasLiveClass`, AI limits), Stripe Product & Price IDs.

### Interactive Elements & Actions
- **Create Plan**: `openCreateModal()`.
- **Edit Plan**: `openEditModal(plan)`.
- **Toggle Plan Active**: `(change)="togglePlan(plan)"`.
- **Save Plan**: `savePlan()`.

### State & Signals
- `plans = signal<PlanDto[]>([])`
- `isModalOpen = signal<boolean>(false)`
- `planForm: FormGroup`
- **Injected Services**: `AdminApiService`, `ToastService`.

---

## 3.9 School Master Schedule (`AdminScheduleComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/schedule`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'الجدول المدرسي' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-schedule/admin-schedule.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/components/admin-schedule/admin-schedule.component.html`

### UI Sections & Visual States
- **Grade & Class Filter Tabs**:
  - Select Grade -> Select Class.
- **Weekly Schedule Grid**:
  - 5 Days columns (الأحد إلى الخميس).
  - Time slots rows (08:00 AM to 03:00 PM).
  - Slot Block: Subject badge, Teacher name, Room name / Live link indicator, Edit/Delete icon triggers.
- **Session Slot Modal**:
  - Form to add new session slot: Day of week, Start time, End time / duration, Subject, Teacher.

### Interactive Elements & Actions
- **Click Empty Slot**: `openAddSlotModal(day, time)`.
- **Edit Slot**: `openEditSlotModal(slot)`.
- **Delete Slot**: `deleteSlot(slotId)`.

### State & Signals
- `classes = signal<ClassDto[]>([])`
- `selectedClassId = signal<number | null>(null)`
- `scheduleSlots = signal<any[]>([])`
- `isModalOpen = signal<boolean>(false)`
- **Injected Services**: `AdminApiService`, `AcademicApiService`.

---

## 3.10 Platform AI Analytics (`PlatformAnalyticsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/platform-analytics`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'تحليلات الذكاء الاصطناعي' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/pages/platform-analytics/platform-analytics.component.ts`

### UI Sections & Visual States
- **AI KPI Row**:
  - Total LLM Tokens Used.
  - Average AI Generation Latency (seconds).
  - Total Monthly Reports Generated.
  - Total AI Questions Generated.
- **Token Consumption Breakdown Chart**:
  - Bar or donut visual distribution of tokens consumed by service (Parent Report vs Question Bank vs Student Insights).
- **Recent AI Prompts & Error Log**:
  - Log of failed LLM generations with status codes and retry buttons.

### Interactive Elements & Actions
- **Date Range Toggle**: `(click)="setDateRange('7d' | '30d' | 'all')"`.
- **Refresh**: `(click)="loadAnalytics()"`.

### State & Signals
- `analyticsData = signal<any>(null)`
- `dateRange = signal<'7d' | '30d' | 'all'>('30d')`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `AiAnalyticsService`.

---

## 3.11 Grade Heatmap (`GradeHeatmapComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/heatmap/:gradeId`, route parameter `:gradeId`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'خريطة الأداء الحرارية' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/pages/grade-heatmap/grade-heatmap.component.ts`

### UI Sections & Visual States
- **Header**: Grade Title and color scale legend (Green: >=75%, Amber: 50-74%, Red: <50%).
- **2D Matrix Heatmap Table**:
  - Rows: Classes in the selected grade.
  - Columns: Enrolled subjects.
  - Cell: Color-shaded tile displaying class average percentage.
  - Hover popover: Displays count of weak topics and top 3 error concepts.

### Interactive Elements & Actions
- **Click Heatmap Cell**: Navigates directly to `/dashboard/teacher/analytics/:classId/:subjectId`.
- **Grade Selector Switch**: Jumps to another grade heatmap.

### State & Signals
- `gradeId = signal<number>(0)`
- `heatmapData = signal<any>(null)`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `AiAnalyticsService`, `ActivatedRoute`, `Router`.

---

## 3.12 System Prompt Editor (`PromptEditorComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/admin/prompt-editor`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Admin'], breadcrumb: 'محرر توجيهات الذكاء الاصطناعي' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/admin/pages/prompt-editor/prompt-editor.component.ts`

### UI Sections & Visual States
- **Prompt Selector Dropdown**:
  - Options: "تقرير ولي الأمر الشهري", "توليد أسئلة الاختبارات", "اقتراحات التدريس للمعلم", "تحليل نقاط ضعف الطالب".
- **Template Code/Text Editor**:
  - Monospace textarea with syntax highlight background for placeholder tokens (`{{student_name}}`, `{{weak_topics}}`, `{{class_average}}`).
- **Token Reference Sidebar**:
  - Clickable token chips that insert the placeholder variable into the editor at cursor position.
- **Test Sandbox Runner**:
  - Input: Test Student ID or Class ID.
  - "تجربة التوليد" (Test Prompt) button.
  - Output box displaying raw LLM response.

### Interactive Elements & Actions
- **Save Prompt Template**: `(click)="savePrompt()"`.
- **Insert Token**: `(click)="insertToken(token)"`.
- **Run Sandbox Test**: `(click)="runTestPrompt()"`.

### State & Signals
- `selectedPromptKey = signal<string>('ParentMonthlyReport')`
- `promptContent = signal<string>('')`
- `testOutput = signal<string>('')`
- `isSaving = signal<boolean>(false)`
- `isTesting = signal<boolean>(false)`
- **Injected Services**: `AiAnalyticsService`, `ToastService`.
