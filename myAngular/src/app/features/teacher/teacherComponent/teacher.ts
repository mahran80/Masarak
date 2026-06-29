import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../services/teacher-assessment.service';
import { TeacherSessionService, SessionDto } from '../services/teacher-session.service';

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
  type: 'submission' | 'alert' | 'message';
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

  // Fallback mock sessions shown when API returns no data (useful in development)
  private readonly mockSessions: Session[] = [
    { id: 0, title: 'الرياضيات', subject: 'جبر الصف الخامس', grade: 'الصف ٥أ', time: '٠٨:٠٠ – ٠٨:٤٥', status: 'live' },
    { id: 0, title: 'العلوم', subject: 'التحولات الفيزيائية', grade: 'الصف ٤ب', time: '٠٩:٠٠ – ٠٩:٤٥', status: 'upcoming' },
    { id: 0, title: 'اللغة العربية', subject: 'النحو والصرف', grade: 'الصف ٥ج', time: '١٠:٠٠ – ١٠:٤٥', status: 'upcoming' },
    { id: 0, title: 'الرياضيات', subject: 'الهندسة الفراغية', grade: 'الصف ٦أ', time: '١١:٠٠ – ١١:٤٥', status: 'done' },
  ];

  readonly activities = signal<RecentActivity[]>([
    { icon: '📝', text: 'تم تقديم واجب الرياضيات من طالب: أحمد علي', time: 'منذ ١٠ دقائق', type: 'submission' },
    { icon: '📢', text: 'تذكير: اجتماع المعلمين غداً الساعة ١٠:٠٠ ص', time: 'منذ ٣٠ دقيقة', type: 'alert' },
    { icon: '💬', text: 'رسالة جديدة من ولي أمر الطالب سارة محمد', time: 'منذ ساعة', type: 'message' },
    { icon: '📝', text: 'تم تقديم واجب العلوم من طالبة: نور أحمد', time: 'منذ ساعتين', type: 'submission' },
  ]);

  ngOnInit(): void {
    this.assessmentService.getPendingGrading()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.pendingGradingCount.set(
            data.totalPendingExamAnswers + data.totalPendingSubmissions
          );
          this.isLoadingStats.set(false);
        },
        error: () => {
          this.isLoadingStats.set(false);
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
          if (data.length === 0) {
            // No sessions from API — show mock data so dashboard isn't blank
            this.sessions.set(this.mockSessions);
          } else {
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
          }
          this.isLoadingSessions.set(false);
        },
        error: () => {
          // API not available — fall back to mock data
          this.sessions.set(this.mockSessions);
          this.isLoadingSessions.set(false);
        }
      });
  }

  sessionStatusLabel(status: Session['status']): string {
    return { live: 'جارية الآن', upcoming: 'قادمة', done: 'منتهية' }[status];
  }
}
