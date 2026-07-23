import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
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
    loadComponent: () =>
      import('../pages/exam-result/exam-result.component').then((m) => m.StudentExamResultPageComponent),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('../pages/courses/courses.component').then((m) => m.StudentCoursesPageComponent),
  },
  {
    path: 'courses/:subjectId',
    loadComponent: () => import('../pages/course-details/course-details.component').then((m) => m.StudentCourseDetailsPageComponent),
  },
  {
    path: 'content',
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
    loadComponent: () =>
      import('../pages/student-lessons/student-lessons.component').then((m) => m.StudentLessonsComponent),
  },
  {
    path: 'assignments',
    loadComponent: () =>
      import('../pages/assignments/assignments.component').then(
        (m) => m.StudentAssignmentsPageComponent,
      ),
  },
  {
    path: 'exams',
    loadComponent: () =>
      import('../pages/exams/exams.component').then((m) => m.StudentExamsPageComponent),
  },
  {
    path: 'grades',
    loadComponent: () =>
      import('../pages/grades/grades.component').then((m) => m.StudentGradesPageComponent),
  },
  {
    path: 'attendance',
    loadComponent: () =>
      import('../pages/attendance/attendance.component').then(
        (m) => m.StudentAttendancePageComponent,
      ),
  },
  {
    path: 'performance',
    loadComponent: () =>
      import('../pages/performance/performance.component').then(
        (m) => m.StudentPerformancePageComponent,
      ),
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('../pages/schedule/schedule.component').then((m) => m.StudentSchedulePageComponent),
  },
  {
    path: 'sessions/:id/live',
    loadComponent: () =>
      import('../../shared/components/live-room/live-room.component').then((m) => m.LiveRoomComponent),
    data: { role: 'student' }
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../pages/profile/profile.component').then((m) => m.StudentProfilePageComponent),
  },
  {
    path: 'subscription',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
  {
    path: 'insights',
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
