import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherSessionService, SessionDto } from '../../services/teacher-session.service';

import { TeacherContextService } from '../../services/teacher-context.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-teacher-sessions',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, RouterModule],
  templateUrl: './teacher-sessions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSessionsComponent implements OnInit {
  private readonly sessionService = inject(TeacherSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(TeacherContextService);
  private readonly router = inject(Router);

  readonly sessions = signal<SessionDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Date filters
  readonly fromDate = signal<string>(this.getDefaultFromDate());
  readonly toDate = signal<string>(this.getDefaultToDate());

  // Form State
  readonly showForm = signal(false);
  readonly isEditing = signal(false);
  readonly editingSessionId = signal<number | null>(null);
  readonly formAssignmentId = signal<number | null>(null);
  readonly formTitle = signal('');
  readonly formDescription = signal('');
  readonly formScheduledAt = signal('');
  readonly formDuration = signal(60);
  readonly formEmbedUrl = signal('');
  readonly isSaving = signal(false);

  // For assignment dropdown
  readonly assignments = this.contextService.assignments;

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.sessionService
      .getMySessions(this.fromDate(), this.toDate())
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

  openCreateForm(): void {
    this.isEditing.set(false);
    this.editingSessionId.set(null);
    this.formAssignmentId.set(null);
    this.formTitle.set('');
    this.formDescription.set('');
    this.formScheduledAt.set('');
    this.formDuration.set(60);
    this.formEmbedUrl.set('');
    this.showForm.set(true);
  }

  openEditForm(session: SessionDto): void {
    this.isEditing.set(true);
    this.editingSessionId.set(session.sessionId);
    // Note: teachingAssignmentId is not returned in SessionDto, so we might need to handle this differently if we need it for update.
    // UpdateSessionRequest doesn't require teachingAssignmentId, so it's fine.
    this.formTitle.set(session.title);
    this.formDescription.set(session.description || '');
    
    // Format date for datetime-local input
    const d = new Date(session.scheduledAt);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    this.formScheduledAt.set(d.toISOString().slice(0, 16));
    
    this.formDuration.set(session.durationMinutes);
    this.formEmbedUrl.set(session.embedUrl || '');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveSession(): void {
    if (!this.formTitle() || !this.formScheduledAt() || (!this.formAssignmentId() && !this.isEditing())) {
      alert('Please fill all required fields');
      return;
    }

    this.isSaving.set(true);
    const date = new Date(this.formScheduledAt());
    const isoString = date.toISOString();

    if (this.isEditing()) {
      this.sessionService.updateSession(this.editingSessionId()!, {
        title: this.formTitle(),
        description: this.formDescription(),
        scheduledAt: isoString,
        durationMinutes: this.formDuration(),
        embedUrl: this.formEmbedUrl()
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showForm.set(false);
          this.loadSessions();
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err.error?.message || 'Failed to update session');
        }
      });
    } else {
      this.sessionService.scheduleSession({
        teachingAssignmentId: this.formAssignmentId()!,
        title: this.formTitle(),
        description: this.formDescription(),
        scheduledAt: isoString,
        durationMinutes: this.formDuration(),
        embedUrl: this.formEmbedUrl()
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showForm.set(false);
          this.loadSessions();
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err.error?.message || 'Failed to schedule session');
        }
      });
    }
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
        error: (err) => alert(err.error?.message || 'Failed to start session')
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

  cancelSession(sessionId: number): void {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    this.sessionService.cancelSession(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadSessions(),
        error: (err) => alert(err.error?.message || 'Failed to cancel session')
      });
  }

  copyLink(url: string | undefined): void {
    if (url) {
      navigator.clipboard.writeText(url);
      alert('Meeting link copied to clipboard!');
    }
  }

  private getDefaultFromDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7); // 1 week ago
    return d.toISOString().split('T')[0];
  }

  private getDefaultToDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks from now
    return d.toISOString().split('T')[0];
  }
}
