import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { ParentReportDto } from '../../../../models/ai-analytics.model';
import { inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-parent-summary',
  standalone: true,
  imports: [NgFor, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parent-summary.component.html',
  styleUrl: './parent-summary.component.scss'
})
export class ParentSummaryComponent {
  private readonly aiAnalyticsService = inject(AiAnalyticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  reportData: ParentReportDto | null = null;
  trend = [{ label: 'Q1', value: 70 }];
  insights = [{ text: 'تحسن في الرياضيات' }];
  maxValue = 100;

  constructor() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(),
      switchMap(params => {
        const studentId = Number(params.get('studentId')) || 1;
        const month = params.get('month') || 'CurrentMonth';
        return this.aiAnalyticsService.getParentReport(studentId, month);
      })
    ).subscribe(res => {
      this.reportData = res;
      if (res && res.aiNarrative) {
        this.insights = [{ text: res.aiNarrative }];
      }
      this.cdr.markForCheck();
    });
  }
}
