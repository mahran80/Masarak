import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanDto } from '../../../models/subscription.models';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card flex flex-col h-full transition-all duration-200 cursor-pointer
             hover:shadow-card-hover hover:-translate-y-0.5
             relative overflow-hidden"
      [class.ring-2]="featured"
      [class.ring-brand-500]="featured"
    >
      <!-- Featured badge -->
      <div *ngIf="featured"
        class="absolute top-0 right-0 bg-brand-600 text-white text-xs font-semibold
               px-3 py-1 rounded-bl-xl">
        Most Popular
      </div>

      <div class="p-6 flex flex-col h-full">
        <!-- Plan type badge -->
        <span class="badge-brand self-start mb-4">{{ planTypeLabel }}</span>

        <!-- Name & price -->
        <h3 class="text-xl font-bold text-surface-900 mb-1">{{ plan.name }}</h3>
        <p *ngIf="plan.description" class="text-sm text-surface-500 mb-4">{{ plan.description }}</p>

        <div class="flex items-baseline gap-1 mb-6">
          <span class="text-4xl font-extrabold text-surface-900 font-display">
            {{ plan.price | number:'1.2-2' }}
          </span>
          <span class="text-surface-500 text-sm">{{ plan.currency }}</span>
        </div>

        <!-- Duration -->
        <div class="flex items-center gap-2 text-sm text-surface-600 mb-4">
          <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {{ plan.durationDays }} days access
        </div>

        <!-- Features -->
        <ul class="space-y-3 mb-8 flex-1">
          <li *ngIf="plan.maxSubjects > 0" class="feature-item">
            <svg class="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Up to {{ plan.maxSubjects === 9999 ? 'unlimited' : plan.maxSubjects }} subjects
          </li>

          <li class="feature-item" [class.text-surface-400]="!plan.hasAi">
            <svg class="feature-icon" [class.text-brand-500]="plan.hasAi"
                 [class.text-surface-300]="!plan.hasAi"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M6.343 6.343l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <span [class.line-through]="!plan.hasAi">AI Recommendations</span>
          </li>

          <li class="feature-item" [class.text-surface-400]="!plan.hasLiveClass">
            <svg class="feature-icon" [class.text-brand-500]="plan.hasLiveClass"
                 [class.text-surface-300]="!plan.hasLiveClass"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span [class.line-through]="!plan.hasLiveClass">Live Classes</span>
          </li>

          <li class="feature-item" [class.text-surface-400]="!plan.hasRecordings">
            <svg class="feature-icon" [class.text-brand-500]="plan.hasRecordings"
                 [class.text-surface-300]="!plan.hasRecordings"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span [class.line-through]="!plan.hasRecordings">Session Recordings</span>
          </li>
        </ul>

        <!-- CTA -->
        <button
          (click)="select.emit(plan)"
          [disabled]="loading"
          class="btn-primary w-full btn-lg"
          [class.opacity-60]="loading"
        >
          <svg *ngIf="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ loading ? 'Redirecting...' : 'Get Started' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .feature-item {
      @apply flex items-center gap-2.5 text-sm text-surface-700;
    }
    .feature-icon {
      @apply w-4 h-4 flex-shrink-0 text-brand-500;
    }
  `],
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: PlanDto;
  @Input() featured = false;
  @Input() loading  = false;
  @Output() select  = new EventEmitter<PlanDto>();

  get planTypeLabel(): string {
    const map: Record<string, string> = {
      Monthly:        'Monthly',
      PerSubject:     'Per Subject',
      FullCurriculum: 'Full Curriculum',
    };
    return map[this.plan.type] ?? this.plan.type;
  }
}
