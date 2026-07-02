import { Routes } from '@angular/router';
import { Chat } from './features/signalR/Component/chat/chat';
import { Landing } from './features/landing/landing';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout';
import { AdminComponent } from './features/admin/adminComponent/admin';
import { TeacherComponent } from './features/teacher/teacherComponent/teacher';
import { TeacherCourses } from './features/teacher/components/teacher-courses/teacher-courses';
import { UserManagement } from './features/admin/components/user-management/user-management';
import { TeacherStudents } from './features/teacher/components/teacher-students/teacher-students';
import { TeacherAssignments } from './features/teacher/components/teacher-assignments/teacher-assignments';
import { guestGuard } from './core/guards/guest-guard-guard';
import { AcademicManagementComponent } from './features/admin/components/academic-management/academic-management';
import { AdminPerformanceComponent } from './features/admin/components/admin-performance/admin-performance';
import { TeachersDirectoryComponent } from './features/academic/pages/admin/teachers-list/teachers-list.component';
import { SystemHealthComponent } from './features/admin/components/system-health/system-health.component';
import { AdminContentComponent } from './features/admin/components/content-moderation/content.component';
import { AdminSubscriptionsComponent } from './features/admin/components/subscriptions/subscriptions.component';
import { AdminAnalyticsComponent } from './features/admin/adminComponent/analytics/analytics.component';
import { PerformanceAnalysisComponent } from './features/teacher/components/performance-analysis/performance-analysis.component';
import { ParentSummaryComponent } from './features/teacher/components/parent-summary/parent-summary.component';
import { authGuard } from './core/guards/auth-guard-guard';
import { adminGuard } from './core/guards/admin-guard-guard';
import { teacherGuard } from './core/guards/teacher-guard-guard';
import { studentGuard } from './core/guards/student-guard-guard';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
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
        path: 'ChangePassword',
        loadComponent: () =>
          import('./features/auth/change-password-component/change-password-component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },

      {
        path: 'ForgotPassword',
        loadComponent: () =>
          import('./features/auth/forgot-password-component/forgot-password-component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },

      {
        path: 'ResetPassword',
        loadComponent: () =>
          import('./features/auth/reset-password-component/reset-password-component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },

  {
    path: 'dashboard',
    component: DashboardLayoutComponent, // الشاسيه الثابت
    canActivate: [authGuard],
    children: [
      {
        path: 'student',
        canActivate: [studentGuard],
        loadChildren: () =>
          import('./features/student/routes/student.routes').then((m) => m.STUDENT_ROUTES),
          // يفتح لوحة التحكم على رابط: dashboard/student
          
      }, // محتوى الطالب
      {
        path: 'teacher',
        canActivate: [teacherGuard],
        children: [
          { path: '', component: TeacherComponent },
          { path: 'courses', component: TeacherCourses },
          { path: 'students', component: TeacherStudents },
          { path: 'assignments', component: TeacherAssignments },
          { path: 'analytics/:classId/:subjectId', component: PerformanceAnalysisComponent },
          { path: 'parent-report/:studentId/:month', component: ParentSummaryComponent },
          { path: 'exams', loadComponent: () => import('./features/teacher/components/teacher-exams/teacher-exams').then(m => m.TeacherExamsComponent) },
          { path: 'assessment/assignments/create', loadComponent: () => import('./features/teacher/pages/assessment/assignment-creator/assignment-creator.component').then(m => m.AssignmentCreatorComponent) },
          { path: 'assessment/assignments/:id/submissions', loadComponent: () => import('./features/teacher/pages/assessment/assignment-submissions/assignment-submissions.component').then(m => m.AssignmentSubmissionsComponent) },
          { path: 'assessment/exams/create', loadComponent: () => import('./features/teacher/pages/assessment/exam-creator/exam-creator.component').then(m => m.ExamCreatorComponent) },
          { path: 'assessment/grading', loadComponent: () => import('./features/teacher/pages/assessment/grading-dashboard/grading-dashboard.component').then(m => m.GradingDashboardComponent) },
          { path: 'assessment/grading/exam/:studentExamId', loadComponent: () => import('./features/teacher/pages/assessment/exam-grader/exam-grader.component').then(m => m.ExamGraderComponent) },
          { path: 'sessions', loadComponent: () => import('./features/teacher/components/teacher-sessions/teacher-sessions.component').then(m => m.TeacherSessionsComponent) },
        ],
      }, // محتوى المدرس
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', component: AdminComponent },

          { path: 'users', component: UserManagement },
          { path: 'teachers', component: TeachersDirectoryComponent },
          { path: 'academic', component: AcademicManagementComponent },
          { path: 'performance', component: AdminPerformanceComponent },
          { path: 'system-health', component: SystemHealthComponent },
          { path: 'content-moderation', component: AdminContentComponent },
          { path: 'subscriptions', component: AdminSubscriptionsComponent },
          { path: 'analytics', component: AdminAnalyticsComponent },
        ],
      }, // محتوى المدير
    ],
  },
  {
    path: 'chat',
    component: Chat,
  },

  {
    path: 'plans',
    loadComponent: () =>
      import('./features/subscription/pages/plans/plans.component').then(
        (m) => m.PlansPageComponent,
      ),
  },

  {
    path: 'my-subscription',
    loadComponent: () =>
      import('./features/subscription/pages/my-subscription/my-subscription.component').then(
        (m) => m.MySubscriptionPageComponent,
      ),
  },

  {
    path: 'checkout-success',
    loadComponent: () =>
      import('./features/subscription/pages/checkout-success/checkout-success.component').then(
        (m) => m.CheckoutSuccessPageComponent,
      ),
  },

  {
    path: 'checkout-cancel',
    loadComponent: () =>
      import('./features/subscription/pages/checkout-cancel/checkout-cancel.component').then(
        (m) => m.CheckoutCancelPageComponent,
      ),
  },

    { path: '**', redirectTo: '' },

];
