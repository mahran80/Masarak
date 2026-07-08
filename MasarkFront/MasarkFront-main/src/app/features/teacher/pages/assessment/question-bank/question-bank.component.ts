import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { TeacherQuestion } from '../../../models/teacher-assessment.model';
import { QuestionEditorComponent } from '../question-editor/question-editor.component';

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [IconComponent, ReactiveFormsModule, QuestionEditorComponent],
  templateUrl: './question-bank.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);

  readonly teachingAssignments = signal<any[]>([]);
  readonly selectedSubjectId = signal<number | null>(null);
  
  readonly bankQuestions = signal<TeacherQuestion[]>([]);
  readonly isLoading = signal(false);

  readonly showQuestionEditor = signal(false);
  readonly selectedQuestionForEdit = signal<TeacherQuestion | null>(null);

  filterForm!: FormGroup;

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      subjectId: ['']
    });

    this.loadTeachingAssignments();

    this.filterForm.get('subjectId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value) {
          this.selectedSubjectId.set(Number(value));
          this.loadBankQuestions(Number(value));
        } else {
          this.selectedSubjectId.set(null);
          this.bankQuestions.set([]);
        }
      });
  }

  private loadTeachingAssignments(): void {
    this.http.get<any[]>(`${environment.apiUrl}/teacher/assignments`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => {
          // Get unique subjects
          const uniqueSubjects = [];
          const subjectIds = new Set();
          for (const ta of assignments) {
            if (!subjectIds.has(ta.subjectId)) {
              subjectIds.add(ta.subjectId);
              uniqueSubjects.push(ta);
            }
          }
          this.teachingAssignments.set(uniqueSubjects);
          
          if (uniqueSubjects.length > 0) {
            this.filterForm.patchValue({ subjectId: uniqueSubjects[0].subjectId });
          }
        },
        error: (err) => console.error('Failed to load subjects', err)
      });
  }

  private loadBankQuestions(subjectId: number): void {
    this.isLoading.set(true);
    this.assessmentService.getQuestionBank(subjectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.bankQuestions.set(questions);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        }
      });
  }

  openAddQuestion(): void {
    if (!this.selectedSubjectId()) return;
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
    // In QuestionBank context, the question-editor will emit the saved TeacherQuestion.
    // However, the question-editor was built to work with `examId` and uses `addQuestion` / `updateQuestion`.
    // Wait, the question editor is hardcoded to call `this.assessmentService.addQuestion(examId, ...)` inside.
    // If we want to reuse it for the bank, we need to modify `QuestionEditorComponent` to support `mode="exam" | "bank"`.
    // Let's intercept or assume the QuestionEditor has been updated.
    
    // For now, let's just refresh the list.
    if (this.selectedSubjectId()) {
        this.loadBankQuestions(this.selectedSubjectId()!);
    }
    this.closeQuestionEditor();
  }

  deleteQuestion(qId: number): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) return;

    if (confirm('هل أنت متأكد من حذف هذا السؤال نهائياً من البنك؟')) {
      this.assessmentService.deleteBankQuestion(subjectId, qId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.bankQuestions.set(this.bankQuestions().filter(q => q.questionId !== qId));
        });
    }
  }
}
