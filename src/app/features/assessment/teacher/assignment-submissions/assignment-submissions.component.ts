import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TeacherAssessmentService } from '../../../../services/teacher-assessment.service';
import { SubmissionDetailDto, GradeSubmissionRequest } from '../../../../models/assessment.models';

@Component({
  selector: 'app-assignment-submissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <a routerLink="../../" class="text-brand-600 hover:underline text-sm mb-2 inline-block">← Back to Assignments</a>
        <h1 class="text-3xl font-bold text-surface-900 font-display">Submissions</h1>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading submissions..."></app-loading-spinner>
      
      <div *ngIf="error() && !loading()" class="alert-error mb-6">{{ error() }}</div>

      <app-empty-state
        *ngIf="!loading() && !error() && submissions().length === 0"
        icon="📥" title="No submissions yet"
        description="Students have not submitted any work for this assignment.">
      </app-empty-state>

      <!-- Submissions table -->
      <div *ngIf="!loading() && submissions().length > 0" class="card overflow-hidden">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-surface-50 border-b border-surface-200">
            <tr>
              <th class="px-6 py-4 font-semibold text-surface-900">Student</th>
              <th class="px-6 py-4 font-semibold text-surface-900">Submitted At</th>
              <th class="px-6 py-4 font-semibold text-surface-900">Status</th>
              <th class="px-6 py-4 font-semibold text-surface-900">Marks</th>
              <th class="px-6 py-4 font-semibold text-surface-900">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr *ngFor="let sub of submissions()" class="hover:bg-surface-50">
              <td class="px-6 py-4 font-medium text-surface-900">{{ sub.studentName }}</td>
              <td class="px-6 py-4 text-surface-600">{{ sub.submittedAt | date:'short' }}</td>
              <td class="px-6 py-4">
                <span [class]="sub.status === 'Graded' ? 'badge bg-brand-100 text-brand-700' : 'badge bg-amber-100 text-amber-700'">
                  {{ sub.status }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium">
                {{ sub.marksAwarded !== null ? sub.marksAwarded : '-' }}
              </td>
              <td class="px-6 py-4 flex gap-2">
                <button *ngIf="sub.hasFile" (click)="downloadFile(sub.submissionId)" class="btn-secondary btn-sm">Download</button>
                <button (click)="openGradeModal(sub)" class="btn-primary btn-sm">Grade</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Grade Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeModal()">
      <div class="card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold mb-4">Grade Submission</h2>
        <p class="mb-4">Student: <strong>{{ targetSub()?.studentName }}</strong></p>
        <form [formGroup]="form" (ngSubmit)="submitGrade()" class="space-y-4">
          <div>
            <label class="form-label">Marks Awarded</label>
            <input type="number" formControlName="marksAwarded" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Feedback</label>
            <textarea formControlName="feedback" class="form-input" rows="3"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Saving...' : 'Save Grade' }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AssignmentSubmissionsComponent implements OnInit {
  private svc = inject(TeacherAssessmentService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  assignmentId!: number;
  submissions = signal<SubmissionDetailDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showModal = signal(false);
  saving = signal(false);
  targetSub = signal<SubmissionDetailDto | null>(null);

  form = this.fb.group({
    marksAwarded: [0, [Validators.required, Validators.min(0)]],
    feedback: ['']
  });

  ngOnInit() {
    this.assignmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getSubmissions(this.assignmentId).subscribe({
      next: data => { this.submissions.set(data); this.loading.set(false); },
      error: err => { this.error.set('Failed to load submissions.'); this.loading.set(false); }
    });
  }

  downloadFile(id: number) {
    this.svc.getSubmissionFileUrl(id).subscribe({
      next: res => window.open(res.url, '_blank'),
      error: () => alert('Failed to get download URL')
    });
  }

  openGradeModal(sub: SubmissionDetailDto) {
    this.targetSub.set(sub);
    this.form.reset({ marksAwarded: sub.marksAwarded || 0 });
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  submitGrade() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const req: GradeSubmissionRequest = {
      marksAwarded: this.form.value.marksAwarded!,
      feedback: this.form.value.feedback || undefined
    };
    this.svc.gradeSubmission(this.targetSub()!.submissionId, req).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.load(); },
      error: () => { this.saving.set(false); alert('Failed to grade submission'); }
    });
  }
}
