import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SessionDto } from '../../../../models/academic.models';

interface DayColumn {
  label: string;
  labelAr: string;
  date: Date;
  sessions: SessionDto[];
}

@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="cardClass"
      (click)="cardClick.emit(session)"
      role="button"
      tabindex="0"
      (keydown.enter)="cardClick.emit(session)"
    >
      <!-- Status indicator -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <span class="text-xs font-semibold text-brand-700 truncate">{{ session.subjectName }}</span>
        <span [class]="statusBadge">
          <span *ngIf="isLive" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block"></span>
          {{ statusLabel }}
        </span>
      </div>

      <!-- Title -->
      <p class="text-sm font-semibold text-surface-900 leading-snug mb-1 line-clamp-2">{{ session.title }}</p>

      <!-- Meta -->
      <p class="text-xs text-surface-500">{{ session.className }}</p>
      <p class="text-xs text-surface-500">{{ session.teacherName }}</p>

      <!-- Time -->
      <div class="mt-2 pt-2 border-t border-surface-100 flex items-center justify-between">
        <span class="text-xs text-surface-600 font-medium">
          {{ session.scheduledAt | date:'shortTime' }}
        </span>
        <span class="text-xs text-surface-400">{{ session.durationMinutes }} min</span>
      </div>

      <!-- Join button -->
      <a
        *ngIf="session.embedUrl && (isLive || isScheduled)"
        [href]="session.embedUrl"
        target="_blank"
        rel="noopener noreferrer"
        (click)="$event.stopPropagation()"
        class="mt-2 block w-full text-center text-xs font-semibold py-1.5 rounded-lg
               bg-brand-600 text-white hover:bg-brand-700 transition-colors"
      >
        {{ isLive ? '🔴 Join Now' : '🔗 Join Link' }}
      </a>
    </div>
  `,
})
export class SessionCardComponent {
  @Input({ required: true }) session!: SessionDto;
  @Output() cardClick = new EventEmitter<SessionDto>();

  get isLive():      boolean { return this.session.status === 'Live'; }
  get isScheduled(): boolean { return this.session.status === 'Scheduled'; }
  get isPast():      boolean { return this.session.status === 'Completed' || this.session.status === 'Cancelled'; }

  get statusLabel(): string {
    const map: Record<string, string> = { Scheduled: 'Scheduled', Live: 'Live', Completed: 'Done', Cancelled: 'Cancelled' };
    return map[this.session.status] ?? this.session.status;
  }

  get statusBadge(): string {
    const map: Record<string, string> = {
      Scheduled: 'badge badge-brand',
      Live:      'badge badge-active',
      Completed: 'badge badge-expired',
      Cancelled: 'badge badge-cancelled',
    };
    return map[this.session.status] ?? 'badge';
  }

  get cardClass(): string {
    const base = 'p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500';
    if (this.isLive)      return `${base} bg-emerald-50 border-emerald-200 shadow-sm`;
    if (this.isPast)      return `${base} bg-surface-50 border-surface-200 opacity-60`;
    return `${base} bg-white border-brand-100 shadow-sm`;
  }
}
