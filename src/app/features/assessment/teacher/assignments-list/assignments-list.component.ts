import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TeacherAssessmentService } from '../../../../services/teacher-assessment.service';
import { SessionService } from '../../../../services/session.service';
import { TeachingAssignmentDto } from '../../../../models/academic.models';
import { AssignmentDto, CreateAssignmentRequest, AssignmentStatus } from '../../../../models/assessment.models';

@Component({
  selector: 'app-assignments-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <div class="page-container">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge bg-teal-100 text-teal-700 mb-2 inline-flex">Assessment</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Assignments</h1>
          <p class="text-surface-500 mt-1">Manage assignments for your classes</p>
        </div>
        <button (click)="openCreateModal()" [disabled]="!selectedTaId()" class="btn-primary self-start sm:self-auto">
          Add Assignment
        </button>
      </div>

      <!-- TA Selector -->
      <div class="card p-4 mb-6">
        <label class="form-label">Select Class/Subject</label>
        <select class="form-select" (change)="onTaChange($event)">
          <option value="">-- Select a class --</option>
          <option *ngFor="let ta of tas()" [value]="ta.id">{{ ta.className }} - {{ ta.subjectName }}</option>
        </select>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading..."></app-loading-spinner>
      
      <div *ngIf="error() && !loading()" class="alert-error mb-6">{{ error() }}</div>

      <app-empty-state
        *ngIf="selectedTaId() && !loading() && !error() && assignments().length === 0"
        icon="📄" title="No assignments"
        description="You haven't created any assignments for this class yet.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Create Assignment</button>
      </app-empty-state>

      <!-- Assignments grid -->
      <div *ngIf="selectedTaId() && !loading() && assignments().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let a of assignments()" class="card p-5">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-surface-900">{{ a.title }}</h3>
            <span [class]="statusClass(a.status)">{{ a.status }}</span>
          </div>
          <p class="text-sm text-surface-500 mb-4">Due: {{ a.dueDate | date:'medium' }}</p>
          <div class="flex items-center justify-between mt-auto">
            <div class="text-sm">
              <span class="font-medium">{{ a.maxMarks }}</span> Marks
              <span class="mx-2 text-surface-300">|</span>
              <span class="font-medium">{{ a.submissionCount }}</span> Submissions
            </div>
            <div class="flex gap-2">
              <button *ngIf="a.status === 'Draft'" (click)="publish(a.assignmentId)" class="btn-secondary btn-sm">Publish</button>
              <button *ngIf="a.status === 'Published'" (click)="close(a.assignmentId)" class="btn-secondary btn-sm">Close</button>
              <a [routerLink]="['/teacher/assessment/assignments', a.assignmentId, 'submissions']" class="btn-primary btn-sm">View</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeModal()">
      <div class="card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold mb-4">Create Assignment</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="form-label">Title</label>
            <input type="text" formControlName="title" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Instructions</label>
            <textarea formControlName="instructions" class="form-input" rows="3"></textarea>
          </div>
          <div>
            <label class="form-label">Due Date</label>
            <input type="datetime-local" formControlName="dueDate" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Max Marks</label>
            <input type="number" formControlName="maxMarks" class="form-input"/>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Saving...' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AssignmentsListComponent implements OnInit {
  private svc = inject(TeacherAssessmentService);
  private sessionSvc = inject(SessionService);
  private fb = inject(FormBuilder);

  tas = signal<TeachingAssignmentDto[]>([]);
  assignments = signal<AssignmentDto[]>([]);
  selectedTaId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  showModal = signal(false);
  saving = signal(false);

  form = this.fb.group({
    title: ['', Validators.required],
    instructions: [''],
    dueDate: ['', Validators.required],
    maxMarks: [100, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    this.sessionSvc.getMyAssignments().subscribe({
      next: data => this.tas.set(data),
      error: err => this.error.set('Failed to load teaching assignments.')
    });
  }

  onTaChange(event: Event) {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedTaId.set(v ? Number(v) : null);
    if (this.selectedTaId()) this.loadAssignments();
    else this.assignments.set([]);
  }

  loadAssignments() {
    this.loading.set(true);
    this.svc.getAssignments(this.selectedTaId()!).subscribe({
      next: data => { this.assignments.set(data); this.loading.set(false); },
      error: err => { this.error.set('Failed to load assignments.'); this.loading.set(false); }
    });
  }

  statusClass(status: string) {
    if (status === 'Draft') return 'badge bg-surface-200 text-surface-700';
    if (status === 'Published') return 'badge bg-brand-100 text-brand-700';
    return 'badge bg-red-100 text-red-700';
  }

  openCreateModal() { this.form.reset({ maxMarks: 100 }); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const req: CreateAssignmentRequest = {
      teachingAssignmentId: this.selectedTaId()!,
      title: this.form.value.title!,
      instructions: this.form.value.instructions || undefined,
      dueDate: new Date(this.form.value.dueDate!).toISOString(),
      maxMarks: this.form.value.maxMarks!
    };
    this.svc.createAssignment(req).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadAssignments(); },
      error: () => { this.saving.set(false); alert('Failed to create assignment'); }
    });
  }

  publish(id: number) {
    this.svc.publishAssignment(id).subscribe({
      next: () => this.loadAssignments(),
      error: () => alert('Failed to publish')
    });
  }

  close(id: number) {
    this.svc.closeAssignment(id).subscribe({
      next: () => this.loadAssignments(),
      error: () => alert('Failed to close')
    });
  }
}
