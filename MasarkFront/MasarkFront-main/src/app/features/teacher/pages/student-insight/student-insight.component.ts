import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { StudentInsightDto, TeachingSuggestionDto } from '../../../../models/ai-analytics.model';
import { ToastService } from '../../../../core/services/toast.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-student-insight',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-indigo-600"><app-icon name="academic-cap" size="1.2em"></app-icon></span>
              تفاصيل أداء الطالب
            </h1>
            <p class="text-sm text-slate-500 mt-1">تحليل الأداء مع اقتراحات تعليمية من الذكاء الاصطناعي</p>
          </div>
          <a routerLink="/dashboard/teacher" class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ← العودة للوحة المدرس
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-36"></div>
          }
        </div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadInsight()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- Student Info -->
        <div class="bg-gradient-to-l from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-2xl"><app-icon name="academic-cap" size="1.2em"></app-icon></div>
            <div>
              <h2 class="text-xl font-bold">{{ data()!.studentName }}</h2>
              <p class="text-indigo-200 text-sm">{{ data()!.subjectName }}</p>
            </div>
          </div>
        </div>

        <!-- Weak Topics -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span><app-icon name="clipboard" size="1.2em"></app-icon></span> نقاط الضعف المُحددة
          </h3>
          @if (data()!.weakTopics.length === 0) {
            <div class="text-center py-8">
              <span class="text-4xl block mb-2"><app-icon name="sparkles" size="1.2em"></app-icon></span>
              <p class="text-slate-500 font-medium">لم نرصد نقاط ضعف محددة لهذا الطالب في هذه المادة</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (topic of data()!.weakTopics; track topic.topicName) {
                <div class="border border-slate-100 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-slate-800">{{ topic.topicName }}</span>
                    <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                          [class.bg-red-100]="topic.errorRate >= 0.5"
                          [class.text-red-700]="topic.errorRate >= 0.5"
                          [class.bg-amber-100]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                          [class.text-amber-700]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                          [class.bg-blue-100]="topic.errorRate < 0.3"
                          [class.text-blue-700]="topic.errorRate < 0.3">
                      نسبة الخطأ: {{ (topic.errorRate * 100).toFixed(0) }}%
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2 mb-3">
                    <div class="h-2 rounded-full"
                         [class.bg-red-500]="topic.errorRate >= 0.5"
                         [class.bg-amber-500]="topic.errorRate >= 0.3 && topic.errorRate < 0.5"
                         [class.bg-blue-500]="topic.errorRate < 0.3"
                         [style.width.%]="topic.errorRate * 100"></div>
                  </div>
                  <ul class="text-xs text-slate-500 space-y-1">
                    @for (action of topic.recommendedActions; track action) {
                      <li class="flex items-start gap-1.5"><span class="text-indigo-500 mt-0.5">▸</span>{{ action }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </div>

        <!-- Active Alerts -->
        @if (data()!.activeAlerts.length > 0) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span><app-icon name="bell" size="1.2em"></app-icon></span> تنبيهات نشطة
              <span class="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{{ data()!.activeAlerts.length }}</span>
            </h3>
            <div class="space-y-3">
              @for (alert of data()!.activeAlerts; track alert.performanceAlertId) {
                <div class="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50">
                  <span class="text-lg">
                    @if (alert.alertType === 'LowAttendance') { <app-icon name="clock" size="1.2em"></app-icon> }
                    @else if (alert.alertType === 'LowExamScore') { <app-icon name="pencil" size="1.2em"></app-icon> }
                    @else { <app-icon name="clipboard" size="1.2em"></app-icon> }
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-bold text-slate-800">{{ alert.message }}</p>
                    <p class="text-xs text-slate-400">{{ alert.createdAt | date:'shortDate' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Latest Teaching Suggestion -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span><app-icon name="sparkles" size="1.2em"></app-icon></span> اقتراح تعليمي من الذكاء الاصطناعي
            </h3>
            <button (click)="generateSuggestion()"
                    [disabled]="isGenerating() || isSuggestionDegraded()"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (isGenerating()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التوليد...
              } @else {
                <app-icon name="sparkles" size="1.2em"></app-icon> توليد اقتراح جديد
              }
            </button>
          </div>

          @if (suggestion()) {
            <div class="bg-gradient-to-l from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100">
              @if (isSuggestionDegraded()) {
                <div class="mb-3 flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <app-icon name="exclamation-triangle" size="14"></app-icon>
                  تم تجاوز الحد اليومي — اقتراح مبسّط
                </div>
              }
              <p class="text-slate-700 leading-relaxed mb-4">{{ suggestion()!.suggestion }}</p>
              <h4 class="text-sm font-bold text-slate-800 mb-2">خطوات مقترحة:</h4>
              <ul class="space-y-2">
                @for (item of suggestion()!.actionItems; track item) {
                  <li class="flex items-start gap-2 text-sm text-slate-600">
                    <span class="text-indigo-500 font-bold mt-0.5"><app-icon name="check" size="1.2em"></app-icon></span>
                    {{ item }}
                  </li>
                }
              </ul>
              <p class="text-[10px] text-slate-400 mt-3">تم التوليد: {{ suggestion()!.generatedAt | date:'short' }}</p>
            </div>
          } @else {
            <div class="text-center py-8 text-slate-400">
              <span class="text-4xl block mb-2"><app-icon name="robot" size="1.2em"></app-icon></span>
              <p class="font-medium">لا يوجد اقتراح حالياً. اضغط "توليد اقتراح جديد" للحصول على نصيحة تعليمية مخصصة.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StudentInsightComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly aiService = inject(AiAnalyticsService);
  private readonly toast = inject(ToastService);

  isSuggestionDegraded = computed(() => {
    const s = this.suggestion();
    return s?.dataSource?.includes('Quota_Exceeded') ?? false;
  });

  data = signal<StudentInsightDto | null>(null);
  suggestion = signal<TeachingSuggestionDto | null>(null);
  isLoading = signal<boolean>(true);
  isGenerating = signal<boolean>(false);
  error = signal<string | null>(null);

  studentId = 0;
  subjectId = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.studentId = Number(params.get('studentId')) || 0;
      this.subjectId = Number(params.get('subjectId')) || 0;
      this.loadInsight();
    });
  }

  loadInsight(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getStudentInsightForTeacher(this.studentId, this.subjectId).subscribe({
      next: (res) => {
        this.data.set(res);
        if (res.latestSuggestion) {
          this.suggestion.set(res.latestSuggestion);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل بيانات الطالب.');
        this.isLoading.set(false);
      },
    });
  }

  generateSuggestion(): void {
    this.isGenerating.set(true);
    this.aiService.generateTeachingSuggestion(this.studentId, this.subjectId).subscribe({
      next: (res) => {
        this.suggestion.set(res);
        this.isGenerating.set(false);
        if (res.dataSource?.includes('Quota_Exceeded')) {
          this.toast.warning('تم تجاوز الحد اليومي للذكاء الاصطناعي. الاقتراح المعروض مبسّط.');
        }
      },
      error: () => {
        this.isGenerating.set(false);
      },
    });
  }
}
