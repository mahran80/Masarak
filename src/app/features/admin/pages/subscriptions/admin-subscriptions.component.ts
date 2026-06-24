import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SubscriptionApiService } from '../../../../services/subscription.service';
import {
  SubscriptionDto, PagedResult, SubscriptionStatus,
  PlanDto, AdminActivateRequest
} from '../../../../models/subscription.models';
import { UserInfoDto } from '../../../../models/auth.models';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Subscriptions</h1>
          <p class="text-surface-500 mt-1">Manage student subscriptions</p>
        </div>
        <button (click)="openActivateModal()" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Activate Subscription
        </button>
      </div>

      <!-- Filters -->
      <div class="card p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label class="form-label">Filter by status</label>
          <select [class]="'form-select'" (change)="onStatusFilter($event)">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="form-label">Page size</label>
          <select class="form-select" (change)="onPageSizeChange($event)">
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading subscriptions…">
      </app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Empty -->
      <app-empty-state
        *ngIf="!loading() && !error() && subs().length === 0"
        icon="📋" title="No subscriptions found"
        description="Try adjusting the filters above.">
      </app-empty-state>

      <!-- Table -->
      <div *ngIf="!loading() && subs().length > 0"
           class="card overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200 bg-surface-50">
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Student</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden sm:table-cell">Plan</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Status</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden md:table-cell">End Date</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden lg:table-cell">Method</th>
                <th class="text-right px-4 py-3 font-semibold text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr *ngFor="let s of subs()" class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-surface-900 truncate max-w-[160px]">{{ s.userFullName }}</p>
                  <p class="text-xs text-surface-500">ID: {{ s.userId }}</p>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <p class="text-surface-700">{{ s.planName }}</p>
                  <span class="badge-brand mt-0.5">{{ s.planType }}</span>
                </td>
                <td class="px-4 py-3">
                  <span [class]="statusBadge(s.status)">{{ s.status }}</span>
                </td>
                <td class="px-4 py-3 text-surface-600 hidden md:table-cell">
                  {{ s.endDate | date:'mediumDate' }}
                </td>
                <td class="px-4 py-3 text-surface-600 hidden lg:table-cell">
                  {{ s.activationMethod }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    *ngIf="s.status === 'Active' || s.status === 'Pending'"
                    (click)="openCancelModal(s)"
                    class="btn-danger btn-sm">
                    Cancel
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="result() && result()!.totalPages > 1"
           class="flex items-center justify-between">
        <p class="text-sm text-surface-500">
          {{ result()!.totalCount }} total · page {{ result()!.pageNumber }} of {{ result()!.totalPages }}
        </p>
        <div class="flex gap-2">
          <button (click)="prevPage()" [disabled]="!result()!.hasPrevious || loading()" class="btn-secondary btn-sm">
            ← Prev
          </button>
          <button (click)="nextPage()" [disabled]="!result()!.hasNext || loading()" class="btn-secondary btn-sm">
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- ── Activate Modal ── -->
    <div *ngIf="showActivateModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeActivateModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Activate Subscription</h2>
        <p class="text-sm text-surface-500 mb-6">Manually activate a subscription for a teacher or student.</p>

        <div *ngIf="activateError()" class="alert-error mb-4 text-sm">{{ activateError() }}</div>
        <div *ngIf="activateSuccess()" class="alert-success mb-4 text-sm">{{ activateSuccess() }}</div>

        <form [formGroup]="activateForm" (ngSubmit)="submitActivate()" novalidate class="space-y-4">
          <div>
            <label class="form-label">User Role</label>
            <select formControlName="userRole" class="form-select" (change)="onRoleChange($event)">
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label class="form-label">Select User</label>
            <select formControlName="targetUserId" class="form-select">
              <option [value]="null" disabled>Select user...</option>
              <option *ngFor="let u of filteredUsers()" [value]="u.userId">
                {{ u.fullName }} ({{ u.email }})
              </option>
            </select>
            <span *ngIf="activateForm.get('targetUserId')?.invalid && activateSubmitted()" class="form-error">
              Please select a user
            </span>
          </div>
          <div>
            <label class="form-label">Plan</label>
            <select formControlName="planId" class="form-select">
              <option [value]="null" disabled>Select a plan…</option>
              <option *ngFor="let p of plans()" [value]="p.planId">{{ p.name }}</option>
            </select>
            <span *ngIf="activateForm.get('planId')?.invalid && activateSubmitted()" class="form-error">
              Please select a plan
            </span>
          </div>
          <div>
            <label class="form-label">Admin Note <span class="text-surface-400 font-normal">(optional)</span></label>
            <input type="text" formControlName="note" placeholder="Internal note…" class="form-input"/>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeActivateModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="activating()" class="btn-primary flex-1">
              <svg *ngIf="activating()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ activating() ? 'Activating…' : 'Activate' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Cancel Modal ── -->
    <div *ngIf="showCancelModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCancelModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <div class="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Cancel Subscription</h2>
        <p class="text-sm text-surface-500 mb-1">
          Cancel subscription <strong>#{{ cancelTarget()?.subscriptionId }}</strong> for
          <strong>{{ cancelTarget()?.userFullName }}</strong>?
        </p>
        <p class="text-xs text-surface-400 mb-6">This action cannot be undone.</p>

        <div *ngIf="cancelError()" class="alert-error mb-4 text-sm">{{ cancelError() }}</div>

        <div class="mb-4">
          <label class="form-label">Reason <span class="text-danger">*</span></label>
          <input type="text" [(ngModel)]="cancelReason" placeholder="Enter cancellation reason…"
                 class="form-input"/>
        </div>
        <div class="flex gap-3">
          <button (click)="closeCancelModal()" class="btn-secondary flex-1">Back</button>
          <button (click)="submitCancel()" [disabled]="cancelling() || !cancelReason.trim()"
                  class="btn-danger flex-1">
            <svg *ngIf="cancelling()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {{ cancelling() ? 'Cancelling…' : 'Confirm Cancel' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AdminSubscriptionsComponent implements OnInit {
  private subApi = inject(SubscriptionApiService);
  private fb     = inject(FormBuilder);

  result   = signal<PagedResult<SubscriptionDto> | null>(null);
  subs     = computed(() => this.result()?.items ?? []);
  plans    = signal<PlanDto[]>([]);
  loading  = signal(true);
  error    = signal<string | null>(null);

  page       = signal(1);
  pageSize   = signal(10);
  statusFilter = signal<SubscriptionStatus | undefined>(undefined);

  // Activate modal
  showActivateModal = signal(false);
  activating        = signal(false);
  activateError     = signal<string | null>(null);
  activateSuccess   = signal<string | null>(null);
  activateSubmitted = signal(false);

  users             = signal<UserInfoDto[]>([]);
  selectedRole      = signal<'Student' | 'Teacher'>('Student');
  filteredUsers     = computed(() => {
    const role = this.selectedRole();
    return this.users().filter(u => u.role === role);
  });

  activateForm = this.fb.group({
    userRole:     ['Student'],
    targetUserId: [null as number | null],
    planId:       [null as number | null],
    note:         [''],
  });

  // Cancel modal
  showCancelModal = signal(false);
  cancelTarget    = signal<SubscriptionDto | null>(null);
  cancelReason    = '';
  cancelling      = signal(false);
  cancelError     = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
    this.loadPlans();
    this.loadUsers();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.subApi.getAllSubscriptions({
      pageNumber: this.page(),
      pageSize:   this.pageSize(),
      status:     this.statusFilter(),
    }).subscribe({
      next:  r   => { this.result.set(r); this.loading.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to load subscriptions.');
        this.loading.set(false);
      },
    });
  }

  loadPlans(): void {
    this.subApi.getPlans().subscribe({ next: p => this.plans.set(p) });
  }

  loadUsers(): void {
    this.subApi.getUsers().subscribe({
      next: u => this.users.set(u),
      error: () => {}
    });
  }

  onRoleChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'Student' | 'Teacher';
    this.selectedRole.set(val);
    this.activateForm.patchValue({ targetUserId: null });
  }

  onStatusFilter(event: Event): void {
    const v = (event.target as HTMLSelectElement).value as SubscriptionStatus | '';
    this.statusFilter.set(v || undefined);
    this.page.set(1);
    this.load();
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
    this.load();
  }

  prevPage(): void { this.page.update(p => p - 1); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }

  statusBadge(status: string): string {
    return ({
      Active:    'badge-active',
      Pending:   'badge-pending',
      Expired:   'badge-expired',
      Cancelled: 'badge-cancelled',
    }[status] ?? 'badge') as string;
  }

  // ── Activate ──────────────────────────────────────────────────────────────────
  openActivateModal(): void {
    this.activateForm.reset({
      userRole: 'Student',
      targetUserId: null,
      planId: null,
      note: ''
    });
    this.selectedRole.set('Student');
    this.activateError.set(null);
    this.activateSuccess.set(null);
    this.activateSubmitted.set(false);
    this.showActivateModal.set(true);
    this.loadUsers();
  }

  closeActivateModal(): void {
    this.showActivateModal.set(false);
  }

  submitActivate(): void {
    this.activateSubmitted.set(true);
    this.activateError.set(null);
    const targetUserId = this.activateForm.get('targetUserId')?.value;
    const planId = this.activateForm.get('planId')?.value;
    const note = this.activateForm.get('note')?.value;

    if (!targetUserId || !planId) {
      if (!targetUserId) this.activateForm.get('targetUserId')?.setErrors({ required: true });
      if (!planId) this.activateForm.get('planId')?.setErrors({ required: true });
      return;
    }

    this.activating.set(true);
    const req: AdminActivateRequest = { 
      studentUserId: targetUserId,
      userId: targetUserId,
      planId, 
      note: note || undefined 
    };
    this.subApi.adminActivate(req).subscribe({
      next: () => {
        this.activating.set(false);
        this.activateSuccess.set('Subscription activated successfully!');
        setTimeout(() => { this.closeActivateModal(); this.load(); }, 1500);
      },
      error: err => {
        this.activating.set(false);
        this.activateError.set(err?.error?.message ?? 'Activation failed.');
      },
    });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  openCancelModal(sub: SubscriptionDto): void {
    this.cancelTarget.set(sub);
    this.cancelReason = '';
    this.cancelError.set(null);
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void { this.showCancelModal.set(false); }

  submitCancel(): void {
    const sub = this.cancelTarget();
    if (!sub || !this.cancelReason.trim()) return;

    this.cancelling.set(true);
    this.cancelError.set(null);
    this.subApi.adminCancel(sub.subscriptionId, this.cancelReason.trim()).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.closeCancelModal();
        this.load();
      },
      error: err => {
        this.cancelling.set(false);
        this.cancelError.set(err?.error?.message ?? 'Cancellation failed.');
      },
    });
  }
}
