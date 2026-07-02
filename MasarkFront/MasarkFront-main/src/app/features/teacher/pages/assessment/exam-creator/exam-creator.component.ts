import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { CreateExamRequest, TeacherExam, TeacherQuestion } from '../../../models/teacher-assessment.model';
import { QuestionEditorComponent } from '../question-editor/question-editor.component';

@Component({
  selector: 'app-exam-creator',
  standalone: true,
  imports: [ReactiveFormsModule, QuestionEditorComponent],
  templateUrl: './exam-creator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamCreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  readonly currentStep = signal<1 | 2>(1);
  readonly createdExam = signal<TeacherExam | null>(null);
  readonly questions = signal<TeacherQuestion[]>([]);
  
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showQuestionEditor = signal(false);
  readonly selectedQuestionForEdit = signal<TeacherQuestion | null>(null);
  
  readonly teachingAssignments = signal<any[]>([]);

  examForm!: FormGroup;

  ngOnInit(): void {
    this.examForm = this.fb.group({
      teachingAssignmentId: ['', [Validators.required]], 
      title: ['', [Validators.required, Validators.maxLength(255)]],
      instructions: [''],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      durationMinutes: [60, [Validators.required, Validators.min(1), Validators.max(600)]],
    });

    this.http.get<any[]>(`${environment.apiUrl}/teacher/assignments`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => {
          this.teachingAssignments.set(assignments);
          if (assignments.length > 0) {
            this.examForm.patchValue({ teachingAssignmentId: assignments[0].id });
          }
        },
        error: (err) => console.error('Failed to load courses', err)
      });
  }

  onSaveMeta(): void {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: CreateExamRequest = {
      ...this.examForm.value,
      teachingAssignmentId: Number(this.examForm.value.teachingAssignmentId),
      startTime: new Date(this.examForm.value.startTime).toISOString(),
      endTime: new Date(this.examForm.value.endTime).toISOString(),
    };

    this.assessmentService.createExam(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (exam) => {
          this.createdExam.set(exam);
          this.currentStep.set(2);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('فشل في إنشاء الاختبار. الرجاء المحاولة مرة أخرى.');
          console.error(err);
        }
      });
  }

  onPublishExam(): void {
    const exam = this.createdExam();
    if (!exam) return;

    this.isSubmitting.set(true);
    this.assessmentService.publishExam(exam.examId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/dashboard/teacher']); 
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set('فشل في نشر الاختبار.');
        }
      });
  }

  openAddQuestion(): void {
    this.selectedQuestionForEdit.set(null);
    this.showQuestionEditor.set(true);
  }

  openEditQuestion(q: TeacherQuestion): void {
    this.selectedQuestionForEdit.set(q);
    this.showQuestionEditor.set(true);
  }

  closeQuestionEditor(): void {
    this.showQuestionEditor.set(false);
    this.selectedQuestionForEdit.set(null);
  }

  onQuestionSaved(question: TeacherQuestion): void {
    const current = this.questions();
    const existingIndex = current.findIndex(q => q.questionId === question.questionId);
    
    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = question;
      this.questions.set(updated);
    } else {
      this.questions.set([...current, question]);
    }
    
    this.closeQuestionEditor();
  }

  deleteQuestion(qId: number): void {
    const exam = this.createdExam();
    if (!exam) return;

    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      this.assessmentService.deleteQuestion(exam.examId, qId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.questions.set(this.questions().filter(q => q.questionId !== qId));
        });
    }
  }
}
