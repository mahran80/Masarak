import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect, computed } from '@angular/core';
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
  imports: [IconComponent, DatePipe, NgClass, RouterLink, FormsModule],
  templateUrl: './teacher-exams.html',
  styleUrl: './teacher-exams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherExamsComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(TeacherContextService);

  readonly exams = signal<TeacherExam[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly examsPage = signal(1);
  readonly examsPageSize = signal(10);

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
    this.examsPage.set(1);
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

  readonly examsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.exams().length / this.examsPageSize()))
  );

  readonly effectiveExamsPage = computed(() =>
    Math.min(this.examsPage(), this.examsTotalPages())
  );

  readonly paginatedExams = computed(() => {
    const start = (this.effectiveExamsPage() - 1) * this.examsPageSize();
    return this.exams().slice(start, start + this.examsPageSize());
  });

  readonly examsRangeStart = computed(() =>
    this.exams().length ? (this.effectiveExamsPage() - 1) * this.examsPageSize() + 1 : 0
  );

  readonly examsRangeEnd = computed(() =>
    Math.min(this.effectiveExamsPage() * this.examsPageSize(), this.exams().length)
  );

  setExamsPage(page: number): void {
    this.examsPage.set(Math.min(Math.max(page, 1), this.examsTotalPages()));
  }

  changeExamsPageSize(size: number | string): void {
    this.examsPageSize.set(Number(size));
    this.examsPage.set(1);
  }

  paginationPages(): number[] {
    const total = this.examsTotalPages();
    const current = this.effectiveExamsPage();
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter(page => page > 0 && page <= total).sort((a, b) => a - b);
    const result: number[] = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) result.push(0);
      result.push(page);
    });
    return result;
  }
}
