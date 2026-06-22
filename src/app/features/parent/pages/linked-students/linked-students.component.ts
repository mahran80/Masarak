import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ParentApiService } from '../../../../services/parent.service';
import { LinkedStudentDto, PagedResult } from '../../../../models/subscription.models';

@Component({
  selector: 'app-linked-students',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-surface-900 font-display">My Students</h1>
          <p class="text-surface-500 mt-1">Students linked to your parent account</p>
        </div>
        <a routerLink="/parent/link-student" class="btn-primary self-start sm:self-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Link Student
        </a>
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="loading()" size="lg" [fullPage]="true" label="Loading students…">
      </app-loading-spinner>

      <!-- Error -->
      <div *ngIf="error() && !loading()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
        <button (click)="load()" class="ml-auto underline text-xs">Retry</button>
      </div>

      <!-- Empty -->
      <app-empty-state
        *ngIf="!loading() && !error() && students().length === 0"
        icon="👨‍👧‍👦"
        title="No students linked"
        description="Link your child's account to monitor their subscription and activity.">
        <a routerLink="/parent/link-student" class="btn-primary mt-6">Link a Student</a>
      </app-empty-state>

      <!-- Students grid -->
      <div *ngIf="!loading() && students().length > 0"
           class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div *ngFor="let s of students()" class="card-hover p-5">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span class="text-brand-700 font-bold text-sm">{{ s.fullName[0].toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-surface-900 truncate">{{ s.fullName }}</p>
              <p class="text-xs text-surface-500 truncate">{{ s.email }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-surface-100 flex items-center justify-between">
            <span class="text-xs text-surface-500">Subscription</span>
            <span [class]="s.hasActiveSubscription ? 'badge-active' : 'badge-expired'">
              {{ s.hasActiveSubscription ? 'Active' : 'No plan' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="result() && result()!.totalPages > 1"
           class="flex items-center justify-between">
        <p class="text-sm text-surface-500">
          Showing {{ result()!.items.length }} of {{ result()!.totalCount }} students
        </p>
        <div class="flex gap-2">
          <button
            (click)="prevPage()"
            [disabled]="!result()!.hasPrevious || loading()"
            class="btn-secondary btn-sm">
            ← Previous
          </button>
          <span class="px-3 py-1.5 text-sm text-surface-600 self-center">
            {{ result()!.pageNumber }} / {{ result()!.totalPages }}
          </span>
          <button
            (click)="nextPage()"
            [disabled]="!result()!.hasNext || loading()"
            class="btn-secondary btn-sm">
            Next →
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LinkedStudentsComponent implements OnInit {
  private parentApi = inject(ParentApiService);

  result   = signal<PagedResult<LinkedStudentDto> | null>(null);
  students = computed(() => this.result()?.items ?? []);
  loading  = signal(true);
  error    = signal<string | null>(null);

  page     = signal(1);
  pageSize = 12;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.parentApi.getLinkedStudents(this.page(), this.pageSize).subscribe({
      next:  r   => { this.result.set(r); this.loading.set(false); },
      error: err => {
        this.error.set(err?.error?.message ?? 'Failed to load students.');
        this.loading.set(false);
      },
    });
  }

  prevPage(): void { this.page.update(p => p - 1); this.load(); }
  nextPage(): void { this.page.update(p => p + 1); this.load(); }
}
