import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800
                flex flex-col items-center justify-center px-4 py-12">

      <!-- Decorative circles -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-700/20 blur-3xl"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl"></div>
      </div>

      <!-- Logo -->
      <a routerLink="/" class="flex items-center gap-2.5 mb-8 relative z-10">
        <div class="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20
                    flex items-center justify-center shadow-lg">
          <span class="text-white font-bold text-lg font-display">M</span>
        </div>
        <span class="text-white font-bold text-2xl font-display tracking-tight">Masarak</span>
      </a>

      <!-- Card -->
      <div class="w-full max-w-md relative z-10">
        <div class="bg-white rounded-3xl shadow-modal overflow-hidden">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
