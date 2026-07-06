import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed, effect } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherSessionService, SessionDto } from '../../services/teacher-session.service';

import { TeacherContextService } from '../../services/teacher-context.service';
import { Router, RouterModule } from '@angular/router';
import { WeeklyCalendarComponent, CalendarSession } from '../../../shared/components/weekly-calendar/weekly-calendar.component';

@Component({
  selector: 'app-teacher-sessions',
  standalone: true,
  imports: [NgClass, FormsModule, RouterModule, WeeklyCalendarComponent],
  templateUrl: './teacher-sessions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSessionsComponent implements OnInit {
  private readonly sessionService = inject(TeacherSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(TeacherContextService);
  private readonly router = inject(Router);

  readonly sessions = signal<SessionDto[]>([]);

  
  // UI signals
  isSidebarOpen = signal(true);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    return new Date(d.setDate(diff));
  }

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
    this.loadSessions();
  }

  // Assignments from context
  readonly assignments = this.contextService.assignments;

  // Sidebar selections
  readonly selectedGradeId = signal<number | null>(null);
  readonly selectedClassId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const g = this.grades();
      if (g.length > 0 && !this.selectedGradeId()) {
        this.selectedGradeId.set(g[0].gradeId);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const c = this.classes();
      if (c.length > 0 && !this.selectedClassId()) {
        this.selectedClassId.set(c[0].classId);
      }
    }, { allowSignalWrites: true });
  }

  // Computed data for sidebar
  readonly grades = computed(() => {
    const allAssignments = this.assignments();
    const uniqueGrades = new Map<number, { gradeId: number; name: string }>();
    allAssignments.forEach(a => {
      if (a.gradeId && !uniqueGrades.has(a.gradeId)) {
        uniqueGrades.set(a.gradeId, { gradeId: a.gradeId, name: a.gradeName });
      }
    });
    return Array.from(uniqueGrades.values());
  });

  readonly classes = computed(() => {
    const gid = this.selectedGradeId();
    if (!gid) return [];
    const allAssignments = this.assignments();
    const classMap = new Map<number, { classId: number; name: string }>();
    allAssignments.forEach(a => {
      if (a.gradeId === gid && !classMap.has(a.classId)) {
        classMap.set(a.classId, { classId: a.classId, name: a.className });
      }
    });
    return Array.from(classMap.values());
  });

  readonly filteredSessions = computed(() => {
    const cid = this.selectedClassId();
    if (!cid) return [];
    return this.sessions().filter(s => s.classId === cid);
  });

  readonly calendarSessions = computed<any[]>(() => {
    return this.filteredSessions().map(s => ({
      id: s.sessionId,
      title: s.title,
      subjectName: s.subjectName,
      className: s.className,
      status: s.status,
      scheduledAt: new Date(s.scheduledAt),
      durationMinutes: s.durationMinutes,
      originalData: s
    }));
  });

  ngOnInit(): void {
    this.contextService.loadAssignments();
    this.loadSessions();
  }

  onGradeSelect(gradeId: number): void {
    if (this.selectedGradeId() === gradeId) {
      this.selectedGradeId.set(null);
      this.selectedClassId.set(null);
    } else {
      this.selectedGradeId.set(gradeId);
      const classes = this.classes();
      if (classes && classes.length > 0) {
        this.selectedClassId.set(classes[0].classId);
      } else {
        this.selectedClassId.set(null);
      }
    }
  }

  onClassSelect(classId: number): void {
    this.selectedClassId.set(classId);
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const fromDateStr = this.formatDateForApi(this.weekStart());
    const endDate = new Date(this.weekStart());
    endDate.setDate(endDate.getDate() + 7); // Add 7 days to cover up to 00:00 of the next Sunday
    const toDateStr = this.formatDateForApi(endDate);

    this.sessionService
      .getMySessions(fromDateStr, toDateStr)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage.set('Failed to load sessions.');
          this.isLoading.set(false);
        },
      });
  }
  canStartSession(session: SessionDto): boolean {
    const now = new Date();
    const scheduledAt = new Date(session.scheduledAt);
    
    // session ends at ScheduledAt + DurationMinutes
    const endsAt = new Date(scheduledAt.getTime() + session.durationMinutes * 60000);
    
    // start window is 15 mins before scheduledAt
    const startWindow = new Date(scheduledAt.getTime() - 15 * 60000);

    return now >= startWindow && now <= endsAt;
  }

  startSession(sessionId: number): void {
    if (!confirm('Are you sure you want to start this session?')) return;
    this.sessionService.startSession(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadSessions();
          this.router.navigate(['/dashboard/teacher/sessions', sessionId, 'live']);
        },
        error: (err) => alert(err.error?.message || err.error?.detail || 'Failed to start session')
      });
  }

  completeSession(sessionId: number): void {
    if (!confirm('Are you sure you want to end this session?')) return;
    this.sessionService.completeSession(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadSessions(),
        error: (err) => alert(err.error?.message || 'Failed to complete session')
      });
  }

  copyLink(url: string | undefined): void {
    if (url) {
      navigator.clipboard.writeText(url);
      alert('Meeting link copied to clipboard!');
    }
  }

  onCalendarStart(s: CalendarSession): void {
    this.startSession(Number(s.id));
  }

  onCalendarJoin(s: CalendarSession): void {
    this.router.navigate(['/dashboard/teacher/sessions', s.id, 'live']);
  }


  onCalendarComplete(s: CalendarSession): void {
    this.completeSession(Number(s.id));
  }

  private formatDateForApi(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
