import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StudentAssessmentService } from '../../../../services/student-assessment.service';
import { ExamDto } from '../../../../models/assessment.models';

@Component({
  selector: 'app-my-exams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <span class="badge bg-violet-100 text-violet-700 mb-2 inline-flex">Student Portal</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">My Exams</h1>
        <p class="text-surface-500 mt-1">View and take your exams</p>
      </div>

      <!-- Subject Input for Testing -->
      <div class="card p-4 mb-6 flex gap-4 items-end">
        <div class="flex-1">
          <label class="form-label">Subject ID (for testing)</label>
          <input type="number" [formControl]="subjectIdCtrl" class="form-input" placeholder="e.g. 1"/>
        </div>
        <button (click)="load()" class="btn-primary">Load</button>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading..."></app-loading-spinner>
      
      <div *ngIf="error() && !loading()" class="alert-error mb-6">{{ error() }}</div>

      <app-empty-state
        *ngIf="loaded() && !loading() && !error() && exams().length === 0"
        icon="📄" title="No open exams"
        description="You have no open exams for this subject right now.">
      </app-empty-state>

      <!-- Exams list -->
      <div *ngIf="!loading() && exams().length > 0" class="space-y-4">
        <div *ngFor="let e of exams()" class="card p-5 border-l-4 border-brand-500">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="text-lg font-bold text-surface-900">{{ e.title }}</h3>
              <p class="text-sm text-surface-500">{{ e.durationMinutes }} Minutes · {{ e.totalMarks }} Marks</p>
            </div>
            <button (click)="startExam(e.examId)" class="btn-primary" [disabled]="starting()">
              {{ starting() ? 'Starting...' : 'Start Exam' }}
            </button>
          </div>
          <p class="text-xs text-surface-400">Closes: {{ e.closeAt | date:'medium' }}</p>
        </div>
      </div>
    </div>
  `
})
export class MyExamsComponent {
  private svc = inject(StudentAssessmentService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  subjectIdCtrl = this.fb.control(1, Validators.required);
  exams = signal<ExamDto[]>([]);
  loading = signal(false);
  loaded = signal(false);
  error = signal<string | null>(null);
  starting = signal(false);

  load() {
    if (this.subjectIdCtrl.invalid) return;
    this.loading.set(true); this.error.set(null);
    this.svc.getOpenExams(this.subjectIdCtrl.value!).subscribe({
      next: data => { this.exams.set(data); this.loading.set(false); this.loaded.set(true); },
      error: () => { this.error.set('Failed to load exams.'); this.loading.set(false); }
    });
  }

  startExam(id: number) {
    this.starting.set(true);
    // Navigate immediately passing the examId
    this.router.navigate(['/student/assessment/exams/take', id]);
  }
}
