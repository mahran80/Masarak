import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionDto } from '../../../../models/academic.models';
import { SessionCardComponent } from '../session-card/session-card.component';

interface DayColumn {
  label: string;
  labelAr: string;
  isoDate: string;
  date: Date;
  sessions: SessionDto[];
}

@Component({
  selector: 'app-weekly-calendar',
  standalone: true,
  imports: [CommonModule, SessionCardComponent],
  template: `
    <div>
      <!-- Week header -->
      <div class="flex items-center justify-between mb-4">
        <button
          (click)="prevWeek()"
          class="btn-secondary btn-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Prev
        </button>

        <div class="text-center">
          <p class="text-sm font-semibold text-surface-700">
            {{ weekStart | date:'MMM d' }} — {{ weekEnd | date:'MMM d, yyyy' }}
          </p>
        </div>

        <button
          (click)="nextWeek()"
          class="btn-secondary btn-sm flex items-center gap-1"
        >
          Next
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Desktop Grid: 7 columns -->
      <div class="hidden md:grid grid-cols-7 gap-2">
        <div *ngFor="let day of days" class="min-h-[120px]">
          <!-- Day header -->
          <div
            [class]="'text-center py-2 px-1 rounded-lg mb-2 ' +
              (isToday(day.date) ? 'bg-brand-600 text-white' : 'bg-surface-50 text-surface-600')"
          >
            <p class="text-xs font-semibold">{{ day.label }}</p>
            <p class="text-xs opacity-75">{{ day.labelAr }}</p>
            <p [class]="'text-lg font-bold ' + (isToday(day.date) ? 'text-white' : 'text-surface-900')">
              {{ day.date | date:'d' }}
            </p>
          </div>

          <!-- Sessions for this day -->
          <div class="space-y-2">
            <app-session-card
              *ngFor="let s of day.sessions"
              [session]="s"
              (cardClick)="sessionClick.emit($event)"
            ></app-session-card>

            <div
              *ngIf="day.sessions.length === 0"
              class="flex items-center justify-center h-16 rounded-xl border-2 border-dashed border-surface-100"
            >
              <span class="text-xs text-surface-300">No sessions</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile: stacked list -->
      <div class="md:hidden space-y-4">
        <div *ngFor="let day of days">
          <div
            *ngIf="day.sessions.length > 0"
            class="mb-1"
          >
            <div
              [class]="'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 ' +
                (isToday(day.date) ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-700')"
            >
              {{ day.label }} · {{ day.date | date:'MMM d' }}
            </div>
            <div class="space-y-2 pl-2">
              <app-session-card
                *ngFor="let s of day.sessions"
                [session]="s"
                (cardClick)="sessionClick.emit($event)"
              ></app-session-card>
            </div>
          </div>
        </div>

        <!-- Mobile empty state -->
        <div
          *ngIf="totalSessions === 0"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
            <span class="text-3xl">📅</span>
          </div>
          <p class="text-surface-500 text-sm">No sessions scheduled this week</p>
        </div>
      </div>

      <!-- Desktop empty state -->
      <div
        *ngIf="totalSessions === 0"
        class="hidden md:flex flex-col items-center justify-center py-12"
      >
        <span class="text-5xl mb-3">📅</span>
        <p class="text-surface-500 text-sm">No sessions scheduled this week</p>
      </div>
    </div>
  `,
})
export class WeeklyCalendarComponent implements OnChanges {
  @Input() sessions: SessionDto[] = [];
  @Input() currentWeekStart: Date = this.getMondayOfCurrentWeek();
  @Output() sessionClick = new EventEmitter<SessionDto>();
  @Output() weekChanged  = new EventEmitter<{ weekStart: Date; weekEnd: Date }>();

  days: DayColumn[] = [];

  get weekStart(): Date { return this.currentWeekStart; }
  get weekEnd():   Date {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }
  get totalSessions(): number { return this.sessions.length; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessions'] || changes['currentWeekStart']) {
      this.buildDays();
    }
  }

  prevWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
    this.weekChanged.emit({ weekStart: this.currentWeekStart, weekEnd: this.weekEnd });
    this.buildDays();
  }

  nextWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
    this.weekChanged.emit({ weekStart: this.currentWeekStart, weekEnd: this.weekEnd });
    this.buildDays();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private buildDays(): void {
    const dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    this.days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      const isoDate = date.toISOString().slice(0, 10);

      const daySessions = this.sessions
        .filter(s => s.scheduledAt.slice(0, 10) === isoDate)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

      return {
        label:    dayNames[date.getDay()],
        labelAr:  dayNamesAr[date.getDay()],
        isoDate,
        date,
        sessions: daySessions,
      };
    });
  }

  private getMondayOfCurrentWeek(): Date {
    const now  = new Date();
    const day  = now.getDay(); // 0=Sun
    const diff = (day === 0) ? -6 : 1 - day; // shift to Monday
    const mon  = new Date(now);
    mon.setDate(now.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }
}
