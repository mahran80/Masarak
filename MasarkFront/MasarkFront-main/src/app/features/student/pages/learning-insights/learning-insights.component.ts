import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import {
  LearningInsightsDashboardDto,
  WeaknessAnalysisDto,
  ContentRecommendationDto,
  PerformanceAlertDto,
  PerformanceTrendDto,
} from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-learning-insights',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-blue-600"><app-icon name="sparkles" size="1.2em"></app-icon></span>
              رؤى التعلم الذكية
            </h1>
            <p class="text-sm text-slate-500 mt-1">تحليل نقاط الضعف والقوة لديك مع توصيات مخصصة بالذكاء الاصطناعي</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-48">
              <div class="w-1/3 h-5 bg-slate-200 rounded mb-3"></div>
              <div class="space-y-2">
                <div class="w-full h-4 bg-slate-100 rounded"></div>
                <div class="w-3/4 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error -->
      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
          <h3 class="font-bold text-lg mb-1">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadInsights()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- Active Alerts -->
        @if (data()!.activeAlerts.length > 0) {
          <div>
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
              <span class="text-blue-600"><app-icon name="bell" size="1.2em"></app-icon></span> تنبيهات الأداء
              <span class="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{{ data()!.activeAlerts.length }}</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (alert of data()!.activeAlerts; track alert.performanceAlertId) {
                <div class="bg-white rounded-xl border-r-4 p-4 shadow-sm"
                     [class.border-r-red-500]="alert.alertType === 'LowExamScore'"
                     [class.border-r-amber-500]="alert.alertType === 'LowAttendance'"
                     [class.border-r-blue-500]="alert.alertType === 'MissedAssignments'">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">
                      @if (alert.alertType === 'LowAttendance') { <app-icon name="clock" size="1.2em"></app-icon> }
                      @else if (alert.alertType === 'LowExamScore') { <app-icon name="pencil" size="1.2em"></app-icon> }
                      @else { <app-icon name="clipboard" size="1.2em"></app-icon> }
                    </span>
                    <span class="font-bold text-slate-800">
                      @if (alert.alertType === 'LowAttendance') { انخفاض الحضور }
                      @else if (alert.alertType === 'LowExamScore') { درجة منخفضة }
                      @else { واجبات ناقصة }
                    </span>
                  </div>
                  <p class="text-sm text-slate-600">{{ alert.message }}</p>
                  @if (alert.subjectName) {
                    <span class="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{{ alert.subjectName }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Weakness Analyses -->
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="text-blue-600"><app-icon name="chart" size="1.2em"></app-icon></span> تحليل نقاط الضعف
          </h2>
          @if (data()!.subjectAnalyses.length === 0) {
            <div class="bg-white text-slate-700 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span class="text-4xl mb-3 flex justify-center text-blue-600"><app-icon name="check-circle" size="1.2em"></app-icon></span>
              <p class="font-bold text-slate-700">لم نرصد أي نقاط ضعف حتى الآن. أداء رائع!</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              @for (analysis of data()!.subjectAnalyses; track analysis.subjectId) {
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div class="bg-gradient-to-l from-violet-600 to-indigo-600 px-5 py-3">
                    <h3 class="text-white font-bold">{{ analysis.subjectName }}</h3>
                    <p class="text-violet-200 text-xs">آخر تحديث: {{ analysis.generatedAt | date:'shortDate' }}</p>
                  </div>
                  <div class="p-5 space-y-4">
                    @for (topic of analysis.weakTopics; track topic.topicName) {
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="text-sm font-bold text-slate-700">{{ topic.topicName }}</span>
                          <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                                [class.bg-red-100]="topic.errorRate >= 0.5"
                                [class.text-red-700]="topic.errorRate >= 0.5"
                                [class.bg-amber-100]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                [class.text-amber-700]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                [class.bg-blue-100]="topic.errorRate < 0.3"
                                [class.text-blue-700]="topic.errorRate < 0.3">
                            {{ (topic.errorRate * 100).toFixed(0) }}% أخطاء
                          </span>
                        </div>
                        <!-- Error rate bar -->
                        <div class="w-full bg-slate-100 rounded-full h-2">
                          <div class="h-2 rounded-full transition-all"
                               [class.bg-red-500]="topic.errorRate >= 0.5"
                               [class.bg-amber-500]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                               [class.bg-blue-500]="topic.errorRate < 0.3"
                               [style.width.%]="topic.errorRate * 100"></div>
                        </div>
                        <!-- Recommended actions -->
                        <ul class="text-xs text-slate-500 space-y-1">
                          @for (action of topic.recommendedActions; track action) {
                            <li class="flex items-start gap-1.5">
                              <span class="text-violet-500 mt-0.5">▸</span>
                              <span>{{ action }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    @if (analysis.narrativeSummary) {
                      <p class="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {{ analysis.narrativeSummary }}
                      </p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Content Recommendations -->
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="text-blue-600"><app-icon name="sparkles" size="1.2em"></app-icon></span> محتوى موصى به
          </h2>
          @if (data()!.recommendations.length === 0) {
            <div class="flex flex-col items-center justify-center text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-4xl mb-3 text-slate-400"><app-icon name="book-open" size="1.2em"></app-icon></span>
              <p class="text-slate-500 font-medium">لا توجد توصيات حالياً</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (rec of data()!.recommendations; track rec.contentItemId) {
                <div class="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="text-2xl">
                      @if (rec.contentType === 'Video') { <app-icon name="video" size="1.2em"></app-icon> }
                      @else if (rec.contentType === 'Document') { <app-icon name="document-text" size="1.2em"></app-icon> }
                      @else if (rec.contentType === 'Quiz') { <app-icon name="check-circle" size="1.2em"></app-icon> }
                      @else { <app-icon name="folder" size="1.2em"></app-icon> }
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate group-hover:text-violet-600 transition-colors">{{ rec.title }}</p>
                      <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold">{{ rec.contentType }}</span>
                    </div>
                  </div>
                  <p class="text-xs text-slate-500 leading-relaxed">{{ rec.reason }}</p>
                  <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span class="text-[10px] text-slate-400 font-medium">ملاءمة: {{ (rec.relevanceScore * 100).toFixed(0) }}%</span>
                    <div class="w-16 bg-slate-100 rounded-full h-1.5">
                      <div class="h-1.5 bg-violet-500 rounded-full" [style.width.%]="rec.relevanceScore * 100"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Performance Trends -->
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <span class="text-blue-600"><app-icon name="chart" size="1.2em"></app-icon></span> اتجاهات الأداء
          </h2>
          @if (data()!.performanceTrends.length === 0) {
            <div class="flex flex-col items-center justify-center text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-4xl mb-3 text-slate-400"><app-icon name="chart" size="1.2em"></app-icon></span>
              <p class="text-slate-500 font-medium">لا توجد بيانات أداء كافية لعرض الاتجاهات</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (trend of data()!.performanceTrends; track trend.subjectName) {
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                    {{ trend.subjectName }}
                  </h3>
                  <!-- Simple visual trend using bars -->
                  <div class="flex items-end gap-1.5 h-32">
                    @for (point of trend.examScores; track point.date) {
                      <div class="flex-1 flex flex-col items-center gap-1">
                        <span class="text-[9px] text-slate-500 font-bold">{{ point.score.toFixed(0) }}</span>
                        <div class="w-full rounded-t-md transition-all"
                             [class.bg-emerald-500]="point.score >= 80"
                             [class.bg-blue-500]="point.score >= 60 && point.score < 80"
                             [class.bg-amber-500]="point.score >= 40 && point.score < 60"
                             [class.bg-red-500]="point.score < 40"
                             [style.height.%]="point.score"></div>
                        <span class="text-[8px] text-slate-400 truncate w-full text-center">{{ point.date | date:'MM/dd' }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LearningInsightsComponent implements OnInit {
  private readonly aiService = inject(AiAnalyticsService);

  data = signal<LearningInsightsDashboardDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInsights();
  }

  loadInsights(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getStudentInsights().subscribe({
      next: (res) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل رؤى التعلم. يرجى التأكد من اشتراكك والمحاولة مرة أخرى.');
        this.isLoading.set(false);
      },
    });
  }
}
