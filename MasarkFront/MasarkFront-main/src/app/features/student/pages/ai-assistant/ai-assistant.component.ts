import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { WeakTopicDto } from '../../../../models/ai-analytics.model';
import { inject, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [NgFor, FormsModule, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss'
})
export class AiAssistantComponent {
  private readonly aiAnalyticsService = inject(AiAnalyticsService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  concepts: WeakTopicDto[] = [];
  readonly intro = 'أهلاً! لقد قمت بتحليل نتائج اختبارك الأخير. دعنا نراجع بعض المفاهيم التي تحتاج إلى مزيد من التركيز.';
  readonly messageDraft = signal('');

  constructor() {
    this.aiAnalyticsService.getStudentInsights().pipe(
      takeUntilDestroyed()
    ).subscribe(res => {
      if (res && res.subjectAnalyses && res.subjectAnalyses.length > 0) {
        this.concepts = res.subjectAnalyses[0].weakTopics || [];
        this.cdr.markForCheck();
      }
    });
  }

  send(): void {
    // Static demo only — chat will be wired to the API later.
    this.messageDraft.set('');
  }
}
