import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TeacherAssessmentService } from '../../../../services/teacher-assessment.service';
import { SessionService } from '../../../../services/session.service';
import { TeachingAssignmentDto } from '../../../../models/academic.models';
import { ExamDto, CreateExamRequest } from '../../../../models/assessment.models';

@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <div class="page-container">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge bg-teal-100 text-teal-700 mb-2 inline-flex">Assessment</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Exams</h1>
          <p class="text-surface-500 mt-1">Manage exams for your classes</p>
        </div>
        <button (click)="openCreateModal()" [disabled]="!selectedTaId()" class="btn-primary self-start sm:self-auto">
          Add Exam
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
        *ngIf="selectedTaId() && !loading() && !error() && exams().length === 0"
        icon="📄" title="No exams"
        description="You haven't created any exams for this class yet.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Create Exam</button>
      </app-empty-state>

      <!-- Exams grid -->
      <div *ngIf="selectedTaId() && !loading() && exams().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let e of exams()" class="card p-5 border-l-4" 
             [class.border-brand-500]="e.status === 'Published'"
             [class.border-surface-300]="e.status === 'Draft'">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-surface-900">{{ e.title }}</h3>
            <span [class]="statusClass(e.status)">{{ e.status }}</span>
          </div>
          <p class="text-sm text-surface-500 mb-2">Opens: {{ e.openAt | date:'short' }}</p>
          <p class="text-sm text-surface-500 mb-4">Closes: {{ e.closeAt | date:'short' }}</p>
          
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-surface-100">
            <div class="text-sm">
              <span class="font-medium">{{ e.totalMarks }}</span> Marks
              <span class="mx-2 text-surface-300">|</span>
              <span class="font-medium">{{ e.questionCount }}</span> Qs
              <span class="mx-2 text-surface-300">|</span>
              <span class="font-medium">{{ e.durationMinutes }}</span> min
            </div>
            <div class="flex gap-2">
              <button *ngIf="e.status === 'Draft'" (click)="publish(e.examId)" class="btn-secondary btn-sm">Publish</button>
              <a [routerLink]="['/teacher/assessment/exams', e.examId, 'builder']" class="btn-primary btn-sm">Builder</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" (click)="closeModal()">
      <div class="card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold mb-4">Create Exam</h2>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="form-label">Title</label>
            <input type="text" formControlName="title" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Instructions</label>
            <textarea formControlName="instructions" class="form-input" rows="2"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Open At</label>
              <input type="datetime-local" formControlName="openAt" class="form-input"/>
            </div>
            <div>
              <label class="form-label">Close At</label>
              <input type="datetime-local" formControlName="closeAt" class="form-input"/>
            </div>
          </div>
          <div>
            <label class="form-label">Duration (Minutes)</label>
            <input type="number" formControlName="durationMinutes" class="form-input"/>
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
export class ExamsListComponent implements OnInit {
  private svc = inject(TeacherAssessmentService);
  private sessionSvc = inject(SessionService);
  private fb = inject(FormBuilder);

  tas = signal<TeachingAssignmentDto[]>([]);
  exams = signal<ExamDto[]>([]);
  selectedTaId = signal<number | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  
  showModal = signal(false);
  saving = signal(false);

  form = this.fb.group({
    title: ['', Validators.required],
    instructions: [''],
    openAt: ['', Validators.required],
    closeAt: ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(1)]]
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
    if (this.selectedTaId()) this.loadExams();
    else this.exams.set([]);
  }

  loadExams() {
    this.loading.set(true);
    this.svc.getExams(this.selectedTaId()!).subscribe({
      next: data => { this.exams.set(data); this.loading.set(false); },
      error: err => { this.error.set('Failed to load exams.'); this.loading.set(false); }
    });
  }

  statusClass(status: string) {
    if (status === 'Draft') return 'badge bg-surface-200 text-surface-700';
    if (status === 'Published') return 'badge bg-brand-100 text-brand-700';
    return 'badge bg-red-100 text-red-700';
  }

  openCreateModal() { this.form.reset({ durationMinutes: 60 }); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const req: CreateExamRequest = {
      teachingAssignmentId: this.selectedTaId()!,
      title: this.form.value.title!,
      instructions: this.form.value.instructions || undefined,
      openAt: new Date(this.form.value.openAt!).toISOString(),
      closeAt: new Date(this.form.value.closeAt!).toISOString(),
      durationMinutes: this.form.value.durationMinutes!
    };
    this.svc.createExam(req).subscribe({
      next: () => { this.saving.set(false); this.closeModal(); this.loadExams(); },
      error: () => { this.saving.set(false); alert('Failed to create exam'); }
    });
  }

  publish(id: number) {
    this.svc.publishExam(id).subscribe({
      next: () => this.loadExams(),
      error: () => alert('Failed to publish. Ensure there is at least 1 question.')
    });
  }
}
