# Perspective 4: Teacher Perspective Audit
**Masarak Platform — Code-Grounded UI & Functionality Blueprint**

---

## 4.1 Teacher Home Dashboard (`TeacherComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'لوحة المعلم' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/teacherComponent/teacher.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/teacherComponent/teacher.html`

### UI Sections & Visual States
- **Top Greeting & Live Alert**:
  - Greeting text with teacher name.
  - Next Upcoming Session Banner: Session title, class, start time countdown, and "بدء الجلسة" (Start Live Class) primary button.
- **KPI Stats Row**:
  - Total Assigned Classes.
  - Total Enrolled Students.
  - Pending Submissions to Grade (with badge count).
  - Total Completed Sessions.
- **Quick Action Grid**:
  - "إنشاء اختبار جديد" -> `/dashboard/teacher/assessment/exams/create`
  - "بنك الأسئلة" -> `/dashboard/teacher/assessment/question-bank`
  - "تصحيح الواجبات والاختبارات" -> `/dashboard/teacher/assessment/grading`
  - "إدارة الدروس والوحدات" -> `/dashboard/teacher/lessons`
  - "جدول الحصص الأسبوعي" -> `/dashboard/teacher/sessions`
- **Recent Submissions Quick List**:
  - Table of latest student submissions waiting for evaluation.

### Interactive Elements & Actions
- **Start Next Session**: Navigates to `/dashboard/teacher/sessions/:id/live`.
- **Action Buttons**: Angular router links to assessment and course modules.

### State & Signals
- `dashboardData = signal<any>(null)`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `TeacherService`, `AuthStateService`, `Router`.

---

## 4.2 Teacher Courses & Content Management (`TeacherCourses`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/courses`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'المقررات والمحتوى' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-courses/teacher-courses.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-courses/teacher-courses.html`

### UI Sections & Visual States
- **Subject Selector Tabs**:
  - Horizontal tabs showing all assigned subjects for the logged-in teacher.
- **Upload Content Card**:
  - File Dropzone for PDF documents (max 50MB).
  - External Video Link Input (YouTube / Vimeo embed).
  - Lesson / Unit association dropdown.
  - Title & description inputs.
- **Published Materials Table**:
  - Title, Content Type icon (PDF/Video/Link), Linked Lesson, Upload Date, File size, Actions (Download, Delete).

### Interactive Elements & Actions
- **Select Subject Tab**: `(click)="selectSubject(subject.id)"`.
- **Upload File / Submit**: `(click)="uploadMaterial()"` -> calls backend Azure Blob upload.
- **Delete Material**: `(click)="deleteMaterial(item.id)"` prompts `ConfirmDialogService`.

### State & Signals
- `assignedSubjects = signal<any[]>([])`
- `selectedSubjectId = signal<number | null>(null)`
- `materials = signal<any[]>([])`
- `isUploading = signal<boolean>(false)`
- **Injected Services**: `TeacherService`, `ToastService`, `ConfirmDialogService`.

---

## 4.3 Enrolled Students Directory (`TeacherStudents`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/students`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'الطلاب المسجلين' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-students/teacher-students.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-students/teacher-students.html`

### UI Sections & Visual States
- **Class & Subject Filter**:
  - Dropdown to switch between classes taught by teacher.
- **Students Table**:
  - Student (Avatar, Full Name, Email).
  - Attendance Rate percentage with color badge.
  - Last Exam Score.
  - Homework Completion Rate.
  - Actions: "تحليل الذكاء الاصطناعي" (View AI Insight), "تقرير ولي الأمر" (Parent Report).

### Interactive Elements & Actions
- **Filter Class**: `(change)="onClassChange($event)"`.
- **View AI Insight**: Navigates to `/dashboard/teacher/students/:studentId/subjects/:subjectId/insight`.
- **View Parent Report**: Navigates to `/dashboard/teacher/parent-report/:studentId/:month`.

### State & Signals
- `classes = signal<any[]>([])`
- `selectedClassId = signal<number | null>(null)`
- `students = signal<any[]>([])`
- `isLoading = signal<boolean>(false)`
- **Injected Services**: `TeacherService`, `Router`.

---

## 4.4 Class AI Performance Analysis (`PerformanceAnalysisComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/analytics/:classId/:subjectId`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تحليل أداء الفصل' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/performance-analysis/performance-analysis.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/performance-analysis/performance-analysis.component.html`

### UI Sections & Visual States
- **Class KPIs**:
  - Class Average Score.
  - Scheduled vs Completed Sessions.
  - Syllabus completion percentage.
- **Score Distribution Histogram**:
  - 5 Distribution bars (0-20, 20-40, 40-60, 60-80, 80-100%).
- **Top 5 Performing Students Card**: Ranked with gold/silver badges.
- **Bottom 5 At-Risk Students Card**: Highlights students needing immediate academic support.

### Interactive Elements & Actions
- **Click Student**: Jumps to student individual insight view.
- **Refresh Analytics**: `loadAnalytics()`.

### State & Signals
- `data = signal<ClassAnalyticsDashboardDto | null>(null)`
- `maxDistCount = signal<number>(1)`
- `sessionRate = signal<number>(0)`
- **Injected Services**: `AiAnalyticsService`, `ActivatedRoute`.

---

## 4.5 Parent Report Teacher Summary (`ParentSummaryComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/parent-report/:studentId/:month`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تقرير ولي الأمر' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/parent-summary/parent-summary.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/parent-summary/parent-summary.component.html`

### UI Sections & Visual States
- Read/Edit view of the AI-generated monthly report.
- AI Narrative critique textarea.
- Identified weak topics list.
- Teacher Custom Recommendations section: Textarea where teacher adds personal feedback before report is finalized for parents.
- "اعتماد التقرير" (Approve & Endorse Report) button.

### Interactive Elements & Actions
- **Save Teacher Feedback**: `(click)="saveTeacherNotes()"`.
- **Regenerate AI Narrative**: `(click)="regenerateNarrative()"`.

### State & Signals
- `report = signal<any>(null)`
- `teacherNotes = signal<string>('')`
- `isSaving = signal<boolean>(false)`
- **Injected Services**: `AiAnalyticsService`, `ToastService`, `ActivatedRoute`.

---

## 4.6 Teacher Exams Management (`TeacherExamsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/exams`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'الاختبارات' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-exams/teacher-exams.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-exams/teacher-exams.html`

### UI Sections & Visual States
- **Top Actions**: "إنشاء اختبار جديد" (Create New Exam) button.
- **Exams Table**:
  - Title, Subject, Duration in Minutes, Start & End Time, Total Submissions count, Status Pill (مسودة Draft, منشور Published, منتهي Closed).
  - Actions: Edit, Submissions/Grading link, Close Exam, Delete.

### Interactive Elements & Actions
- **Create Exam CTA**: Navigates to `/dashboard/teacher/assessment/exams/create`.
- **View Submissions**: Navigates to `/dashboard/teacher/assessment/grading`.
- **Delete Exam**: `(click)="deleteExam(exam.id)"` prompts confirmation dialog.

### State & Signals
- `exams = signal<any[]>([])`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `TeacherExamService`, `ConfirmDialogService`, `ToastService`.

---

## 4.7 Assignment Creator (`AssignmentCreatorComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/assignments/create`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'إنشاء واجب' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/assignment-creator/assignment-creator.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/assignment-creator/assignment-creator.component.html`

### UI Sections & Visual States
- **Assignment Form**:
  - Title: `<input formControlName="title">`.
  - Subject Dropdown: `<select formControlName="subjectId">`.
  - Lesson Dropdown: `<select formControlName="lessonId">` (filtered by subject).
  - Due Date & Time picker: `<input type="datetime-local" formControlName="dueDate">`.
  - Max Marks / Score: `<input type="number" formControlName="maxScore">`.
  - Description / Prompt: `<textarea formControlName="description">`.
  - File Attachment: File dropzone for assignment prompt worksheet.
- **Submit Buttons**:
  - "نشر الواجب للطلاب" (Publish Assignment).
  - "إلغاء".

### Interactive Elements & Actions
- **Subject Change**: `(change)="onSubjectSelect($event)"` loads lessons for that subject.
- **Submit Form**: `(ngSubmit)="createAssignment()"`.

### State & Signals
- `assignmentForm: FormGroup`
- `lessons = signal<any[]>([])`
- `isSubmitting = signal<boolean>(false)`
- **Injected Services**: `TeacherAssignmentService`, `TeacherLessonService`, `ToastService`, `Router`.

---

## 4.8 Assignment Submissions & Manual Grading (`AssignmentSubmissionsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/assignments/:id/submissions`, route parameter `:id`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تسليمات الواجب' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component.html`

### UI Sections & Visual States
- Assignment Header: Title, due date, max marks, total enrolled vs submitted count.
- Submissions List / Table:
  - Student Name & Avatar.
  - Submission Timestamp (with "متأخر" late badge if submitted after due date).
  - Student Answer Preview: Text answer or downloadable attachment file link.
  - Grading Controls:
    - Score Input (`<input type="number" [max]="maxScore">`).
    - Feedback Textarea (`<textarea placeholder="ملاحظات المعلم للطالب...">`).
    - "حفظ الدرجة" (Save Grade) button.
  - Status Badge: "قيد التصحيح" (Pending) vs "تم التصحيح" (Graded).

### Interactive Elements & Actions
- **Submit Grade**: `(click)="gradeStudent(submission.id, score, feedback)"`.
- **Download Submission File**: `downloadAttachment(submission.fileUrl)`.

### State & Signals
- `assignment = signal<any>(null)`
- `submissions = signal<any[]>([])`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `TeacherAssignmentService`, `ToastService`, `ActivatedRoute`.

---

## 4.9 Exam Creator Wizard (`ExamCreatorComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/exams/create`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'إنشاء اختبار' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/exam-creator/exam-creator.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/exam-creator/exam-creator.component.html`

### UI Sections & Visual States
- **Step 1: Exam Settings Card**:
  - Title, Subject selector, Duration in minutes, Scheduled Start datetime, Scheduled End datetime, Total Marks (auto-calculated from questions), Pass mark percentage.
- **Step 2: Questions Assembly Builder**:
  - "إضافة من بنك الأسئلة" (Select from Question Bank) modal trigger.
  - "إنشاء سؤال يدوي" (Create Custom Question) inline form:
    - Question Type: Multiple Choice (MCQ), True/False, Essay/Short Answer.
    - Question Text (supports rich text/math).
    - Answer options with radio toggle for the correct answer.
    - Question Marks / Weight.
- **Selected Questions Order List**:
  - Reorderable list of questions included in the exam.
  - Remove question button per item.

### Interactive Elements & Actions
- **Open Bank Modal**: `(click)="openQuestionBankModal()"`.
- **Add Question to Exam**: `addQuestionToExam(question)`.
- **Remove Question**: `removeQuestion(index)`.
- **Save Draft**: `(click)="submitExam(false)"`.
- **Publish Exam**: `(click)="submitExam(true)"`.

### State & Signals
- `examForm: FormGroup`
- `selectedQuestions = signal<any[]>([])`
- `isBankModalOpen = signal<boolean>(false)`
- `isSubmitting = signal<boolean>(false)`
- **Injected Services**: `TeacherExamService`, `TeacherQuestionBankService`, `ToastService`, `Router`.

---

## 4.10 Question Bank with AI Generation (`QuestionBankComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/question-bank`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'بنك الأسئلة' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/question-bank/question-bank.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/question-bank/question-bank.component.html`

### UI Sections & Visual States
- **Top Actions & AI Drawer Trigger**:
  - "إنشاء سؤال جديد" (Add Manual Question).
  - "توليد أسئلة بالذكاء الاصطناعي ✨" (Generate with AI) button.
- **AI Question Generator Slide-Over Drawer**:
  - Subject & Grade selector.
  - Topic / Concept input (e.g. "قوانين نيوتن للحركة").
  - Number of questions (1 to 10).
  - Difficulty level: Easy, Medium, Hard.
  - "توليد الأسئلة" button with spinning loader.
  - Generated preview list with checkboxes allowing teacher to select which questions to import into the bank.
- **Questions Search & Filter Bar**:
  - Subject dropdown, Question type filter, Difficulty filter, Search keyword.
- **Questions List**:
  - Question card with expand/collapse options.
  - Correct answer highlighted in emerald.
  - Action buttons: Edit, Delete.

### Interactive Elements & Actions
- **Open AI Drawer**: `(click)="openAiDrawer()"`.
- **Generate AI Questions**: `(click)="generateAiQuestions()"`.
- **Import Selected AI Questions**: `(click)="importSelectedQuestions()"`.
- **Delete Question**: `(click)="deleteQuestion(q.id)"`.

### State & Signals
- `questions = signal<any[]>([])`
- `isAiDrawerOpen = signal<boolean>(false)`
- `aiGeneratedQuestions = signal<any[]>([])`
- `isGenerating = signal<boolean>(false)`
- `filterSubjectId = signal<number | null>(null)`
- **Injected Services**: `TeacherQuestionBankService`, `AiAnalyticsService`, `ToastService`.

---

## 4.11 Grading Dashboard (`GradingDashboardComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/grading`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'لوحة التصحيح' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component.html`

### UI Sections & Visual States
- Summary metric: Total pending manual grading submissions across all exams.
- Filter by Exam dropdown.
- Submissions Queue Table:
  - Exam Title, Student Name, Class, Submission Date, Auto-Graded Score, Pending Essay Questions Count.
  - Action button: "بدء التصحيح" (Start Grading).

### Interactive Elements & Actions
- **Filter Exam**: `(change)="onExamFilterChange($event)"`.
- **Start Grading Student**: Navigates to `/dashboard/teacher/assessment/grading/exam/:studentExamId`.

### State & Signals
- `pendingSubmissions = signal<any[]>([])`
- `isLoading = signal<boolean>(true)`
- **Injected Services**: `TeacherExamService`, `Router`.

---

## 4.12 Individual Exam Grader (`ExamGraderComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/assessment/grading/exam/:studentExamId`, route parameter `:studentExamId`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تصحيح الاختبار' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/exam-grader/exam-grader.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/exam-grader/exam-grader.component.html`

### UI Sections & Visual States
- Student & Exam Meta Header: Student name, Exam title, Total score accumulator.
- Question Grading Cards List:
  - MCQ / True-False questions: Read-only display of student choice vs correct answer and auto-calculated score.
  - Essay / Short Answer questions:
    - Student written text.
    - Model answer / grading rubric guide.
    - Score input (`[max]="question.maxMarks"`).
    - Teacher feedback textarea.
- Sticky Bottom Action Bar:
  - Real-time recalculated final score.
  - "اعتماد وحفظ النتيجة النهائية" (Finalize & Save Grade) primary button.

### Interactive Elements & Actions
- **Update Question Score**: `updateScore(questionId, score)`.
- **Submit Final Grade**: `(click)="saveFinalGrade()"`.

### State & Signals
- `studentExam = signal<any>(null)`
- `gradingMap = signal<Record<number, { score: number, feedback: string }>>({})`
- `isSaving = signal<boolean>(false)`
- **Injected Services**: `TeacherExamService`, `ToastService`, `Router`, `ActivatedRoute`.

---

## 4.13 Lessons & Units Manager (`LessonsManagerComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/lessons`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'إدارة الدروس' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/lessons-manager/lessons-manager.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/assessment/lessons-manager/lessons-manager.component.html`

### UI Sections & Visual States
- Subject selector dropdown.
- Units Accordion Tree:
  - Unit Header: Unit Title, Order index, Add Lesson button, Edit/Delete Unit.
  - Lessons List under Unit:
    - Lesson card: Title, description, order number.
    - Content chips: PDFs count, Videos count, Exams count, Assignments count.
    - Action buttons: Edit Lesson, Attach Material, Delete Lesson.
- Create / Edit Unit Modal.
- Create / Edit Lesson Modal.

### Interactive Elements & Actions
- **Open Unit Modal**: `openUnitModal()`.
- **Open Lesson Modal**: `openLessonModal(unitId)`.
- **Save Unit / Lesson**: `saveUnit()`, `saveLesson()`.
- **Delete Item**: `deleteItem(item)` with confirmation dialog.

### State & Signals
- `subjects = signal<any[]>([])`
- `selectedSubjectId = signal<number | null>(null)`
- `units = signal<any[]>([])`
- `isUnitModalOpen = signal<boolean>(false)`
- `isLessonModalOpen = signal<boolean>(false)`
- **Injected Services**: `TeacherLessonService`, `AcademicApiService`, `ToastService`.

---

## 4.14 Live Sessions Calendar (`TeacherSessionsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/sessions`
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'الحصص المباشرة' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-sessions/teacher-sessions.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/components/teacher-sessions/teacher-sessions.component.html`

### UI Sections & Visual States
- Top Bar: "جدولة حصة جديدة" (Schedule New Session) button.
- Embedded Weekly Calendar Component (`<app-weekly-calendar />`):
  - Weekly view (الأحد إلى الخميس).
  - Session cards inside calendar slots.
- Schedule New Session Modal:
  - Subject dropdown, Class dropdown, Session Title, Date picker, Start time picker, Duration minutes (default 60).
- Session Details Popover:
  - "بدء الحصة الآن" (Join Live Room).
  - "سجل الحضور والغياب" (View Attendance).

### Interactive Elements & Actions
- **Open Schedule Modal**: `(click)="openScheduleModal()"`.
- **Submit Schedule**: `(ngSubmit)="createSession()"`.
- **Join Live Room**: Navigates to `/dashboard/teacher/sessions/:id/live`.
- **View Attendance**: Navigates to `/dashboard/teacher/sessions/:id/attendance`.

### State & Signals
- `sessions = signal<any[]>([])`
- `isModalOpen = signal<boolean>(false)`
- `sessionForm: FormGroup`
- **Injected Services**: `LiveSessionService`, `TeacherService`, `ToastService`, `Router`.

---

## 4.15 Live Room (`LiveRoomComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/sessions/:id/live`, route parameter `:id`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `canDeactivate: [canDeactivateGuard]`, `data: { role: 'teacher', breadcrumb: 'الحصة المباشرة' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/shared/components/live-room/live-room.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/shared/components/live-room/live-room.component.html`

### UI Sections & Visual States
- **Full Viewport Dark Overlay Container** (`fixed inset-0 z-50 bg-slate-950 flex flex-col dir="rtl"`).
- **Header**: Session title, Connection status pill ("متصل" emerald vs "جاري الاتصال..." pulsing sky).
- **Interactive Video / Whiteboard Grid**:
  - Main Display Area (Switches between Whiteboard and Teacher Camera):
    - Whiteboard View: `<app-whiteboard />` active when `isWhiteboardActive() === true`.
    - Local Player: Teacher camera stream with name tag "أنت - (المحاضر)" and camera-off avatar fallback.
  - Remote Participants Column (`lg:col-start-2`):
    - Video tiles for connected students with name tag and mute audio icon.
    - Hover Controls on Student Tile: "السماح بالسبورة" (Grant Whiteboard Access) vs "إلغاء السبورة" (Revoke Whiteboard Access).
    - Empty state when no students are joined.
- **Bottom Controls Bar**:
  - Mute/Unmute Mic button (`(click)="toggleMic()"`).
  - Camera On/Off button (`(click)="toggleCamera()"`).
  - Whiteboard Toggle button (`(click)="toggleWhiteboard()"`).
  - Screen Share Toggle button (`(click)="toggleScreenShare()"`).
  - Red Leave Session button (`(click)="leaveSession()"`).

### Interactive Elements & Actions
- **Toggle Mic**: Calls `localAudioTrack.setMuted(!isMuted())`.
- **Toggle Camera**: Calls `localVideoTrack.setMuted(!isCameraOff())`.
- **Toggle Whiteboard**: Toggles `isWhiteboardActive()`, syncs via SignalR `liveSessionService.toggleWhiteboard(...)`.
- **Toggle Screen Share**: Publishes Agora screen track; on stop, reverts to camera track.
- **Grant/Revoke Whiteboard**: `grantWhiteboardAccess(uid)` / `revokeWhiteboardAccess(uid)`.
- **Leave Session**: Closes audio/video tracks, leaves Agora channel, calls backend `leaveSession`, and redirects to `/dashboard/teacher/sessions`.

### State & Signals
- `isLoading = signal<boolean>(true)`
- `isMuted = signal<boolean>(false)`
- `isCameraOff = signal<boolean>(false)`
- `isWhiteboardActive = signal<boolean>(false)`
- `isScreenSharing = signal<boolean>(false)`
- `remoteUsers = signal<IAgoraRTCRemoteUser[]>([])`
- **Injected Services**: `LiveSessionService`, `AuthStateService`, `HttpClient`, `Router`, `ActivatedRoute`.

---

## 4.16 Live Session Attendance Review (`TeacherSessionAttendanceComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/sessions/:id/attendance`, route parameter `:id`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'سجل حضور الحصة' }`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/live-session/attendance/session-attendance.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/live-session/attendance/session-attendance.component.html`

### UI Sections & Visual States
- Session Meta Card: Session Title, Scheduled date & time, duration.
- 4 Attendance Stats: إجمالي الطلاب (Total), حاضر (Present), غائب (Absent), بعذر (Excused).
- Attendance Records Table:
  - Student Name.
  - Status Badge: Present (Green), Absent (Red), Excused (Amber).
  - Joined At timestamp.
  - Teacher Note.
  - Action button: "تعديل الحالة" (Override Status).
- **Override Status Modal**:
  - Dropdown: Present, Absent, Excused.
  - Notes textarea.
  - Save Override button.

### Interactive Elements & Actions
- **Open Modal**: `openOverrideModal(record)`.
- **Save Override**: `submitOverride()`.

### State & Signals
- `sessionAttendance = signal<SessionAttendanceDto | null>(null)`
- `selectedRecord = signal<AttendanceRecordDto | null>(null)`
- `overrideStatus = signal<'Present' | 'Absent' | 'Excused'>('Present')`
- `overrideNote = signal<string>('')`
- `isModalOpen = signal<boolean>(false)`
- `isSubmitting = signal<boolean>(false)`
- **Injected Services**: `TeacherAttendanceService`, `ActivatedRoute`.

---

## 4.17 Class Analytics Dashboard (`ClassAnalyticsComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/analytics/:classId/:subjectId` (and `/dashboard/teacher/classes/:classId/subjects/:subjectId/analytics`).
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تحليلات الفصل' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/class-analytics/class-analytics.component.ts`

### UI Sections & Visual States
- KPI Row: Class Average, Class Name & Subject, Sessions Completed/Scheduled, Completion Rate.
- Score Distribution Histogram: Percentage buckets with dynamic height styling.
- Top 5 Students List vs Bottom 5 Students Needing Intervention List.

### Interactive Elements & Actions
- Refresh Analytics: `(click)="loadAnalytics()"`.

### State & Signals
- `data = signal<ClassAnalyticsDashboardDto | null>(null)`
- `maxDistCount = signal<number>(1)`
- `sessionRate = signal<number>(0)`
- **Injected Services**: `AiAnalyticsService`, `ActivatedRoute`.

---

## 4.18 Student Insight & AI Suggestions (`StudentInsightComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/teacher/students/:studentId/subjects/:subjectId/insight`, route parameters `:studentId`, `:subjectId`.
- **Guards**: `canActivate: [authGuard, roleGuard]`, `data: { roles: ['Teacher'], breadcrumb: 'تفاصيل الطالب' }`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/teacher/pages/student-insight/student-insight.component.ts`

### UI Sections & Visual States
- Student Banner: Student name and subject.
- **Weak Topics Section**:
  - Topic name, Error Rate badge (Red >50%, Amber 30-50%, Blue <30%).
  - Error rate progress bar.
  - Recommended teacher actions list.
- **Active Performance Alerts List**: Cards for low attendance, low test scores, or missing tasks.
- **AI Teaching Suggestion Card**:
  - Natural language pedagogical advice.
  - Action items checklist.
  - Generation timestamp.
  - "توليد اقتراح جديد ✨" (Generate New Suggestion) button with spinner.

### Interactive Elements & Actions
- **Generate AI Suggestion**: `(click)="generateSuggestion()"` -> calls `aiService.generateTeachingSuggestion(...)`.

### State & Signals
- `data = signal<StudentInsightDto | null>(null)`
- `suggestion = signal<TeachingSuggestionDto | null>(null)`
- `isGenerating = signal<boolean>(false)`
- **Injected Services**: `AiAnalyticsService`, `ActivatedRoute`.
