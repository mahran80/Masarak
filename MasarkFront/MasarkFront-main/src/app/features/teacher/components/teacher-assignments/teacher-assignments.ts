import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../services/teacher-assessment.service';
import { TeacherContextService } from '../../services/teacher-context.service';
import { TeacherAssignment } from '../../models/teacher-assessment.model';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [IconComponent, DatePipe, NgClass, RouterLink, FormsModule],
  templateUrl: './teacher-assignments.html',
  styleUrl: './teacher-assignments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAssignments implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(TeacherContextService);

  readonly assignments = signal<TeacherAssignment[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly assignmentsPage = signal(1);
  readonly assignmentsPageSize = signal(10);

  readonly teachingAssignments = this.contextService.assignments;
  readonly isLoadingContext = this.contextService.isLoading;
  readonly selectedTaId = this.contextService.selectedAssignmentId;
  readonly selectedContext = this.contextService.selectedAssignment;

  constructor() {
    effect(() => {
      const taId = this.selectedTaId();
      if (taId !== null) {
        this.loadAssignments(taId);
      } else {
        this.assignments.set([]);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.contextService.loadAssignments();
  }

  selectAssignment(taId: number): void {
    this.assignmentsPage.set(1);
    this.contextService.selectAssignment(taId);
  }

  loadAssignments(taId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getAssignments(taId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.assignments.set(data);
          this.isLoading.set(false);
        },
        error: (_err: unknown) => {
          this.errorMessage.set('فشل في تحميل الواجبات. الرجاء المحاولة مرة أخرى.');
          this.isLoading.set(false);
        }
      });
  }

  publishAssignment(id: number): void {
    if (confirm('هل أنت متأكد من نشر هذا الواجب؟ بمجرد نشره سيتمكن الطلاب من رؤيته.')) {
      this.assessmentService.publishAssignment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.selectedTaId() !== null) this.loadAssignments(this.selectedTaId()!);
        });
    }
  }

  closeAssignment(id: number): void {
    if (confirm('هل أنت متأكد من إغلاق هذا الواجب؟ لن يتمكن الطلاب من تسليمه بعد الإغلاق.')) {
      this.assessmentService.closeAssignment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.selectedTaId() !== null) this.loadAssignments(this.selectedTaId()!);
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

  readonly assignmentsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.assignments().length / this.assignmentsPageSize()))
  );

  readonly effectiveAssignmentsPage = computed(() =>
    Math.min(this.assignmentsPage(), this.assignmentsTotalPages())
  );

  readonly paginatedAssignments = computed(() => {
    const start = (this.effectiveAssignmentsPage() - 1) * this.assignmentsPageSize();
    return this.assignments().slice(start, start + this.assignmentsPageSize());
  });

  readonly assignmentsRangeStart = computed(() =>
    this.assignments().length
      ? (this.effectiveAssignmentsPage() - 1) * this.assignmentsPageSize() + 1
      : 0
  );

  readonly assignmentsRangeEnd = computed(() =>
    Math.min(this.effectiveAssignmentsPage() * this.assignmentsPageSize(), this.assignments().length)
  );

  setAssignmentsPage(page: number): void {
    this.assignmentsPage.set(Math.min(Math.max(page, 1), this.assignmentsTotalPages()));
  }

  changeAssignmentsPageSize(size: number | string): void {
    this.assignmentsPageSize.set(Number(size));
    this.assignmentsPage.set(1);
  }

  paginationPages(): number[] {
    const total = this.assignmentsTotalPages();
    const current = this.effectiveAssignmentsPage();
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
