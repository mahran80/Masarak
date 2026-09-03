import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { DatePipe } from '@angular/common';
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
  StudentCourse,
  StudentEntityId,
  SubmitAssignmentRequest,
} from '../../models';
import { StudentService } from '../../services/student.service';

interface SelectedAssignment {
  subject: StudentCourse;
  assignment: StudentAssignment;
}

@Component({
  selector: 'app-student-assignments-page',
  standalone: true,
  imports: [BreadcrumbComponent, DatePipe],
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

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(5);

  readonly paginatedGroups = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    return this.groups().slice(startIndex, startIndex + this.pageSize());
  });

  readonly totalPages = computed(() => Math.ceil(this.groups().length / this.pageSize()));

  readonly totalAssignments = computed(() =>
    this.groups().reduce((total, group) => total + group.assignments.length, 0),
  );

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

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
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
