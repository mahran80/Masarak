import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SubscriptionApiService } from '../../../../services/subscription.service';
import { AuthStateService } from '../../../../core/auth-state.service';
import { AuthApiService } from '../../../../services/auth.service';
import { SubscriptionStatusResponse, SubscriptionDto } from '../../../../models/subscription.models';

@Component({
  selector: 'app-my-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container max-w-4xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-surface-900 font-display">My Subscription</h1>
        <p class="text-surface-500 mt-1">Manage your access and billing</p>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading subscription…">
      </app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
        <button (click)="loadStatus()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <div *ngIf="!loading() && !error()">

        <!-- ── Active Subscription Card ── -->
        <ng-container *ngIf="status()?.hasActiveSubscription && status()?.activeSubscription as sub">
          <div class="card p-6 mb-6 relative overflow-hidden">
            <!-- Gradient accent -->
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-700"></div>

            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="badge-active">Active</span>
                  <span class="badge-brand">{{ sub.planType }}</span>
                </div>
                <h2 class="text-2xl font-bold text-surface-900 font-display mt-2">{{ sub.planName }}</h2>
                <p class="text-sm text-surface-500 mt-1">
                  Activated via {{ formatMethod(sub.activationMethod) }}
                </p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-xs text-surface-500 uppercase tracking-wide font-medium">Expires</p>
                <p class="text-lg font-semibold text-surface-900">{{ sub.endDate | date:'mediumDate' }}</p>
                <p class="text-xs" [class]="daysLeftClass(sub.endDate)">
                  {{ daysLeft(sub.endDate) }} days remaining
                </p>
              </div>
            </div>

            <!-- Date range -->
            <div class="mt-6 pt-5 border-t border-surface-100 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Start date</p>
                <p class="text-sm font-medium text-surface-700">{{ sub.startDate | date:'mediumDate' }}</p>
              </div>
              <div>
                <p class="text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">End date</p>
                <p class="text-sm font-medium text-surface-700">{{ sub.endDate | date:'mediumDate' }}</p>
              </div>
            </div>

            <!-- Admin note -->
            <div *ngIf="sub.adminNote"
                 class="mt-4 p-3 bg-surface-50 rounded-xl text-sm text-surface-600 border border-surface-200">
              <span class="font-medium text-surface-700">Note:</span> {{ sub.adminNote }}
            </div>
          </div>

          <!-- Student linkage code -->
          <div *ngIf="auth.isStudent()" class="card p-6 mb-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="font-semibold text-surface-900 mb-1">Parent Linkage Code</h3>
                <p class="text-sm text-surface-500">Share this code with your parent to link their account.</p>
              </div>
            </div>
            <div class="mt-4">
              <div *ngIf="codeLoading()" class="flex items-center gap-2 text-sm text-surface-500">
                <app-loading-spinner size="sm"></app-loading-spinner> Loading code…
              </div>
              <div *ngIf="!codeLoading() && linkageCode()"
                   class="flex items-center gap-3 mt-2">
                <code class="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3
                             text-xl font-mono font-bold text-surface-900 tracking-widest text-center">
                  {{ linkageCode() }}
                </code>
                <button (click)="copyCode()" class="btn-secondary btn-sm flex-shrink-0">
                  {{ copied() ? '✓ Copied!' : 'Copy' }}
                </button>
              </div>
              <p *ngIf="!codeLoading() && codeError()" class="text-sm text-danger mt-2">
                {{ codeError() }}
              </p>
            </div>
          </div>
        </ng-container>

        <!-- ── No Subscription ── -->
        <div *ngIf="!status()?.hasActiveSubscription">
          <app-empty-state
            icon="🎓"
            title="No active subscription"
            description="Get full access to all courses, live classes, and AI recommendations.">
            <a routerLink="/plans" class="btn-primary btn-lg mt-6">View Plans</a>
          </app-empty-state>
        </div>

        <!-- ── History ── -->
        <div *ngIf="!loading()" class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-surface-900 font-display">Subscription History</h2>
          </div>

          <app-loading-spinner *ngIf="historyLoading()" size="md" label="Loading history…">
          </app-loading-spinner>

          <div *ngIf="!historyLoading() && history().length === 0 && status()?.hasActiveSubscription"
               class="card p-6 text-center text-surface-500 text-sm">
            No previous subscriptions.
          </div>

          <div *ngIf="!historyLoading() && history().length > 0" class="space-y-3">
            <div *ngFor="let h of history()" class="card p-4 flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-surface-900 truncate">{{ h.planName }}</p>
                <p class="text-xs text-surface-500 mt-0.5">
                  {{ h.startDate | date:'mediumDate' }} – {{ h.endDate | date:'mediumDate' }}
                </p>
              </div>
              <span [class]="statusBadge(h.status)">{{ h.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MySubscriptionComponent implements OnInit {
  private subApi  = inject(SubscriptionApiService);
  private authApi = inject(AuthApiService);
  readonly auth   = inject(AuthStateService);

  status         = signal<SubscriptionStatusResponse | null>(null);
  history        = signal<SubscriptionDto[]>([]);
  loading        = signal(true);
  historyLoading = signal(true);
  error          = signal<string | null>(null);
  linkageCode    = signal<string | null>(null);
  codeLoading    = signal(false);
  codeError      = signal<string | null>(null);
  copied         = signal(false);

  ngOnInit(): void {
    this.loadStatus();
    this.loadHistory();
    if (this.auth.isStudent()) this.loadLinkageCode();
  }

  loadStatus(): void {
    this.loading.set(true);
    this.subApi.getMySubscriptionStatus().subscribe({
      next:  res => { this.status.set(res); this.loading.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to load subscription.');
        this.loading.set(false);
      },
    });
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.subApi.getMyHistory().subscribe({
      next:  h  => { this.history.set(h); this.historyLoading.set(false); },
      error: () => this.historyLoading.set(false),
    });
  }

  loadLinkageCode(): void {
    this.codeLoading.set(true);
    this.authApi.getMyLinkageCode().subscribe({
      next:  r   => { this.linkageCode.set(r.code); this.codeLoading.set(false); },
      error: err => {
        this.codeError.set(err?.error?.message ?? 'Could not load linkage code.');
        this.codeLoading.set(false);
      },
    });
  }

  copyCode(): void {
    const code = this.linkageCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  daysLeft(endDate: string): number {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  daysLeftClass(endDate: string): string {
    const d = this.daysLeft(endDate);
    if (d <= 7)  return 'text-xs text-danger font-medium';
    if (d <= 30) return 'text-xs text-warning font-medium';
    return 'text-xs text-success font-medium';
  }

  formatMethod(method: string): string {
    return ({ Stripe: 'Stripe', AdminManual: 'Admin', Cash: 'Cash' }[method] ?? method);
  }

  statusBadge(status: string): string {
    return ({
      Active:    'badge-active',
      Pending:   'badge-pending',
      Expired:   'badge-expired',
      Cancelled: 'badge-cancelled',
    }[status] ?? 'badge') as string;
  }
}
