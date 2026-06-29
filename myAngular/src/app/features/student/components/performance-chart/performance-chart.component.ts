import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  max: number;
}

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full flex flex-col gap-4">
      @for (point of processedData(); track point.label) {
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-sm font-bold text-slate-700">
            <span>{{ point.label }}</span>
            <span dir="ltr">{{ point.value }} / {{ point.max }} ({{ point.percentage | number:'1.0-0' }}%)</span>
          </div>
          <div class="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div class="h-full transition-all duration-1000 ease-out rounded-full"
                 [style.width.%]="point.percentage"
                 [class]="getBarClass(point.percentage)">
            </div>
          </div>
        </div>
      }
      
      @if (data.length === 0) {
        <div class="text-center py-8 text-slate-400 font-bold">لا توجد بيانات متاحة لعرضها</div>
      }
    </div>
  `
})
export class PerformanceChartComponent {
  @Input() data: ChartDataPoint[] = [];

  readonly processedData = computed(() => {
    return this.data.map(p => ({
      ...p,
      percentage: p.max > 0 ? Math.min(100, Math.max(0, (p.value / p.max) * 100)) : 0
    }));
  });

  getBarClass(percentage: number): string {
    if (percentage >= 85) return 'bg-emerald-500';
    if (percentage >= 65) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  }
}
