import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { SessionService } from '../../../../../services/session.service';
import { TeachingAssignmentDto, CreateSessionRequest } from '../../../../../models/academic.models';

@Component({
  selector: 'app-session-scheduler',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container max-w-2xl">
      <!-- Header -->
      <div class="mb-8">
        <span class="badge bg-teal-100 text-teal-700 mb-2 inline-flex">Teacher Portal</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">Schedule a Session</h1>
        <p class="text-surface-500 mt-1">Create a new live class session for your students</p>
      </div>

      <app-loading-spinner *ngIf="loadingAssignments()" size="md" label="Loading your assignments…"></app-loading-spinner>

      <div *ngIf="!loadingAssignments()" class="card p-8">
        <!-- Conflict error -->
        <div *ngIf="conflictError()" class="alert-warning mb-6">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="font-semibold">Schedule Conflict Detected</p>
            <p class="text-sm mt-0.5">{{ conflictError() }}</p>
          </div>
        </div>

        <!-- Generic error -->
        <div *ngIf="submitError() && !conflictError()" class="alert-error mb-6">{{ submitError() }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-6">
          <!-- Assignment -->
          <div>
            <label class="form-label">Teaching Assignment <span class="text-danger">*</span></label>
            <select formControlName="teachingAssignmentId" class="form-select">
              <option value="" disabled>Select your assignment…</option>
              <option *ngFor="let a of assignments()" [value]="a.id">
                {{ a.subjectName }} — {{ a.className }} ({{ a.academicYear }})
              </option>
            </select>
            <span *ngIf="form.get('teachingAssignmentId')?.invalid && submitted()" class="form-error">Required</span>
          </div>

          <!-- Title -->
          <div>
            <label class="form-label">Session Title <span class="text-danger">*</span></label>
            <input type="text" formControlName="title" placeholder="e.g. Chapter 3 — Algebra Review" class="form-input"/>
            <span *ngIf="form.get('title')?.invalid && submitted()" class="form-error">Required</span>
          </div>

          <!-- Description -->
          <div>
            <label class="form-label">Description <span class="text-surface-400 font-normal">(optional)</span></label>
            <textarea formControlName="description" rows="3"
              placeholder="What will be covered in this session…"
              class="form-input resize-none"></textarea>
          </div>

          <!-- Date/Time + Duration -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Date & Time <span class="text-danger">*</span></label>
              <input type="datetime-local" formControlName="scheduledAt" class="form-input"/>
              <span *ngIf="form.get('scheduledAt')?.invalid && submitted()" class="form-error">Required</span>
            </div>
            <div>
              <label class="form-label">Duration (minutes) <span class="text-danger">*</span></label>
              <select formControlName="durationMinutes" class="form-select">
                <option [value]="30">30 min</option>
                <option [value]="45">45 min</option>
                <option [value]="60">60 min (1 hour)</option>
                <option [value]="90">90 min (1.5 hours)</option>
                <option [value]="120">120 min (2 hours)</option>
              </select>
            </div>
          </div>

          <!-- Embed URL -->
          <div>
            <label class="form-label">Join Link <span class="text-surface-400 font-normal">(Zoom / Teams / Meet URL)</span></label>
            <input type="url" formControlName="embedUrl" placeholder="https://zoom.us/j/..." class="form-input"/>
            <p class="form-hint">Students will see this link to join the live class. Leave blank if not ready yet.</p>
          </div>

          <!-- Preview card -->
          <div *ngIf="selectedAssignment()" class="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p class="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">Session Preview</p>
            <p class="font-semibold text-surface-900">{{ form.get('title')?.value || 'Untitled Session' }}</p>
            <p class="text-sm text-surface-600 mt-1">
              {{ selectedAssignment()?.subjectName }} · {{ selectedAssignment()?.className }}
            </p>
            <p class="text-sm text-surface-500 mt-1" *ngIf="form.get('scheduledAt')?.value">
              🕐 {{ form.get('scheduledAt')?.value | date:'medium' }} · {{ form.get('durationMinutes')?.value }} min
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="goBack()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1">
              <svg *ngIf="saving()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ saving() ? 'Scheduling…' : 'Schedule Session' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SessionSchedulerComponent implements OnInit {
  private svc    = inject(SessionService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  assignments       = signal<TeachingAssignmentDto[]>([]);
  loadingAssignments = signal(true);
  saving            = signal(false);
  submitted         = signal(false);
  submitError       = signal<string | null>(null);
  conflictError     = signal<string | null>(null);

  form = this.fb.group({
    teachingAssignmentId: [null as number | null, Validators.required],
    title:                ['', Validators.required],
    description:          [''],
    scheduledAt:          ['', Validators.required],
    durationMinutes:      [60, Validators.required],
    embedUrl:             [''],
  });

  selectedAssignment = computed(() => {
    const id = this.form.get('teachingAssignmentId')?.value;
    return this.assignments().find(a => a.id === Number(id)) ?? null;
  });

  ngOnInit(): void {
    this.svc.getMyAssignments().subscribe({
      next: a => {
        this.assignments.set(a);
        this.loadingAssignments.set(false);
        // Pre-select if navigated from my-assignments with ?assignmentId=
        const qId = this.route.snapshot.queryParamMap.get('assignmentId');
        if (qId) {
          this.form.patchValue({ teachingAssignmentId: Number(qId) });
        }
      },
      error: () => this.loadingAssignments.set(false),
    });
  }

  goBack(): void { this.router.navigate(['/teacher/assignments']); }

  submit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.conflictError.set(null);
    if (this.form.invalid) return;

    const { teachingAssignmentId, title, description, scheduledAt, durationMinutes, embedUrl } = this.form.value;

    // Convert local datetime-local to ISO string
    const isoDate = new Date(scheduledAt!).toISOString();

    const req: CreateSessionRequest = {
      teachingAssignmentId: teachingAssignmentId!,
      title: title!,
      description: description || undefined,
      scheduledAt: isoDate,
      durationMinutes: durationMinutes!,
      embedUrl: embedUrl || undefined,
    };

    this.saving.set(true);
    this.svc.createSession(req).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/teacher/sessions']);
      },
      error: err => {
        this.saving.set(false);
        const status = err?.status;
        const msg = err?.error?.message ?? 'Failed to schedule session.';
        if (status === 409) {
          this.conflictError.set(msg);
        } else {
          this.submitError.set(msg);
        }
      },
    });
  }
}
