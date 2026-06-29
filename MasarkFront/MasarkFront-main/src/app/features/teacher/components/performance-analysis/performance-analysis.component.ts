import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { ClassAnalyticsDashboardDto } from '../../../../models/ai-analytics.model';
import { inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface CommonMistake {
  id: string;
  icon: string;
  text: string;
}

@Component({
  selector: 'app-performance-analysis',
  standalone: true,
  imports: [NgFor, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './performance-analysis.component.html',
  styleUrl: './performance-analysis.component.scss'
})
export class PerformanceAnalysisComponent {
  private readonly aiAnalyticsService = inject(AiAnalyticsService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  overallLevelPercent = 0;
  analyticsData: ClassAnalyticsDashboardDto | null = null;

  mistakes: CommonMistake[] = [
    { id: 'm1', icon: 'clipboard', text: 'قواعد الإملاء - التاء المربوطة (20 خطأ)' },
    { id: 'm2', icon: 'edit', text: 'قواعد النحو - الجملة الفعلية (15 خطأ)' },
    { id: 'm3', icon: 'chart', text: 'الرياضيات - الكسور العشرية (10 أخطاء)' }
  ];

  constructor() {
    this.route.paramMap.subscribe(params => {
      const classId = Number(params.get('classId')) || 1;
      const subjectId = Number(params.get('subjectId')) || 1;
      this.aiAnalyticsService.getClassAnalytics(classId, subjectId).subscribe(res => {
        this.analyticsData = res;
        this.overallLevelPercent = res.classAverage;
        this.cdr.markForCheck();
      });
    });
  }
}
