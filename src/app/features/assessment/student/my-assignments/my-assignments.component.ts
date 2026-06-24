import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StudentAssessmentService } from '../../../../services/student-assessment.service';
import { AssignmentDto } from '../../../../models/assessment.models';

@Component({
  selector: 'app-my-assignments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <span class="badge bg-violet-100 text-violet-700 mb-2 inline-flex">Student Portal</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">My Assignments</h1>
        <p class="text-surface-500 mt-1">View and submit your assignments</p>
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
        *ngIf="loaded() && !loading() && !error() && assignments().length === 0"
        icon="📄" title="No assignments"
        description="You have no assignments for this subject.">
      </app-empty-state>

      <!-- Assignments list -->
      <div *ngIf="!loading() && assignments().length > 0" class="space-y-4">
        <div *ngFor="let a of assignments()" class="card p-5 border-l-4 border-brand-500">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="text-lg font-bold text-surface-900">{{ a.title }}</h3>
              <p class="text-sm text-surface-500">{{ a.subjectName }}</p>
            </div>
            <span class="font-bold text-brand-600">{{ a.maxMarks }} Marks</span>
          </div>
          <p class="text-sm text-surface-500 mb-4">Due: {{ a.dueDate | date:'medium' }}</p>
          <button (click)="openSubmitModal(a)" class="btn-primary btn-sm">Submit Work</button>
        </div>
      </div>
    </div>

    <!-- Submit Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeModal()">
      <div class="card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold mb-4">Submit Assignment</h2>
        <p class="mb-4 text-sm"><strong>{{ target()?.title }}</strong></p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="form-label">Text Answer</label>
            <textarea formControlName="textContent" class="form-input" rows="4"></textarea>
          </div>
          <div>
            <label class="form-label">File Upload (Optional)</label>
            <input type="file" (change)="onFileChange($event)" class="form-input" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Submitting...' : 'Submit' }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MyAssignmentsComponent {
  private svc = inject(StudentAssessmentService);
  private fb = inject(FormBuilder);

  subjectIdCtrl = this.fb.control(1, Validators.required);
  assignments = signal<AssignmentDto[]>([]);
  loading = signal(false);
  loaded = signal(false);
  error = signal<string | null>(null);

  showModal = signal(false);
  saving = signal(false);
  target = signal<AssignmentDto | null>(null);
  selectedFile: File | undefined = undefined;

  form = this.fb.group({ textContent: [''] });

  load() {
    if (this.subjectIdCtrl.invalid) return;
    this.loading.set(true); this.error.set(null);
    this.svc.getAssignments(this.subjectIdCtrl.value!).subscribe({
      next: data => { this.assignments.set(data); this.loading.set(false); this.loaded.set(true); },
      error: () => { this.error.set('Failed to load assignments.'); this.loading.set(false); }
    });
  }

  openSubmitModal(a: AssignmentDto) {
    this.target.set(a);
    this.form.reset();
    this.selectedFile = undefined;
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  submit() {
    this.saving.set(true);
    this.svc.submitAssignment(this.target()!.assignmentId, { textContent: this.form.value.textContent || undefined }, this.selectedFile).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); alert('Submitted successfully!'); },
      error: () => { this.saving.set(false); alert('Failed to submit.'); }
    });
  }
}
