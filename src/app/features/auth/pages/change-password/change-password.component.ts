import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../../services/auth.service';
import { AuthStateService } from '../../../../core/auth-state.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container max-w-lg">
      <div class="card p-6 sm:p-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-surface-900 font-display">Change Password</h1>
          <p class="text-sm text-surface-500 mt-1">Update your password to keep your account secure</p>
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
        <div *ngIf="successMessage()" class="alert-success mb-6">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="font-medium">Password updated successfully</p>
            <p class="text-xs text-emerald-700 mt-1">
              {{ successMessage() }} Redirecting to login in {{ countdown() }}...
            </p>
          </div>
        </div>

        <!-- Form -->
        <form *ngIf="!successMessage()" [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
          <!-- Current Password -->
          <div>
            <label for="currentPassword" class="form-label">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              formControlName="currentPassword"
              placeholder="••••••••"
              [class]="fieldClass('currentPassword')"
            />
            <span *ngIf="showError('currentPassword')" class="form-error">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Current password is required
            </span>
          </div>

          <!-- New Password -->
          <div>
            <label for="newPassword" class="form-label">New Password</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              placeholder="••••••••"
              [class]="fieldClass('newPassword')"
            />
            <span *ngIf="showError('newPassword')" class="form-error">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              {{ newPasswordError() }}
            </span>
          </div>

          <!-- Confirm New Password -->
          <div>
            <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              formControlName="confirmNewPassword"
              placeholder="••••••••"
              [class]="fieldClass('confirmNewPassword')"
            />
            <span *ngIf="showError('confirmNewPassword') || form.hasError('mismatch')" class="form-error">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              {{ confirmPasswordError() }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              (click)="cancel()"
              [disabled]="loading()"
              class="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="loading()"
              class="btn-primary flex-1"
            >
              <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ loading() ? 'Saving...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  submitted = signal(false);
  countdown = signal(3);

  form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPass = control.get('newPassword')?.value;
    const confirmPass = control.get('confirmNewPassword')?.value;
    return newPass && confirmPass && newPass !== confirmPass ? { mismatch: true } : null;
  }

  fieldClass(name: string): string {
    const ctrl = this.form.get(name);
    const hasError = (ctrl?.invalid && (ctrl?.touched || this.submitted())) || 
                     (name === 'confirmNewPassword' && this.form.hasError('mismatch') && (ctrl?.touched || this.submitted()));
    return hasError ? 'form-input-error' : 'form-input';
  }

  showError(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && (ctrl?.touched || this.submitted()));
  }

  newPasswordError(): string {
    const ctrl = this.form.get('newPassword');
    if (ctrl?.hasError('required')) return 'New password is required';
    if (ctrl?.hasError('minlength')) return 'Password must be at least 8 characters';
    return '';
  }

  confirmPasswordError(): string {
    const ctrl = this.form.get('confirmNewPassword');
    if (ctrl?.hasError('required')) return 'Please confirm your new password';
    if (this.form.hasError('mismatch')) return 'Passwords do not match';
    return '';
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { currentPassword, newPassword, confirmNewPassword } = this.form.value;

    this.authApi.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!,
      confirmNewPassword: confirmNewPassword!,
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.successMessage.set(res.message);
          
          // Start redirect countdown
          const interval = setInterval(() => {
            this.countdown.update(c => c - 1);
            if (this.countdown() <= 0) {
              clearInterval(interval);
              this.authState.clearAuth();
              this.router.navigate(['/login']);
            }
          }, 1000);
        } else {
          this.error.set(res.message ?? 'Failed to change password.');
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
