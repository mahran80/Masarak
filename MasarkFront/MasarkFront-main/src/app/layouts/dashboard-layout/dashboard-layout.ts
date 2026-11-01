import { Component, OnInit, OnDestroy, inject, HostListener, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { AuthApiService } from '../../core/services/auth-api-service';
import { AuthStateService } from '../../core/services/auth-state-service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationHubService } from '../../core/services/notification-hub.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationBellComponent,
    IconComponent,
    BreadcrumbComponent,
    A11yModule
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationHubService = inject(NotificationHubService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly userRole = this.authState.userRole;
  readonly userName = this.authState.user;
  readonly userRoleDisplay = this.authState.user;
  readonly currentYear = new Date().getFullYear();

  // Vector avatar fallback
  readonly userAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  // Sidebar signals
  readonly sidebarExpanded = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('masarak_sidebar_expanded') !== 'false' : true
  );
  readonly mobileDrawerOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isNavigating = signal<boolean>(false);

  private routerSub?: Subscription;

  // Grouped Navigation per role
  readonly navGroups = computed<NavGroup[]>(() => {
    const role = this.userRole();

    if (role === 'Student') {
      return [
        {
          heading: 'الرئيسية',
          items: [
            { label: 'لوحة التحكم', route: '/dashboard/student', icon: 'chart', exact: true }
          ]
        },
        {
          heading: 'التعلم',
          items: [
            { label: 'دروسي', route: '/dashboard/student/courses', icon: 'book' },
            { label: 'الدروس والوحدات', route: '/dashboard/student/lessons', icon: 'book-open' },
            { label: 'مكتبة الدروس', route: '/dashboard/student/content', icon: 'archive' },
            { label: 'الواجبات', route: '/dashboard/student/assignments', icon: 'clipboard-document-list' },
            { label: 'الاختبارات', route: '/dashboard/student/exams', icon: 'document-check' }
          ]
        },
        {
          heading: 'النتائج',
          items: [
            { label: 'الدرجات', route: '/dashboard/student/grades', icon: 'check-badge' },
            { label: 'الجدول الأسبوعي', route: '/dashboard/student/schedule', icon: 'calendar' },
            { label: 'رؤى التعلم', route: '/dashboard/student/insights', icon: 'trend-up' }
          ]
        },
        {
          heading: 'أخرى',
          items: [
            { label: 'المحادثات', route: '/dashboard/chat', icon: 'chat' },
            { label: 'الخطط والاشتراكات', route: '/dashboard/plans', icon: 'credit-card' }
          ]
        }
      ];
    }

    if (role === 'Teacher') {
      return [
        {
          heading: 'الرئيسية',
          items: [
            { label: 'لوحة المدرس', route: '/dashboard/teacher', icon: 'chart', exact: true }
          ]
        },
        {
          heading: 'التدريس',
          items: [
            { label: 'المقررات', route: '/dashboard/teacher/courses', icon: 'book-open' },
            { label: 'الدروس', route: '/dashboard/teacher/lessons', icon: 'academic-cap' },
            { label: 'الطلاب', route: '/dashboard/teacher/students', icon: 'users' },
            { label: 'الحصص المباشرة', route: '/dashboard/teacher/sessions', icon: 'video' }
          ]
        },
        {
          heading: 'التقييمات',
          items: [
            { label: 'الواجبات', route: '/dashboard/teacher/assessment/assignments/create', icon: 'clipboard-document-list' },
            { label: 'الاختبارات', route: '/dashboard/teacher/exams', icon: 'document-check' },
            { label: 'إنشاء اختبار', route: '/dashboard/teacher/assessment/exams/create', icon: 'pencil-square' },
            { label: 'بنك الأسئلة', route: '/dashboard/teacher/assessment/question-bank', icon: 'folder-open' },
            { label: 'لوحة التصحيح', route: '/dashboard/teacher/assessment/grading', icon: 'check-badge' }
          ]
        },
        {
          heading: 'أخرى',
          items: [
            { label: 'المحادثات', route: '/dashboard/chat', icon: 'chat' }
          ]
        }
      ];
    }

    if (role === 'Admin') {
      return [
        {
          heading: 'الرئيسية',
          items: [
            { label: 'نظرة عامة', route: '/dashboard/admin', icon: 'chart', exact: true }
          ]
        },
        {
          heading: 'الإدارة',
          items: [
            { label: 'إدارة المستخدمين', route: '/dashboard/admin/users', icon: 'users' },
            { label: 'دليل المعلمين', route: '/dashboard/admin/teachers', icon: 'user' },
            { label: 'الإدارة الأكاديمية', route: '/dashboard/admin/academic', icon: 'building' },
            { label: 'جدول الحصص', route: '/dashboard/admin/schedule', icon: 'calendar' },
            { label: 'إدارة المحتوى', route: '/dashboard/admin/content-moderation', icon: 'shield' },
            { label: 'إدارة الاشتراكات', route: '/dashboard/admin/subscriptions', icon: 'credit-card' },
            { label: 'إدارة الخطط', route: '/dashboard/admin/plans', icon: 'clipboard-document-list' }
          ]
        },
        {
          heading: 'التقارير والذكاء',
          items: [
            { label: 'تقارير الأداء', route: '/dashboard/admin/performance', icon: 'trend-up' },
            { label: 'تحليلات المنصة', route: '/dashboard/admin/platform-analytics', icon: 'chart' },
            { label: 'قوالب الذكاء الاصطناعي', route: '/dashboard/admin/prompt-editor', icon: 'robot' }
          ]
        }
      ];
    }

    if (role === 'Parent') {
      return [
        {
          heading: 'الرئيسية',
          items: [
            { label: 'لوحة التحكم', route: '/dashboard/parent', icon: 'home', exact: true },
            { label: 'أبنائي', route: '/dashboard/parent/children', icon: 'family' }
          ]
        },
        {
          heading: 'أخرى',
          items: [
            { label: 'الخطط والاشتراكات', route: '/dashboard/parent/subscriptions', icon: 'credit-card' },
            { label: 'المحادثات', route: '/dashboard/chat', icon: 'chat' }
          ]
        }
      ];
    }

    // Default generic items
    return [
      {
        heading: 'الرئيسية',
        items: [
          { label: 'لوحة التحكم', route: '/dashboard', icon: 'home', exact: true }
        ]
      }
    ];
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenus();
    this.closeMobileDrawer();
  }

  toggleSidebar(): void {
    const updated = !this.sidebarExpanded();
    this.sidebarExpanded.set(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('masarak_sidebar_expanded', String(updated));
    }
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update(v => !v);
    if (this.mobileDrawerOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen.update(v => !v);
  }

  closeMenus(): void {
    this.isUserMenuOpen.set(false);
  }

  ngOnInit(): void {
    // Load existing notifications
    this.notificationService.loadNotifications();
    // Start listening for real-time notifications
    this.notificationHubService.startConnection();

    // Listen to route events for route loading progress and drawer auto-closing
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
        this.closeMobileDrawer();
        this.closeMenus();
      }
    });
  }

  ngOnDestroy(): void {
    this.notificationHubService.stopConnection();
    this.routerSub?.unsubscribe();
  }

  onAvatarError(event: any): void {
    event.target.src = this.userAvatar;
  }

  logout(): void {
    this.closeMenus();
    this.closeMobileDrawer();

    this.confirmDialog.confirm({
      title: 'تسجيل الخروج',
      body: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
      confirmLabel: 'تسجيل الخروج',
      cancelLabel: 'إلغاء',
      variant: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.executeLogout();
      }
    });
  }

  private executeLogout(): void {
    this.notificationHubService.stopConnection();
    const refreshToken = this.authState.getRefreshToken();

    if (refreshToken) {
      this.authApi.logout(refreshToken).subscribe({
        next: () => {
          this.authState.clearAuth();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.authState.clearAuth();
          this.router.navigate(['/auth/login']);
        },
      });
      return;
    }

    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
