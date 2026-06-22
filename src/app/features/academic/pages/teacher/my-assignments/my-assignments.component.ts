import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { SessionService } from '../../../../../services/session.service';
import { TeachingAssignmentDto } from '../../../../../models/academic.models';

@Component({
  selector: 'app-my-assignments',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8">
        <span class="badge bg-teal-100 text-teal-700 mb-2 inline-flex">Teacher Portal</span>
        <h1 class="text-3xl font-bold text-surface-900 font-display">My Assignments</h1>
        <p class="text-surface-500 mt-1">Classes and subjects you are assigned to teach</p>
      </div>

      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading assignments…"></app-loading-spinner>

      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <app-empty-state
        *ngIf="!loading() && !error() && assignments().length === 0"
        icon="📋" title="No assignments"
        description="You have no teaching assignments for the current academic year. Contact your administrator.">
      </app-empty-state>

      <!-- Cards grid -->
      <div *ngIf="!loading() && assignments().length > 0"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div *ngFor="let a of assignments()" class="card p-6 hover:shadow-md transition-shadow">
          <!-- Subject badge -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
              <span class="text-2xl">📚</span>
            </div>
            <span class="badge bg-surface-100 text-surface-600 text-xs">{{ a.academicYear }}</span>
          </div>

          <h3 class="text-lg font-bold text-surface-900 mb-1">{{ a.subjectName }}</h3>
          <p class="text-sm text-surface-500 mb-4">Class: <span class="font-medium text-surface-700">{{ a.className }}</span></p>

          <!-- Quick action -->
          <a
            [routerLink]="['/teacher/sessions/new']"
            [queryParams]="{ assignmentId: a.id }"
            class="btn-primary w-full text-center text-sm"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Schedule Session
          </a>
        </div>
      </div>

      <!-- Sessions shortcut -->
      <div *ngIf="!loading() && assignments().length > 0" class="mt-8 flex justify-center">
        <a [routerLink]="['/teacher/sessions']" class="btn-secondary">
          View All My Sessions →
        </a>
      </div>
    </div>
  `,
})
export class MyAssignmentsComponent implements OnInit {
  private svc = inject(SessionService);

  assignments = signal<TeachingAssignmentDto[]>([]);
  loading     = signal(true);
  error       = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.svc.getMyAssignments().subscribe({
      next:  a   => { this.assignments.set(a); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Failed to load assignments.'); this.loading.set(false); },
    });
  }
}
