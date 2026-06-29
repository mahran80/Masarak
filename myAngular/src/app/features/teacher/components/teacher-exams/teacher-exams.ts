import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../services/teacher-assessment.service';
import { TeacherExam } from '../../models/teacher-assessment.model';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink],
  templateUrl: './teacher-exams.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherExamsComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly exams = signal<TeacherExam[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Default teachingAssignmentId = 1 (placeholder until we have a selector)
  private readonly defaultTeachingAssignmentId = 1;

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getExams(this.defaultTeachingAssignmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.exams.set(data);
          this.isLoading.set(false);
        },
        error: (_err: unknown) => {
          this.errorMessage.set('فشل في تحميل الاختبارات. الرجاء المحاولة مرة أخرى.');
          this.isLoading.set(false);
        }
      });
  }

  publishExam(examId: number): void {
    if (confirm('هل أنت متأكد من نشر هذا الاختبار؟ بمجرد نشره سيتمكن الطلاب من رؤيته.')) {
      this.assessmentService.publishExam(examId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.loadExams(); // Reload to update status
        });
    }
  }

  closeExam(examId: number): void {
    if (confirm('هل أنت متأكد من إغلاق هذا الاختبار؟ لن يتمكن الطلاب من دخوله بعد الإغلاق.')) {
      this.assessmentService.closeExam(examId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.loadExams(); // Reload to update status
        });
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      Draft: 'مسودة',
      Published: 'منشور',
      Closed: 'مغلق',
    };
    return labels[status] ?? status;
  }
}
