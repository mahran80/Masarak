import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api-service';
import { AuthStateService } from '../../core/services/auth-state-service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationHubService } from '../../core/services/notification-hub.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, IconComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationHubService = inject(NotificationHubService);

  readonly userRole = this.authState.userRole;
  readonly userName = this.authState.user;
  // Default vector avatar to prevent 404 Not Found error
  readonly userAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  readonly userRoleDisplay = this.authState.user;

  isExploreMenuOpen = false;
  isUserMenuOpen = false;
  readonly isSidebarCollapsed = signal(false);

  // Locale & Theme Support
  readonly lang = signal<'ar' | 'en'>('ar');
  readonly theme = signal<'light' | 'dark'>('light');
  readonly showLangDropdown = signal(false);
  readonly dashboardFooterMessage = computed(() => {
    const messages = this.lang() === 'ar'
      ? ['استمر، كل درس يقربك من هدفك.', 'خطوة صغيرة اليوم تصنع فرقًا كبيرًا غدًا.', 'رحلتك التعليمية تستحق أن تفتخر بها.']
      : ['Keep going — every lesson brings you closer to your goal.', 'A small step today makes a big difference tomorrow.', 'Your learning journey is worth celebrating.'];
    return messages[new Date().getDate() % messages.length];
  });

  get userInitials(): string {
    const name = this.userName()?.fullName;
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'U';
  }

  roleLabel(role: string | null | undefined): string {
    const normalized = (role ?? '').replace(/[\s_-]/g, '').toLowerCase();
    const labels: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'Admin' },
      administrator: { ar: 'مدير النظام', en: 'Administrator' },
      systemadministrator: { ar: 'مدير النظام', en: 'System Administrator' },
      superadmin: { ar: 'مدير النظام', en: 'Super Admin' },
      parent: { ar: 'ولي أمر', en: 'Parent' },
      teacher: { ar: 'معلم', en: 'Teacher' },
      student: { ar: 'طالب', en: 'Student' },
    };
    const label = labels[normalized];
    return label ? label[this.lang()] : (role || (this.lang() === 'ar' ? 'مستخدم' : 'User'));
  }

  roleContext(role: string | null | undefined): string {
    const normalized = (role ?? '').replace(/[\s_-]/g, '').toLowerCase();
    const contexts: Record<string, { ar: string; en: string }> = {
      student: { ar: 'رحلتك التعليمية', en: 'Your learning journey' },
      teacher: { ar: 'إدارة صفوفك ومحتواك', en: 'Manage your classes and content' },
      parent: { ar: 'متابعة الأبناء', en: 'Follow your children’s progress' },
      admin: { ar: 'إدارة المنصة', en: 'Platform administration' },
      administrator: { ar: 'إدارة المنصة', en: 'Platform administration' },
      systemadministrator: { ar: 'إدارة المنصة', en: 'Platform administration' },
    };
    return contexts[normalized]?.[this.lang()] ?? (this.lang() === 'ar' ? 'حساب مسارك' : 'Masarak account');
  }
  get isOnboarding(): boolean {
    return this.router.url.includes('/add-student');
  }

  get isLiveSession(): boolean {
    return /\/dashboard\/(teacher|student)\/sessions\/[^/]+\/live(?:[?#].*)?$/.test(this.router.url);
  }

  get isStandalonePage(): boolean {
    return this.isOnboarding || this.isLiveSession;
  }

  toggleSidebar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSidebarCollapsed.update(val => !val);
  }

  toggleExploreMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isExploreMenuOpen = !this.isExploreMenuOpen;
    if (this.isExploreMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isExploreMenuOpen = false;
    }
  }

  closeMenus(): void {
    this.isExploreMenuOpen = false;
    this.isUserMenuOpen = false;
    this.showLangDropdown.set(false);
  }

  toggleLanguage() {
    const next = this.lang() === 'ar' ? 'en' : 'ar';
    this.lang.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', next);
      document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    }
  }

  setLang(lang: 'ar' | 'en') {
    this.lang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  }

  toggleTheme() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      document.body.setAttribute('data-theme', next);
    }
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
        document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }

      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        this.theme.set(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    }

    // Load existing notifications
    this.notificationService.loadNotifications();
    // Start listening for real-time notifications
    this.notificationHubService.startConnection();
  }

  ngOnDestroy(): void {
    this.notificationHubService.stopConnection();
  }

  onAvatarError(event: any): void {
    // Fallback vector avatar if the image fails to load
    event.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }

  logout(): void {
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
