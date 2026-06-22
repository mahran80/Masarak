import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ParentApiService } from '../../../../services/parent.service';

@Component({
  selector: 'app-link-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container max-w-lg">
      <a routerLink="/parent/linked-students"
         class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to My Students
      </a>

      <div class="card p-8">
        <div class="mb-8">
          <div class="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-surface-900 font-display">Link a Student</h1>
          <p class="text-surface-500 mt-1 text-sm">
            Enter the linkage code from your student's subscription page to connect their account.
          </p>
        </div>

        <!-- Success -->
        <div *ngIf="success()" class="alert-success mb-6">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            <p class="font-medium">Student linked successfully!</p>
            <p class="text-xs mt-0.5">{{ success() }}</p>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="alert-error mb-6">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error() }}
        </div>

        <form *ngIf="!success()" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="form-label">Student Linkage Code</label>
          <input
            type="text"
            formControlName="code"
            placeholder="e.g. AB12CD34"
            [class]="form.get('code')?.invalid && (form.get('code')?.touched || submitted())
                     ? 'form-input-error' : 'form-input'"
            class="font-mono tracking-widest text-lg text-center uppercase"
            (input)="toUpper($event)"
          />
          <span *ngIf="form.get('code')?.invalid && (form.get('code')?.touched || submitted())"
                class="form-error">
            Please enter the linkage code
          </span>

          <div class="mt-6 flex gap-3">
            <a routerLink="/parent/linked-students" class="btn-secondary flex-1">Cancel</a>
            <button type="submit" [disabled]="loading()" class="btn-primary flex-1">
              <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ loading() ? 'Linking…' : 'Link Student' }}
            </button>
          </div>
        </form>

        <div *ngIf="success()" class="mt-4">
          <a routerLink="/parent/linked-students" class="btn-primary w-full">
            View My Students
          </a>
        </div>
      </div>
    </div>
  `,
})
export class LinkStudentComponent {
  private fb         = inject(FormBuilder);
  private parentApi  = inject(ParentApiService);
  private router     = inject(Router);

  loading   = signal(false);
  error     = signal<string | null>(null);
  success   = signal<string | null>(null);
  submitted = signal(false);

  form = this.fb.group({
    code: ['', Validators.required],
  });

  toUpper(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? 0;
    input.value = input.value.toUpperCase();
    this.form.get('code')?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    this.parentApi.linkStudent(this.form.value.code!.trim()).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(`${res.studentFullName} has been linked to your account.`);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Invalid code or student not found.');
      },
    });
  }
}
