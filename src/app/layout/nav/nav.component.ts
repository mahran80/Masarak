import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { AuthApiService } from '../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-white border-b border-surface-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2.5 group">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <span class="text-white font-bold text-sm font-display">M</span>
            </div>
            <span class="font-bold text-surface-900 text-lg font-display tracking-tight">Masarak</span>
          </a>

          <!-- Desktop links -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/plans" routerLinkActive="text-brand-600 bg-brand-50"
               class="px-3.5 py-2 text-sm font-medium text-surface-600 hover:text-surface-900
                      hover:bg-surface-50 rounded-lg transition-colors">
              Plans
            </a>

            <ng-container *ngIf="auth.isAuthenticated()">
              <a routerLink="/dashboard" routerLinkActive="text-brand-600 bg-brand-50"
                 class="px-3.5 py-2 text-sm font-medium text-surface-600 hover:text-surface-900
                        hover:bg-surface-50 rounded-lg transition-colors">
                Dashboard
              </a>
              <a routerLink="/my-subscription" routerLinkActive="text-brand-600 bg-brand-50"
                 class="px-3.5 py-2 text-sm font-medium text-surface-600 hover:text-surface-900
                        hover:bg-surface-50 rounded-lg transition-colors">
                Subscription
              </a>
              <a *ngIf="auth.isParent()" routerLink="/parent/linked-students"
                 routerLinkActive="text-brand-600 bg-brand-50"
                 class="px-3.5 py-2 text-sm font-medium text-surface-600 hover:text-surface-900
                        hover:bg-surface-50 rounded-lg transition-colors">
                My Students
              </a>
              <a *ngIf="auth.isAdmin()" routerLink="/admin/subscriptions"
                 routerLinkActive="text-brand-600 bg-brand-50"
                 class="px-3.5 py-2 text-sm font-medium text-surface-600 hover:text-surface-900
                        hover:bg-surface-50 rounded-lg transition-colors">
                Admin
              </a>
            </ng-container>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-3">
            <ng-container *ngIf="!auth.isAuthenticated()">
              <a routerLink="/login" class="btn-ghost btn-sm hidden sm:flex">Sign in</a>
              <a routerLink="/register" class="btn-primary btn-sm">Get Started</a>
            </ng-container>

            <ng-container *ngIf="auth.isAuthenticated()">
              <!-- User menu -->
              <div class="relative">
                <button
                  (click)="menuOpen.set(!menuOpen())"
                  class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl
                         hover:bg-surface-50 transition-colors"
                >
                  <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <span class="text-brand-700 font-semibold text-sm">
                      {{ auth.user()?.fullName?.[0]?.toUpperCase() }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-surface-700 hidden sm:block max-w-[120px] truncate">
                    {{ auth.user()?.fullName }}
                  </span>
                  <svg class="w-4 h-4 text-surface-400 transition-transform"
                       [class.rotate-180]="menuOpen()"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <!-- Dropdown -->
                <div *ngIf="menuOpen()"
                  class="absolute right-0 mt-2 w-56 card shadow-modal py-1 z-50"
                >
                  <div class="px-4 py-2.5 border-b border-surface-100">
                    <p class="text-sm font-medium text-surface-900 truncate">{{ auth.user()?.fullName }}</p>
                    <p class="text-xs text-surface-500 truncate">{{ auth.user()?.email }}</p>
                    <span class="badge-brand mt-1">{{ auth.user()?.role }}</span>
                  </div>

                  <a routerLink="/my-subscription" (click)="menuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2 text-sm text-surface-700
                            hover:bg-surface-50 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    Subscription
                  </a>

                  <a routerLink="/change-password" (click)="menuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2 text-sm text-surface-700
                            hover:bg-surface-50 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Change Password
                  </a>

                  <div class="border-t border-surface-100 mt-1">
                    <button
                      (click)="logout()"
                      [disabled]="loggingOut()"
                      class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger
                             hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      {{ loggingOut() ? 'Signing out...' : 'Sign out' }}
                    </button>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Mobile hamburger -->
            <button (click)="mobileOpen.set(!mobileOpen())"
                    class="md:hidden btn-ghost btn-sm p-2" aria-label="Toggle menu">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path *ngIf="!mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"/>
                <path *ngIf="mobileOpen()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div *ngIf="mobileOpen()" class="md:hidden border-t border-surface-100 py-2 px-4 space-y-1">
        <a routerLink="/plans" (click)="mobileOpen.set(false)"
           class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
          Plans
        </a>
        <ng-container *ngIf="auth.isAuthenticated()">
          <a routerLink="/dashboard" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
            Dashboard
          </a>
          <a routerLink="/my-subscription" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
            Subscription
          </a>
          <a *ngIf="auth.isParent()" routerLink="/parent/linked-students" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
            My Students
          </a>
          <a *ngIf="auth.isAdmin()" routerLink="/admin/subscriptions" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
            Admin
          </a>
        </ng-container>
        <ng-container *ngIf="!auth.isAuthenticated()">
          <a routerLink="/login" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
            Sign in
          </a>
          <a routerLink="/register" (click)="mobileOpen.set(false)"
             class="block px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg">
            Get Started
          </a>
        </ng-container>
      </div>
    </nav>
  `,
})
export class NavComponent {
  readonly auth      = inject(AuthStateService);
  private authApi    = inject(AuthApiService);
  private router     = inject(Router);

  menuOpen   = signal(false);
  mobileOpen = signal(false);
  loggingOut = signal(false);

  logout(): void {
    const rt = this.auth.getRefreshToken();
    this.loggingOut.set(true);
    this.menuOpen.set(false);
    if (rt) {
      this.authApi.logout(rt).subscribe({
        complete: () => this.finishLogout(),
        error:    () => this.finishLogout(),
      });
    } else {
      this.finishLogout();
    }
  }

  private finishLogout(): void {
    this.auth.clearAuth();
    this.loggingOut.set(false);
    this.router.navigate(['/login']);
  }
}
