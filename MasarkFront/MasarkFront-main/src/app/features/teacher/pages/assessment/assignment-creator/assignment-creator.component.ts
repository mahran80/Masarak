import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../../../../environments/environment';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { TeacherLessonsService } from '../../../services/teacher-lessons.service';
import { CreateAssignmentRequest } from '../../../models/teacher-assessment.model';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-assignment-creator',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, MatDatepickerModule, MatNativeDateModule, DatePipe, CommonModule],
  templateUrl: './assignment-creator.component.html',
  styleUrl: './assignment-creator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly lessonsService = inject(TeacherLessonsService);

  readonly minDate = new Date();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  
  readonly teachingAssignments = signal<any[]>([]);
  readonly lessons = signal<any[]>([]);

  assignmentForm!: FormGroup;

  ngOnInit(): void {
    this.assignmentForm = this.fb.group({
      teachingAssignmentId: ['', [Validators.required]],
      lessonId: [''],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      instructions: [''],
      dueDateDate: ['', [Validators.required]],
      dueDateTime: ['', [Validators.required]],
      maxScore: [100, [Validators.required, Validators.min(0), Validators.max(1000)]],
    });

    this.assignmentForm.get('teachingAssignmentId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(taId => {
        if (taId) {
          this.lessonsService.getLessons(Number(taId)).subscribe(res => {
            this.lessons.set(res);
            this.assignmentForm.patchValue({ lessonId: '' });
          });
        } else {
          this.lessons.set([]);
        }
      });

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

    const dateVal = new Date(this.assignmentForm.value.dueDateDate);
    const timeStr = this.assignmentForm.value.dueDateTime;
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      dateVal.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }

    const request: CreateAssignmentRequest = {
      ...this.assignmentForm.value,
      teachingAssignmentId: Number(this.assignmentForm.value.teachingAssignmentId),
      lessonId: this.assignmentForm.value.lessonId ? Number(this.assignmentForm.value.lessonId) : undefined,
      dueDate: dateVal.toISOString(),
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
