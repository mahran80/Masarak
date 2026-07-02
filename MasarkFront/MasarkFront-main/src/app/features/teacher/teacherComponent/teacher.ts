import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './teacher.html',
  styleUrl: './teacher.css',
})
export class TeacherComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly sessionService = inject(TeacherSessionService);
  private readonly dashboardService = inject(TeacherDashboardService);
  private readonly destroyRef = inject(DestroyRef);

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
              status
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
}
