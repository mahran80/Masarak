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

  getSubjectImageUrl(subjectName: string): string {
    const name = (subjectName || '').toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '/assets/images/student/subject-mathematics-3d.png';
    if (name.includes('physic') || name.includes('فيزياء')) return '/assets/images/student/subject-physics-3d.jpg';
    if (name.includes('chem') || name.includes('كيمياء')) return '/assets/images/student/subject-chemistry-3d.jpg';
    if (name.includes('biolog') || name.includes('أحياء') || name.includes('احياء')) return '/assets/images/student/subject-biology-3d.jpg';
    if (name.includes('sci') || name.includes('علوم')) return '/assets/images/student/subject-science-3d.png';
    if (name.includes('comp') || name.includes('حاسب') || name.includes('برمجة') || name.includes('computer')) return '/assets/images/student/subject-computing-3d.png';
    if (name.includes('arab') || name.includes('عربي') || name.includes('عربية')) return '/assets/images/student/subject-arabic-3d.png';
    if (name.includes('eng') || name.includes('انجليزي') || name.includes('إنجليزية')) return '/assets/images/student/subject-english-3d.png';
    if (name.includes('hist') || name.includes('تاريخ')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('geo') || name.includes('جغرافيا')) return '/assets/images/student/subject-geography-3d.jpg';
    if (name.includes('islam') || name.includes('إسلامي') || name.includes('دين')) return '/assets/images/student/subject-islamic-3d.jpg';
    if (name.includes('fren') || name.includes('فرنسي')) return '/assets/images/student/subject-french-3d.jpg';
    return '/assets/images/student/subject-science-3d.png';
  }

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

    if (!activeExam || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.actionMessage.set(null);
    
    this.store.forceSaveNow().pipe(
      switchMap(() => this.studentService.submitExam(activeExam.studentExamId)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.examResult.set(result);
        this.store.clearExam();
        this.isSubmitting.set(false);
        this.actionMessage.set('تم تسليم الاختبار بنجاح.');
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
