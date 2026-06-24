import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StudentAssessmentService } from '../../../../services/student-assessment.service';
import { ExamAttemptDto, QuestionDto } from '../../../../models/assessment.models';

@Component({
  selector: 'app-exam-taker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container max-w-3xl">
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading exam..."></app-loading-spinner>
      
      <div *ngIf="error() && !loading()" class="alert-error mb-6">{{ error() }}</div>

      <ng-container *ngIf="attempt()">
        <!-- Header & Timer -->
        <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md pb-4 mb-6 border-b border-surface-200 pt-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-surface-900 font-display">{{ attempt()!.examTitle }}</h1>
              <p class="text-sm text-surface-500">Do not refresh this page.</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-mono font-bold" [class.text-red-600]="secondsRemaining() < 300">
                {{ formatTime(secondsRemaining()) }}
              </div>
              <p class="text-xs text-surface-500">Remaining Time</p>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <form [formGroup]="form" class="space-y-8">
          <div *ngFor="let q of attempt()!.questions; let i = index" class="card p-6 border-t-4 border-brand-500">
            <div class="flex justify-between items-start mb-4">
              <h3 class="font-bold text-lg">Question {{ i + 1 }}</h3>
              <span class="badge bg-surface-100 text-surface-600">{{ q.marks }} Marks</span>
            </div>
            <p class="text-surface-900 mb-6">{{ q.text }}</p>

            <!-- MCQ -->
            <div *ngIf="q.type === 'MCQ'" class="space-y-3">
              <label *ngFor="let opt of q.options" class="flex items-center gap-3 p-3 border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">
                <input type="radio" [formControlName]="'q_' + q.questionId" [value]="opt.label" (change)="saveAnswer(q.questionId)" class="w-4 h-4 text-brand-600"/>
                <span class="font-bold w-6">{{ opt.label }}</span>
                <span>{{ opt.text }}</span>
              </label>
            </div>

            <!-- True/False -->
            <div *ngIf="q.type === 'TrueFalse'" class="space-y-3">
              <label class="flex items-center gap-3 p-3 border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">
                <input type="radio" [formControlName]="'q_' + q.questionId" value="True" (change)="saveAnswer(q.questionId)" class="w-4 h-4 text-brand-600"/>
                <span>True</span>
              </label>
              <label class="flex items-center gap-3 p-3 border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer">
                <input type="radio" [formControlName]="'q_' + q.questionId" value="False" (change)="saveAnswer(q.questionId)" class="w-4 h-4 text-brand-600"/>
                <span>False</span>
              </label>
            </div>

            <!-- Text Based -->
            <div *ngIf="q.type === 'ShortAnswer' || q.type === 'FillInBlank'">
              <input type="text" [formControlName]="'q_' + q.questionId" (blur)="saveAnswer(q.questionId)" class="form-input" placeholder="Your answer..."/>
            </div>

            <!-- Essay -->
            <div *ngIf="q.type === 'Essay'">
              <textarea [formControlName]="'q_' + q.questionId" (blur)="saveAnswer(q.questionId)" class="form-input" rows="4" placeholder="Type your essay here..."></textarea>
            </div>
            
            <div class="mt-2 text-xs text-brand-600 italic" *ngIf="savingQId() === q.questionId">Saving...</div>
          </div>
        </form>

        <div class="mt-8 flex justify-end pb-12">
          <button (click)="submitExam()" [disabled]="submitting()" class="btn-primary px-8 py-3 text-lg">
            {{ submitting() ? 'Submitting...' : 'Submit Exam' }}
          </button>
        </div>
      </ng-container>
    </div>
  `
})
export class ExamTakerComponent implements OnInit, OnDestroy {
  private svc = inject(StudentAssessmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  studentExamId!: number;
  attempt = signal<ExamAttemptDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  secondsRemaining = signal(0);
  private timerInt?: any;

  form = this.fb.group({});
  savingQId = signal<number | null>(null);
  submitting = signal(false);

  ngOnInit() {
    const examId = Number(this.route.snapshot.paramMap.get('id'));
    this.load(examId);
  }

  // Workaround: We need examId to call startExam. Let's assume the route param is examId!
  load(examId: number) {
    this.svc.startExam(examId).subscribe({
      next: data => {
        this.attempt.set(data);
        this.studentExamId = data.studentExamId;
        this.secondsRemaining.set(data.secondsRemaining);
        this.buildForm(data);
        this.startTimer();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exam. It may have expired or been submitted.');
        this.loading.set(false);
      }
    });
  }

  buildForm(data: ExamAttemptDto) {
    data.questions.forEach(q => {
      const saved = data.savedAnswers.find(a => a.questionId === q.questionId);
      const val = saved ? (saved.selectedOptionId || saved.answerText || '') : '';
      this.form.addControl('q_' + q.questionId, new FormControl(val));
    });
  }

  startTimer() {
    this.timerInt = setInterval(() => {
      const current = this.secondsRemaining();
      if (current <= 0) {
        clearInterval(this.timerInt);
        this.submitExam();
      } else {
        this.secondsRemaining.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInt) clearInterval(this.timerInt);
  }

  saveAnswer(qId: number) {
    const val = this.form.get('q_' + qId)?.value;
    if (!val) return;
    this.savingQId.set(qId);

    // Determine if val is option or text. MCQ/TrueFalse usually are options
    const q = this.attempt()!.questions.find(x => x.questionId === qId);
    const req = {
      questionId: qId,
      answerText: (q?.type === 'MCQ' || q?.type === 'TrueFalse') ? undefined : val,
      selectedOptionId: (q?.type === 'MCQ' || q?.type === 'TrueFalse') ? val : undefined
    };

    this.svc.saveAnswer(this.studentExamId, req).subscribe({
      next: () => this.savingQId.set(null),
      error: () => this.savingQId.set(null) // Silent fail or retry logic could go here
    });
  }

  submitExam() {
    if (this.submitting()) return;
    this.submitting.set(true);
    if (this.timerInt) clearInterval(this.timerInt);

    this.svc.submitExam(this.studentExamId).subscribe({
      next: (res) => {
        this.router.navigate(['/student/assessment/exams/result', this.studentExamId]);
      },
      error: () => {
        alert('Failed to submit exam. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  formatTime(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
