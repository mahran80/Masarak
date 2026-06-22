import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { AcademicService } from '../../../../../services/academic.service';
import { StudentEnrollmentDto } from '../../../../../models/academic.models';

@Component({
  selector: 'app-my-class',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container max-w-2xl">
      <!-- Header -->
      <div class="mb-8">
        <span class="badge bg-violet-100 text-violet-700 mb-2 inline-flex">Student Portal</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">My Class</h1>
        <p class="text-surface-500 mt-1">Your current enrollment information</p>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading enrollment…"></app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Not enrolled -->
      <div *ngIf="!loading() && !error() && !enrollment()"
           class="card p-12 text-center">
        <div class="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-5">
          <span class="text-4xl">🎓</span>
        </div>
        <h2 class="text-xl font-bold text-surface-900 mb-2">Not Yet Enrolled</h2>
        <p class="text-surface-500 text-sm max-w-sm mx-auto mb-6">
          You are not currently enrolled in any class. Please contact your school administrator to get enrolled.
        </p>
        <a [routerLink]="['/dashboard']" class="btn-secondary">Back to Dashboard</a>
      </div>

      <!-- Enrollment card -->
      <div *ngIf="!loading() && enrollment()" class="space-y-4">
        <!-- Main info card -->
        <div class="card p-8">
          <div class="flex items-center gap-5 mb-6">
            <div class="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {{ enrollment()!.className[0] }}
            </div>
            <div>
              <h2 class="text-2xl font-bold text-surface-900">{{ enrollment()!.className }}</h2>
              <p class="text-surface-500">{{ enrollment()!.gradeName }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-surface-50 rounded-xl p-4">
              <p class="text-xs text-surface-500 mb-1">Grade</p>
              <p class="font-semibold text-surface-900">{{ enrollment()!.gradeName }}</p>
            </div>
            <div class="bg-surface-50 rounded-xl p-4">
              <p class="text-xs text-surface-500 mb-1">Class</p>
              <p class="font-semibold text-surface-900">{{ enrollment()!.className }}</p>
            </div>
            <div class="bg-surface-50 rounded-xl p-4">
              <p class="text-xs text-surface-500 mb-1">Academic Year</p>
              <p class="font-semibold text-surface-900">{{ enrollment()!.academicYear }}</p>
            </div>
          </div>
        </div>

        <!-- Quick link to schedule -->
        <div class="card p-6 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-surface-900">Weekly Schedule</h3>
            <p class="text-sm text-surface-500">View your upcoming live sessions</p>
          </div>
          <a [routerLink]="['/student/schedule']" class="btn-primary">
            View Schedule →
          </a>
        </div>
      </div>
    </div>
  `,
})
export class MyClassComponent implements OnInit {
  private svc = inject(AcademicService);

  enrollment = signal<StudentEnrollmentDto | null>(null);
  loading    = signal(true);
  error      = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.svc.getMyClass().subscribe({
      next:  e   => { this.enrollment.set(e); this.loading.set(false); },
      error: err => {
        // 404 means not enrolled
        if (err?.status === 404) { this.enrollment.set(null); this.loading.set(false); }
        else { this.error.set(err?.error?.message ?? 'Failed to load enrollment.'); this.loading.set(false); }
      },
    });
  }
}
