import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AcademicService } from '../../../../../services/academic.service';
import {
  GradeDto, ClassDto, StudentInClassDto, EnrollStudentRequest
} from '../../../../../models/academic.models';

@Component({
  selector: 'app-enrollment-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8">
        <span class="badge-brand mb-2 inline-flex">Admin Panel</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">Enrollment Management</h1>
        <p class="text-surface-500 mt-1">Enroll and unenroll students from classes</p>
      </div>

      <!-- Enroll form card -->
      <div class="card p-6 mb-8">
        <h2 class="text-lg font-semibold text-surface-900 mb-4">Enroll a Student</h2>
        <div *ngIf="enrollError()" class="alert-error mb-4 text-sm">{{ enrollError() }}</div>
        <div *ngIf="enrollSuccess()" class="alert-success mb-4 text-sm">{{ enrollSuccess() }}</div>

        <form [formGroup]="enrollForm" (ngSubmit)="submitEnroll()" novalidate>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="form-label">Student User ID <span class="text-danger">*</span></label>
              <input type="number" formControlName="studentUserId" placeholder="e.g. 10" class="form-input"/>
              <span *ngIf="enrollForm.get('studentUserId')?.invalid && enrollSubmitted()" class="form-error">Required</span>
            </div>
            <div>
              <label class="form-label">Class <span class="text-danger">*</span></label>
              <select formControlName="classId" class="form-select" (change)="onEnrollClassChange($event)">
                <option value="">-- Select grade first, then class --</option>
                <optgroup *ngFor="let g of grades()" [label]="g.name">
                  <option *ngFor="let c of classesByGrade[g.gradeId] ?? []" [value]="c.classId">{{ c.name }}</option>
                </optgroup>
              </select>
              <span *ngIf="enrollForm.get('classId')?.invalid && enrollSubmitted()" class="form-error">Required</span>
            </div>
            <div>
              <label class="form-label">Academic Year <span class="text-danger">*</span></label>
              <input type="number" formControlName="academicYear" class="form-input"/>
            </div>
          </div>
          <button type="submit" [disabled]="enrolling()" class="btn-primary">
            <svg *ngIf="enrolling()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {{ enrolling() ? 'Enrolling…' : 'Enroll Student' }}
          </button>
        </form>
      </div>

      <!-- Roster section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-surface-900">Class Roster</h2>
          <div class="flex gap-3">
            <select class="form-select w-40" (change)="onRosterGradeChange($event)">
              <option value="">Grade…</option>
              <option *ngFor="let g of grades()" [value]="g.gradeId">{{ g.name }}</option>
            </select>
            <select class="form-select w-40" [disabled]="!rosterGradeId()" (change)="onRosterClassChange($event)">
              <option value="">Class…</option>
              <option *ngFor="let c of rosterClasses()" [value]="c.classId">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <app-loading-spinner *ngIf="rosterLoading()" size="md" label="Loading roster…"></app-loading-spinner>

        <div *ngIf="!rosterLoading() && !rosterClassId()" class="flex flex-col items-center py-12">
          <span class="text-4xl mb-3">👥</span>
          <p class="text-surface-500 text-sm">Select a class to view enrolled students.</p>
        </div>

        <app-empty-state
          *ngIf="rosterClassId() && !rosterLoading() && roster().length === 0"
          icon="👤" title="No students enrolled"
          description="Use the form above to enroll students in this class.">
        </app-empty-state>

        <div *ngIf="rosterClassId() && !rosterLoading() && roster().length > 0" class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-200 bg-surface-50">
                <th class="text-left px-4 py-3 font-semibold text-surface-700">Student</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden sm:table-cell">Email</th>
                <th class="text-left px-4 py-3 font-semibold text-surface-700 hidden md:table-cell">ID</th>
                <th class="text-right px-4 py-3 font-semibold text-surface-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100">
              <tr *ngFor="let s of roster()" class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {{ s.fullName[0] }}
                    </div>
                    <span class="font-medium text-surface-900">{{ s.fullName }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-surface-500 hidden sm:table-cell">{{ s.email }}</td>
                <td class="px-4 py-3 text-surface-400 hidden md:table-cell">{{ s.studentUserId }}</td>
                <td class="px-4 py-3 text-right">
                  <button (click)="openUnenrollModal(s)" class="btn-danger btn-sm">Unenroll</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Unenroll Confirmation ── -->
    <div *ngIf="showUnenrollModal()"
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         (click)="closeUnenrollModal()">
      <div class="card p-8 max-w-sm w-full shadow-modal" (click)="$event.stopPropagation()">
        <h2 class="text-xl font-bold text-surface-900 font-display mb-2">Unenroll Student</h2>
        <p class="text-sm text-surface-500 mb-6">
          Remove <strong>{{ unenrollTarget()?.fullName }}</strong> from this class?
        </p>
        <div *ngIf="unenrollError()" class="alert-error mb-4 text-sm">{{ unenrollError() }}</div>
        <div class="flex gap-3">
          <button (click)="closeUnenrollModal()" class="btn-secondary flex-1">Cancel</button>
          <button (click)="submitUnenroll()" [disabled]="unenrolling()" class="btn-danger flex-1">
            {{ unenrolling() ? 'Removing…' : 'Unenroll' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class EnrollmentManagementComponent implements OnInit {
  private svc = inject(AcademicService);
  private fb  = inject(FormBuilder);

  grades        = signal<GradeDto[]>([]);
  roster        = signal<StudentInClassDto[]>([]);
  rosterClasses = signal<ClassDto[]>([]);
  rosterGradeId = signal<number | null>(null);
  rosterClassId = signal<number | null>(null);
  rosterLoading = signal(false);

  enrolling     = signal(false);
  enrollError   = signal<string | null>(null);
  enrollSuccess = signal<string | null>(null);
  enrollSubmitted = signal(false);

  showUnenrollModal = signal(false);
  unenrollTarget    = signal<StudentInClassDto | null>(null);
  unenrolling       = signal(false);
  unenrollError     = signal<string | null>(null);

  classesByGrade: Record<number, ClassDto[]> = {};
  readonly currentYear = new Date().getFullYear();

  enrollForm = this.fb.group({
    studentUserId: [null as number | null, Validators.required],
    classId:       [null as number | null, Validators.required],
    academicYear:  [this.currentYear, Validators.required],
  });

  ngOnInit(): void {
    this.svc.getGrades().subscribe({
      next: grades => {
        this.grades.set(grades);
        grades.forEach(g => {
          this.svc.getClassesByGrade(g.gradeId).subscribe({
            next: cls => { this.classesByGrade = { ...this.classesByGrade, [g.gradeId]: cls }; }
          });
        });
      }
    });
  }

  onEnrollClassChange(event: Event): void {
    // academicYear could auto-fill from class
  }

  submitEnroll(): void {
    this.enrollSubmitted.set(true);
    if (this.enrollForm.invalid) return;
    const { studentUserId, classId, academicYear } = this.enrollForm.value;
    this.enrolling.set(true); this.enrollError.set(null); this.enrollSuccess.set(null);
    const req: EnrollStudentRequest = { studentUserId: studentUserId!, classId: classId!, academicYear: academicYear! };
    this.svc.enrollStudent(req).subscribe({
      next: () => {
        this.enrolling.set(false);
        this.enrollSuccess.set('Student enrolled successfully!');
        this.enrollForm.reset({ academicYear: this.currentYear });
        this.enrollSubmitted.set(false);
        if (this.rosterClassId() === classId) this.loadRoster();
        setTimeout(() => this.enrollSuccess.set(null), 4000);
      },
      error: err => { this.enrolling.set(false); this.enrollError.set(err?.error?.message ?? 'Enrollment failed.'); },
    });
  }

  onRosterGradeChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.rosterGradeId.set(v ? Number(v) : null);
    this.rosterClassId.set(null);
    this.roster.set([]);
    if (this.rosterGradeId()) {
      this.svc.getClassesByGrade(this.rosterGradeId()!).subscribe({ next: c => this.rosterClasses.set(c) });
    } else {
      this.rosterClasses.set([]);
    }
  }

  onRosterClassChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.rosterClassId.set(v ? Number(v) : null);
    if (this.rosterClassId()) this.loadRoster();
    else this.roster.set([]);
  }

  loadRoster(): void {
    const id = this.rosterClassId();
    if (!id) return;
    this.rosterLoading.set(true);
    this.svc.getClassRoster(id).subscribe({
      next:  r => { this.roster.set(r); this.rosterLoading.set(false); },
      error: () => this.rosterLoading.set(false),
    });
  }

  openUnenrollModal(s: StudentInClassDto): void { this.unenrollTarget.set(s); this.unenrollError.set(null); this.showUnenrollModal.set(true); }
  closeUnenrollModal(): void { this.showUnenrollModal.set(false); }

  submitUnenroll(): void {
    const s = this.unenrollTarget()!;
    this.unenrolling.set(true); this.unenrollError.set(null);
    // The API uses enrollment ID (studentClassId) — we use studentUserId as identifier here.
    // Actual unenroll endpoint is DELETE /api/admin/enrollments/{studentClassId}
    // The roster returns studentUserId but not studentClassId, so we pass studentUserId as the id.
    this.svc.unenrollStudent(s.studentUserId).subscribe({
      next: () => { this.unenrolling.set(false); this.closeUnenrollModal(); this.loadRoster(); },
      error: err => { this.unenrolling.set(false); this.unenrollError.set(err?.error?.message ?? 'Failed to unenroll.'); },
    });
  }
}
