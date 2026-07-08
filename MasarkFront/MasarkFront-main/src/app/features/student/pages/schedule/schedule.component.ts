import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentScheduleSession } from '../../models';
import { StudentService } from '../../services/student.service';

import { WeeklyCalendarComponent, CalendarSession } from '../../../shared/components/weekly-calendar/weekly-calendar.component';

@Component({
  selector: 'app-student-schedule-page',
  standalone: true,
  imports: [WeeklyCalendarComponent, FormsModule],
  templateUrl: './schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSchedulePageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly sessions = signal<StudentScheduleSession[]>([]);
  readonly calendarSessions = signal<CalendarSession[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Academic weeks for dropdown
  readonly academicWeeks = computed(() => {
    const d = new Date();
    let startYear = d.getFullYear();
    if (d.getMonth() < 8) {
      startYear--;
    }
    const academicStart = new Date(startYear, 8, 1);
    academicStart.setHours(0, 0, 0, 0);
    const day = academicStart.getDay();
    const diff = academicStart.getDate() - day;
    const firstWeekStart = new Date(academicStart.setDate(diff));

    const weeks = [];
    for (let i = 0; i < 52; i++) {
      const wDate = new Date(firstWeekStart);
      wDate.setDate(wDate.getDate() + (i * 7));
      weeks.push({
        label: `الأسبوع ${i + 1} (${wDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })})`,
        value: this.toDateString(wDate)
      });
    }
    return weeks;
  });

  // Keep track of selected week start as string for select binding
  readonly selectedWeek = signal<string>(this.getCurrentWeekStr());

  private toDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCurrentWeekStr(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    return this.toDateString(weekStart);
  }

  // Backward compatibility with child component (it expects a Date)
  readonly weekStart = computed(() => new Date(this.selectedWeek()));

  onWeekChange(event: any): void {
    this.selectedWeek.set(event.target.value);
    this.loadSchedule();
  }

  ngOnInit(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentService
      .getMyClass()
      .pipe(
        switchMap((classInfo) => this.studentService.getSchedule(classInfo?.academicYear, this.toDateString(this.weekStart()))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.calendarSessions.set(sessions.map(s => ({
            id: s.sessionId || 0,
            title: s.sessionTitle || '',
            subjectName: s.subjectName || '',
            teacherName: s.teacherName,
            status: s.status || 'Scheduled',
            scheduledAt: new Date(s.sessionDate || new Date()),
            durationMinutes: Number(s.duration || 60),
            originalData: s
          })));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.sessions.set([]);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  joinSessionFromCalendar(s: CalendarSession): void {
    this.joinSession(s.id);
  }

  joinSession(sessionId: number | string | undefined): void {
    if (!sessionId) return;
    this.router.navigate(['/dashboard/student/sessions', sessionId, 'live']);
  }
}
