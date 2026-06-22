import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AcademicService } from '../../../../../services/academic.service';
import {
  GradeDto, SubjectDto,
  CreateSubjectRequest, UpdateSubjectRequest
} from '../../../../../models/academic.models';

@Component({
  selector: 'app-subject-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Subject Management</h1>
          <p class="text-surface-500 mt-1">Manage subjects per grade</p>
        </div>
        <button (click)="openCreateModal()" [disabled]="!selectedGradeId()" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Subject
        </button>
      </div>

      <!-- Grade selector -->
      <div class="card p-4 mb-6">
        <label class="form-label">Select Grade</label>
        <select class="form-select" (change)="onGradeChange($event)">
          <option value="">-- Select a grade --</option>
          <option *ngFor="let g of grades()" [value]="g.gradeId">{{ g.name }} — {{ g.nameAr }}</option>
        </select>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading subjects…"></app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="loadSubjects()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Prompt to select grade -->
      <div *ngIf="!selectedGradeId() && !loading()" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">📚</span>
        <p class="text-surface-500 text-sm">Select a grade above to view its subjects.</p>
      </div>

      <!-- Empty -->
      <app-empty-state
        *ngIf="selectedGradeId() && !loading() && !error() && subjects().length === 0"
        icon="📖" title="No subjects yet"
        description="Add subjects for the selected grade.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Add Subject</button>
      </app-empty-state>

      <!-- Table -->
      <div *ngIf="selectedGradeId() && !loading() && subjects().length > 0" class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200 bg-surface-50">
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Name</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden sm:table-cell">Arabic Name</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden md:table-cell">Code</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden md:table-cell">Status</th>
                <th class="text-right px-4 py-3 font-semibold text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr *ngFor="let s of subjects()" class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3 font-medium text-surface-900">{{ s.name }}</td>
                <td class="px-4 py-3 text-surface-700 hidden sm:table-cell" dir="rtl">{{ s.nameAr }}</td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="badge-brand">{{ s.code }}</span>
                </td>
                <td class="px-4 py-3 hidden md:table-cell">
                  <span [class]="s.isActive ? 'badge-active' : 'badge-cancelled'">
                    {{ s.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="openEditModal(s)" class="btn-secondary btn-sm">Edit</button>
                    <button (click)="openDeleteModal(s)" class="btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Create Modal ── -->
    <div *ngIf="showCreateModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCreateModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Add Subject</h2>
        <p class="text-sm text-surface-500 mb-6">New subject for <strong>{{ selectedGradeName() }}</strong>.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Name (English) <span class="text-danger">*</span></label>
            <input type="text" formControlName="name" placeholder="e.g. Mathematics" class="form-input"/>
            <span *ngIf="createForm.get('name')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Name (Arabic) <span class="text-danger">*</span></label>
            <input type="text" formControlName="nameAr" placeholder="الرياضيات" class="form-input" dir="rtl"/>
            <span *ngIf="createForm.get('nameAr')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Code <span class="text-danger">*</span></label>
            <input type="text" formControlName="code" placeholder="e.g. MATH-G5" class="form-input"/>
            <span *ngIf="createForm.get('code')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeCreateModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">
              {{ saving() ? 'Saving…' : 'Create Subject' }}
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
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Edit Subject</h2>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <form [formGroup]="editForm" (ngSubmit)="submitEdit()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Name (English)</label>
            <input type="text" formControlName="name" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Name (Arabic)</label>
            <input type="text" formControlName="nameAr" class="form-input" dir="rtl"/>
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" formControlName="isActive" id="subActive" class="w-4 h-4 text-brand-600 rounded"/>
            <label for="subActive" class="text-sm text-surface-700">Active</label>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeEditModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Delete Modal ── -->
    <div *ngIf="showDeleteModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeDeleteModal()">
      <div class="card p-8 max-w-sm w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-2">Delete Subject</h2>
        <p class="text-sm text-surface-500 mb-1">Delete <strong>{{ deleteTarget()?.name }}</strong>?</p>
        <p class="text-xs text-surface-400 mb-6">This cannot be undone.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeDeleteModal()" class="btn-secondary flex-1">Cancel</button>
          <button (click)="submitDelete()" [disabled]="saving()" class="btn-danger flex-1">{{ saving() ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class SubjectManagementComponent implements OnInit {
  private svc = inject(AcademicService);
  private fb  = inject(FormBuilder);

  grades         = signal<GradeDto[]>([]);
  subjects       = signal<SubjectDto[]>([]);
  selectedGradeId = signal<number | null>(null);
  loading        = signal(false);
  error          = signal<string | null>(null);
  saving         = signal(false);
  submitted      = signal(false);
  modalError     = signal<string | null>(null);

  showCreateModal = signal(false);
  showEditModal   = signal(false);
  showDeleteModal = signal(false);
  editTarget      = signal<SubjectDto | null>(null);
  deleteTarget    = signal<SubjectDto | null>(null);

  createForm = this.fb.group({
    name:   ['', Validators.required],
    nameAr: ['', Validators.required],
    code:   ['', Validators.required],
  });

  editForm = this.fb.group({
    name:     ['', Validators.required],
    nameAr:   ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.svc.getGrades().subscribe({ next: g => this.grades.set(g) });
  }

  selectedGradeName(): string {
    return this.grades().find(g => g.gradeId === this.selectedGradeId())?.name ?? '';
  }

  onGradeChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.selectedGradeId.set(v ? Number(v) : null);
    if (this.selectedGradeId()) this.loadSubjects();
    else this.subjects.set([]);
  }

  loadSubjects(): void {
    const id = this.selectedGradeId();
    if (!id) return;
    this.loading.set(true); this.error.set(null);
    this.svc.getSubjectsByGrade(id).subscribe({
      next:  s   => { this.subjects.set(s); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed to load subjects.'); this.loading.set(false); },
    });
  }

  openCreateModal(): void { this.createForm.reset(); this.modalError.set(null); this.submitted.set(false); this.showCreateModal.set(true); }
  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    this.submitted.set(true);
    if (this.createForm.invalid) return;
    const { name, nameAr, code } = this.createForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: CreateSubjectRequest = { gradeId: this.selectedGradeId()!, name: name!, nameAr: nameAr!, code: code! };
    this.svc.createSubject(req).subscribe({
      next: () => { this.saving.set(false); this.closeCreateModal(); this.loadSubjects(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to create subject.'); },
    });
  }

  openEditModal(s: SubjectDto): void {
    this.editTarget.set(s);
    this.editForm.patchValue({ name: s.name, nameAr: s.nameAr, isActive: s.isActive });
    this.modalError.set(null); this.showEditModal.set(true);
  }
  closeEditModal(): void { this.showEditModal.set(false); }

  submitEdit(): void {
    if (this.editForm.invalid) return;
    const s = this.editTarget()!;
    const { name, nameAr, isActive } = this.editForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: UpdateSubjectRequest = { name: name!, nameAr: nameAr!, isActive: !!isActive };
    this.svc.updateSubject(s.subjectId, req).subscribe({
      next: () => { this.saving.set(false); this.closeEditModal(); this.loadSubjects(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to update subject.'); },
    });
  }

  openDeleteModal(s: SubjectDto): void { this.deleteTarget.set(s); this.modalError.set(null); this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); }

  submitDelete(): void {
    const s = this.deleteTarget()!;
    this.saving.set(true); this.modalError.set(null);
    this.svc.deleteSubject(s.subjectId).subscribe({
      next: () => { this.saving.set(false); this.closeDeleteModal(); this.loadSubjects(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to delete subject.'); },
    });
  }
}
