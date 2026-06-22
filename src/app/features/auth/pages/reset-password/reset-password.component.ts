import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-surface-900 font-display">Create new password</h1>
        <p class="text-sm text-surface-500 mt-1">Enter your reset code and choose a secure password</p>
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
          <p class="font-medium">Password reset successful</p>
          <p class="text-xs text-emerald-700 mt-1">
            {{ successMessage() }}
          </p>
          <button
            routerLink="/login"
            class="mt-3 btn btn-secondary btn-sm"
          >
            Go to login
          </button>
        </div>
      </div>

      <!-- Form -->
      <form *ngIf="!successMessage()" [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
        <!-- Token -->
        <div>
          <label for="token" class="form-label">Reset Code / Token</label>
          <input
            id="token"
            type="text"
            formControlName="token"
            placeholder="E.g. F7B8A9CD"
            [class]="fieldClass('token') + ' font-mono uppercase tracking-wider'"
          />
          <span *ngIf="showError('token')" class="form-error">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Reset code is required
          </span>
        </div>

        <!-- New Password -->
        <div>
          <label for="newPassword" class="form-label">New Password</label>
          <div class="relative">
            <input
              id="newPassword"
              [type]="showNewPassword() ? 'text' : 'password'"
              formControlName="newPassword"
              placeholder="••••••••"
              [class]="fieldClass('newPassword') + ' pr-10'"
            />
            <button type="button" (click)="showNewPassword.set(!showNewPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              <svg *ngIf="!showNewPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg *ngIf="showNewPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <span *ngIf="showError('newPassword')" class="form-error">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ newPasswordError() }}
          </span>
        </div>

        <!-- Confirm Password -->
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

        <!-- Submit -->
        <button type="submit" [disabled]="loading()" class="btn-primary w-full btn-lg mt-2">
          <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading() ? 'Resetting password...' : 'Reset password' }}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 text-center text-sm">
        <a routerLink="/login" class="font-medium text-brand-600 hover:text-brand-700">Back to sign in</a>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showNewPassword = signal(false);
  submitted = signal(false);

  form = this.fb.group(
    {
      token: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (tokenParam) {
      this.form.patchValue({ token: tokenParam });
    }
  }

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
    if (ctrl?.hasError('required')) return 'Please confirm your password';
    if (this.form.hasError('mismatch')) return 'Passwords do not match';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { token, newPassword, confirmNewPassword } = this.form.value;

    this.authApi.resetPassword({
      token: token!,
      newPassword: newPassword!,
      confirmNewPassword: confirmNewPassword!,
    }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) {
          this.successMessage.set(res.message);
        } else {
          this.error.set(res.message ?? 'Failed to reset password.');
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
