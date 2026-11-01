import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, Observable, of } from 'rxjs';
import { filter, switchMap, throttleTime, catchError } from 'rxjs/operators';
import { StudentService } from './student.service';
import { 
  StartStudentExamResponse, 
  StudentExamAnswer, 
  StudentEntityId 
} from '../models';

export interface ExamAttemptState {
  exam: StartStudentExamResponse | null;
  answers: Record<string, StudentExamAnswer>;
  currentQuestionIndex: number;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class ExamAttemptStore {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private retryTimeoutId: any = null;

  // State
  private readonly state = signal<ExamAttemptState>({
    exam: null,
    answers: {},
    currentQuestionIndex: 0,
    isSaving: false,
    lastSavedAt: null
  });

  // Autosave status signals
  readonly saveFailed = signal<boolean>(false);
  readonly saveRetryCount = signal<number>(0);

  // Selectors
  readonly exam = computed(() => this.state().exam);
  readonly answers = computed(() => this.state().answers);
  readonly answersList = computed(() => Object.values(this.state().answers));
  readonly currentQuestionIndex = computed(() => this.state().currentQuestionIndex);
  readonly isSaving = computed(() => this.state().isSaving);
  readonly lastSavedAt = computed(() => this.state().lastSavedAt);
  
  readonly currentQuestion = computed(() => {
    const ex = this.exam();
    if (!ex || !ex.questions || ex.questions.length === 0) return null;
    return ex.questions[this.currentQuestionIndex()];
  });

  readonly isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
  readonly isLastQuestion = computed(() => {
    const ex = this.exam();
    if (!ex || !ex.questions) return true;
    return this.currentQuestionIndex() === ex.questions.length - 1;
  });

  readonly totalQuestions = computed(() => {
    const ex = this.exam();
    return ex?.questions?.length || 0;
  });

  readonly answeredQuestionsCount = computed(() => {
    return Object.keys(this.answers()).length;
  });

  // Triggers for auto-save
  private readonly autoSaveTrigger = new Subject<void>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId);
        this.retryTimeoutId = null;
      }
    });

    // Set up auto-save every 30 seconds if there are changes
    // Or when manually triggered (throttled to avoid spam)
    this.autoSaveTrigger.pipe(
      throttleTime(5000, undefined, { leading: true, trailing: true }),
      filter(() => !!this.exam()?.studentExamId),
      switchMap(() => {
        this.updateState({ isSaving: true });
        const examId = this.exam()!.studentExamId;
        return this.studentService.saveExamAnswers(examId, { answers: this.answersList() }).pipe(
          catchError(() => {
            this.handleSaveError();
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res !== null) {
          this.handleSaveSuccess();
        }
      }
    });

    // Auto-trigger save every 30 seconds if exam is active
    interval(30000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (this.exam()) {
        this.autoSaveTrigger.next();
      }
    });
  }

  private handleSaveSuccess(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.saveFailed.set(false);
    this.saveRetryCount.set(0);
    this.updateState({ 
      isSaving: false,
      lastSavedAt: new Date()
    });
  }

  private handleSaveError(): void {
    this.updateState({ isSaving: false });
    this.saveFailed.set(true);
    const count = this.saveRetryCount();
    if (count < 3) {
      const delayMs = Math.pow(2, count) * 2000;
      this.saveRetryCount.set(count + 1);
      this.retryTimeoutId = setTimeout(() => {
        if (this.exam()?.studentExamId) {
          this.autoSaveTrigger.next();
        }
      }, delayMs);
    }
  }

  // Actions
  initExam(exam: StartStudentExamResponse): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.saveFailed.set(false);
    this.saveRetryCount.set(0);

    const initialAnswers = this.createAnswerMap(exam.savedAnswers || []);
    
    this.state.set({
      exam,
      answers: initialAnswers,
      currentQuestionIndex: 0,
      isSaving: false,
      lastSavedAt: null
    });
  }

  clearExam(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    this.saveFailed.set(false);
    this.saveRetryCount.set(0);

    this.state.set({
      exam: null,
      answers: {},
      currentQuestionIndex: 0,
      isSaving: false,
      lastSavedAt: null
    });
  }

  setAnswer(answer: StudentExamAnswer): void {
    const key = String(answer.questionId);
    
    this.updateState({
      answers: {
        ...this.answers(),
        [key]: answer
      }
    });

    // Trigger auto-save
    this.autoSaveTrigger.next();
  }

  nextQuestion(): void {
    if (!this.isLastQuestion()) {
      this.updateState({ currentQuestionIndex: this.currentQuestionIndex() + 1 });
    }
  }

  prevQuestion(): void {
    if (!this.isFirstQuestion()) {
      this.updateState({ currentQuestionIndex: this.currentQuestionIndex() - 1 });
    }
  }

  goToQuestion(index: number): void {
    const total = this.totalQuestions();
    if (index >= 0 && index < total) {
      this.updateState({ currentQuestionIndex: index });
    }
  }

  forceSaveNow(): Observable<any> {
    const examId = this.exam()?.studentExamId;
    if (!examId) return of(null);
    return this.studentService.saveExamAnswers(examId, { answers: this.answersList() });
  }

  private updateState(partialState: Partial<ExamAttemptState>): void {
    this.state.update(state => ({ ...state, ...partialState }));
  }

  private createAnswerMap(answers: StudentExamAnswer[]): Record<string, StudentExamAnswer> {
    return answers.reduce<Record<string, StudentExamAnswer>>((map, answer) => {
      map[String(answer.questionId)] = answer;
      return map;
    }, {});
  }
}
