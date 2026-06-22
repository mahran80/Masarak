import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AcademicService } from '../../../../../services/academic.service';
import { GradeDto, GradeStage, CreateGradeRequest, UpdateGradeRequest } from '../../../../../models/academic.models';

@Component({
  selector: 'app-grade-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Grade Management</h1>
          <p class="text-surface-500 mt-1">Manage school grades and stages</p>
        </div>
        <button (click)="openCreateModal()" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Grade
        </button>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading grades…"></app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Empty -->
      <app-empty-state
        *ngIf="!loading() && !error() && grades().length === 0"
        icon="🎓" title="No grades yet"
        description="Create the first school grade to get started.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Add Grade</button>
      </app-empty-state>

      <!-- Grades grouped by stage -->
      <div *ngIf="!loading() && grades().length > 0" class="space-y-6">
        <div *ngFor="let stage of stages">
          <h2 class="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">{{ stageLabel(stage) }}</h2>
          <div class="card overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-surface-200 bg-surface-50">
                  <th class="text-left px-4 py-3 font-semibold text-surface-700">Order</th>
                  <th class="text-left px-4 py-3 font-semibold text-surface-700">Name</th>
                  <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden sm:table-cell">Arabic Name</th>
                  <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden md:table-cell">Status</th>
                  <th class="text-right px-4 py-3 font-semibold text-surface-700">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100">
                <tr *ngFor="let g of gradesByStage(stage)" class="hover:bg-surface-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {{ g.order }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-medium text-surface-900">{{ g.name }}</td>
                  <td class="px-4 py-3 text-surface-700 hidden sm:table-cell" dir="rtl">{{ g.nameAr }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span [class]="g.isActive ? 'badge-active' : 'badge-cancelled'">
                      {{ g.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="openEditModal(g)" class="btn-secondary btn-sm">Edit</button>
                      <button (click)="openDeleteModal(g)" class="btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Create Modal ── -->
    <div *ngIf="showCreateModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCreateModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Add Grade</h2>
        <p class="text-sm text-surface-500 mb-6">Create a new school grade.</p>

        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>

        <form [formGroup]="createForm" (ngSubmit)="submitCreate()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Name (English) <span class="text-danger">*</span></label>
            <input type="text" formControlName="name" placeholder="e.g. Grade 5" class="form-input"/>
            <span *ngIf="createForm.get('name')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Name (Arabic) <span class="text-danger">*</span></label>
            <input type="text" formControlName="nameAr" placeholder="الصف الخامس" class="form-input" dir="rtl"/>
            <span *ngIf="createForm.get('nameAr')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Stage <span class="text-danger">*</span></label>
            <select formControlName="stage" class="form-select">
              <option value="" disabled>Select stage…</option>
              <option value="Primary">Primary (ابتدائي)</option>
              <option value="Preparatory">Preparatory (إعدادي)</option>
              <option value="Secondary">Secondary (ثانوي)</option>
            </select>
            <span *ngIf="createForm.get('stage')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Order <span class="text-danger">*</span></label>
            <input type="number" formControlName="order" placeholder="1–12" min="1" max="12" class="form-input"/>
            <span *ngIf="createForm.get('order')?.invalid && submitted()" class="form-error">Enter a number 1–12</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeCreateModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">
              <svg *ngIf="saving()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ saving() ? 'Saving…' : 'Create Grade' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Edit Modal ── -->
    <div *ngIf="showEditModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeEditModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Edit Grade</h2>
        <p class="text-sm text-surface-500 mb-6">Update grade "{{ editTarget()?.name }}".</p>

        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>

        <form [formGroup]="editForm" (ngSubmit)="submitEdit()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Name (English) <span class="text-danger">*</span></label>
            <input type="text" formControlName="name" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Name (Arabic) <span class="text-danger">*</span></label>
            <input type="text" formControlName="nameAr" class="form-input" dir="rtl"/>
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" formControlName="isActive" id="editActive" class="w-4 h-4 text-brand-600 rounded"/>
            <label for="editActive" class="text-sm text-surface-700">Active</label>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeEditModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">
              <svg *ngIf="saving()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Delete Confirmation Modal ── -->
    <div *ngIf="showDeleteModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeDeleteModal()">
      <div class="card p-8 max-w-sm w-full shadow-modal" (click)="$event.stopPropagation()">
        <div class="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Delete Grade</h2>
        <p class="text-sm text-surface-500 mb-1">Delete <strong>{{ deleteTarget()?.name }}</strong>?</p>
        <p class="text-xs text-surface-400 mb-6">This will remove the grade and may affect related classes and subjects.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeDeleteModal()" class="btn-secondary flex-1">Cancel</button>
          <button (click)="submitDelete()" [disabled]="saving()" class="btn-danger flex-1">
            {{ saving() ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class GradeManagementComponent implements OnInit {
  private svc = inject(AcademicService);
  private fb  = inject(FormBuilder);

  grades  = signal<GradeDto[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);
  saving  = signal(false);
  submitted = signal(false);
  modalError = signal<string | null>(null);

  showCreateModal = signal(false);
  showEditModal   = signal(false);
  showDeleteModal = signal(false);
  editTarget      = signal<GradeDto | null>(null);
  deleteTarget    = signal<GradeDto | null>(null);

  readonly stages: GradeStage[] = ['Primary', 'Preparatory', 'Secondary'];

  createForm = this.fb.group({
    name:   ['', Validators.required],
    nameAr: ['', Validators.required],
    stage:  ['' as GradeStage | '', Validators.required],
    order:  [null as number | null, [Validators.required, Validators.min(1), Validators.max(12)]],
  });

  editForm = this.fb.group({
    name:     ['', Validators.required],
    nameAr:   ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getGrades().subscribe({
      next:  g   => { this.grades.set(g); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed to load grades.'); this.loading.set(false); },
    });
  }

  gradesByStage(stage: GradeStage): GradeDto[] {
    return this.grades().filter(g => g.stage === stage).sort((a, b) => a.order - b.order);
  }

  stageLabel(stage: GradeStage): string {
    return { Primary: 'Primary (ابتدائي)', Preparatory: 'Preparatory (إعدادي)', Secondary: 'Secondary (ثانوي)' }[stage];
  }

  // ── Create ────────────────────────────────────────────────────────────────
  openCreateModal(): void {
    this.createForm.reset(); this.modalError.set(null); this.submitted.set(false);
    this.showCreateModal.set(true);
  }
  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    this.submitted.set(true);
    if (this.createForm.invalid) return;
    const { name, nameAr, stage, order } = this.createForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: CreateGradeRequest = { name: name!, nameAr: nameAr!, stage: stage as GradeStage, order: order! };
    this.svc.createGrade(req).subscribe({
      next: () => { this.saving.set(false); this.closeCreateModal(); this.load(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to create grade.'); },
    });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  openEditModal(g: GradeDto): void {
    this.editTarget.set(g);
    this.editForm.patchValue({ name: g.name, nameAr: g.nameAr, isActive: g.isActive });
    this.modalError.set(null);
    this.showEditModal.set(true);
  }
  closeEditModal(): void { this.showEditModal.set(false); }

  submitEdit(): void {
    if (this.editForm.invalid) return;
    const g = this.editTarget()!;
    const { name, nameAr, isActive } = this.editForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: UpdateGradeRequest = { name: name!, nameAr: nameAr!, isActive: !!isActive };
    this.svc.updateGrade(g.gradeId, req).subscribe({
      next: () => { this.saving.set(false); this.closeEditModal(); this.load(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to update grade.'); },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  openDeleteModal(g: GradeDto): void {
    this.deleteTarget.set(g); this.modalError.set(null); this.showDeleteModal.set(true);
  }
  closeDeleteModal(): void { this.showDeleteModal.set(false); }

  submitDelete(): void {
    const g = this.deleteTarget()!;
    this.saving.set(true); this.modalError.set(null);
    this.svc.deleteGrade(g.gradeId).subscribe({
      next: () => { this.saving.set(false); this.closeDeleteModal(); this.load(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to delete grade.'); },
    });
  }
}
