import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Component, DestroyRef, OnInit, OnDestroy, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../services/teacher-assessment.service';
import { TeacherSessionService, SessionDto } from '../services/teacher-session.service';
import { TeacherDashboardService } from '../services/teacher-dashboard.service';

interface Session {
  id: number;
  title: string;
  subject: string;
  grade: string;
  time: string;
  status: 'live' | 'upcoming' | 'done';
  originalStatus: string;
  scheduledAt: Date;
  endsAt: Date;
}

interface RecentActivity {
  icon: string;
  text: string;
  time: string;
  type: string;
  color?: string;
}

@Component({
  selector: 'app-teacher',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  templateUrl: './teacher.html',
  styleUrl: './teacher.css',
  encapsulation: ViewEncapsulation.None
})
export class TeacherComponent implements OnInit, OnDestroy {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly sessionService = inject(TeacherSessionService);
  private readonly dashboardService = inject(TeacherDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly pendingGradingCount = signal<number>(0);
  readonly isLoadingStats = signal(true);
  readonly isLoadingSessions = signal(true);

  readonly sessions = signal<Session[]>([]);

  readonly activities = signal<RecentActivity[]>([]);

  readonly stats = signal<any>(null);

  // Hero Slider State
  readonly activeSlide = signal<number>(0);
  private slideInterval: any;

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  setSlide(idx: number): void {
    this.activeSlide.set(idx);
    this.startAutoSlide(); // Reset
  }

  nextSlide(): void {
    this.activeSlide.update(curr => (curr + 1) % 3);
  }

  prevSlide(): void {
    this.activeSlide.update(curr => (curr - 1 + 3) % 3);
  }


  ngOnInit(): void {
    this.dashboardService.getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.stats.set(data);
          this.pendingGradingCount.set(data.assignmentsToGrade);
          this.isLoadingStats.set(false);
        },
        error: () => {
          this.isLoadingStats.set(false);
        }
      });

    this.dashboardService.getActivities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.activities.set(data.map(a => ({
            icon: a.icon,
            text: a.title,
            time: a.time,
            type: 'submission', // Generic fallback
            color: a.color
          })));
        }
      });

    // 2. Load today's sessions
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    this.sessionService.getMySessions(from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const mapped = data.map(d => {
            const start = new Date(d.scheduledAt);
            const end = new Date(d.endsAt);
            const formatTime = (date: Date) => date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            let status: Session['status'] = 'upcoming';
            if (d.status === 'Completed' || d.status === 'Cancelled') {
              status = 'done';
            } else if (d.status === 'Live') {
              status = 'live';
            } else if (now >= start && now <= end) {
              status = 'live'; // Treat in-progress scheduled sessions as live
            }
            return {
              id: d.sessionId,
              title: d.title,
              subject: d.subjectName,
              grade: d.className,
              time: `${formatTime(start)} – ${formatTime(end)}`,
              status,
              originalStatus: d.status,
              scheduledAt: start,
              endsAt: end
            };
          });
          this.sessions.set(mapped);
          this.isLoadingSessions.set(false);
        },
        error: () => {
          this.sessions.set([]);
          this.isLoadingSessions.set(false);
        }
      });
  }

  sessionStatusLabel(status: Session['status']): string {
    return { live: 'جارية الآن', upcoming: 'قادمة', done: 'منتهية' }[status];
  }

  canStartSession(s: Session): boolean {
    const now = new Date();
    const startWindow = new Date(s.scheduledAt.getTime() - 15 * 60000);
    return now >= startWindow && now <= s.endsAt;
  }

  onSessionClick(s: Session): void {
    if (s.originalStatus === 'Scheduled') {
      if (!this.canStartSession(s)) {
        alert('You can only start a session up to 15 minutes before its scheduled time, and you cannot start it after it ends.');
        return;
      }
      if (confirm('Are you sure you want to start this session?')) {
        this.sessionService.startSession(s.id).subscribe({
          next: () => this.router.navigate(['/dashboard/teacher/sessions', s.id, 'live']),
          error: (err) => alert(err.error?.message || err.error?.detail || 'Failed to start session')
        });
      }
    } else {
      // Already live, just navigate
      this.router.navigate(['/dashboard/teacher/sessions', s.id, 'live']);
    }
  }
}
