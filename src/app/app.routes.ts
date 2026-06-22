import { Routes } from '@angular/router';
import { authGuard }   from './guards/auth.guard';
import { adminGuard }  from './guards/admin.guard';
import { parentGuard } from './guards/parent.guard';
import { guestGuard }  from './guards/guest.guard';
import { teacherGuard }      from './guards/teacher.guard';
import { studentGuard }      from './guards/student.guard';
import { subscriptionGuard } from './guards/subscription.guard';
import { AuthLayoutComponent }  from './features/auth/components/auth-layout/auth-layout.component';
import { MainLayoutComponent }  from './layout/main-layout/main-layout.component';
import { CheckoutSuccessComponent } from './features/subscription/pages/checkout-success/checkout-success.component';
import { CheckoutCancelComponent }  from './features/subscription/pages/checkout-cancel/checkout-cancel.component';

export const routes: Routes = [
  // ── Auth routes (no nav) ─────────────────────────────────────────────────────
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login/login.component')
            .then(m => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/register/register.component')
            .then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component')
            .then(m => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component')
            .then(m => m.ResetPasswordComponent),
      },

    ],
  },

  // ── Checkout result pages (full screen, no nav) ───────────────────────────────
  { path: 'checkout/success', component: CheckoutSuccessComponent },
  { path: 'checkout/cancel',  component: CheckoutCancelComponent  },

  // ── Main app routes (with nav + footer) ──────────────────────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      // Public
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/subscription/pages/plans/plans.component')
            .then(m => m.PlansComponent),
      },

      // Dashboard — all authenticated users
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
      },

      // Change Password
      {
        path: 'change-password',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/auth/pages/change-password/change-password.component')
            .then(m => m.ChangePasswordComponent),
      },

      // Subscription
      {
        path: 'my-subscription',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/subscription/pages/my-subscription/my-subscription.component')
            .then(m => m.MySubscriptionComponent),
      },

      // Parent
      {
        path: 'parent',
        canActivate: [parentGuard],
        children: [
          {
            path: 'linked-students',
            loadComponent: () =>
              import('./features/parent/pages/linked-students/linked-students.component')
                .then(m => m.LinkedStudentsComponent),
          },
          {
            path: 'link-student',
            loadComponent: () =>
              import('./features/parent/pages/link-student/link-student.component')
                .then(m => m.LinkStudentComponent),
          },
          { path: '', redirectTo: 'linked-students', pathMatch: 'full' },
        ],
      },

      // Admin (Phase 1)
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'subscriptions',
            loadComponent: () =>
              import('./features/admin/pages/subscriptions/admin-subscriptions.component')
                .then(m => m.AdminSubscriptionsComponent),
          },
          // ── Phase 2: Academic Admin ─────────────────────────────────────
          {
            path: 'grades',
            loadComponent: () =>
              import('./features/academic/pages/admin/grade-management/grade-management.component')
                .then(m => m.GradeManagementComponent),
          },
          {
            path: 'subjects',
            loadComponent: () =>
              import('./features/academic/pages/admin/subject-management/subject-management.component')
                .then(m => m.SubjectManagementComponent),
          },
          {
            path: 'classes',
            loadComponent: () =>
              import('./features/academic/pages/admin/class-management/class-management.component')
                .then(m => m.ClassManagementComponent),
          },
          {
            path: 'assignments',
            loadComponent: () =>
              import('./features/academic/pages/admin/assignment-management/assignment-management.component')
                .then(m => m.AssignmentManagementComponent),
          },
          {
            path: 'enrollments',
            loadComponent: () =>
              import('./features/academic/pages/admin/enrollment-management/enrollment-management.component')
                .then(m => m.EnrollmentManagementComponent),
          },
          { path: '', redirectTo: 'subscriptions', pathMatch: 'full' },
        ],
      },

      // ── Phase 2: Teacher ────────────────────────────────────────────────
      {
        path: 'teacher',
        canActivate: [teacherGuard],
        children: [
          {
            path: 'assignments',
            loadComponent: () =>
              import('./features/academic/pages/teacher/my-assignments/my-assignments.component')
                .then(m => m.MyAssignmentsComponent),
          },
          {
            path: 'sessions/new',
            loadComponent: () =>
              import('./features/academic/pages/teacher/session-scheduler/session-scheduler.component')
                .then(m => m.SessionSchedulerComponent),
          },
          {
            path: 'sessions',
            loadComponent: () =>
              import('./features/academic/pages/teacher/my-sessions/my-sessions.component')
                .then(m => m.MySessionsComponent),
          },
          { path: '', redirectTo: 'assignments', pathMatch: 'full' },
        ],
      },

      // ── Phase 2: Student ────────────────────────────────────────────────
      {
        path: 'student',
        canActivate: [studentGuard, subscriptionGuard],
        children: [
          {
            path: 'my-class',
            loadComponent: () =>
              import('./features/academic/pages/student/my-class/my-class.component')
                .then(m => m.MyClassComponent),
          },
          {
            path: 'schedule',
            loadComponent: () =>
              import('./features/academic/pages/student/my-schedule/my-schedule.component')
                .then(m => m.MyScheduleComponent),
          },
          { path: '', redirectTo: 'my-class', pathMatch: 'full' },
        ],
      },

      // Default redirects
      { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
