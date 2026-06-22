import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlanCardComponent } from '../../../../shared/components/plan-card/plan-card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SubscriptionApiService } from '../../../../services/subscription.service';
import { AuthStateService } from '../../../../core/auth-state.service';
import { PlanDto } from '../../../../models/subscription.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, PlanCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="text-center mb-12">
        <span class="badge-brand mb-3 inline-flex">Simple Pricing</span>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-surface-900 font-display tracking-tight mb-4">
          Choose your plan
        </h1>
        <p class="text-lg text-surface-500 max-w-xl mx-auto text-balance">
          Unlock full access to courses, live classes, and AI-powered learning — cancel anytime.
        </p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="flex justify-center py-20">
        <app-loading-spinner size="lg" label="Loading plans…"></app-loading-spinner>
      </div>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error max-w-lg mx-auto">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Empty -->
      <app-empty-state
        *ngIf="!loading() && !error() && plans().length === 0"
        icon="📋" title="No plans available"
        description="Check back soon — new plans are being added.">
      </app-empty-state>

      <!-- Plans grid -->
      <div *ngIf="!loading() && !error() && plans().length > 0"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <app-plan-card
          *ngFor="let plan of plans(); let i = index"
          [plan]="plan"
          [featured]="i === 1"
          [loading]="checkingOutPlanId() === plan.planId"
          (select)="onSelectPlan($event)">
        </app-plan-card>
      </div>

      <!-- Guest note -->
      <p *ngIf="!auth.isAuthenticated() && !loading() && plans().length > 0"
         class="text-center text-sm text-surface-500 mt-10">
        You'll need to
        <a href="/login" class="font-medium text-brand-600 hover:text-brand-700">sign in</a>
        or
        <a href="/register" class="font-medium text-brand-600 hover:text-brand-700">create an account</a>
        to subscribe.
      </p>

      <!-- Error toast for checkout failure -->
      <div *ngIf="checkoutError()"
           class="fixed bottom-6 right-6 alert-error shadow-modal max-w-sm animate-fade-in z-50">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ checkoutError() }}
        <button (click)="checkoutError.set(null)" class="ml-auto text-xs underline">Dismiss</button>
      </div>
    </div>
  `,
})
export class PlansComponent implements OnInit {
  private subApi = inject(SubscriptionApiService);
  readonly auth  = inject(AuthStateService);
  private router = inject(Router);

  plans              = signal<PlanDto[]>([]);
  loading            = signal(true);
  error              = signal<string | null>(null);
  checkingOutPlanId  = signal<number | null>(null);
  checkoutError      = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.subApi.getPlans().subscribe({
      next:  plans => { this.plans.set(plans); this.loading.set(false); },
      error: err   => {
        this.error.set(err?.error?.message ?? 'Failed to load plans.');
        this.loading.set(false);
      },
    });
  }

  onSelectPlan(plan: PlanDto): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.checkingOutPlanId.set(plan.planId);
    this.checkoutError.set(null);

    this.subApi.initiateCheckout(plan.planId).subscribe({
      next: result => {
        this.checkingOutPlanId.set(null);
        window.location.href = result.checkoutUrl;
      },
      error: err => {
        this.checkingOutPlanId.set(null);
        this.checkoutError.set(
          err?.error?.message ?? 'Could not start checkout. Please try again.'
        );
      },
    });
  }
}
