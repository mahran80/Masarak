import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { PendingGradingDashboard } from '../../../models/teacher-assessment.model';

@Component({
  selector: 'app-grading-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './grading-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradingDashboardComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboardData = signal<PendingGradingDashboard | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getPendingGrading()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('فشل في تحميل لوحة التصحيح.');
          this.isLoading.set(false);
          console.error(err);
        }
      });
  }
}
