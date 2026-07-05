import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { TeacherLessonsService } from '../../../services/teacher-lessons.service';
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
  private readonly lessonsService = inject(TeacherLessonsService);

  readonly currentStep = signal<1 | 2>(1);
  readonly createdExam = signal<TeacherExam | null>(null);
  readonly questions = signal<TeacherQuestion[]>([]);
  
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showQuestionEditor = signal(false);
  readonly selectedQuestionForEdit = signal<TeacherQuestion | null>(null);
  
  readonly showQuestionBank = signal(false);
  readonly bankQuestions = signal<TeacherQuestion[]>([]);
  readonly selectedBankQuestionIds = signal<number[]>([]);
  readonly isFetchingBank = signal(false);

  readonly teachingAssignments = signal<any[]>([]);
  readonly lessons = signal<any[]>([]);

  examForm!: FormGroup;

  ngOnInit(): void {
    this.examForm = this.fb.group({
      teachingAssignmentId: ['', [Validators.required]], 
      lessonId: [''],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      instructions: [''],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      durationMinutes: [60, [Validators.required, Validators.min(1), Validators.max(600)]],
    });

    this.examForm.get('teachingAssignmentId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(taId => {
        if (taId) {
          this.lessonsService.getLessons(Number(taId)).subscribe(res => {
            this.lessons.set(res);
            this.examForm.patchValue({ lessonId: '' });
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
      lessonId: this.examForm.value.lessonId ? Number(this.examForm.value.lessonId) : undefined,
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

  openQuestionBank(): void {
    const exam = this.createdExam();
    if (!exam) return;
    
    const taId = Number(this.examForm.value.teachingAssignmentId);
    const ta = this.teachingAssignments().find(t => t.id === taId);
    if (!ta) return;
    
    this.isFetchingBank.set(true);
    this.showQuestionBank.set(true);
    this.selectedBankQuestionIds.set([]);

    this.assessmentService.getQuestionBank(ta.subjectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.bankQuestions.set(questions);
          this.isFetchingBank.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isFetchingBank.set(false);
        }
      });
  }

  closeQuestionBank(): void {
    this.showQuestionBank.set(false);
  }

  toggleBankQuestionSelection(qId: number): void {
    const current = this.selectedBankQuestionIds();
    if (current.includes(qId)) {
      this.selectedBankQuestionIds.set(current.filter(id => id !== qId));
    } else {
      this.selectedBankQuestionIds.set([...current, qId]);
    }
  }

  importSelectedQuestions(): void {
    const exam = this.createdExam();
    const ids = this.selectedBankQuestionIds();
    if (!exam || ids.length === 0) return;

    this.isSubmitting.set(true);
    this.assessmentService.addQuestionsFromBank(exam.examId, { questionBankIds: ids })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (importedQuestions) => {
          this.questions.set([...this.questions(), ...importedQuestions]);
          this.isSubmitting.set(false);
          this.closeQuestionBank();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting.set(false);
        }
      });
  }
}
