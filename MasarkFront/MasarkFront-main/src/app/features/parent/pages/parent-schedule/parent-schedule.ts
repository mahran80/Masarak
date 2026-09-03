import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-parent-schedule',
  standalone: true,
  imports: [CommonModule, IconComponent, RouterLink],
  templateUrl: './parent-schedule.html'
})
export class ParentScheduleComponent implements OnInit {
  private readonly parentService = inject(ParentService);
  private readonly route = inject(ActivatedRoute);

  studentId = signal<number>(0);
  schedule = signal<any>(null);
  isLoading = signal(true);

  // For the date picker navigation
  currentWeekStart = signal<Date>(this.getStartOfWeek(new Date()));

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('studentId');
      if (id) {
        this.studentId.set(+id);
        this.loadSchedule();
      }
    });
  }

  loadSchedule() {
    this.isLoading.set(true);
    const dateStr = this.currentWeekStart().toISOString().split('T')[0];
    this.parentService.getChildSchedule(this.studentId(), dateStr).subscribe({
      next: (res) => {
        this.schedule.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  nextWeek() {
    const next = new Date(this.currentWeekStart());
    next.setDate(next.getDate() + 7);
    this.currentWeekStart.set(next);
    this.loadSchedule();
  }

  prevWeek() {
    const prev = new Date(this.currentWeekStart());
    prev.setDate(prev.getDate() - 7);
    this.currentWeekStart.set(prev);
    this.loadSchedule();
  }
}
