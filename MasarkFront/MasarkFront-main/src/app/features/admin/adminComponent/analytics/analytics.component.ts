import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe, NgFor } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { PlatformAnalyticsDto } from '../../../../models/ai-analytics.model';
import { inject, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [NgFor, IconComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})

export class AdminAnalyticsComponent {
  private readonly aiAnalyticsService = inject(AiAnalyticsService);
  private readonly cdr = inject(ChangeDetectorRef);

  platformData: PlatformAnalyticsDto | null = null;

  // Mock fallbacks for UI elements not directly supported by backend yet, or until data loads
  dau = [{ label: 'Sat', value: 120 }, { label: 'Sun', value: 300 }];
  subjects = [{ label: 'Math', percent: 40, color: '#ff0000' }];
  loginHours = [{ hour: '10am', value: 50 }];
  growthPercent = 12;

  maxDau = 300;
  maxLogin = 50;
  donutSegments: any[] = [];

  constructor() {
    this.aiAnalyticsService.getPlatformAnalytics().subscribe(res => {
      this.platformData = res;
      this.cdr.markForCheck();
    });
  }
}
