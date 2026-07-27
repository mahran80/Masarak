import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';

import { StudentAttendanceSummaryComponent } from '../../components/attendance-summary/attendance-summary.component';
import { StudentCourseCardComponent } from '../../components/course-card/course-card.component';
import { StudentDashboardCardsComponent } from '../../components/dashboard-cards/dashboard-cards.component';
import { StudentScheduleCardComponent } from '../../components/schedule-card/schedule-card.component';
import { StudentDashboardData, StudentScheduleSession } from '../../models';
import { StudentService } from '../../services/student.service';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-student-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    StudentAttendanceSummaryComponent,
    StudentCourseCardComponent,
    StudentDashboardCardsComponent,
    StudentScheduleCardComponent,
    IconComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardPageComponent implements OnInit, OnDestroy {
  private readonly studentService = inject(StudentService);
  private readonly authStateService = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly user = this.authStateService.user;
  
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
    this.startAutoSlide(); // Reset timer
  }

  nextSlide(): void {
    this.activeSlide.update(curr => (curr + 1) % 2);
  }

  prevSlide(): void {
    this.activeSlide.update(curr => (curr - 1 + 2) % 2);
  }

  readonly detectedGender = computed<'male' | 'female'>(() => {
    const name = this.user()?.fullName ?? '';
    if (!name) return 'male';
    const femaleEnds = ['ة', 'ى', 'اء', 'ام', 'ين'];
    const femaleNames = [
      'مريم', 'زينب', 'هدى', 'نهى', 'سارة', 'فاطمة', 'شروق', 'حبيبة', 'ياسمين', 
      'إيمان', 'منار', 'أسماء', 'ندى', 'نور', 'سلمى', 'رنا', 'منى', 'ضحى', 
      'آية', 'عبير', 'نورهان', 'رانيا', 'دعاء', 'رحمة', 'ندين', 'فريدة', 
      'روان', 'شهد', 'ملاك', 'جنا', 'ملك', 'نرمين', 'ماري', 'ساره', 'هبة', 'شيرين'
    ];
    const firstWord = name.trim().split(' ')[0];
    if (femaleNames.includes(firstWord)) return 'female';

    const lastChar = firstWord.charAt(firstWord.length - 1);
    const lastTwo = firstWord.slice(-2);
    if (femaleEnds.includes(lastChar) || lastTwo === 'ات' || lastTwo === 'ان') {
      const maleExclusions = [
        'أحمد', 'محمد', 'مروان', 'عثمان', 'سليمان', 'حسين', 'حسن', 'مصطفى', 
        'يحيى', 'مجدي', 'هاني', 'علي', 'رامي', 'شادي', 'سامي', 'فادي', 'علاء', 'سليمان'
      ];
      if (!maleExclusions.includes(firstWord)) {
        return 'female';
      }
    }
    return 'male';
  });

  readonly data = signal<StudentDashboardData | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly recentCourses = computed(() => this.data()?.courses.slice(0, 4) ?? []);
  readonly upcomingSchedule = computed(() => this.data()?.schedule.slice(0, 3) ?? []);
  readonly isEnrollmentError = computed(() =>
    (this.errorMessage() ?? '').toLowerCase().includes('not enrolled') ||
    (this.errorMessage() ?? '').includes('غير مسجل') ||
    (this.errorMessage() ?? '').includes('غير مُسجل')
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

    this.studentService
      .getDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.data.set(null);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  joinSession(session: StudentScheduleSession): void {
    if (session.sessionId === undefined) {
      return;
    }
    this.router.navigate(['/dashboard/student/sessions', session.sessionId, 'live']);
  }
}
