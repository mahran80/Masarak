import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DatePipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  StudentAssignment,
  StudentAssignmentGroup,
  StudentEntityId,
  SubmitAssignmentRequest,
} from '../../models';
import { StudentService } from '../../services/student.service';

export interface SelectedAssignment {
  subject: any;
  assignment: StudentAssignment;
}

@Component({
  selector: 'app-student-assignments-page',
  standalone: true,
  imports: [CommonModule, IconComponent, DatePipe],
  templateUrl: './assignments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAssignmentsPageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly groups = signal<StudentAssignmentGroup[]>([]);
  readonly selectedAssignmentId = signal<StudentEntityId | null>(null);
  readonly answerText = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly totalAssignments = computed(() =>
    this.groups().reduce((total, group) => total + group.assignments.length, 0),
  );

  readonly completedAssignmentsCount = computed(() => {
    return this.groups().reduce((total, group) => {
      return total + group.assignments.filter(a => a.status === 'Submitted' || a.status === 'Graded').length;
    }, 0);
  });

  readonly pendingAssignmentsCount = computed(() => {
    return this.groups().reduce((total, group) => {
      return total + group.assignments.filter(a => a.status !== 'Submitted' && a.status !== 'Graded').length;
    }, 0);
  });

  readonly selectedAssignment = computed<SelectedAssignment | null>(() => {
    const selectedAssignmentId = this.selectedAssignmentId();

    for (const group of this.groups()) {
      const assignment =
        group.assignments.find(
          (currentAssignment) =>
            String(currentAssignment.assignmentId) === String(selectedAssignmentId),
        ) ?? null;

      if (assignment) {
        return { subject: group.subject, assignment };
      }
    }

    const firstGroup = this.groups().find((group) => group.assignments.length > 0);
    const firstAssignment = firstGroup?.assignments[0] ?? null;

    return firstGroup && firstAssignment
      ? { subject: firstGroup.subject, assignment: firstAssignment }
      : null;
  });

  getSubjectImageUrl(subjectName: string): string {
    const name = (subjectName || '').toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '/assets/images/student/subject-mathematics-3d.png';
    if (name.includes('physic') || name.includes('فيزياء')) return '/assets/images/student/subject-physics-3d.jpg';
    if (name.includes('chem') || name.includes('كيمياء')) return '/assets/images/student/subject-chemistry-3d.jpg';
    if (name.includes('biolog') || name.includes('أحياء') || name.includes('احياء')) return '/assets/images/student/subject-biology-3d.jpg';
    if (name.includes('sci') || name.includes('علوم')) return '/assets/images/student/subject-science-3d.png';
    if (name.includes('comp') || name.includes('حاسب') || name.includes('برمجة') || name.includes('computer')) return '/assets/images/student/subject-computing-3d.png';
    if (name.includes('arab') || name.includes('عربي') || name.includes('عربية')) return '/assets/images/student/subject-arabic-3d.png';
    if (name.includes('eng') || name.includes('انجليزي') || name.includes('إنجليزية')) return '/assets/images/student/subject-english-3d.png';
    if (name.includes('hist') || name.includes('تاريخ')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('geo') || name.includes('جغرافيا')) return '/assets/images/student/subject-geography-3d.jpg';
    if (name.includes('islam') || name.includes('إسلامي') || name.includes('دين')) return '/assets/images/student/subject-islamic-3d.jpg';
    if (name.includes('fren') || name.includes('فرنسي')) return '/assets/images/student/subject-french-3d.jpg';
    return '/assets/images/student/subject-science-3d.png';
  }

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

    this.studentService
      .getAssignmentGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.selectedAssignmentId.set(this.firstAssignmentId(groups));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.groups.set([]);
          this.selectedAssignmentId.set(null);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  selectAssignment(assignment: StudentAssignment): void {
    this.selectedAssignmentId.set(assignment.assignmentId);
    this.actionMessage.set(null);
  }

  submitSelectedAssignment(): void {
    const selected = this.selectedAssignment();

    if (!selected) {
      return;
    }

    const request = this.createSubmitRequest();

    if (!request.textContent && !request.file) {
      this.actionMessage.set('Add an answer or file before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);

    this.studentService
      .submitAssignment(selected.assignment.assignmentId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.actionMessage.set('Assignment submitted successfully.');
          this.answerText.set('');
          this.selectedFile.set(null);
          this.loadAssignments();
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.actionMessage.set(this.studentService.resolveErrorMessage(error));
        },
      });
  }

  readTextAreaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  readInputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  readFileValue(event: Event): File | null {
    return event.target instanceof HTMLInputElement ? event.target.files?.[0] ?? null : null;
  }

  private createSubmitRequest(): SubmitAssignmentRequest {
    const textContent = this.answerText().trim();

    return {
      textContent: textContent.length > 0 ? textContent : undefined,
      file: this.selectedFile(),
    };
  }

  private firstAssignmentId(groups: StudentAssignmentGroup[]): StudentEntityId | null {
    for (const group of groups) {
      const assignmentId = group.assignments[0]?.assignmentId;

      if (assignmentId !== undefined) {
        return assignmentId;
      }
    }

    return null;
  }
}
