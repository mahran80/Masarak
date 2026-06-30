import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="badgeClass()" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border">
      <span class="text-base">{{ icon() }}</span>
      <span dir="ltr">{{ score }} / {{ maxScore }}</span>
    </div>
  `
})
export class ScoreBadgeComponent {
  @Input({ required: true }) score = 0;
  @Input({ required: true }) maxScore = 100;

  readonly percentage = computed(() => {
    if (this.maxScore === 0) return 0;
    return (this.score / this.maxScore) * 100;
  });

  readonly badgeClass = computed(() => {
    const p = this.percentage();
    if (p >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (p >= 65) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (p >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  });

  readonly icon = computed(() => {
    const p = this.percentage();
    if (p >= 85) return '🌟';
    if (p >= 65) return '👍';
    if (p >= 50) return '⚠️';
    return '💔';
  });
}
