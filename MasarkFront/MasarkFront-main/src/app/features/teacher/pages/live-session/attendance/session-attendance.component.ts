import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAttendanceService, SessionAttendanceDto, AttendanceRecordDto } from '../../../services/teacher-attendance.service';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-teacher-session-attendance',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule, RouterLink, IconComponent],
  templateUrl: './session-attendance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSessionAttendanceComponent implements OnInit {
  private readonly attendanceService = inject(TeacherAttendanceService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly sessionAttendance = signal<SessionAttendanceDto | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Modal State
  readonly isModalOpen = signal(false);
  readonly selectedRecord = signal<AttendanceRecordDto | null>(null);
  readonly overrideStatus = signal<'Present' | 'Absent' | 'Excused'>('Present');
  readonly overrideNote = signal('');
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    const sessionIdStr = this.route.snapshot.paramMap.get('id');
    if (sessionIdStr) {
      this.loadAttendance(Number(sessionIdStr));
    } else {
      this.errorMessage.set('Session ID not found in route.');
      this.isLoading.set(false);
    }
  }

  loadAttendance(sessionId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.attendanceService.getSessionAttendance(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.sessionAttendance.set(data);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.errorMessage.set(err.error?.message || 'Failed to load attendance.');
          this.isLoading.set(false);
        }
      });
  }

  openOverrideModal(record: AttendanceRecordDto): void {
    this.selectedRecord.set(record);
    this.overrideStatus.set(record.status);
    this.overrideNote.set(record.teacherNote || '');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedRecord.set(null);
  }

  submitOverride(): void {
    const record = this.selectedRecord();
    if (!record) return;

    this.isSubmitting.set(true);
    this.attendanceService.overrideAttendance(record.attendanceId, {
      newStatus: this.overrideStatus(),
      note: this.overrideNote()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        const sessionId = this.sessionAttendance()?.sessionId;
        if (sessionId) {
          this.loadAttendance(sessionId);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        alert(err.error?.message || 'Failed to override attendance.');
      }
    });
  }
}
