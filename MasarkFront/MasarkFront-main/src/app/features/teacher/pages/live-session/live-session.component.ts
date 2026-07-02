import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherSessionService, SessionDto } from '../../services/teacher-session.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-live-session',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './live-session.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveSessionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionService = inject(TeacherSessionService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly session = signal<SessionDto | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  safeEmbedUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    const sessionId = Number(this.route.snapshot.paramMap.get('sessionId'));

    // sessionId === 0 means the teacher clicked from a mock/demo session —
    // show the page in demo mode without calling the API.
    if (sessionId === 0) {
      this.session.set({
        sessionId: 0,
        title: 'جلسة تجريبية',
        subjectName: '',
        className: '',
        teacherName: '',
        scheduledAt: new Date().toISOString(),
        durationMinutes: 45,
        endsAt: new Date().toISOString(),
        status: 'Live',
      });
      this.isLoading.set(false);
      return;
    }

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    this.sessionService.getMySessions(from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessions) => {
          const found = sessions.find(s => s.sessionId === sessionId) ?? null;
          this.session.set(found);
          if (found?.embedUrl) {
            this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(found.embedUrl);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('فشل في تحميل بيانات الجلسة.');
          this.isLoading.set(false);
        }
      });
  }
}
