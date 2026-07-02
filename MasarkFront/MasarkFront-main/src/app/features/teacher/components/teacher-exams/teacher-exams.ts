import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../services/teacher-assessment.service';
import { TeacherContextService } from '../../services/teacher-context.service';
import { TeacherExam } from '../../models/teacher-assessment.model';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, FormsModule],
  templateUrl: './teacher-exams.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherExamsComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(TeacherContextService);

  readonly exams = signal<TeacherExam[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly teachingAssignments = this.contextService.assignments;
  readonly isLoadingContext = this.contextService.isLoading;
  readonly selectedTaId = this.contextService.selectedAssignmentId;
  readonly selectedContext = this.contextService.selectedAssignment;

  constructor() {
    effect(() => {
      const taId = this.selectedTaId();
      if (taId !== null) {
        this.loadExams(taId);
      } else {
        this.exams.set([]);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.contextService.loadAssignments();
  }

  selectAssignment(taId: number): void {
    this.contextService.selectAssignment(taId);
  }

  loadExams(taId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getExams(taId)
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
          if (this.selectedTaId() !== null) this.loadExams(this.selectedTaId()!); // Reload to update status
        });
    }
  }

  closeExam(examId: number): void {
    if (confirm('هل أنت متأكد من إغلاق هذا الاختبار؟ لن يتمكن الطلاب من دخوله بعد الإغلاق.')) {
      this.assessmentService.closeExam(examId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.selectedTaId() !== null) this.loadExams(this.selectedTaId()!); // Reload to update status
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
