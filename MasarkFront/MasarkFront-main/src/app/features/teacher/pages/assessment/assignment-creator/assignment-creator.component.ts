import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { CreateAssignmentRequest } from '../../../models/teacher-assessment.model';

@Component({
  selector: 'app-assignment-creator',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './assignment-creator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  assignmentForm!: FormGroup;

  ngOnInit(): void {
    this.assignmentForm = this.fb.group({
      teachingAssignmentId: [1, [Validators.required]], // Default to 1 for now until we have teaching assignments
      title: ['', [Validators.required, Validators.maxLength(255)]],
      instructions: [''],
      dueDate: ['', [Validators.required]],
      maxScore: [100, [Validators.required, Validators.min(0), Validators.max(1000)]],
    });
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: CreateAssignmentRequest = {
      ...this.assignmentForm.value,
      dueDate: new Date(this.assignmentForm.value.dueDate).toISOString(),
    };

    this.assessmentService.createAssignment(request)
      .pipe(
        switchMap(assignment => this.assessmentService.publishAssignment(assignment.assignmentId).pipe(
          catchError(() => of(null)) // Ignore publish errors and proceed to navigation
        )),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard/teacher/assignments']); 
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('حدث خطأ أثناء إنشاء الواجب. الرجاء المحاولة مرة أخرى.');
          console.error(err);
        }
      });
  }
}
