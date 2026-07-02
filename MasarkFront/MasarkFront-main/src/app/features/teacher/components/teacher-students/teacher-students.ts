import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, effect, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherContextService } from '../../services/teacher-context.service';
import { TeacherStudentsService, StudentInClass } from '../../services/teacher-students.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [NgClass, FormsModule],
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
}
