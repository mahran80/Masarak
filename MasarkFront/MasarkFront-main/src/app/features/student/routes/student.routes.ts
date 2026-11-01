import { Routes } from '@angular/router';
import { canDeactivateGuard } from '../../../core/guards/can-deactivate.guard';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'لوحة الطالب' },
    loadComponent: () =>
      import('../pages/dashboard/dashboard.component').then((m) => m.StudentDashboardPageComponent),
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'exams/result/:id',
    data: { breadcrumb: 'نتيجة الاختبار' },
    loadComponent: () =>
      import('../pages/exam-result/exam-result.component').then((m) => m.StudentExamResultPageComponent),
  },
  {
    path: 'courses',
    data: { breadcrumb: 'دروسي' },
    loadComponent: () =>
      import('../pages/courses/courses.component').then((m) => m.StudentCoursesPageComponent),
  },
  {
    path: 'content',
    data: { breadcrumb: 'مكتبة الدروس' },
    loadComponent: () =>
      import('../pages/content/content.component').then((m) => m.StudentContentPageComponent),
  },
  {
    path: 'library',
    redirectTo: 'content',
    pathMatch: 'full',
  },
  {
    path: 'lessons',
    data: { breadcrumb: 'الدروس والوحدات' },
    loadComponent: () =>
      import('../pages/student-lessons/student-lessons.component').then((m) => m.StudentLessonsComponent),
  },
  {
    path: 'assignments',
    data: { breadcrumb: 'الواجبات' },
    loadComponent: () =>
      import('../pages/assignments/assignments.component').then(
        (m) => m.StudentAssignmentsPageComponent,
      ),
  },
  {
    path: 'exams',
    data: { breadcrumb: 'الاختبارات' },
    loadComponent: () =>
      import('../pages/exams/exams.component').then((m) => m.StudentExamsPageComponent),
    canDeactivate: [canDeactivateGuard],
  },
  {
    path: 'grades',
    data: { breadcrumb: 'الدرجات' },
    loadComponent: () =>
      import('../pages/grades/grades.component').then((m) => m.StudentGradesPageComponent),
  },
  {
    path: 'attendance',
    data: { breadcrumb: 'سجل الحضور' },
    loadComponent: () =>
      import('../pages/attendance/attendance.component').then(
        (m) => m.StudentAttendancePageComponent,
      ),
  },
  {
    path: 'performance',
    data: { breadcrumb: 'الأداء الأكاديمي' },
    loadComponent: () =>
      import('../pages/performance/performance.component').then(
        (m) => m.StudentPerformancePageComponent,
      ),
  },
  {
    path: 'schedule',
    data: { breadcrumb: 'الجدول الأسبوعي' },
    loadComponent: () =>
      import('../pages/schedule/schedule.component').then((m) => m.StudentSchedulePageComponent),
  },
  {
    path: 'sessions/:id/live',
    loadComponent: () =>
      import('../../shared/components/live-room/live-room.component').then((m) => m.LiveRoomComponent),
    data: { role: 'student', breadcrumb: 'الحصة المباشرة' },
    canDeactivate: [canDeactivateGuard],
  },
  {
    path: 'profile',
    data: { breadcrumb: 'الملف الشخصي' },
    loadComponent: () =>
      import('../pages/profile/profile.component').then((m) => m.StudentProfilePageComponent),
  },
  {
    path: 'subscription',
    redirectTo: '/dashboard/plans',
    pathMatch: 'full',
  },
  {
    path: 'plans',
    redirectTo: '/dashboard/plans',
    pathMatch: 'full',
  },
  {
    path: 'insights',
    data: { breadcrumb: 'رؤى التعلم' },
    loadComponent: () =>
      import('../pages/learning-insights/learning-insights.component').then(
        (m) => m.LearningInsightsComponent,
      ),
  },
  {
    path: 'exams/:id',
    redirectTo: 'exams',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
