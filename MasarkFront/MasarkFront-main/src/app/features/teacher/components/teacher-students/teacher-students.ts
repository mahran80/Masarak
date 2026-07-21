import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherContextService } from '../../services/teacher-context.service';
import { TeacherStudentsService, StudentInClass } from '../../services/teacher-students.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [IconComponent, NgClass, FormsModule],
  templateUrl: './teacher-students.html',
  styleUrl: './teacher-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherStudents implements OnInit {
  private readonly studentsService = inject(TeacherStudentsService);
  private readonly contextService = inject(TeacherContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal('');
  readonly students = signal<StudentInClass[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly studentsPage = signal(1);
  readonly studentsPageSize = signal(10);

  readonly teachingAssignments = this.contextService.assignments;
  readonly isLoadingContext = this.contextService.isLoading;
  readonly selectedTaId = this.contextService.selectedAssignmentId;
  readonly selectedContext = this.contextService.selectedAssignment;

  constructor() {
    effect(() => {
      const taId = this.selectedTaId();
      if (taId !== null) {
        this.loadStudents(taId);
      } else {
        this.students.set([]);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.contextService.loadAssignments();
  }

  selectAssignment(taId: number): void {
    this.studentsPage.set(1);
    this.contextService.selectAssignment(taId);
  }

  loadStudents(taId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.studentsService.getStudents(taId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.students.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('فشل في تحميل بيانات الطلاب.');
          this.isLoading.set(false);
        }
      });
  }

  readonly filteredStudents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    return this.students().filter(s => {
      return !q || s.fullName.toLowerCase().includes(q);
    });
  });

  readonly studentsTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredStudents().length / this.studentsPageSize()))
  );

  readonly effectiveStudentsPage = computed(() =>
    Math.min(this.studentsPage(), this.studentsTotalPages())
  );

  readonly paginatedStudents = computed(() => {
    const start = (this.effectiveStudentsPage() - 1) * this.studentsPageSize();
    return this.filteredStudents().slice(start, start + this.studentsPageSize());
  });

  readonly studentsRangeStart = computed(() =>
    this.filteredStudents().length
      ? (this.effectiveStudentsPage() - 1) * this.studentsPageSize() + 1
      : 0
  );

  readonly studentsRangeEnd = computed(() =>
    Math.min(this.effectiveStudentsPage() * this.studentsPageSize(), this.filteredStudents().length)
  );

  setStudentsPage(page: number): void {
    this.studentsPage.set(Math.min(Math.max(page, 1), this.studentsTotalPages()));
  }

  changeStudentsPageSize(size: number | string): void {
    this.studentsPageSize.set(Number(size));
    this.studentsPage.set(1);
  }

  paginationPages(): number[] {
    const total = this.studentsTotalPages();
    const current = this.effectiveStudentsPage();
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
