import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AcademicService } from '../../../../../services/academic.service';
import {
  GradeDto, ClassDto, StudentInClassDto,
  CreateClassRequest, UpdateClassRequest
} from '../../../../../models/academic.models';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
          <h1 class="text-3xl font-bold text-surface-900 font-display">Class Management</h1>
          <p class="text-surface-500 mt-1">Manage classes and view student rosters</p>
        </div>
        <button (click)="openCreateModal()" [disabled]="!selectedGradeId()" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Class
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

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading classes…"></app-loading-spinner>

      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="loadClasses()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <div *ngIf="!selectedGradeId() && !loading()" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">🏫</span>
        <p class="text-surface-500 text-sm">Select a grade to view its classes.</p>
      </div>

      <app-empty-state
        *ngIf="selectedGradeId() && !loading() && !error() && classes().length === 0"
        icon="🏫" title="No classes yet"
        description="Create classes for the selected grade.">
        <button (click)="openCreateModal()" class="btn-primary mt-4">Add Class</button>
      </app-empty-state>

      <!-- Classes grid -->
      <div *ngIf="selectedGradeId() && !loading() && classes().length > 0"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let c of classes()" class="card p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="text-lg font-bold text-surface-900">{{ c.name }}</h3>
              <p class="text-sm text-surface-500">{{ c.gradeName }} · {{ c.academicYear }}</p>
            </div>
            <span [class]="c.isActive ? 'badge-active' : 'badge-cancelled'">
              {{ c.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Capacity bar -->
          <div class="mb-3">
            <div class="flex justify-between text-xs text-surface-500 mb-1">
              <span>Enrollment</span>
              <span>{{ c.enrollmentCount }} / {{ c.maxCapacity }}</span>
            </div>
            <div class="w-full bg-surface-100 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                [class]="capacityClass(c)"
                [style.width.%]="capacityPct(c)"
              ></div>
            </div>
          </div>

          <div class="flex gap-2">
            <button (click)="openRosterModal(c)" class="btn-secondary btn-sm flex-1">
              👥 Roster
            </button>
            <button (click)="openEditModal(c)" class="btn-secondary btn-sm">Edit</button>
            <button (click)="openDeleteModal(c)" class="btn-danger btn-sm">Del</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Create Modal ── -->
    <div *ngIf="showCreateModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeCreateModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Add Class</h2>
        <p class="text-sm text-surface-500 mb-6">New class for <strong>{{ selectedGradeName() }}</strong>.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Class Name <span class="text-danger">*</span></label>
            <input type="text" formControlName="name" placeholder="e.g. 5A" class="form-input"/>
            <span *ngIf="createForm.get('name')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div>
            <label class="form-label">Max Capacity <span class="text-danger">*</span></label>
            <input type="number" formControlName="maxCapacity" placeholder="30" min="1" class="form-input"/>
            <span *ngIf="createForm.get('maxCapacity')?.invalid && submitted()" class="form-error">Enter a valid capacity</span>
          </div>
          <div>
            <label class="form-label">Academic Year <span class="text-danger">*</span></label>
            <input type="number" formControlName="academicYear" [placeholder]="currentYear" class="form-input"/>
            <span *ngIf="createForm.get('academicYear')?.invalid && submitted()" class="form-error">Required</span>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeCreateModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">{{ saving() ? 'Saving…' : 'Create Class' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Edit Modal ── -->
    <div *ngIf="showEditModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeEditModal()">
      <div class="card p-8 max-w-md w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-1">Edit Class</h2>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <form [formGroup]="editForm" (ngSubmit)="submitEdit()" novalidate class="space-y-4">
          <div>
            <label class="form-label">Name</label>
            <input type="text" formControlName="name" class="form-input"/>
          </div>
          <div>
            <label class="form-label">Max Capacity</label>
            <input type="number" formControlName="maxCapacity" min="1" class="form-input"/>
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" formControlName="isActive" id="clsActive" class="w-4 h-4 text-brand-600 rounded"/>
            <label for="clsActive" class="text-sm text-surface-700">Active</label>
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
        <h2 class="text-xl font-bold text-surface-900 font-display mb-2">Delete Class</h2>
        <p class="text-sm text-surface-500 mb-6">Delete class <strong>{{ deleteTarget()?.name }}</strong>? This cannot be undone.</p>
        <div *ngIf="modalError()" class="alert-error mb-4 text-sm">{{ modalError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeDeleteModal()" class="btn-secondary flex-1">Cancel</button>
          <button (click)="submitDelete()" [disabled]="saving()" class="btn-danger flex-1">{{ saving() ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>

    <!-- ── Roster Modal ── -->
    <div *ngIf="showRosterModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeRosterModal()">
      <div class="card p-6 max-w-lg w-full shadow-modal max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-surface-900 font-display">
            {{ rosterTarget()?.name }} — Roster
          </h2>
          <button (click)="closeRosterModal()" class="btn-ghost btn-sm">✕</button>
        </div>
        <p class="text-sm text-surface-500 mb-4">{{ rosterTarget()?.enrollmentCount }} enrolled students</p>

        <app-loading-spinner *ngIf="rosterLoading()" size="md" label="Loading roster…"></app-loading-spinner>

        <div *ngIf="!rosterLoading()" class="overflow-y-auto flex-1">
          <div *ngIf="roster().length === 0" class="text-center py-8 text-surface-400">No students enrolled.</div>
          <div *ngFor="let s of roster()" class="flex items-center gap-3 p-3 hover:bg-surface-50 rounded-lg">
            <div class="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
              {{ s.fullName[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-surface-900 truncate">{{ s.fullName }}</p>
              <p class="text-xs text-surface-500 truncate">{{ s.email }}</p>
            </div>
            <span class="text-xs text-surface-400">ID: {{ s.studentUserId }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ClassManagementComponent implements OnInit {
  private svc = inject(AcademicService);
  private fb  = inject(FormBuilder);

  grades          = signal<GradeDto[]>([]);
  classes         = signal<ClassDto[]>([]);
  roster          = signal<StudentInClassDto[]>([]);
  selectedGradeId = signal<number | null>(null);
  loading         = signal(false);
  rosterLoading   = signal(false);
  error           = signal<string | null>(null);
  saving          = signal(false);
  submitted       = signal(false);
  modalError      = signal<string | null>(null);

  showCreateModal = signal(false);
  showEditModal   = signal(false);
  showDeleteModal = signal(false);
  showRosterModal = signal(false);
  editTarget      = signal<ClassDto | null>(null);
  deleteTarget    = signal<ClassDto | null>(null);
  rosterTarget    = signal<ClassDto | null>(null);

  readonly currentYear = new Date().getFullYear();

  createForm = this.fb.group({
    name:         ['', Validators.required],
    maxCapacity:  [null as number | null, [Validators.required, Validators.min(1)]],
    academicYear: [this.currentYear, Validators.required],
  });

  editForm = this.fb.group({
    name:        ['', Validators.required],
    maxCapacity: [null as number | null, [Validators.required, Validators.min(1)]],
    isActive:    [true],
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
    if (this.selectedGradeId()) this.loadClasses();
    else this.classes.set([]);
  }

  loadClasses(): void {
    const id = this.selectedGradeId();
    if (!id) return;
    this.loading.set(true); this.error.set(null);
    this.svc.getClassesByGrade(id).subscribe({
      next:  c   => { this.classes.set(c); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed to load classes.'); this.loading.set(false); },
    });
  }

  capacityPct(c: ClassDto): number {
    return c.maxCapacity > 0 ? Math.min(100, (c.enrollmentCount / c.maxCapacity) * 100) : 0;
  }

  capacityClass(c: ClassDto): string {
    const pct = this.capacityPct(c);
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  openCreateModal(): void { this.createForm.reset({ academicYear: this.currentYear }); this.modalError.set(null); this.submitted.set(false); this.showCreateModal.set(true); }
  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    this.submitted.set(true);
    if (this.createForm.invalid) return;
    const { name, maxCapacity, academicYear } = this.createForm.value;
    this.saving.set(true); this.modalError.set(null);
    const req: CreateClassRequest = { gradeId: this.selectedGradeId()!, name: name!, maxCapacity: maxCapacity!, academicYear: academicYear! };
    this.svc.createClass(req).subscribe({
      next: () => { this.saving.set(false); this.closeCreateModal(); this.loadClasses(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to create class.'); },
    });
  }

  openEditModal(c: ClassDto): void {
    this.editTarget.set(c);
    this.editForm.patchValue({ name: c.name, maxCapacity: c.maxCapacity, isActive: c.isActive });
    this.modalError.set(null); this.showEditModal.set(true);
  }
  closeEditModal(): void { this.showEditModal.set(false); }

  submitEdit(): void {
    if (this.editForm.invalid) return;
    const c = this.editTarget()!;
    const { name, maxCapacity, isActive } = this.editForm.value;
    this.saving.set(true); this.modalError.set(null);
    this.svc.updateClass(c.classId, { name: name!, maxCapacity: maxCapacity!, isActive: !!isActive }).subscribe({
      next: () => { this.saving.set(false); this.closeEditModal(); this.loadClasses(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to update.'); },
    });
  }

  openDeleteModal(c: ClassDto): void { this.deleteTarget.set(c); this.modalError.set(null); this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); }

  submitDelete(): void {
    const c = this.deleteTarget()!;
    this.saving.set(true); this.modalError.set(null);
    this.svc.deleteClass(c.classId).subscribe({
      next: () => { this.saving.set(false); this.closeDeleteModal(); this.loadClasses(); },
      error: err => { this.saving.set(false); this.modalError.set(err?.error?.message ?? 'Failed to delete.'); },
    });
  }

  openRosterModal(c: ClassDto): void {
    this.rosterTarget.set(c); this.rosterLoading.set(true); this.roster.set([]); this.showRosterModal.set(true);
    this.svc.getClassRoster(c.classId).subscribe({
      next:  r => { this.roster.set(r); this.rosterLoading.set(false); },
      error: () => this.rosterLoading.set(false),
    });
  }
  closeRosterModal(): void { this.showRosterModal.set(false); }
}
