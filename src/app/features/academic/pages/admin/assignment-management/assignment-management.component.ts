import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AcademicService } from '../../../../../services/academic.service';
import {
  GradeDto, ClassDto, SubjectDto, TeachingAssignmentDto, CreateAssignmentRequest
} from '../../../../../models/academic.models';

@Component({
  selector: 'app-assignment-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Assignment Management</h1>
          <p class="text-surface-500 mt-1">Assign teachers to classes and subjects</p>
        </div>
        <button (click)="openCreateModal()" [disabled]="!selectedClassId()" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Assign Teacher
        </button>
      </div>

      <!-- Selectors -->
      <div class="card p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Select Grade</label>
          <select class="form-select" (change)="onGradeChange($event)">
            <option value="">-- Select a grade --</option>
            <option *ngFor="let g of grades()" [value]="g.gradeId">{{ g.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Select Class</label>
          <select class="form-select" (change)="onClassChange($event)" [disabled]="!selectedGradeId()">
            <option value="">-- Select a class --</option>
            <option *ngFor="let c of classes()" [value]="c.classId">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading assignments…"></app-loading-spinner>

      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="loadAssignments()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <div *ngIf="!selectedClassId() && !loading()" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">👩‍🏫</span>
        <p class="text-surface-500 text-sm">Select a grade and class to view teaching assignments.</p>
      </div>

      <app-empty-state
        *ngIf="selectedClassId() && !loading() && !error() && assignments().length === 0"
        icon="👩‍🏫" title="No assignments yet"
        description="Assign teachers to this class.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Assign Teacher</button>
      </app-empty-state>

      <!-- Table -->
      <div *ngIf="selectedClassId() && !loading() && assignments().length > 0" class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200 bg-surface-50">
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Teacher</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Subject</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden sm:table-cell">Year</th>
                <th class="text-right px-4 py-3 font-semibold text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr *ngFor="let a of assignments()" class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {{ a.teacherName[0] }}
                    </div>
                    <span class="font-medium text-surface-900">{{ a.teacherName }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-surface-700">{{ a.subjectName }}</td>
                <td class="px-4 py-3 text-surface-500 hidden sm:table-cell">{{ a.academicYear }}</td>
                <td class="px-4 py-3 text-right">
                  <button (click)="openDeleteModal(a)" class="btn-danger btn-sm">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Assign Modal ── -->
    <div *ngIf="showCreateModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCreateModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Assign Teacher</h2>
        <p class="text-sm text-surface-500 mb-6">Assign a teacher to <strong>{{ selectedClassName() }}</strong>.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Teacher User ID <span class="text-danger">*</span></label>
            <input type="number" formControlName="teacherUserId" placeholder="e.g. 5" class="form-input"/>
            <p class="form-hint">Enter the User ID of the teacher account.</p>
            <span *ngIf="createForm.get('teacherUserId')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Subject <span class="text-danger">*</span></label>
            <select formControlName="subjectId" class="form-select">
              <option value="" disabled>Select subject…</option>
              <option *ngFor="let s of subjects()" [value]="s.subjectId">{{ s.name }}</option>
            </select>
            <span *ngIf="createForm.get('subjectId')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Academic Year <span class="text-danger">*</span></label>
            <input type="number" formControlName="academicYear" class="form-input"/>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeCreateModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Saving…' : 'Assign' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Remove Confirmation ── -->
    <div *ngIf="showDeleteModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeDeleteModal()">
      <div class="card p-8 max-w-sm w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-2">Remove Assignment</h2>
        <p class="text-sm text-surface-500 mb-6">
          Remove <strong>{{ deleteTarget()?.teacherName }}</strong> from teaching
          <strong>{{ deleteTarget()?.subjectName }}</strong>?
        </p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeDeleteModal()" class="btn-secondary flex-1">Cancel</button>
          <button (click)="submitDelete()" [disabled]="saving()" class="btn-danger flex-1">{{ saving() ? 'Removing…' : 'Remove' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class AssignmentManagementComponent implements OnInit {
  private svc = inject(AcademicService);
  private fb  = inject(FormBuilder);

  grades          = signal<GradeDto[]>([]);
  classes         = signal<ClassDto[]>([]);
  subjects        = signal<SubjectDto[]>([]);
  assignments     = signal<TeachingAssignmentDto[]>([]);
  selectedGradeId = signal<number | null>(null);
  selectedClassId = signal<number | null>(null);
  loading         = signal(false);
  error           = signal<string | null>(null);
  saving          = signal(false);
  submitted       = signal(false);
  modalError      = signal<string | null>(null);

  showCreateModal = signal(false);
  showDeleteModal = signal(false);
  deleteTarget    = signal<TeachingAssignmentDto | null>(null);

  readonly currentYear = new Date().getFullYear();

  createForm = this.fb.group({
    teacherUserId: [null as number | null, Validators.required],
    subjectId:     [null as number | null, Validators.required],
    academicYear:  [this.currentYear, Validators.required],
  });

  ngOnInit(): void {
    this.svc.getGrades().subscribe({ next: g => this.grades.set(g) });
  }

  selectedClassName(): string {
    return this.classes().find(c => c.classId === this.selectedClassId())?.name ?? '';
  }

  onGradeChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedGradeId.set(v ? Number(v) : null);
    this.selectedClassId.set(null);
    this.assignments.set([]);
    if (this.selectedGradeId()) {
      this.svc.getClassesByGrade(this.selectedGradeId()!).subscribe({ next: c => this.classes.set(c) });
      this.svc.getSubjectsByGrade(this.selectedGradeId()!).subscribe({ next: s => this.subjects.set(s) });
    } else {
      this.classes.set([]); this.subjects.set([]);
    }
  }

  onClassChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedClassId.set(v ? Number(v) : null);
    if (this.selectedClassId()) this.loadAssignments();
    else this.assignments.set([]);
  }

  loadAssignments(): void {
    const id = this.selectedClassId();
    if (!id) return;
    this.loading.set(true); this.error.set(null);
    this.svc.getClassAssignments(id).subscribe({
      next:  a   => { this.assignments.set(a); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed.'); this.loading.set(false); },
    });
  }

  openCreateModal(): void { this.createForm.reset({ academicYear: this.currentYear }); this.modalError.set(null); this.submitted.set(false); this.showCreateModal.set(true); }
  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    this.submitted.set(true);
    if (this.createForm.invalid) return;
    const { teacherUserId, subjectId, academicYear } = this.createForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: CreateAssignmentRequest = { teacherUserId: teacherUserId!, classId: this.selectedClassId()!, subjectId: subjectId!, academicYear: academicYear! };
    this.svc.createAssignment(req).subscribe({
      next: () => { this.saving.set(false); this.closeCreateModal(); this.loadAssignments(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to assign.'); },
    });
  }

  openDeleteModal(a: TeachingAssignmentDto): void { this.deleteTarget.set(a); this.modalError.set(null); this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); }

  submitDelete(): void {
    const a = this.deleteTarget()!;
    this.saving.set(true); this.modalError.set(null);
    this.svc.deleteAssignment(a.id).subscribe({
      next: () => { this.saving.set(false); this.closeDeleteModal(); this.loadAssignments(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to remove.'); },
    });
  }
}
