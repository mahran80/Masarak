import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-timer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg border transition-colors duration-300 shadow-sm"
         [class.bg-rose-50]="isDanger()"
         [class.text-rose-600]="isDanger()"
         [class.border-rose-200]="isDanger()"
         [class.animate-pulse]="isDanger()"
         [class.bg-white]="!isDanger()"
         [class.text-slate-700]="!isDanger()"
         [class.border-slate-200]="!isDanger()">
      
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span dir="ltr">{{ formattedTime() }}</span>
    </div>
  `
})
export class ExamTimerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) durationSeconds = 0;
  @Input() startTime: string = new Date().toISOString();
  
  @Output() timeUp = new EventEmitter<void>();

  readonly remainingSeconds = signal<number>(0);
  
  readonly formattedTime = computed(() => {
    const totalSeconds = this.remainingSeconds();
    if (totalSeconds <= 0) return '00:00:00';
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  readonly isDanger = computed(() => {
    return this.remainingSeconds() > 0 && this.remainingSeconds() <= 300; // 5 minutes
  });

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Calculate initial remaining time based on startTime
    this.updateTime();
    
    // Update every second
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTime(): void {
    const start = new Date(this.startTime).getTime();
    const now = new Date().getTime();
    
    // Elapsed time in seconds
    const elapsed = Math.floor((now - start) / 1000);
    const remaining = Math.max(0, this.durationSeconds - elapsed);
    
    this.remainingSeconds.set(remaining);
    
    if (remaining <= 0) {
      if (this.intervalId) clearInterval(this.intervalId);
      this.timeUp.emit();
    }
  }
}
