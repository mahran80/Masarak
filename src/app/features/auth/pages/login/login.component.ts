import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthApiService } from '../../../../services/auth.service';
import { AuthStateService } from '../../../../core/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-surface-900 font-display">Welcome back</h1>
        <p class="text-sm text-surface-500 mt-1">Sign in to your Masarak account</p>
      </div>

      <!-- Error alert -->
      <div *ngIf="error()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">

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

        <!-- Password -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="password" class="form-label mb-0">Password</label>
          </div>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              [class]="fieldClass('password') + ' pr-10'"
            />
            <button type="button" (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              <svg *ngIf="!showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg *ngIf="showPassword()" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <span *ngIf="showError('password')" class="form-error">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Password is required
          </span>
        </div>

        <!-- Submit -->
        <button type="submit" [disabled]="loading()" class="btn-primary w-full btn-lg mt-2">
          <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Footer -->
      <div class="mt-6 space-y-3 text-center text-sm text-surface-500">
        <p>
          Don't have an account?
          <a routerLink="/register" class="font-medium text-brand-600 hover:text-brand-700">Get started</a>
        </p>
        <p>
          <a routerLink="/forgot-password" class="font-medium text-brand-600 hover:text-brand-700">Forgot your password?</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb        = inject(FormBuilder);
  private authApi   = inject(AuthApiService);
  private authState = inject(AuthStateService);
  private router    = inject(Router);

  loading      = signal(false);
  error        = signal<string | null>(null);
  showPassword = signal(false);
  submitted    = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
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
    if (ctrl?.hasError('email'))    return 'Enter a valid email address';
    return '';
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { email, password } = this.form.value;

    this.authApi.login({ email: email!, password: password! }).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.accessToken && res.refreshToken && res.user) {
          this.authState.setAuth({
            accessToken:  res.accessToken,
            refreshToken: res.refreshToken,
            user:         res.user,
          });
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.error ?? 'Login failed. Please try again.');
        }
      },
      error: err => {
        this.loading.set(false);
        this.error.set(
          err?.error?.error ?? err?.error?.message ?? 'An unexpected error occurred.'
        );
      },
    });
  }
}
