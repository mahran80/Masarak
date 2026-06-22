import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { WeeklyCalendarComponent } from '../../../components/weekly-calendar/weekly-calendar.component';
import { AcademicService } from '../../../../../services/academic.service';
import { SessionDto } from '../../../../../models/academic.models';

@Component({
  selector: 'app-my-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, WeeklyCalendarComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <span class="badge bg-violet-100 text-violet-700 mb-2 inline-flex">Student Portal</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">My Weekly Schedule</h1>
          <p class="text-surface-500 mt-1">Upcoming live sessions for your class</p>
        </div>
        <a [routerLink]="['/student/my-class']" class="btn-secondary btn-sm">
          ← My Class
        </a>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex items-center gap-2 text-sm text-surface-600">
          <div class="w-3 h-3 rounded-full bg-brand-500"></div> Scheduled
        </div>
        <div class="flex items-center gap-2 text-sm text-surface-600">
          <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div> Live Now
        </div>
        <div class="flex items-center gap-2 text-sm text-surface-600">
          <div class="w-3 h-3 rounded-full bg-surface-300"></div> Past
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading schedule…"></app-loading-spinner>

      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="loadSchedule()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Calendar -->
      <div *ngIf="!loading()" class="card p-4 sm:p-6">
        <app-weekly-calendar
          [sessions]="sessions()"
          [currentWeekStart]="weekStart"
          (weekChanged)="onWeekChanged($event)"
          (sessionClick)="openSessionModal($event)"
        ></app-weekly-calendar>
      </div>
    </div>

    <!-- ── Session Detail Modal ── -->
    <div *ngIf="selectedSession()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeSessionModal()">
      <div class="card p-6 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <!-- Status -->
        <div class="flex items-center gap-2 mb-4">
          <span [class]="sessionBadge(selectedSession()!.status)">
            <span *ngIf="selectedSession()!.status === 'Live'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block"></span>
            {{ selectedSession()!.status }}
          </span>
          <span class="text-xs text-surface-400">{{ selectedSession()!.subjectName }}</span>
        </div>

        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">{{ selectedSession()!.title }}</h2>
        <p *ngIf="selectedSession()!.description" class="text-sm text-surface-500 mb-4">{{ selectedSession()!.description }}</p>

        <!-- Details -->
        <div class="space-y-2 mb-6">
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <span class="text-lg">👩‍🏫</span>
            <span>{{ selectedSession()!.teacherName }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <span class="text-lg">🏫</span>
            <span>{{ selectedSession()!.className }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <span class="text-lg">🕐</span>
            <span>{{ selectedSession()!.scheduledAt | date:'fullDate' }} at {{ selectedSession()!.scheduledAt | date:'shortTime' }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-surface-600">
            <span class="text-lg">⏱️</span>
            <span>{{ selectedSession()!.durationMinutes }} minutes (ends {{ selectedSession()!.endsAt | date:'shortTime' }})</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button (click)="closeSessionModal()" class="btn-secondary flex-1">Close</button>
          <a
            *ngIf="selectedSession()!.embedUrl && canJoin(selectedSession()!.status)"
            [href]="selectedSession()!.embedUrl!"
            target="_blank" rel="noopener noreferrer"
            class="btn-primary flex-1 text-center"
          >
            🔗 Join Live Class
          </a>
          <span
            *ngIf="!selectedSession()!.embedUrl || !canJoin(selectedSession()!.status)"
            class="text-xs text-surface-400 self-center flex-1 text-center"
          >
            {{ selectedSession()!.status === 'Completed' ? 'Session ended' : selectedSession()!.status === 'Cancelled' ? 'Cancelled' : 'Link not yet available' }}
          </span>
        </div>
      </div>
    </div>
  `,
})
export class MyScheduleComponent implements OnInit {
  private svc = inject(AcademicService);

  sessions        = signal<SessionDto[]>([]);
  loading         = signal(true);
  error           = signal<string | null>(null);
  selectedSession = signal<SessionDto | null>(null);
  weekStart       = this.getMondayOfCurrentWeek();

  ngOnInit(): void { this.loadSchedule(); }

  loadSchedule(): void {
    this.loading.set(true); this.error.set(null);
    const iso = this.weekStart.toISOString().slice(0, 10);
    this.svc.getMySchedule(iso).subscribe({
      next:  data => { this.sessions.set(data.sessions); this.loading.set(false); },
      error: err  => { this.error.set(err?.error?.message ?? 'Failed to load schedule.'); this.loading.set(false); },
    });
  }

  onWeekChanged(event: { weekStart: Date; weekEnd: Date }): void {
    this.weekStart = event.weekStart;
    this.loadSchedule();
  }

  openSessionModal(session: SessionDto): void { this.selectedSession.set(session); }
  closeSessionModal(): void { this.selectedSession.set(null); }

  canJoin(status: string): boolean { return status === 'Scheduled' || status === 'Live'; }

  sessionBadge(status: string): string {
    return ({ Scheduled: 'badge-brand', Live: 'badge-active', Completed: 'badge-expired', Cancelled: 'badge-cancelled' })[status] ?? 'badge';
  }

  private getMondayOfCurrentWeek(): Date {
    const now  = new Date();
    const day  = now.getDay();
    const diff = (day === 0) ? -6 : 1 - day;
    const mon  = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }
}
