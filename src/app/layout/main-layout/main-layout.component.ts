import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from '../nav/nav.component';
import { SubscriptionBannerComponent } from '../../shared/components/subscription-banner/subscription-banner.component';
import { AuthStateService } from '../../core/auth-state.service';
import { SubscriptionApiService } from '../../services/subscription.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, SubscriptionBannerComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-nav></app-nav>
      <app-subscription-banner
        *ngIf="showBanner()"
      ></app-subscription-banner>
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      <footer class="border-t border-surface-200 bg-white py-6 mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row
                    items-center justify-between gap-2 text-xs text-surface-400">
          <span>&copy; {{ year }} Masarak. All rights reserved.</span>
          <span>Education Platform</span>
        </div>
      </footer>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  private auth    = inject(AuthStateService);
  private subApi  = inject(SubscriptionApiService);

  showBanner = signal(false);
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    // Only show banner for logged-in non-admin users
    if (this.auth.isAuthenticated() && !this.auth.isAdmin()) {
      this.subApi.getMySubscriptionStatus().subscribe({
        next: res => this.showBanner.set(!res.hasActiveSubscription),
        error: () => this.showBanner.set(false),
      });
    }
  }
}
