import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StudentAttendanceSummary } from '../../models';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-attendance-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAttendanceSummaryComponent {
  readonly summary = input<StudentAttendanceSummary | null>(null);

  readonly attendanceRate = computed(() => {
    const rate = this.summary()?.attendanceRate ?? 0;
    return Math.min(Math.max(Math.round(rate), 0), 100);
  });

  readonly totalSessions = computed(() => {
    const summary = this.summary();
    return summary
      ? summary.totalSessions ??
          summary.presentCount +
            summary.absentCount +
            (summary.lateCount ?? 0) +
            (summary.excusedCount ?? 0)
      : 0;
  });
}
