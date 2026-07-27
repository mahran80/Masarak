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
    <div class="student-page student-insights-page space-y-6 pb-12 pt-4 md:pt-6" dir="rtl">
      
      <!-- Simple Clean Header (No Hero Banner) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-800/80">
        <div class="space-y-1">
          <h1 class="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span class="text-blue-600 dark:text-blue-400"><app-icon name="chart" size="1.1em"></app-icon></span>
            تقارير الأداء ومستويات التحصيل
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">
            تحليل شامل لمستواك الدراسي ونقاط القوة والضعف مع مصادر مقترحة للمراجعة
          </p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          @if (data()?.dataSource === 'Cache') {
            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2.5 py-1 rounded-full">
              <app-icon name="bolt" size="11"></app-icon>
              محدث تلقائياً
            </span>
          }
          <button (click)="loadInsights()" class="inline-flex items-center gap-1.5 text-[11px] font-black bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm">
            <span [class.animate-spin]="isLoading()">↻</span>
            تحديث البيانات
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 animate-pulse h-48">
              <div class="w-1/3 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
              <div class="space-y-3">
                <div class="w-full h-4 bg-slate-100 dark:bg-slate-800/65 rounded"></div>
                <div class="w-3/4 h-4 bg-slate-100 dark:bg-slate-800/65 rounded"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @else if (error()) {
        <div class="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-8 rounded-3xl border border-red-100 dark:border-red-900/30 text-center max-w-xl mx-auto shadow-sm">
          <span class="text-4xl mb-3 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon></span>
          <h3 class="font-black text-lg mb-1 text-red-800 dark:text-red-300">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-6">{{ error() }}</p>
          <button (click)="loadInsights()" class="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/10 text-sm">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- Main Responsive Columns Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <!-- RIGHT COLUMN: Weakness Analysis & Trends (Width 2/3) -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Weakness Analyses Card Section -->
            <div class="space-y-4">
              <h2 class="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                <span class="text-indigo-500"><app-icon name="book-open" size="1.1em"></app-icon></span>
                مواضيع تحتاج إلى مراجعة
              </h2>

              @if (data()!.subjectAnalyses.length === 0) {
                <div class="insights-card p-8 text-center flex flex-col items-center justify-center">
                  <div class="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-4 text-2xl shadow-inner">
                    <app-icon name="check-circle" size="1.2em"></app-icon>
                  </div>
                  <h3 class="font-black text-slate-800 dark:text-white text-base">أداء ممتاز ومشرق!</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                    لم نرصد أي نقاط ضعف حتى الآن في مقرراتك الدراسية. استمر في هذا التميز!
                  </p>
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  @for (analysis of data()!.subjectAnalyses; track analysis.subjectId) {
                    <div class="insights-card overflow-hidden flex flex-col">
                      <!-- Subject Title Header -->
                      <div class="subject-header px-5 py-4 flex items-center justify-between">
                        <div>
                          <h3 class="text-slate-800 dark:text-white font-black text-sm">{{ analysis.subjectName }}</h3>
                          <span class="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 block">
                            تحديث: {{ analysis.generatedAt | date:'shortDate' }}
                          </span>
                        </div>
                        <span class="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-100/30 dark:border-indigo-900/20">
                          {{ analysis.weakTopics.length }} مواضيع للمراجعة
                        </span>
                      </div>

                      <div class="p-5 flex-1 flex flex-col justify-between space-y-5">
                        <div class="space-y-4">
                          @for (topic of analysis.weakTopics; track topic.topicName) {
                            <div class="space-y-2">
                              <div class="flex justify-between items-center text-xs">
                                <span class="font-bold text-slate-700 dark:text-slate-300">{{ topic.topicName }}</span>
                                <span class="font-black px-2 py-0.5 rounded-full"
                                      [class.bg-red-50]="topic.errorRate >= 0.5"
                                      [class.text-red-650]="topic.errorRate >= 0.5"
                                      [class.dark:bg-red-950/20]="topic.errorRate >= 0.5"
                                      [class.dark:text-red-400]="topic.errorRate >= 0.5"
                                      
                                      [class.bg-amber-50]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                      [class.text-amber-650]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                      [class.dark:bg-amber-950/20]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                      [class.dark:text-amber-400]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                      
                                      [class.bg-blue-50]="topic.errorRate < 0.3"
                                      [class.text-blue-650]="topic.errorRate < 0.3"
                                      [class.dark:bg-blue-950/20]="topic.errorRate < 0.3"
                                      [class.dark:text-blue-400]="topic.errorRate < 0.3">
                                  {{ (topic.errorRate * 100).toFixed(0) }}% أخطاء
                                </span>
                              </div>
                              
                              <!-- Error rate bar -->
                              <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div class="h-1.5 rounded-full transition-all"
                                     [class.bg-red-500]="topic.errorRate >= 0.5"
                                     [class.bg-amber-500]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                                     [class.bg-blue-500]="topic.errorRate < 0.3"
                                     [style.width.%]="topic.errorRate * 100"></div>
                              </div>
                              
                              <!-- Recommended actions -->
                              <ul class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                                @for (action of topic.recommendedActions; track action) {
                                  <li class="flex items-start gap-1.5">
                                    <span class="text-indigo-500 dark:text-indigo-400 mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>
                                    <span>{{ action }}</span>
                                  </li>
                                }
                              </ul>
                            </div>
                          }
                        </div>

                        @if (analysis.narrativeSummary) {
                          <div class="p-3 bg-violet-50/30 dark:bg-violet-950/10 rounded-xl border border-violet-100/30 dark:border-violet-900/20 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2">
                            <span class="text-violet-500 shrink-0 mt-0.5">💡</span>
                            <p>{{ analysis.narrativeSummary }}</p>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Performance Trends Section -->
            <div class="space-y-4 pt-2">
              <h2 class="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                <span class="text-emerald-500"><app-icon name="chart" size="1.1em"></app-icon></span>
                اتجاهات الأداء الدراسي
              </h2>

              @if (data()!.performanceTrends.length === 0) {
                <div class="insights-card p-8 text-center flex flex-col items-center justify-center">
                  <div class="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <app-icon name="chart" size="1.2em"></app-icon>
                  </div>
                  <p class="text-xs text-slate-550 dark:text-slate-450">لا توجد بيانات درجات كافية لعرض اتجاهات الأداء حالياً.</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  @for (trend of data()!.performanceTrends; track trend.subjectName) {
                    <div class="insights-card p-5">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400"></span>
                          {{ trend.subjectName }}
                        </h3>
                        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">درجات الاختبارات الأخيره</span>
                      </div>
                      
                      <!-- Vertical score bars -->
                      <div class="flex items-end gap-3 h-36 pt-4 border-b border-slate-100 dark:border-slate-800/80 pb-2 px-2">
                        @for (point of trend.examScores; track point.date) {
                          <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
                            <span class="text-[9px] text-slate-500 dark:text-slate-400 font-black opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200">{{ point.score.toFixed(0) }}%</span>
                            <div class="w-full rounded-t-lg transition-all duration-300 relative shadow-sm"
                                 [class.bg-gradient-to-t]="true"
                                 [class.from-emerald-500]="point.score >= 80"
                                 [class.to-emerald-400]="point.score >= 80"
                                 [class.from-blue-500]="point.score >= 60 && point.score < 80"
                                 [class.to-blue-400]="point.score >= 60 && point.score < 80"
                                 [class.from-amber-500]="point.score >= 40 && point.score < 60"
                                 [class.to-amber-400]="point.score >= 40 && point.score < 60"
                                 [class.from-red-500]="point.score < 40"
                                 [class.to-red-400]="point.score < 40"
                                 [style.height.%]="point.score">
                              <!-- Hover tooltip helper -->
                              <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow z-30">
                                درجة: {{ point.score }}%
                              </div>
                            </div>
                            <span class="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate w-full text-center">{{ point.date | date:'MM/dd' }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- LEFT COLUMN: Alerts & Recommendations (Width 1/3) -->
          <div class="space-y-6">
            
            <!-- Performance Alerts Section -->
            @if (data()!.activeAlerts.length > 0) {
              <div class="space-y-3">
                <h2 class="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                  <span class="text-rose-500"><app-icon name="bell" size="1.1em"></app-icon></span>
                  تنبيهات التحصيل الأكاديمي
                  <span class="text-xs bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-black px-2 py-0.5 rounded-full">{{ data()!.activeAlerts.length }}</span>
                </h2>
                
                <div class="space-y-3">
                  @for (alert of data()!.activeAlerts; track alert.performanceAlertId) {
                    <div class="insights-card border-r-4 p-4 flex gap-3 relative overflow-hidden"
                         [class.border-r-red-500]="alert.alertType === 'LowExamScore'"
                         [class.border-r-amber-500]="alert.alertType === 'LowAttendance'"
                         [class.border-r-blue-500]="alert.alertType === 'MissedAssignments'">
                      
                      <!-- Alert Icon container -->
                      <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm shadow-inner"
                           [class.bg-red-50]="alert.alertType === 'LowExamScore'"
                           [class.text-red-650]="alert.alertType === 'LowExamScore'"
                           [class.dark:bg-red-950/20]="alert.alertType === 'LowExamScore'"
                           [class.dark:text-red-400]="alert.alertType === 'LowExamScore'"
                           
                           [class.bg-amber-50]="alert.alertType === 'LowAttendance'"
                           [class.text-amber-650]="alert.alertType === 'LowAttendance'"
                           [class.dark:bg-amber-950/20]="alert.alertType === 'LowAttendance'"
                           [class.dark:text-amber-400]="alert.alertType === 'LowAttendance'"
                           
                           [class.bg-blue-50]="alert.alertType !== 'LowExamScore' && alert.alertType !== 'LowAttendance'"
                           [class.text-blue-650]="alert.alertType !== 'LowExamScore' && alert.alertType !== 'LowAttendance'"
                           [class.dark:bg-blue-950/20]="alert.alertType !== 'LowExamScore' && alert.alertType !== 'LowAttendance'"
                           [class.dark:text-blue-400]="alert.alertType !== 'LowExamScore' && alert.alertType !== 'LowAttendance'">
                        @if (alert.alertType === 'LowAttendance') { <app-icon name="clock" size="1.1em"></app-icon> }
                        @else if (alert.alertType === 'LowExamScore') { <app-icon name="pencil" size="1.1em"></app-icon> }
                        @else { <app-icon name="clipboard" size="1.1em"></app-icon> }
                      </div>

                      <div class="space-y-1 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="font-black text-slate-800 dark:text-white text-xs">
                            @if (alert.alertType === 'LowAttendance') { انخفاض معدل الحضور }
                            @else if (alert.alertType === 'LowExamScore') { درجات اختبار منخفضة }
                            @else { واجبات متأخرة أو ناقصة }
                          </span>
                          @if (alert.subjectName) {
                            <span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">{{ alert.subjectName }}</span>
                          }
                        </div>
                        <p class="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed">{{ alert.message }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Recommended Content Section -->
            <div class="space-y-3">
              <h2 class="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                <span class="text-violet-500"><app-icon name="document-text" size="1.1em"></app-icon></span>
                مصادر التعلم والمراجعة المقترحة
              </h2>

              @if (data()!.recommendations.length === 0) {
                <div class="insights-card p-6 text-center flex flex-col items-center justify-center">
                  <div class="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-405 flex items-center justify-center mb-3">
                    <app-icon name="book-open" size="1.1em"></app-icon>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">لا توجد توصيات محتوى متوفرة حالياً.</p>
                </div>
              } @else {
                <div class="space-y-4">
                  @for (rec of data()!.recommendations; track rec.contentItemId) {
                    <div class="insights-card p-4 hover:border-violet-300 dark:hover:border-violet-900/60 transition-all duration-300 group flex flex-col justify-between">
                      <div class="space-y-3">
                        <div class="flex items-start gap-3">
                          <!-- Content Type Icon -->
                          <div class="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-650 dark:text-violet-400 flex items-center justify-center shrink-0 text-base shadow-sm">
                            @if (rec.contentType === 'Video') { <app-icon name="video" size="1.1em"></app-icon> }
                            @else if (rec.contentType === 'Document') { <app-icon name="document-text" size="1.1em"></app-icon> }
                            @else if (rec.contentType === 'Quiz') { <app-icon name="check-circle" size="1.1em"></app-icon> }
                            @else { <app-icon name="folder" size="1.1em"></app-icon> }
                          </div>
                          
                          <div class="min-w-0 flex-1 space-y-0.5">
                            <h4 class="text-xs font-black text-slate-800 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {{ rec.title }}
                            </h4>
                            <span class="inline-block text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-black">
                              {{ rec.contentType === 'Video' ? 'فيديو تدريبي' : rec.contentType === 'Document' ? 'ملف شرح' : rec.contentType === 'Quiz' ? 'اختبار تجريبي' : rec.contentType }}
                            </span>
                          </div>
                        </div>
                        
                        <p class="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed pl-1 italic">
                          💡 {{ rec.reason }}
                        </p>
                      </div>

                      <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                        <span class="text-[9px] text-slate-400 dark:text-slate-500 font-black">مستوى الملاءمة: {{ (rec.relevanceScore * 100).toFixed(0) }}%</span>
                        <div class="w-20 bg-slate-150 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div class="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" [style.width.%]="rec.relevanceScore * 100"></div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .student-insights-page {
      font-family: 'Cairo', sans-serif !important;
    }
    .student-insights-page > :first-child {
      all: unset !important;
      display: flex !important;
      flex-direction: column !important;
      margin-bottom: 1.5rem !important;
      font-family: 'Cairo', sans-serif !important;
    }
    .student-insights-page > :first-child::after {
      display: none !important;
      content: none !important;
    }
    .insights-card {
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.7);
      border-radius: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.015);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host-context(.dark) .insights-card {
      background: #1e293b;
      border-color: rgba(51, 65, 85, 0.45);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    .insights-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.04);
      border-color: rgba(99, 102, 241, 0.25);
    }
    :host-context(.dark) .insights-card:hover {
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.08);
      border-color: rgba(99, 102, 241, 0.35);
    }
    .subject-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    }
    :host-context(.dark) .subject-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
      border-bottom-color: rgba(51, 65, 85, 0.35);
    }
    .text-red-650 {
      color: #dc2626;
    }
    .text-amber-650 {
      color: #d97706;
    }
    .text-blue-650 {
      color: #2563eb;
    }
    .text-slate-850 {
      color: #1e293b;
    }
    .text-slate-650 {
      color: #475569;
    }
    .text-violet-650 {
      color: #7c3aed;
    }
    .bg-slate-150 {
      background-color: #f1f5f9;
    }
  `]
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
