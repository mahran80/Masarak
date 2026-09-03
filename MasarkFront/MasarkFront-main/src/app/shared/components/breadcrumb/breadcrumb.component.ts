import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="flex items-center gap-1.5 text-sm mb-6" aria-label="Breadcrumb" dir="rtl">
      @for (item of items; track item.label; let i = $index; let last = $last) {
        @if (!last && item.route) {
          <a [routerLink]="item.route"
             class="font-medium transition-colors"
             [ngClass]="theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'">
            {{ item.label }}
          </a>
          <span class="mx-0.5" [ngClass]="theme === 'dark' ? 'text-slate-600' : 'text-slate-300'">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        } @else if (!last) {
          <span class="font-medium"
                [ngClass]="theme === 'dark' ? 'text-slate-400' : 'text-slate-500'">{{ item.label }}</span>
          <span class="mx-0.5" [ngClass]="theme === 'dark' ? 'text-slate-600' : 'text-slate-300'">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        } @else {
          <span class="font-semibold"
                [ngClass]="theme === 'dark' ? 'text-white' : 'text-slate-800'">{{ item.label }}</span>
        }
      }
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() theme: 'light' | 'dark' = 'light';
}
