import { DatePipe, DecimalPipe } from '@angular/common';
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
import { switchMap } from 'rxjs';

import {
  StudentCourse,
  StudentEntityId,
  StudentExam,
  StudentExamGroup,
  StudentExamResult,
  StudentExamAnswer
} from '../../models';
import { StudentService } from '../../services/student.service';
import { ExamAttemptStore } from '../../services/exam-attempt.store';
import { ScoreBadgeComponent } from '../../components/score-badge/score-badge.component';
import { ExamTimerComponent } from '../../components/exam-timer/exam-timer.component';
import { QuestionRendererComponent } from '../../components/question-renderer/question-renderer.component';

interface SelectedExam {
  subject: StudentCourse;
  exam: StudentExam;
}

@Component({
  selector: 'app-student-exams-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ScoreBadgeComponent, ExamTimerComponent, QuestionRendererComponent],
  templateUrl: './exams.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExamsPageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  readonly store = inject(ExamAttemptStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly groups = signal<StudentExamGroup[]>([]);
  readonly selectedExamId = signal<StudentEntityId | null>(null);
  readonly examResult = signal<StudentExamResult | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isStarting = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

  readonly totalExams = computed(() =>
    this.groups().reduce((total, group) => total + group.exams.length, 0),
  );

  readonly selectedExam = computed<SelectedExam | null>(() => {
    const selectedExamId = this.selectedExamId();

    for (const group of this.groups()) {
      const exam =
        group.exams.find((currentExam) => String(currentExam.examId) === String(selectedExamId)) ??
        null;

      if (exam) {
        return { subject: group.subject, exam };
      }
    }

    const firstGroup = this.groups().find((group) => group.exams.length > 0);
    const firstExam = firstGroup?.exams[0] ?? null;

    return firstGroup && firstExam ? { subject: firstGroup.subject, exam: firstExam } : null;
  });

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.actionMessage.set(null);

    this.studentService
      .getExamGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.selectedExamId.set(this.firstExamId(groups));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.groups.set([]);
          this.selectedExamId.set(null);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  selectExam(exam: StudentExam): void {
    this.selectedExamId.set(exam.examId);
    this.store.clearExam();
    this.examResult.set(null);
    this.actionMessage.set(null);
  }

  startSelectedExam(): void {
    const selected = this.selectedExam();

    if (!selected) {
      return;
    }

    this.isStarting.set(true);
    this.actionMessage.set(null);
    this.examResult.set(null);

    this.studentService
      .startExam(selected.exam.examId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (exam) => {
          this.store.initExam(exam);
          this.isStarting.set(false);
        },
        error: (error: unknown) => {
          this.actionMessage.set(this.studentService.resolveErrorMessage(error));
          this.isStarting.set(false);
        },
      });
  }

  onAnswerChange(answer: StudentExamAnswer): void {
    this.store.setAnswer(answer);
  }

  submitActiveExam(): void {
    const activeExam = this.store.exam();

    if (!activeExam) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);
    
    // Force one last save before submit
    this.store.forceSaveNow();

    this.studentService
      .submitExam(activeExam.studentExamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.examResult.set(result);
          this.store.clearExam();
          this.isSubmitting.set(false);
          this.actionMessage.set('Exam submitted successfully.');
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.actionMessage.set(this.studentService.resolveErrorMessage(error));
        },
      });
  }

  private firstExamId(groups: StudentExamGroup[]): StudentEntityId | null {
    for (const group of groups) {
      const examId = group.exams[0]?.examId;

      if (examId !== undefined) {
        return examId;
      }
    }

    return null;
  }
}
