import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
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
  private readonly http = inject(HttpClient); // Added for fetching assignments

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  
  // Added to store the teaching assignments
  readonly teachingAssignments = signal<any[]>([]);

  assignmentForm!: FormGroup;

  ngOnInit(): void {
    this.assignmentForm = this.fb.group({
      teachingAssignmentId: ['', [Validators.required]],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      instructions: [''],
      dueDate: ['', [Validators.required]],
      maxScore: [100, [Validators.required, Validators.min(0), Validators.max(1000)]],
    });

    // Fetch active assignments
    this.http.get<any[]>(`${environment.apiUrl}/teacher/assignments`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => {
          this.teachingAssignments.set(assignments);
          if (assignments.length > 0) {
            this.assignmentForm.patchValue({ teachingAssignmentId: assignments[0].id });
          }
        },
        error: (err) => console.error('Failed to load courses', err)
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
      teachingAssignmentId: Number(this.assignmentForm.value.teachingAssignmentId),
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
