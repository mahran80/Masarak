import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthApiService } from '../../../../services/auth.service';
import { AuthStateService } from '../../../../core/auth-state.service';

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw  = ctrl.get('password')?.value;
  const cpw = ctrl.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 sm:p-10">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-surface-900 font-display">Create your account</h1>
        <p class="text-sm text-surface-500 mt-1">Join Masarak and start learning</p>
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="alert-error mb-6">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">

        <!-- Full Name -->
        <div>
          <label class="form-label">Full name</label>
          <input type="text" formControlName="fullName" autocomplete="name"
                 placeholder="Fatima Al-Zahraa"
                 [class]="fc('fullName')"/>
          <span *ngIf="se('fullName')" class="form-error">
            {{ form.get('fullName')?.hasError('required') ? 'Full name is required' : 'Max 150 characters' }}
          </span>
        </div>

        <!-- Email -->
        <div>
          <label class="form-label">Email address</label>
          <input type="email" formControlName="email" autocomplete="email"
                 placeholder="you@example.com"
                 [class]="fc('email')"/>
          <span *ngIf="se('email')" class="form-error">
            {{ form.get('email')?.hasError('required') ? 'Email is required' : 'Enter a valid email' }}
          </span>
        </div>

        <!-- Role -->
        <div>
          <label class="form-label">I am a</label>
          <select formControlName="role" [class]="fc('role') + ' form-select'">
            <option value="" disabled>Select your role…</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Parent">Parent</option>
          </select>
          <span *ngIf="se('role')" class="form-error">Please select a role</span>
        </div>

        <!-- Password -->
        <div>
          <label class="form-label">Password</label>
          <div class="relative">
            <input [type]="showPwd() ? 'text' : 'password'"
                   formControlName="password" autocomplete="new-password"
                   placeholder="Min. 8 characters"
                   [class]="fc('password') + ' pr-10'"/>
            <button type="button" (click)="showPwd.set(!showPwd())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path *ngIf="!showPwd()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                <path *ngIf="showPwd()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <span *ngIf="se('password')" class="form-error">
            {{ form.get('password')?.hasError('required') ? 'Password is required' : 'Password must be at least 8 characters' }}
          </span>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="form-label">Confirm password</label>
          <input [type]="showPwd() ? 'text' : 'password'"
                 formControlName="confirmPassword" autocomplete="new-password"
                 placeholder="Repeat your password"
                 [class]="fc('confirmPassword')"/>
          <span *ngIf="se('confirmPassword')" class="form-error">
            {{ form.get('confirmPassword')?.hasError('required') ? 'Please confirm your password' : '' }}
          </span>
          <span *ngIf="form.hasError('passwordMismatch') && submitted()" class="form-error">
            Passwords do not match
          </span>
        </div>

        <!-- Optional: Phone -->
        <div>
          <label class="form-label">
            Phone <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <input type="tel" formControlName="phone" autocomplete="tel"
                 placeholder="+20 100 000 0000"
                 class="form-input"/>
        </div>

        <!-- Optional: Country -->
        <div>
          <label class="form-label">
            Country <span class="text-surface-400 font-normal">(optional)</span>
          </label>
          <input type="text" formControlName="country" autocomplete="country-name"
                 placeholder="Egypt"
                 class="form-input"/>
        </div>

        <!-- Submit -->
        <button type="submit" [disabled]="loading()" class="btn-primary w-full btn-lg mt-2">
          <svg *ngIf="loading()" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading() ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-surface-500">
        Already have an account?
        <a routerLink="/login" class="font-medium text-brand-600 hover:text-brand-700">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  private fb        = inject(FormBuilder);
  private authApi   = inject(AuthApiService);
  private authState = inject(AuthStateService);
  private router    = inject(Router);

  loading   = signal(false);
  error     = signal<string | null>(null);
  showPwd   = signal(false);
  submitted = signal(false);

  form = this.fb.group({
    fullName:        ['', [Validators.required, Validators.maxLength(150)]],
    email:           ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role:            ['', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmPassword: ['', Validators.required],
    phone:           ['', Validators.maxLength(30)],
    country:         ['', Validators.maxLength(100)],
  }, { validators: passwordMatchValidator });

  fc(name: string): string {
    const ctrl = this.form.get(name);
    return ctrl?.invalid && (ctrl?.touched || this.submitted()) ? 'form-input-error' : 'form-input';
  }

  se(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl?.invalid && (ctrl?.touched || this.submitted()));
  }

  submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) return;

    this.loading.set(true);
    const v = this.form.value;

    this.authApi.register({
      fullName:        v.fullName!,
      email:           v.email!,
      password:        v.password!,
      confirmPassword: v.confirmPassword!,
      role:            v.role! as 'Student' | 'Teacher' | 'Parent',
      phone:           v.phone || undefined,
      country:         v.country || undefined,
    }).subscribe({
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
          this.error.set(res.error ?? 'Registration failed. Please try again.');
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
