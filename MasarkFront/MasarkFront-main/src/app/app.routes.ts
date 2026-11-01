import { Routes } from '@angular/router';
import { canDeactivateGuard } from './core/guards/can-deactivate.guard';
import { Chat } from './features/signalR/Component/chat/chat';
import { LandingPageComponent } from './features/landing/landing';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout';
import { AdminComponent } from './features/admin/adminComponent/admin';
import { TeacherComponent } from './features/teacher/teacherComponent/teacher';
import { TeacherCourses } from './features/teacher/components/teacher-courses/teacher-courses';
import { UserManagement } from './features/admin/components/user-management/user-management';
import { TeacherStudents } from './features/teacher/components/teacher-students/teacher-students';

import { guestGuard } from './core/guards/guest-guard-guard';
import { AcademicManagementComponent } from './features/admin/components/academic-management/academic-management';
import { AdminPerformanceComponent } from './features/admin/components/admin-performance/admin-performance';
import { TeachersDirectoryComponent } from './features/academic/pages/admin/teachers-list/teachers-list.component';

import { AdminContentComponent } from './features/admin/components/content-moderation/content.component';
import { AdminSubscriptionsComponent } from './features/admin/components/subscriptions/subscriptions.component';

import { PerformanceAnalysisComponent } from './features/teacher/components/performance-analysis/performance-analysis.component';
import { ParentSummaryComponent } from './features/teacher/components/parent-summary/parent-summary.component';
import { authGuard } from './core/guards/auth-guard-guard';
import { adminGuard } from './core/guards/admin-guard-guard';
import { teacherGuard } from './core/guards/teacher-guard-guard';
import { studentGuard } from './core/guards/student-guard-guard';
import { parentGuard } from './core/guards/parent-guard-guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    canActivate: [guestGuard],
    pathMatch: 'full',
  },

  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/signup/signup').then((m) => m.Signup),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password-component/forgot-password-component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'ForgotPassword',
        redirectTo: 'forgot-password',
        pathMatch: 'full',
      },

      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password-component/reset-password-component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'ResetPassword',
        redirectTo: 'reset-password',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'change-password',
        data: { breadcrumb: 'تغيير كلمة المرور' },
        loadComponent: () =>
          import('./features/auth/change-password-component/change-password-component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      {
        path: 'student',
        canActivate: [studentGuard],
        loadChildren: () =>
          import('./features/student/routes/student.routes').then((m) => m.STUDENT_ROUTES),
      },
      {
        path: 'teacher',
        canActivate: [teacherGuard],
        data: { breadcrumb: 'لوحة المدرس' },
        children: [
          { path: '', component: TeacherComponent },
          { path: 'courses', data: { breadcrumb: 'المقررات' }, component: TeacherCourses },
          { path: 'students', data: { breadcrumb: 'الطلاب' }, component: TeacherStudents },
          { path: 'assignments', redirectTo: 'assessment/assignments/create', pathMatch: 'full' },

          { path: 'analytics/:classId/:subjectId', data: { breadcrumb: 'تحليل الأداء' }, component: PerformanceAnalysisComponent },
          { path: 'parent-report/:studentId/:month', data: { breadcrumb: 'تقرير ولي الأمر' }, component: ParentSummaryComponent },
          { path: 'exams', data: { breadcrumb: 'الاختبارات' }, loadComponent: () => import('./features/teacher/components/teacher-exams/teacher-exams').then(m => m.TeacherExamsComponent) },
          {
            path: 'assessment',
            data: { breadcrumb: 'التقييمات' },
            children: [
              { path: 'assignments/create', data: { breadcrumb: 'إنشاء واجب' }, loadComponent: () => import('./features/teacher/pages/assessment/assignment-creator/assignment-creator.component').then(m => m.AssignmentCreatorComponent) },
              { path: 'assignments/:id/submissions', data: { breadcrumb: 'تسليمات الواجب' }, loadComponent: () => import('./features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component').then(m => m.AssignmentSubmissionsComponent) },
              { path: 'exams/create', data: { breadcrumb: 'إنشاء اختبار' }, loadComponent: () => import('./features/teacher/pages/assessment/exam-creator/exam-creator.component').then(m => m.ExamCreatorComponent) },
              { path: 'question-bank', data: { breadcrumb: 'بنك الأسئلة' }, loadComponent: () => import('./features/teacher/pages/assessment/question-bank/question-bank.component').then(m => m.QuestionBankComponent) },
              {
                path: 'grading',
                data: { breadcrumb: 'لوحة التصحيح' },
                children: [
                  { path: '', loadComponent: () => import('./features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component').then(m => m.GradingDashboardComponent) },
                  { path: 'exam/:studentExamId', data: { breadcrumb: 'تصحيح الاختبار' }, loadComponent: () => import('./features/teacher/pages/assessment/exam-grader/exam-grader.component').then(m => m.ExamGraderComponent) },
                ]
              },
            ]
          },
          { path: 'lessons', data: { breadcrumb: 'إدارة الدروس' }, loadComponent: () => import('./features/teacher/pages/assessment/lessons-manager/lessons-manager.component').then(m => m.LessonsManagerComponent) },
          {
            path: 'sessions',
            data: { breadcrumb: 'الحصص المباشرة' },
            children: [
              { path: '', loadComponent: () => import('./features/teacher/components/teacher-sessions/teacher-sessions.component').then(m => m.TeacherSessionsComponent) },
              { path: ':id/live', loadComponent: () => import('./features/shared/components/live-room/live-room.component').then(m => m.LiveRoomComponent), data: { role: 'teacher', breadcrumb: 'الحصة المباشرة' }, canDeactivate: [canDeactivateGuard] },
              { path: ':id/attendance', data: { breadcrumb: 'سجل الحضور' }, loadComponent: () => import('./features/teacher/pages/live-session/attendance/session-attendance.component').then(m => m.TeacherSessionAttendanceComponent) },
            ]
          },
          { path: 'class-analytics/:classId/:subjectId', data: { breadcrumb: 'تحليلات الفصل' }, loadComponent: () => import('./features/teacher/pages/class-analytics/class-analytics.component').then(m => m.ClassAnalyticsComponent) },
          { path: 'student-insight/:studentId/:subjectId', data: { breadcrumb: 'رؤى الطالب' }, loadComponent: () => import('./features/teacher/pages/student-insight/student-insight.component').then(m => m.StudentInsightComponent) },
        ],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        data: { breadcrumb: 'لوحة المدير' },
        children: [
          { path: '', component: AdminComponent },

          { path: 'users', data: { breadcrumb: 'إدارة المستخدمين' }, component: UserManagement },
          { path: 'teachers', data: { breadcrumb: 'دليل المعلمين' }, component: TeachersDirectoryComponent },
          { path: 'academic', data: { breadcrumb: 'الإدارة الأكاديمية' }, component: AcademicManagementComponent },
          { path: 'performance', data: { breadcrumb: 'تقارير الأداء' }, component: AdminPerformanceComponent },

          { path: 'content-moderation', data: { breadcrumb: 'إدارة المحتوى' }, component: AdminContentComponent },
          { path: 'subscriptions', data: { breadcrumb: 'إدارة الاشتراكات' }, component: AdminSubscriptionsComponent },
          { path: 'plans', data: { breadcrumb: 'إدارة الخطط' }, loadComponent: () => import('./features/admin/components/admin-plans/admin-plans').then(m => m.AdminPlansComponent) },

          { path: 'schedule', data: { breadcrumb: 'جدول الحصص' }, loadComponent: () => import('./features/admin/components/admin-schedule/admin-schedule.component').then(m => m.AdminScheduleComponent) },
          { path: 'platform-analytics', data: { breadcrumb: 'تحليلات المنصة' }, loadComponent: () => import('./features/admin/pages/platform-analytics/platform-analytics.component').then(m => m.PlatformAnalyticsComponent) },
          { path: 'heatmap/:gradeId', data: { breadcrumb: 'الخريطة الحرارية' }, loadComponent: () => import('./features/admin/pages/grade-heatmap/grade-heatmap.component').then(m => m.GradeHeatmapComponent) },
          { path: 'prompt-editor', data: { breadcrumb: 'قوالب الذكاء الاصطناعي' }, loadComponent: () => import('./features/admin/pages/prompt-editor/prompt-editor.component').then(m => m.PromptEditorComponent) },
        ],
      },
      {
        path: 'parent',
        canActivate: [parentGuard],
        loadChildren: () =>
          import('./features/parent/routes/parent.routes').then((m) => m.PARENT_ROUTES),
      },
      {
        path: 'profile',
        data: { breadcrumb: 'الملف الشخصي' },
        loadComponent: () => import('./features/profile/pages/profile-page.component').then(m => m.ProfilePageComponent)
      },
      {
        path: 'chat',
        data: { breadcrumb: 'المحادثات' },
        component: Chat,
      },
      {
        path: 'plans',
        data: { breadcrumb: 'الخطط والاشتراكات' },
        loadComponent: () =>
          import('./features/subscription/pages/plans/plans.component').then(
            (m) => m.PlansPageComponent,
          ),
      },
      {
        path: 'my-subscription',
        data: { breadcrumb: 'اشتراكي' },
        loadComponent: () =>
          import('./features/subscription/pages/my-subscription/my-subscription.component').then(
            (m) => m.MySubscriptionPageComponent,
          ),
      },
      {
        path: 'checkout-success',
        data: { breadcrumb: 'تأكيد الاشتراك' },
        loadComponent: () =>
          import('./features/subscription/pages/checkout-success/checkout-success.component').then(
            (m) => m.CheckoutSuccessPageComponent,
          ),
      },
      {
        path: 'checkout-cancel',
        data: { breadcrumb: 'إلغاء الاشتراك' },
        loadComponent: () =>
          import('./features/subscription/pages/checkout-cancel/checkout-cancel.component').then(
            (m) => m.CheckoutCancelPageComponent,
          ),
      },
    ],
  },
  {
    path: 'chat',
    redirectTo: '/dashboard/chat',
    pathMatch: 'full',
  },
  {
    path: 'plans',
    redirectTo: '/dashboard/plans',
    pathMatch: 'full',
  },
  {
    path: 'my-subscription',
    redirectTo: '/dashboard/my-subscription',
    pathMatch: 'full',
  },
  {
    path: 'checkout-success',
    redirectTo: '/dashboard/checkout-success',
    pathMatch: 'full',
  },
  {
    path: 'checkout-cancel',
    redirectTo: '/dashboard/checkout-cancel',
    pathMatch: 'full',
  },

  { path: '**', redirectTo: '' },

];
