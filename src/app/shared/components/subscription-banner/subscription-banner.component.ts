import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-amber-800">No active subscription</p>
            <p class="text-xs text-amber-700">Subscribe to access all courses, classes, and features.</p>
          </div>
        </div>
        <a routerLink="/plans" class="btn bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 btn-sm flex-shrink-0">
          View Plans
        </a>
      </div>
    </div>
  `,
})
export class SubscriptionBannerComponent {}
