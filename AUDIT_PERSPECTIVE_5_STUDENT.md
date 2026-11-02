# UI & Functionality Inventory — Perspective 5: Student Perspective

> **Audit Scope**: Covers all routes, routed components, interactive states, signals, and templates within the Student portal under `/dashboard/student/*`. Grounded strictly in Angular 19+ standalone components, signals, `ExamAttemptStore`, and reactive flows.

---

## 1. Student Dashboard (`StudentDashboardPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student` (or `/dashboard/student/dashboard` which redirects to `''`)
  - Guard: Parent route `AuthGuard` (`allowedRoles: ['Student', 'Admin']`)
  - Breadcrumb: `'لوحة الطالب'`
- **File Paths**:
  - TypeScript: [dashboard.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/dashboard/dashboard.component.ts)
  - Template: [dashboard.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/dashboard/dashboard.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"لوحة تحكم الطالب"`, Refresh button with loading spinner/text (`"تحديث"` / `"جارٍ التحميل..."`).
  - **Loading Skeleton**: `@if (isLoading())`: 4-card grid with pulsing skeletons (`animate-pulse`).
  - **Error Banner**: `@else if (errorMessage())`: Rose-themed error container (`bg-rose-50 border-rose-200`) with error description and `"إعادة المحاولة"` retry button.
  - **Dashboard Content**: `@else if (data(); as dashboard)`:
    - **KPI Summary Cards (`<app-student-dashboard-cards>`): Profile, class name, course count, attendance rate, GPA/performance indicators, schedule count.
    - **Attendance Section (`<app-student-attendance-summary>`): Left 2-column widget showing attendance percentage, attended/absent session breakdown.
    - **Upcoming Schedule Widget**: Right 1-column card titled `"الجدول القادم"` with `"عرض الكل"` router link to `schedule`.
      - Displays up to 3 upcoming sessions via `<app-student-schedule-card>`.
      - Empty state: Blue-tinted card with calendar icon and `"لا توجد جلسات قادمة مجدولة."`.
    - **Recent Courses Widget**: Bottom card titled `"أحدث المقررات"` with `"عرض الكل"` router link to `courses`.
      - Grid of up to 4 `<app-student-course-card>` elements displaying subject title, teacher name, progress bar, and grade stats.
      - Empty state: Blue-tinted empty card if no courses enrolled.
- **Interactive Elements & Actions**:
  - `(click)="loadDashboard()"`: Triggered by header refresh button or error retry button.
  - `(joinSession)="joinSession($event)"`: Triggered from schedule card; navigates to `/dashboard/student/sessions/:id/live`.
- **State & Signals**:
  - `data = signal<StudentDashboardData | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `actionMessage = signal<string | null>(null)`
  - `recentCourses = computed(() => this.data()?.courses.slice(0, 4) ?? [])`
  - `upcomingSchedule = computed(() => this.data()?.schedule.slice(0, 3) ?? [])`
  - Injected: `StudentService`, `Router`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The schedule widget empty state is set with `dir="ltr"` in an RTL interface, flipping the icon and text alignment.
  - Course cards and schedule widgets need modern subtle elevation, progress bars with gradient fills, and live session pulse indicators.

---

## 2. Student Courses Catalog (`StudentCoursesPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/courses`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'دروسي'`
- **File Paths**:
  - TypeScript: [courses.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/courses/courses.component.ts)
  - Template: [courses.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/courses/courses.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"مقرراتي الدراسية"`, refresh button, subtitle showing enrolled count.
  - **Loading Skeleton**: Grid of skeleton card place-holders.
  - **Error Container**: Detailed error text with retry action button.
  - **Course Detail Header/Card**: Hero banner highlighting the currently selected subject (`selectedCourse()`) with teacher info, grade status, and quick links to content library and assignments.
  - **Courses Grid**: Grid of `<app-student-course-card>` cards representing all enrolled subjects.
    - Each card displays subject name, code, teacher, progress percentage, total lessons, and action buttons.
  - **Empty State**: Illustrated placeholder when the student is not enrolled in any subjects.
- **Interactive Elements & Actions**:
  - `(click)="selectCourse(course)"`: Selects course to display in hero overview.
  - `(click)="loadCourses()"`: Refreshes course list from backend.
- **State & Signals**:
  - `courses = signal<StudentCourse[]>([])`
  - `selectedSubjectId = signal<StudentEntityId | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `selectedCourse = computed(() => ...)`: Finds active course by ID or falls back to index 0.
  - Injected: `StudentService`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Console log left on line 58 (`console.log(courses)`).
  - Selected course hero banner could be integrated into an intuitive split master-detail view or sleek interactive tabs.

---

## 3. Student Content Library (`StudentContentPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/content` (alias `/dashboard/student/library`)
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'مكتبة الدروس'`
- **File Paths**:
  - TypeScript: [content.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/content/content.component.ts)
  - Template: [content.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/content/content.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title with total item counter badge computed via `totalItems()`, back button (`goBack()`).
  - **Content Group Accordions / Lists**: Grouped by Subject / Unit.
    - For each item: Icon based on type (`Video`, `PDF`, `Document`, `Audio`, `Link`), title, upload date (via `DatePipe`), source badge (`AzureBlob` vs external link).
  - **Video Modal Player**: `@if (isVideoModalOpen())`:
    - Full-screen or modal backdrop.
    - Embedded sanitized player `<iframe [src]="selectedVideoUrl()">` for YouTube links or direct `<video>` element for Azure Blob storage URLs.
    - Close button and modal backdrop dismissal.
  - **Empty / Error States**: Skeletons on loading; custom empty state if no content has been uploaded by teachers.
- **Interactive Elements & Actions**:
  - `(click)="goBack()"`: Location back navigation.
  - `(click)="openResource(item)"`: Detects video vs document; if blob, fetches SAS token download URL via `getDownloadUrl()`; if YouTube, converts watch link to embed link and opens modal; if PDF/doc, opens in external browser tab.
  - `(click)="isVideoModalOpen.set(false)"`: Dismisses video player modal.
- **State & Signals**:
  - `groups = signal<StudentContentGroup[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `isVideoModalOpen = signal<boolean>(false)`
  - `selectedVideoUrl = signal<SafeResourceUrl | null>(null)`
  - `selectedVideoIsBlob = signal<boolean>(false)`
  - `totalItems = computed(() => ...)`
  - Injected: `StudentService`, `DomSanitizer`, `Location`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Video modal needs backdrop blur (`backdrop-blur-md`), responsive 16:9 aspect ratio container, and dedicated media error fallbacks.

---

## 4. Student Lessons & Units Explorer (`StudentLessonsComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/lessons`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الدروس والوحدات'`
- **File Paths**:
  - TypeScript: [student-lessons.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/student-lessons/student-lessons.component.ts)
  - Template: [student-lessons.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/student-lessons/student-lessons.component.html)
- **UI Sections & Visual States**:
  - **Breadcrumb & Header**: Standard breadcrumb bar, page title, subject dropdown selector (`<select (change)="onSelectSubject($event)">`).
  - **Lesson Accordion List**:
    - Each lesson card displays lesson title, unit name, order index, and expand/collapse caret.
  - **Lesson Details Expansion**: `@if (expandedLessonId === lesson.id)`:
    - Detailed description, learning objectives.
    - Associated attachments and digital content items with download / view buttons.
    - Direct link to launch lesson assignments or related exams.
  - **Empty States**:
    - "Select a subject first" prompt before choosing a course.
    - "No lessons added yet for this course" when course has 0 lessons.
- **Interactive Elements & Actions**:
  - `(click)="goBack()"`: Returns to previous view.
  - `(change)="onSelectSubject($event)"`: Loads lessons for selected subject ID.
  - `(click)="toggleDetails(lesson.id)"`: Lazily fetches `getLessonDetail(lessonId)` if not cached, then toggles accordion open/closed.
  - `(click)="openContent(url)"`: Opens lesson document in new tab.
- **State & Properties**:
  - `subjects: any[] = []`
  - `selectedSubjectId: number | null = null`
  - `lessons: Lesson[] = []`
  - `lessonDetails: { [key: number]: LessonDetail } = {}`
  - `expandedLessonId: number | null = null`
  - Injected: `StudentLessonsService`, `HttpClient`, `Location`, `ChangeDetectorRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Still uses traditional properties with manual `ChangeDetectorRef.detectChanges()` instead of Angular signals.
  - Needs conversion to signals (`signal<Lesson[]>`) to align with Phases 1–4 reactive architecture.

---

## 5. Student Assignments Portal (`StudentAssignmentsPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/assignments`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الواجبات'`
- **File Paths**:
  - TypeScript: [assignments.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/assignments/assignments.component.ts)
  - Template: [assignments.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/assignments/assignments.component.html)
- **UI Sections & Visual States**:
  - **Master-Detail Layout**:
    - **Right Panel (Assignment List)**:
      - Subject grouping with total assignment count badge.
      - Assignment item card: Title, due date (formatted with `DatePipe`), submission status badge (`Pending`, `Submitted`, `Graded`, `Overdue`).
      - Pagination controls: `currentPage()`, `totalPages()`, previous/next buttons.
    - **Left Panel (Active Assignment Workspace)**:
      - Selected assignment header: Title, subject, teacher name, deadline banner with countdown indicator.
      - Assignment description & attached files (download links).
      - **Submission Form**:
        - Text answer `<textarea [(ngModel)]="answerText">`.
        - File upload drag-and-drop zone with selected filename and size preview.
        - Submit button with spinner (`isSubmitting()`).
        - Feedback / Grade Box: If already graded, displays teacher score and written feedback.
  - **Status Banners**: Action messages (`actionMessage()`), error alert containers.
- **Interactive Elements & Actions**:
  - `(click)="selectAssignment(assignment)"`: Switches active assignment in left pane.
  - `(change)="onFileSelected($event)"`: Captures file for attachment upload.
  - `(click)="submitAssignment()"`: Calls `studentService.submitAssignment(...)` with text/file payload.
  - `(click)="nextPage()"` / `(click)="prevPage()"`: Paginates assignment groups.
- **State & Signals**:
  - `groups = signal<StudentAssignmentGroup[]>([])`
  - `selectedAssignmentId = signal<StudentEntityId | null>(null)`
  - `answerText = signal<string>('')`
  - `selectedFile = signal<File | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `isSubmitting = signal<boolean>(false)`
  - `errorMessage = signal<string | null>(null)`
  - `actionMessage = signal<string | null>(null)`
  - `currentPage = signal<number>(1)`, `pageSize = signal<number>(5)`
  - `paginatedGroups = computed(() => ...)`, `totalPages = computed(() => ...)`
  - `totalAssignments = computed(() => ...)`, `selectedAssignment = computed(() => ...)`
  - Injected: `StudentService`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Two-column layout requires responsive collapse on mobile screens into tabbed or drawer views.
  - File drag-and-drop zone needs animated states (hover, file detected, upload progress).

---

## 6. Student Exams & Live Testing Engine (`StudentExamsPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/exams` (also redirect from `/dashboard/student/exams/:id`)
  - Guard: `canDeactivateGuard` (prevents navigating away while an exam attempt is in progress)
  - Breadcrumb: `'الاختبارات'`
- **File Paths**:
  - TypeScript: [exams.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.ts)
  - Template: [exams.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exams/exams.component.html)
- **UI Sections & Visual States**:
  - **Mode 1: Exam Selection & Information Screen** (when `!store.exam()`):
    - Subject grouped exam list with status pills (`Upcoming`, `Available`, `Completed`, `Missed`).
    - Paginated groups with `currentPage()` and `totalPages()`.
    - Exam detail preview panel: Title, duration (minutes), passing score, total questions, instructions list.
    - Start Exam CTA: Primary button `"بدء الاختبار"` with loading spinner (`isStarting()`).
    - Past Result Card: If student already submitted, displays score badge via `<app-score-badge>` and button to view full breakdown (`exams/result/:id`).
  - **Mode 2: Active Exam Taking Engine** (when `store.exam()` is active):
    - **Sticky Header**:
      - Exam title and current subject.
      - Real-time countdown timer via `<app-exam-timer>` (triggers `onTimerWarning()` at 5 mins and auto-submits on timeout).
      - Auto-save indicator: Visual dot/badge showing local synchronization status.
      - Final Submit Button: `"تسليم الاختبار"` (opens confirmation modal).
    - **Question Stepper / List**:
      - Question navigator bar showing numbered question bubbles with answered vs unvisited states.
      - Active Question Container: Rendered via `<app-question-renderer>` supporting Single Choice, Multiple Choice, True/False, and Essay/Text inputs.
    - **Confirmation Modal**: `@if (showSubmitConfirm())`:
      - Dialog asking to confirm submission, warning of unanswered questions.
      - Actions: `"تأكيد التسليم"` (`confirmSubmit()`) vs `"إلغاء والعودة"` (`cancelSubmit()`).
    - **Timer Warning Modal / Toast**: Triggered when under 5 minutes remaining.
- **Interactive Elements & Actions**:
  - `(click)="selectExam(exam)"`: Selects exam to preview.
  - `(click)="startSelectedExam()"`: Calls `studentService.startExam(...)`, initializes `ExamAttemptStore`.
  - `(answerChange)="onAnswerChange($event)"`: Updates answers in reactive `ExamAttemptStore` with debounced auto-save.
  - `(click)="submitActiveExam()"`: Prompts confirmation modal; `confirmSubmit()` flushes store and submits exam.
  - `canDeactivate()` & `beforeunload` listener: Guard blocks tab closure or back button while test is running.
- **State & Signals**:
  - Store: `ExamAttemptStore` (manages exam state, answers, timer, auto-saving)
  - `groups = signal<StudentExamGroup[]>([])`
  - `selectedExamId = signal<StudentEntityId | null>(null)`
  - `examResult = signal<StudentExamResult | null>(null)`
  - `isLoading = signal<boolean>(true)`, `isStarting = signal<boolean>(false)`, `isSubmitting = signal<boolean>(false)`
  - `showSubmitConfirm = signal<boolean>(false)`, `showTimerWarning = signal<boolean>(false)`
  - `currentPage = signal<number>(1)`, `pageSize = signal<number>(5)`
  - `paginatedGroups = computed(...)`, `selectedExam = computed(...)`
  - Injected: `StudentService`, `ConfirmDialogService`, `ExamAttemptStore`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The exam taking screen is a mission-critical high-stress UI. It needs distraction-free full-width layout that hides the sidebar and header during the exam.
  - Auto-save feedback needs an unobtrusive floating indicator (green checkmark for "تم الحفظ", yellow for "جارٍ الحفظ").

---

## 7. Student Exam Result Breakdown (`StudentExamResultPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/exams/result/:id`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'نتيجة الاختبار'`
- **File Paths**:
  - TypeScript: [exam-result.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exam-result/exam-result.component.ts)
  - Template: [exam-result.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/exam-result/exam-result.component.html)
- **UI Sections & Visual States**:
  - **Header & Navigation**: Breadcrumb bar with back navigation button (`goBack()`).
  - **Score Summary Hero Banner**:
    - Large circular or pill percentage score.
    - Pass/Fail status banner with icon (`passed` vs `failed`).
    - Key metrics: Total marks obtained vs max marks, percentage, duration taken, completion date.
  - **Question-by-Question Audit Breakdown**:
    - Each question card displays question number, text, max points, and status badge:
      - `Correct`: Emerald pill (`ring-emerald-600/20`).
      - `Incorrect`: Rose pill (`ring-rose-600/20`).
      - `PendingReview`: Amber pill (`ring-amber-600/20`) for manual essay grading.
      - `PartiallyCorrect`: Blue pill (`ring-blue-600/20`).
    - Student's submitted answer vs correct answer (if allowed by teacher settings).
    - Teacher written feedback / explanation note.
  - **Loading & Error States**: Pulsing skeleton and error card with reload button.
- **Interactive Elements & Actions**:
  - `(click)="goBack()"`: Returns to previous exams list.
  - `(click)="loadResult(id)"`: Reloads results.
  - Helper functions: `getBadgeClass(status)`, `getStatusText(status)`.
- **State & Signals**:
  - `result = signal<StudentExamResult | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `error = signal<string | null>(null)`
  - Injected: `ActivatedRoute`, `StudentService`, `Location`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Status badges currently use hard-coded Tailwind classes inside component methods; should use unified design tokens.
  - Needs a confetti/celebration animation for high scores (>= 90%) to enhance student gamification.

---

## 8. Student Grades & Transcript (`StudentGradesPageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/grades`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الدرجات'`
- **File Paths**:
  - TypeScript: [grades.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/grades/grades.component.ts)
  - Template: [grades.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/grades/grades.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"سجل الدرجات والاختبارات"`, subtitle explaining evaluation standards.
  - **Loading & Error Banners**: Standard loading skeleton and error alert.
  - **Grades Data Table / Card Grid**:
    - Subject Name, Exam Title, Date of submission.
    - Score / Max Score with percentage badge.
    - Status indicator (`مكتمل`, `قيد التصحيح`).
    - Action column: Button `"عرض التفاصيل"` navigating directly to exam breakdown.
  - **Empty State**: Friendly illustration when no exams have been graded yet.
- **Interactive Elements & Actions**:
  - `(click)="viewDetails(studentExamId)"`: Routes to `/dashboard/student/exams/result/:id`.
  - `(click)="loadGrades()"`: Refreshes grades list.
- **State & Signals**:
  - `grades = signal<StudentExamGrade[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `error = signal<string | null>(null)`
  - Injected: `StudentService`, `Router`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - English error string hardcoded on line 36 (`'Failed to load exam grades.'`) in an Arabic portal.
  - Needs subject filtering dropdown and sorting by date or grade.

---

## 9. Student Attendance Records (`StudentAttendancePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/attendance`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'سجل الحضور'`
- **File Paths**:
  - TypeScript: [attendance.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/attendance/attendance.component.ts)
  - Template: [attendance.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/attendance/attendance.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"سجل الحضور والغياب"`.
  - **Attendance Summary KPI Card (`<app-student-attendance-summary>`):
    - Overall attendance percentage ring chart.
    - Statistics: Present sessions count, absent sessions count, late sessions count, excused sessions.
  - **Subject-by-Subject Attendance Breakdown**:
    - Table / Cards displaying attendance rate per enrolled subject.
    - Dynamic percentage badge styled via `percentageBadgeClass(percentage)`:
      - Emerald for `>= 85%` (Good standing).
      - Amber for `60% - 84%` (Warning zone).
      - Rose for `< 60%` (Critical absence rate).
  - **Session Log Table**:
    - Date, Session Title, Subject, Status pill (حاضر, غائب, متأخر, معذور), Remarks.
- **Interactive Elements & Actions**:
  - `(click)="loadAttendance()"`: Reloads attendance data.
  - `percentageBadgeClass(percentage)`: Helper computing color coding.
- **State & Signals**:
  - `summary = signal<StudentAttendanceSummary | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `subjects = computed(() => this.summary()?.subjects ?? [])`
  - Injected: `StudentService`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Needs calendar heat-map view similar to GitHub commit grid to visualize attendance streaks over months.

---

## 10. Student Academic Performance Analytics (`StudentPerformancePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/performance`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الأداء الأكاديمي'`
- **File Paths**:
  - TypeScript: [performance.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/performance/performance.component.ts)
  - Template: [performance.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/performance/performance.component.html)
- **UI Sections & Visual States**:
  - **Breadcrumb & Header Bar**: Title `"الأداء الأكاديمي والتحليلي"`, link banner to Smart AI Insights (`/dashboard/student/insights`).
  - **Performance Overview Cards**:
    - Average Grade KPI: Large percentage display computed via `averageGrade()`.
    - Total subjects tracked, best performing subject, subject needing attention.
  - **Interactive Chart (`<app-performance-chart>`):
    - Visual bar chart fed by `chartData()` computing scores per subject.
  - **Detailed Grades Table (`<app-student-performance-table>`):
    - Columns: Subject, Coursework Mark, Midterm, Final Exam, Total Grade, Letter Grade, Academic standing.
- **Interactive Elements & Actions**:
  - `(click)="loadPerformance()"`: Triggers `forkJoin` loading grades and performance.
  - Router link navigating to AI Insights page.
- **State & Signals**:
  - `grades = signal<StudentGrade[]>([])`
  - `performance = signal<StudentPerformance[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `chartData = computed(() => ...)`: Maps performance array to `{ label, value, max: 100 }`.
  - `averageGrade = computed(() => ...)`: Computes weighted or arithmetic average.
  - Injected: `StudentService`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The performance chart is canvas/SVG based and requires full dark/light theme color token alignment.

---

## 11. Student Weekly Schedule (`StudentSchedulePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/schedule`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الجدول الأسبوعي'`
- **File Paths**:
  - TypeScript: [schedule.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/schedule/schedule.component.ts)
  - Template: [schedule.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/schedule/schedule.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"الجدول الأسبوعي للدروس والحصص"`.
  - **Week Selection Bar**:
    - Dropdown `<select [ngModel]="selectedWeek()" (change)="onWeekChange($event)">` populated with all 52 academic weeks via `academicWeeks()`.
    - Next / Previous week quick navigation arrow buttons.
  - **Weekly Timetable Grid (`<app-weekly-calendar>`):
    - 7-day calendar columns (Sunday to Thursday active, Friday/Saturday weekend indicator).
    - Session blocks showing subject name, teacher name, start/end time, room/live link.
    - Live session highlight with animated pulse badge if session is ongoing right now.
  - **Empty Week State**: Clean empty state when no classes are scheduled for the selected week.
- **Interactive Elements & Actions**:
  - `(change)="onWeekChange($event)"`: Updates `selectedWeek` signal and queries schedule.
  - `(sessionClick)="openSessionLiveRoom($event)"`: Navigates to `/dashboard/student/sessions/:id/live`.
- **State & Signals**:
  - `sessions = signal<StudentScheduleSession[]>([])`
  - `calendarSessions = signal<CalendarSession[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `selectedWeek = signal<string>(this.getCurrentWeekStr())`
  - `academicWeeks = computed(...)`, `weekStart = computed(...)`
  - Injected: `StudentService`, `Router`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Calendar grid must be fully responsive on mobile screens by switching from a 7-column desktop view to a swipeable day-by-day carousel.

---

## 12. Student Live Classroom Session (`LiveRoomComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/sessions/:id/live`
  - Guard: `canDeactivateGuard`
  - Data: `{ role: 'student', breadcrumb: 'الحصة المباشرة' }`
- **File Paths**:
  - TypeScript: [live-room.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/shared/components/live-room/live-room.component.ts)
  - Template: [live-room.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/shared/components/live-room/live-room.component.html)
- **UI Sections & Visual States**:
  - **Student Classroom Shell**:
    - Top Status Bar: Session title, teacher name, duration timer, connection quality pill.
    - Central Video / Stream Area: Teacher's video feed or shared whiteboard / screen.
    - Audio/Video control toggle bar (disabled/restricted based on teacher permissions).
    - **Hand-Raise Feature**: Button `"رفع اليد"` to request permission to speak.
    - **Live Session Chat**: Side-panel for in-session questions and announcements.
  - **Leave Session Confirmation Dialog**: Triggers `canDeactivate` to ensure student does not exit by accident.
- **Interactive Elements & Actions**:
  - `toggleAudio()`, `toggleVideo()`
  - `raiseHand()`: Sends SignalR notification to teacher.
  - `leaveRoom()`: Exits live session and redirects back to schedule.
- **State & Signals**:
  - Role-conditioned signals (`role === 'student'`).
  - Active participant state, connection state (`connected`, `reconnecting`, `disconnected`).
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Dark mode theatre styling is essential for video streaming comfort.

---

## 13. Student Profile & Academic Record (`StudentProfilePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/profile`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'الملف الشخصي'`
- **File Paths**:
  - TypeScript: [profile.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/profile/profile.component.ts)
  - Template: [profile.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/profile/profile.component.html)
- **UI Sections & Visual States**:
  - **Student ID Card Banner**:
    - Avatar, full name, national ID / student code, grade and class name.
    - Academic Year badge.
  - **Personal Details Card**: Email, phone number, date of birth, guardian name, guardian contact.
  - **Academic Standing Card**:
    - Top subject badge computed via `topGrade()`.
    - Total completed credits / courses.
    - Cumulative GPA badge.
- **Interactive Elements & Actions**:
  - `(click)="loadProfile()"`: Refreshes student profile and class details.
- **State & Signals**:
  - `profile = signal<StudentProfile | null>(null)`
  - `classInfo = signal<StudentClass | null>(null)`
  - `grades = signal<StudentGrade[]>([])`
  - `isLoading = signal<boolean>(true)`
  - `errorMessage = signal<string | null>(null)`
  - `topGrade = computed(() => ...)`
  - Injected: `StudentService`, `DestroyRef`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Read-only profile; student cannot edit contact info directly without contacting admin or guardian. Clear guidance text is needed.

---

## 14. Student AI Learning Insights (`LearningInsightsComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/student/insights`
  - Guard: Parent `AuthGuard`
  - Breadcrumb: `'رؤى التعلم'`
- **File Paths**:
  - TypeScript: [learning-insights.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/student/pages/learning-insights/learning-insights.component.ts)
  - Template: Inline template inside `learning-insights.component.ts`
- **UI Sections & Visual States**:
  - **Header Bar**: Sparkle icon, title `"رؤى التعلم الذكية"`, subtitle describing AI weakness and strength analysis.
  - **Performance Link Banner**: Gradient banner with button linking to `/dashboard/student/performance`.
  - **Active Alerts Section**: `@if (data()!.activeAlerts.length > 0)`:
    - Alert cards with colored borders:
      - Low Exam Score: Red border (`border-r-red-500`) with pencil icon.
      - Low Attendance: Amber border (`border-r-amber-500`) with clock icon.
      - Missed Assignments: Blue border (`border-r-blue-500`) with clipboard icon.
    - Subject tag, alert message.
  - **Weakness Analysis Grid**:
    - Subject cards with violet-indigo header showing subject name and generation date.
    - Error rate progress bars for specific topics:
      - `>= 50%` error rate: Red bar (`bg-red-500`) & badge.
      - `30% - 49%` error rate: Amber bar (`bg-amber-500`) & badge.
      - `< 30%` error rate: Blue bar (`bg-blue-500`) & badge.
    - AI Recommended Action bullets (`topic.recommendedActions`).
    - AI Narrative Summary paragraph.
    - Empty state: Checkmark icon with `"لم نرصد أي نقاط ضعف حتى الآن. أداء رائع!"`.
  - **AI Content Recommendations**:
    - Recommended resources cards: Icon based on type (`Video`, `Document`, `Quiz`), title, reason for recommendation, relevance score meter bar (`relevanceScore * 100`).
  - **Performance Trends Section**:
    - Subject performance cards with multi-point bar charts displaying score trajectories over dates.
- **Interactive Elements & Actions**:
  - `(click)="loadInsights()"`: Queries `AiAnalyticsService.getStudentInsights()`.
- **State & Signals**:
  - `data = signal<LearningInsightsDashboardDto | null>(null)`
  - `isLoading = signal<boolean>(true)`
  - `error = signal<string | null>(null)`
  - Injected: `AiAnalyticsService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - This is one of the most innovative screens in the application. In the Stitch redesign, the AI recommendation cards should have glassmorphic glow effects, animated progress meters, and single-click buttons to directly launch recommended videos or quizzes.

---

## Perspective 5 Summary & Visual Redesign Matrix

| # | Route Path | Component Name | Key Visual State Highlights | Prime Stitch Redesign Opportunity |
|---|---|---|---|---|
| 1 | `/dashboard/student` | `StudentDashboardPageComponent` | 4 KPI cards, Attendance summary, upcoming schedule, course cards | Live pulse badge on current session, gradient progress bars |
| 2 | `/dashboard/student/courses` | `StudentCoursesPageComponent` | Hero selected course banner, responsive course card grid | Seamless tabs or drawer for course syllabus |
| 3 | `/dashboard/student/content` | `StudentContentPageComponent` | Grouped items, media type icons, video modal player | Sleek 16:9 video player with backdrop blur |
| 4 | `/dashboard/student/lessons` | `StudentLessonsComponent` | Course selector, accordion units, attachment downloads | Upgrade to full signals with interactive timeline |
| 5 | `/dashboard/student/assignments` | `StudentAssignmentsPageComponent` | 2-column master-detail, submission form, grade feedback | Rich drag-and-drop zone with animated upload feedback |
| 6 | `/dashboard/student/exams` | `StudentExamsPageComponent` | Exam list, interactive test taking engine, countdown timer, auto-save | Distraction-free test mode hiding global header/sidebar |
| 7 | `/dashboard/student/exams/result/:id` | `StudentExamResultPageComponent` | Pass/Fail hero banner, colored question audit cards | Gamified confetti celebration for high grades |
| 8 | `/dashboard/student/grades` | `StudentGradesPageComponent` | Grades data table with quick link to exam results | Interactive subject filtering & GPA trend line |
| 9 | `/dashboard/student/attendance` | `StudentAttendancePageComponent` | Percentage ring chart, colored status badges, session log | GitHub-style monthly attendance streak matrix |
| 10 | `/dashboard/student/performance` | `StudentPerformancePageComponent` | Average grade KPI, bar chart, detailed grades table | Modern chart styling aligned with app palette |
| 11 | `/dashboard/student/schedule` | `StudentSchedulePageComponent` | Academic week selector (52 weeks), weekly calendar grid | Mobile day-by-day swipeable calendar card carousel |
| 12 | `/dashboard/student/sessions/:id/live` | `LiveRoomComponent` | Classroom stream, hand-raise button, in-room chat | Dark mode theatre styling with smooth audio/video controls |
| 13 | `/dashboard/student/profile` | `StudentProfilePageComponent` | Student ID card, personal info, academic standing | Polished ID badge card with verified student stamp |
| 14 | `/dashboard/student/insights` | `LearningInsightsComponent` | AI weakness analysis, topic error rates, recommendations | Glassmorphic cards with AI glowing accents |
