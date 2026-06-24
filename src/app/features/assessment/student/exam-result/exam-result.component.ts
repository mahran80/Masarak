import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StudentAssessmentService } from '../../../../services/student-assessment.service';
import { ExamResultDto } from '../../../../models/assessment.models';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container max-w-4xl">
      <div class="mb-8 flex justify-between items-start">
        <div>
          <span class="badge bg-violet-100 text-violet-700 mb-2 inline-flex">Student Portal</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Exam Result</h1>
        </div>
        <a routerLink="/student/assessment/exams" class="btn-secondary">Back to Exams</a>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading result..."></app-loading-spinner>
      
      <div *ngIf="error() && !loading()" class="alert-error mb-6">{{ error() }}</div>

      <ng-container *ngIf="result()">
        <!-- Score Card -->
        <div class="card p-8 mb-8 text-center bg-gradient-to-br from-surface-50 to-white">
          <div *ngIf="result()!.hasPendingManualGrading" class="mb-4 text-amber-600 font-semibold flex items-center justify-center gap-2">
            <span>⚠️</span> Your score is pending manual grading from the teacher.
          </div>
          
          <div class="inline-flex items-center justify-center w-32 h-32 rounded-full border-8"
               [class.border-emerald-500]="result()!.percentage >= 50"
               [class.border-red-500]="result()!.percentage < 50">
            <div class="text-center">
              <div class="text-3xl font-bold text-surface-900">{{ result()!.finalScore }}</div>
              <div class="text-surface-500 text-sm">/ {{ result()!.totalMarks }}</div>
            </div>
          </div>
          <h2 class="text-2xl font-bold mt-4">{{ result()!.percentage }}%</h2>
        </div>

        <!-- Answers Breakdown -->
        <h3 class="text-xl font-bold mb-4">Question Breakdown</h3>
        <div class="space-y-4">
          <div *ngFor="let a of result()!.answers; let i = index" class="card p-5 border-l-4"
               [class.border-emerald-500]="a.marksAwarded === a.maxMarks"
               [class.border-amber-500]="a.marksAwarded > 0 && a.marksAwarded < a.maxMarks"
               [class.border-red-500]="a.marksAwarded === 0 && a.gradingStatus !== 'PendingReview'"
               [class.border-surface-300]="a.gradingStatus === 'PendingReview'">
            
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-surface-900">Question {{ i + 1 }}</span>
              <span class="badge" [ngClass]="{
                'bg-emerald-100 text-emerald-700': a.marksAwarded === a.maxMarks,
                'bg-surface-200 text-surface-700': a.gradingStatus === 'PendingReview',
                'bg-red-100 text-red-700': a.marksAwarded === 0 && a.gradingStatus !== 'PendingReview'
              }">
                {{ a.gradingStatus === 'PendingReview' ? 'Pending' : a.marksAwarded + ' / ' + a.maxMarks }}
              </span>
            </div>
            
            <p class="text-surface-900 mb-4">{{ a.questionText }}</p>
            
            <div class="bg-surface-50 p-3 rounded-lg text-sm mb-2">
              <span class="text-surface-500 font-medium">Your Answer:</span>
              <p class="mt-1 font-medium">{{ a.yourAnswer || '(No answer)' }}</p>
            </div>
            
            <div *ngIf="a.correctAnswer" class="text-sm mt-2 flex items-center gap-2">
              <span class="text-surface-500 font-medium">Correct Answer:</span>
              <span class="text-emerald-700 font-bold">{{ a.correctAnswer }}</span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class ExamResultComponent implements OnInit {
  private svc = inject(StudentAssessmentService);
  private route = inject(ActivatedRoute);

  studentExamId!: number;
  result = signal<ExamResultDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.studentExamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.svc.getExamResult(this.studentExamId).subscribe({
      next: data => { this.result.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load exam result.'); this.loading.set(false); }
    });
  }
}
