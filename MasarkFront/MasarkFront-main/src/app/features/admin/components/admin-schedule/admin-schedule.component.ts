import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicApiService } from '../../../../core/services/academic-api-service';
import { AdminSessionService, AdminSessionDto, AdminScheduleSessionRequest } from '../../services/admin-session.service';
import { WeeklyCalendarComponent, CalendarSession } from '../../../shared/components/weekly-calendar/weekly-calendar.component';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, DatePipe, WeeklyCalendarComponent],
  templateUrl: './admin-schedule.component.html',
})
export class AdminScheduleComponent implements OnInit {
  private readonly academicApi = inject(AcademicApiService);
  private readonly sessionApi = inject(AdminSessionService);

  grades = signal<any[]>([]);
  classes = signal<any[]>([]);
  assignments = signal<any[]>([]); // To get subjects/teachers
  sessions = signal<AdminSessionDto[]>([]);
  teacherSessions = signal<AdminSessionDto[]>([]);

  selectedGradeId = signal<number | null>(null);
  selectedClassId = signal<number | null>(null);

  viewMode = signal<'list' | 'week'>('week');

  // Date filters for list mode
  fromDate = signal<string>(this.getDefaultFromDate());
  toDate = signal<string>(this.getDefaultToDate());

  isSidebarOpen = signal(true);

  calendarSessions = signal<CalendarSession[]>([]);

  // Modal state
  isModalOpen = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  // Form state
  formSubjectId = signal<number | null>(null);
  formTitle = signal('');
  formDescription = signal('');
  formDate = signal('');
  formTime = signal('');
  formDuration = signal(60);
  formIsRecurring = signal(false);
  formRecurUntil = signal('');

  availableTimeSlots = computed(() => {
    const slots: { label: string, value: string, disabled: boolean }[] = [];
    const dateStr = this.formDate();
    const duration = this.formDuration();
    const existingSessions = [...this.sessions(), ...this.teacherSessions()];
    
    // Generate from 07:00 to 21:00 every 30 mins
    for (let h = 7; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const timeValue = `${hh}:${mm}`;
        
        let disabled = false;
        if (dateStr) {
          const slotStart = new Date(`${dateStr}T${timeValue}:00`);
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);
          
          for (const s of existingSessions) {
            const sStart = new Date(s.scheduledAt);
            const sEnd = new Date(s.endsAt);
            // If slot overlaps with an existing session, disable it
            if (slotStart < sEnd && slotEnd > sStart) {
              disabled = true;
              break;
            }
          }
        }
        
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const label = `${displayH}:${mm} ${ampm}`;
        slots.push({ label, value: timeValue, disabled });
      }
    }
    return slots;
  });

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.academicApi.getGrades().subscribe(res => this.grades.set(res));
  }

  onGradeSelect(gradeId: number): void {
    if (this.selectedGradeId() === gradeId) {
      this.selectedGradeId.set(null);
      this.selectedClassId.set(null);
      this.sessions.set([]);
      this.classes.set([]);
      return;
    }
    
    this.selectedGradeId.set(gradeId);
    this.selectedClassId.set(null);
    this.sessions.set([]);
    this.academicApi.getClassesByGrade(gradeId, new Date().getFullYear()).subscribe(res => {
      this.classes.set(res);
      if (res && res.length > 0) {
        this.onClassSelect(res[0].classId);
      }
    });
  }

  onClassSelect(classId: number): void {
    this.selectedClassId.set(classId);
    this.loadSessions();
    this.academicApi.getAssignmentsForClass(classId, new Date().getFullYear()).subscribe(res => {
      this.assignments.set(res.filter((a: any) => a.isActive));
    });
  }

  loadSessions() {
    let fromStr = this.fromDate();
    let toStr = this.toDate();

    if (this.viewMode() === 'week') {
      if (!this.selectedClassId()) {
        this.sessions.set([]);
        this.calendarSessions.set([]);
        return;
      }
      const wStart = this.weekStart();
      fromStr = this.formatDate(wStart);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);
      toStr = this.formatDate(wEnd);
    }

    const request$ = this.selectedClassId() 
      ? this.sessionApi.getClassSchedule(this.selectedClassId()!, fromStr, toStr)
      : this.sessionApi.getAllSessions(fromStr, toStr);

    request$.subscribe({
      next: res => {
        this.sessions.set(res);
        this.calendarSessions.set(res.map(s => ({
            id: s.sessionId,
            title: s.title,
            subjectName: s.subjectName,
            teacherName: s.teacherName,
            status: s.status,
            scheduledAt: new Date(s.scheduledAt),
            durationMinutes: s.durationMinutes,
            originalData: s
        })));
      },
      error: () => this.sessions.set([])
    });
  }

  onSubjectChange(subjectId: number): void {
    this.formSubjectId.set(subjectId);
    
    // Find teacherId from assignments
    const assignment = this.assignments().find(a => a.subjectId === subjectId);
    if (assignment?.teacherId && this.fromDate() && this.toDate()) {
      this.sessionApi.getTeacherSchedule(assignment.teacherId, this.fromDate(), this.toDate()).subscribe({
        next: res => this.teacherSessions.set(res),
        error: () => this.teacherSessions.set([])
      });
    } else {
      this.teacherSessions.set([]);
    }
  }

  openModal(): void {
    this.isModalOpen.set(true);
    this.formSubjectId.set(null);
    this.formTitle.set('');
    this.formDescription.set('');
    this.formDate.set(new Date().toISOString().split('T')[0]);
    this.formTime.set('');
    this.formDuration.set(60);
    this.formIsRecurring.set(false);
    this.formRecurUntil.set('');
    this.errorMessage.set(null);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveSession(): void {
    if (!this.selectedClassId() || !this.formSubjectId() || !this.formTitle() || !this.formDate() || !this.formTime()) {
      alert('Please fill all required fields');
      return;
    }

    this.isSaving.set(true);

    const scheduledAtStr = `${this.formDate()}T${this.formTime()}:00`;

    const req: AdminScheduleSessionRequest = {
      classId: this.selectedClassId()!,
      subjectId: this.formSubjectId()!,
      title: this.formTitle(),
      description: this.formDescription(),
      scheduledAt: scheduledAtStr,
      durationMinutes: this.formDuration(),
      isRecurring: this.formIsRecurring(),
      recurUntil: this.formIsRecurring() && this.formRecurUntil() ? `${this.formRecurUntil()}T23:59:59` : undefined
    };

    this.sessionApi.scheduleSessionSeries(req).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadSessions();
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(err.error?.message || 'Scheduling failed');
      }
    });
  }

  cancelSession(session: AdminSessionDto, entireSeries: boolean = false): void {
    if (!confirm(`Are you sure you want to cancel this ${entireSeries ? 'entire series' : 'single session'}?`)) return;
    
    if (entireSeries && session.seriesId) {
      this.sessionApi.cancelSessionSeries(session.seriesId).subscribe({
        next: () => this.loadSessions(),
        error: (err) => alert(err.error?.message || 'Failed to cancel series')
      });
    } else {
      this.sessionApi.cancelSingleSession(session.sessionId).subscribe({
        next: () => this.loadSessions(),
        error: (err) => alert(err.error?.message || 'Failed to cancel session')
      });
    }
  }

  reactivateSession(s: AdminSessionDto) {
    if (confirm('هل أنت متأكد من إعادة تنشيط هذه الحصة؟')) {
      this.sessionApi.reactivateSession(s.sessionId).subscribe({
        next: () => this.loadSessions(),
        error: err => alert(err.error?.detail || err.error?.message || 'Failed to reactivate session')
      });
    }
  }

  onCalendarCancel(s: CalendarSession) {
    if (s.originalData) {
      if (s.status === 'Scheduled') {
         this.cancelSession(s.originalData, false);
      }
    }
  }

  onCalendarEdit(s: CalendarSession) {
    if (s.originalData) {
      if (s.status === 'Completed' || s.status === 'Cancelled') {
        this.reactivateSession(s.originalData);
      }
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday
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

  private getDefaultFromDate(): string {
    const d = new Date();
    d.setDate(1); // First day of current month
    return this.formatDate(d);
  }

  private getDefaultToDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Last day of current month
    return this.formatDate(d);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
}
