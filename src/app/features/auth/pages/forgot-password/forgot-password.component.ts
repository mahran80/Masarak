import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-surface-900 font-display">Reset password</h1>
        <p class="text-sm text-surface-500 mt-1">Enter your email and we'll help you reset your password</p>
      </div>

      <!-- Error alert -->
      <div *ngIf="error()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
      </div>

      <!-- Success alert -->
      <div *ngIf="successMessage()" class="alert-success mb-6 flex flex-col gap-2">
        <div class="flex items-start gap-3">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="font-medium">Reset request submitted</p>
            <p class="text-xs text-emerald-700 mt-1 mb-3">
              {{ successMessage() }}
            </p>
            <a routerLink="/reset-password" class="btn btn-primary btn-sm">Enter Reset Code</a>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form *ngIf="!successMessage()" [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
        <!-- Email -->
        <div>
          <label for="email" class="form-label">Email address</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="you@example.com"
            [class]="fieldClass('email')"
          />
          <span *ngIf="showError('email')" class="form-error">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ emailError() }}
          </span>
        </div>

        <!-- Submit -->
        <button type="submit" [disabled]="loading()" class="btn-primary w-full btn-lg mt-2">
          <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading() ? 'Sending code...' : 'Send reset code' }}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 text-center text-sm">
        <a routerLink="/login" class="font-medium text-brand-600 hover:text-brand-700">Back to sign in</a>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  devToken = signal<string | null>(null);
  submitted = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  fieldClass(name: string): string {
    const ctrl = this.form.get(name);
    const invalid = ctrl?.invalid && (ctrl?.touched || this.submitted());
    return invalid ? 'form-input-error' : 'form-input';
  }

  showError(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && (ctrl?.touched || this.submitted()));
  }

  emailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.hasError('required')) return 'Email is required';
    if (ctrl?.hasError('email')) return 'Enter a valid email address';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const email = this.form.value.email!;

    this.authApi.forgotPassword({ email }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.successMessage.set(res.message);
        } else {
          this.error.set(res.message ?? 'Failed to request password reset.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message ?? err?.error?.error ?? 'An unexpected error occurred.'
        );
      },
    });
  }
}
