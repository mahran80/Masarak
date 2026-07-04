import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface CalendarSession {
  id: number | string;
  title: string;
  subjectName: string;
  className?: string;
  teacherName?: string;
  status: string; // 'Scheduled', 'Live', 'Completed', 'Cancelled'
  scheduledAt: Date;
  durationMinutes: number;
  originalData?: any;
}

interface DayColumn {
  date: Date;
  dayName: string;
  isToday: boolean;
  sessions: CalendarSession[];
}

@Component({
  selector: 'app-weekly-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, NgClass],
  templateUrl: './weekly-calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyCalendarComponent implements OnChanges {
  @Input() weekStart!: Date;
  @Input() sessions: CalendarSession[] = [];
  @Input() role: 'admin' | 'teacher' | 'student' = 'student';

  @Output() join = new EventEmitter<CalendarSession>();
  @Output() start = new EventEmitter<CalendarSession>();
  @Output() edit = new EventEmitter<CalendarSession>();
  @Output() cancel = new EventEmitter<CalendarSession>();
  @Output() complete = new EventEmitter<CalendarSession>();

  days: DayColumn[] = [];

  readonly dayNamesAr = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  ngOnChanges(): void {
    this.buildCalendar();
  }

  private buildCalendar(): void {
    if (!this.weekStart) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekColumns: DayColumn[] = [];
    
    // Create 7 days starting from weekStart
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.weekStart);
      date.setDate(date.getDate() + i);
      
      const isToday = date.getTime() === today.getTime();
      const dayName = this.dayNamesAr[date.getDay()];

      const daySessions = this.sessions.filter(s => {
        const sDate = new Date(s.scheduledAt);
        return sDate.getDate() === date.getDate() && 
               sDate.getMonth() === date.getMonth() && 
               sDate.getFullYear() === date.getFullYear();
      }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      weekColumns.push({
        date,
        dayName,
        isToday,
        sessions: daySessions
      });
    }

    this.days = weekColumns;
  }

  canStartSession(s: CalendarSession): boolean {
    const now = new Date();
    const scheduledAt = new Date(s.scheduledAt);
    const endsAt = new Date(scheduledAt.getTime() + s.durationMinutes * 60000);
    const startWindow = new Date(scheduledAt.getTime() - 15 * 60000);
    return now >= startWindow && now <= endsAt;
  }
}
