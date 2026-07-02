import { Routes } from '@angular/router';

export const PARENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent)
  },
  {
    path: 'children',
    loadComponent: () => import('../pages/children/children-list.component').then(m => m.ChildrenListComponent)
  },
  {
    path: 'onboarding/add-student',
    loadComponent: () => import('../../auth/signup/signup').then(m => m.Signup),
    data: { mode: 'Student' }
  },
  {
    path: 'reports/:studentId',
    loadComponent: () => import('../pages/smart-report/smart-report.component').then(m => m.SmartReportComponent)
  },
  {
    path: 'alerts/:studentId',
    loadComponent: () => import('../pages/child-alerts/child-alerts.component').then(m => m.ChildAlertsComponent)
  },
  {
    path: 'attendance/:studentId',
    loadComponent: () => import('../pages/attendance/parent-attendance.component').then(m => m.ParentAttendanceComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('../pages/profile/parent-profile.component').then(m => m.ParentProfileComponent)
  },
  {
    path: 'link',
    loadComponent: () => import('../pages/link-student/link-student.component').then(m => m.LinkStudentComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
