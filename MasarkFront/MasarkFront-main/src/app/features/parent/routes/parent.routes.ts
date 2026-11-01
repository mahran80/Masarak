import { Routes } from '@angular/router';

export const PARENT_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'لوحة ولي الأمر' },
    loadComponent: () => import('../pages/dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent)
  },
  {
    path: 'children',
    data: { breadcrumb: 'أبنائي' },
    loadComponent: () => import('../pages/children/children-list.component').then(m => m.ChildrenListComponent)
  },
  {
    path: 'onboarding/add-student',
    loadComponent: () => import('../../auth/signup/signup').then(m => m.Signup),
    data: { mode: 'Student', breadcrumb: 'إضافة طالب' }
  },
  {
    path: 'reports/:studentId',
    data: { breadcrumb: 'التقرير الذكي' },
    loadComponent: () => import('../pages/smart-report/smart-report.component').then(m => m.SmartReportComponent)
  },
  {
    path: 'reports/:studentId/:month',
    data: { breadcrumb: 'التقرير الذكي' },
    loadComponent: () => import('../pages/smart-report/smart-report.component').then(m => m.SmartReportComponent)
  },
  {
    path: 'alerts/:studentId',
    data: { breadcrumb: 'تنبيهات الطالب' },
    loadComponent: () => import('../pages/child-alerts/child-alerts.component').then(m => m.ChildAlertsComponent)
  },
  {
    path: 'attendance/:studentId',
    data: { breadcrumb: 'سجل حضور الطالب' },
    loadComponent: () => import('../pages/attendance/parent-attendance.component').then(m => m.ParentAttendanceComponent)
  },
  {
    path: 'schedule/:studentId',
    data: { breadcrumb: 'جدول الطالب' },
    loadComponent: () => import('../pages/parent-schedule/parent-schedule').then(m => m.ParentScheduleComponent)
  },
  {
    path: 'profile',
    data: { breadcrumb: 'الملف الشخصي' },
    loadComponent: () => import('../pages/profile/parent-profile.component').then(m => m.ParentProfileComponent)
  },
  {
    path: 'link',
    data: { breadcrumb: 'ربط طالب' },
    loadComponent: () => import('../pages/link-student/link-student.component').then(m => m.LinkStudentComponent)
  },
  {
    path: 'subscriptions',
    data: { breadcrumb: 'الخطط والاشتراكات' },
    loadComponent: () => import('../pages/subscriptions/parent-subscriptions.component').then(m => m.ParentSubscriptionsComponent)
  },
  {
    path: 'child-profile/:id',
    data: { breadcrumb: 'ملف الطالب' },
    loadComponent: () => import('../../profile/pages/profile-page.component').then(m => m.ProfilePageComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
