import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { TeacherSubmissionDetail } from '../../../models/teacher-assessment.model';

@Component({
  selector: 'app-assignment-submissions',
  standalone: true,
  imports: [DatePipe, NgClass, ReactiveFormsModule],
  templateUrl: './assignment-submissions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentSubmissionsComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly submissions = signal<TeacherSubmissionDetail[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly assignmentId = signal<number>(0);

  readonly selectedSubmission = signal<TeacherSubmissionDetail | null>(null);
  readonly isGrading = signal(false);
  gradeForm!: FormGroup;

  ngOnInit(): void {
    this.gradeForm = this.fb.group({
      marksAwarded: [0, [Validators.required, Validators.min(0)]],
      feedback: ['']
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.assignmentId.set(id);
        this.loadSubmissions(id);
      }
    });
  }

  loadSubmissions(assignmentId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getSubmissions(assignmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.submissions.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set('فشل في تحميل التسليمات.');
          this.isLoading.set(false);
          console.error(err);
        }
      });
  }

  openGradeModal(submission: TeacherSubmissionDetail): void {
    this.selectedSubmission.set(submission);
    this.gradeForm.patchValue({
      marksAwarded: submission.score ?? 0,
      feedback: ''
    });
  }

  closeGradeModal(): void {
    this.selectedSubmission.set(null);
    this.gradeForm.reset();
  }

  submitGrade(): void {
    const submission = this.selectedSubmission();
    if (!submission || this.gradeForm.invalid) return;

    this.isGrading.set(true);
    this.assessmentService.gradeSubmission(submission.submissionId, this.gradeForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isGrading.set(false);
          this.closeGradeModal();
          this.loadSubmissions(this.assignmentId());
        },
        error: (err) => {
          this.isGrading.set(false);
          console.error(err);
        }
      });
  }

  downloadFile(submissionId: number): void {
    this.assessmentService.getSubmissionFileUrl(submissionId).subscribe(res => {
      if (res.url) window.open(res.url, '_blank');
    });
  }
}
