import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { ExamGradingReview, PendingAnswer } from '../../../models/teacher-assessment.model';

@Component({
  selector: 'app-exam-grader',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './exam-grader.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamGraderComponent implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly reviewData = signal<ExamGradingReview | null>(null);
  readonly currentAnswerIndex = signal<number>(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isGrading = signal(false);

  gradeForm!: FormGroup;

  ngOnInit(): void {
    this.gradeForm = this.fb.group({
      marksAwarded: [0, [Validators.required, Validators.min(0)]],
      feedback: ['']
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('studentExamId'));
      if (id) {
        this.loadReview(id);
      }
    });
  }

  loadReview(studentExamId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getStudentExamForReview(studentExamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.reviewData.set(data);
          this.isLoading.set(false);
          this.setFormForCurrentAnswer();
        },
        error: (err) => {
          this.errorMessage.set('فشل في تحميل بيانات التصحيح.');
          this.isLoading.set(false);
          console.error(err);
        }
      });
  }

  get currentAnswer(): PendingAnswer | null {
    const data = this.reviewData();
    if (!data || data.pendingAnswers.length === 0) return null;
    return data.pendingAnswers[this.currentAnswerIndex()];
  }

  setFormForCurrentAnswer(): void {
    const answer = this.currentAnswer;
    if (answer) {
      this.gradeForm.patchValue({
        marksAwarded: 0,
        feedback: ''
      });
      
      this.gradeForm.get('marksAwarded')?.setValidators([Validators.required, Validators.min(0), Validators.max(answer.maxMarks)]);
      this.gradeForm.get('marksAwarded')?.updateValueAndValidity();
    }
  }

  submitGrade(): void {
    const answer = this.currentAnswer;
    if (!answer || this.gradeForm.invalid) return;

    this.isGrading.set(true);
    this.assessmentService.gradeStudentAnswer(answer.answerId, this.gradeForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isGrading.set(false);
          this.moveToNextAnswer();
        },
        error: (err) => {
          this.isGrading.set(false);
          console.error(err);
        }
      });
  }

  moveToNextAnswer(): void {
    const data = this.reviewData();
    if (!data) return;

    const nextIndex = this.currentAnswerIndex() + 1;
    if (nextIndex < data.pendingAnswers.length) {
      this.currentAnswerIndex.set(nextIndex);
      this.setFormForCurrentAnswer();
    } else {
      alert('تم الانتهاء من تصحيح جميع الأسئلة لهذا الطالب.');
      this.router.navigate(['/dashboard/teacher/assessment/grading']);
    }
  }
}
