import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  }

  ngOnInit(): void {
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
