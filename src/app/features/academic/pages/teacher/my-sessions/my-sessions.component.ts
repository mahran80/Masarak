import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { SessionCardComponent } from '../../../components/session-card/session-card.component';
import { SessionService } from '../../../../../services/session.service';
import { SessionDto, SessionStatus } from '../../../../../models/academic.models';

@Component({
  selector: 'app-my-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, SessionCardComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge bg-teal-100 text-teal-700 mb-2 inline-flex">Teacher Portal</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">My Sessions</h1>
          <p class="text-surface-500 mt-1">Manage your scheduled live classes</p>
        </div>
        <a [routerLink]="['/teacher/sessions/new']" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Session
        </a>
      </div>

      <!-- Date range + filter -->
      <div class="card p-4 mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="form-label">From</label>
          <input type="date" [(ngModel)]="fromDate" class="form-input" [ngModelOptions]="{standalone:true}"/>
        </div>
        <div class="flex-1">
          <label class="form-label">To</label>
          <input type="date" [(ngModel)]="toDate" class="form-input" [ngModelOptions]="{standalone:true}"/>
        </div>
        <div class="flex-1">
          <label class="form-label">Status</label>
          <select [(ngModel)]="statusFilter" class="form-select" [ngModelOptions]="{standalone:true}">
            <option value="">All statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button (click)="load()" class="btn-primary">Apply</button>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading sessions…"></app-loading-spinner>

      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <app-empty-state
        *ngIf="!loading() && !error() && filtered().length === 0"
        icon="📅" title="No sessions found"
        description="Try adjusting the date range or schedule a new session.">
        <a [routerLink]="['/teacher/sessions/new']" class="btn-primary mt-4">Schedule Session</a>
      </app-empty-state>

      <!-- Sessions list -->
      <div *ngIf="!loading() && filtered().length > 0" class="space-y-3">
        <div
          *ngFor="let s of filtered()"
          class="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
        >
          <!-- Status icon -->
          <div [class]="statusIconClass(s.status)">
            <span class="text-xl">{{ statusIcon(s.status) }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-2 flex-wrap">
              <h3 class="text-base font-semibold text-surface-900">{{ s.title }}</h3>
              <span [class]="statusBadge(s.status)">
                <span *ngIf="s.status === 'Live'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block"></span>
                {{ s.status }}
              </span>
            </div>
            <p class="text-sm text-surface-500 mt-0.5">{{ s.subjectName }} · {{ s.className }}</p>
            <p class="text-sm text-surface-600 mt-1">
              🕐 {{ s.scheduledAt | date:'medium' }} · {{ s.durationMinutes }} min
            </p>
            <a *ngIf="s.embedUrl" [href]="s.embedUrl" target="_blank" rel="noopener noreferrer"
               class="text-xs text-brand-600 hover:underline mt-1 inline-block">🔗 Join Link</a>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 flex-shrink-0">
            <button
              *ngIf="s.status === 'Scheduled'"
              (click)="openCancelModal(s)"
              class="btn-danger btn-sm">
              Cancel
            </button>
            <span *ngIf="s.status !== 'Scheduled'" class="text-xs text-surface-400 self-center">
              {{ s.status === 'Cancelled' ? 'Cancelled' : 'Completed' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Cancel Confirmation ── -->
    <div *ngIf="showCancelModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCancelModal()">
      <div class="card p-8 max-w-sm w-full shadow-modal" (click)="$event.stopPropagation()">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-surface-900 font-display mb-2">Cancel Session</h2>
        <p class="text-sm text-surface-500 mb-1">Cancel <strong>{{ cancelTarget()?.title }}</strong>?</p>
        <p class="text-xs text-surface-400 mb-6">Students will no longer see this session on their schedule.</p>
        <div *ngIf="cancelError()" class="alert-error mb-4 text-sm">{{ cancelError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeCancelModal()" class="btn-secondary flex-1">Keep It</button>
          <button (click)="submitCancel()" [disabled]="cancelling()" class="btn-danger flex-1">
            {{ cancelling() ? 'Cancelling…' : 'Cancel Session' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MySessionsComponent implements OnInit {
  private svc = inject(SessionService);

  sessions       = signal<SessionDto[]>([]);
  loading        = signal(true);
  error          = signal<string | null>(null);
  showCancelModal = signal(false);
  cancelTarget   = signal<SessionDto | null>(null);
  cancelling     = signal(false);
  cancelError    = signal<string | null>(null);

  fromDate     = this.toIsoDate(this.startOfWeek());
  toDate       = this.toIsoDate(this.endOfWeek());
  statusFilter = '';

  filtered = () => {
    const f = this.statusFilter as SessionStatus | '';
    return f ? this.sessions().filter(s => s.status === f) : this.sessions();
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.svc.getMySessionsRange(
      new Date(this.fromDate).toISOString(),
      new Date(this.toDate + 'T23:59:59').toISOString()
    ).subscribe({
      next:  s   => { this.sessions.set(s); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed to load sessions.'); this.loading.set(false); },
    });
  }

  statusIcon(status: SessionStatus): string {
    return ({ Scheduled: '📅', Live: '🔴', Completed: '✅', Cancelled: '❌' })[status] ?? '📅';
  }

  statusIconClass(status: SessionStatus): string {
    const map: Record<string, string> = {
      Scheduled: 'w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0',
      Live:      'w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0',
      Completed: 'w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center flex-shrink-0',
      Cancelled: 'w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0',
    };
    return map[status] ?? map['Scheduled'];
  }

  statusBadge(status: SessionStatus): string {
    return ({ Scheduled: 'badge-brand', Live: 'badge-active', Completed: 'badge-expired', Cancelled: 'badge-cancelled' })[status] ?? 'badge';
  }

  openCancelModal(s: SessionDto): void { this.cancelTarget.set(s); this.cancelError.set(null); this.showCancelModal.set(true); }
  closeCancelModal(): void { this.showCancelModal.set(false); }

  submitCancel(): void {
    const s = this.cancelTarget()!;
    this.cancelling.set(true); this.cancelError.set(null);
    this.svc.cancelSession(s.sessionId).subscribe({
      next: () => { this.cancelling.set(false); this.closeCancelModal(); this.load(); },
      error: err => { this.cancelling.set(false); this.cancelError.set(err?.error?.message ?? 'Failed to cancel.'); },
    });
  }

  private startOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const d   = new Date(now);
    d.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfWeek(): Date {
    const start = this.startOfWeek();
    const d     = new Date(start);
    d.setDate(start.getDate() + 6);
    return d;
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
