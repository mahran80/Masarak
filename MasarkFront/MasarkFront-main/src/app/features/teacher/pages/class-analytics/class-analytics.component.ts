import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { ClassAnalyticsDashboardDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-class-analytics',
  standalone: true,
  imports: [BreadcrumbComponent, IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <app-breadcrumb [items]="[
        { label: 'لوحة المدرس', route: '/dashboard/teacher' },
        { label: 'الصفوف', route: '/dashboard/teacher/classes' },
        { label: 'تحليلات الفصل' }
      ]"></app-breadcrumb>
      
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-emerald-600"><app-icon name="chart" size="1.2em"></app-icon></span>
              تحليلات الفصل
            </h1>
            <p class="text-sm text-slate-500 mt-1">عرض شامل لأداء الفصل والطلاب</p>
          </div>
          <a routerLink="/dashboard/teacher" class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ← العودة للوحة المدرس
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-40"></div>
          }
        </div>
      }

      <!-- Error -->
      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
          <h3 class="font-bold text-lg mb-1">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadAnalytics()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- KPI Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Class Average -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p class="text-xs text-slate-500 font-bold mb-2">متوسط الفصل</p>
            <p class="text-3xl font-black"
               [class.text-emerald-600]="data()!.classAverage >= 80"
               [class.text-blue-600]="data()!.classAverage >= 60 && data()!.classAverage < 80"
               [class.text-amber-600]="data()!.classAverage >= 40 && data()!.classAverage < 60"
               [class.text-red-600]="data()!.classAverage < 40">
              {{ data()!.classAverage.toFixed(1) }}%
            </p>
          </div>
          <!-- Class Name -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p class="text-xs text-slate-500 font-bold mb-2">الفصل</p>
            <p class="text-lg font-bold text-slate-800">{{ data()!.className }}</p>
            <p class="text-xs text-slate-400">{{ data()!.subjectName }}</p>
          </div>
          <!-- Sessions -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p class="text-xs text-slate-500 font-bold mb-2">الحصص المُنجزة</p>
            <p class="text-2xl font-black text-blue-600">{{ data()!.sessionsCompleted }}<span class="text-sm text-slate-400">/{{ data()!.sessionsScheduled }}</span></p>
          </div>
          <!-- Completion Rate -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p class="text-xs text-slate-500 font-bold mb-2">نسبة الإنجاز</p>
            <p class="text-2xl font-black text-violet-600">{{ sessionRate().toFixed(0) }}%</p>
          </div>
        </div>

        <!-- Score Distribution -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2">
            <span><app-icon name="chart" size="1.2em"></app-icon></span> توزيع الدرجات
          </h3>
          <div class="flex items-end gap-3 h-40">
            @for (bucket of data()!.distribution; track bucket.label) {
              <div class="flex-1 flex flex-col items-center gap-2">
                <span class="text-xs font-bold text-slate-600">{{ bucket.count }}</span>
                <div class="w-full rounded-t-lg transition-all"
                     [class.bg-red-400]="bucket.label === '0-20'"
                     [class.bg-orange-400]="bucket.label === '20-40'"
                     [class.bg-amber-400]="bucket.label === '40-60'"
                     [class.bg-blue-400]="bucket.label === '60-80'"
                     [class.bg-emerald-400]="bucket.label === '80-100'"
                     [style.height.%]="maxDistCount() > 0 ? (bucket.count / maxDistCount() * 100) : 5"
                     [style.min-height.px]="8"></div>
                <span class="text-[10px] text-slate-400 font-bold">{{ bucket.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Top 5 / Bottom 5 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Top 5 -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <span><app-icon name="trophy" size="1.2em"></app-icon></span> أفضل 5 طلاب
            </h3>
            <div class="space-y-3">
              @for (student of data()!.topFive; track student.studentUserId; let i = $index) {
                <div class="flex items-center gap-3 p-3 rounded-xl"
                     [class.bg-amber-50]="i === 0"
                     [class.border]="i === 0"
                     [class.border-amber-200]="i === 0"
                     [class.bg-slate-50]="i !== 0">
                  <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black"
                        [class.bg-amber-500]="i === 0"
                        [class.text-white]="i === 0"
                        [class.bg-slate-200]="i !== 0"
                        [class.text-slate-600]="i !== 0">
                    {{ i + 1 }}
                  </span>
                  <span class="flex-1 text-sm font-bold text-slate-800">{{ student.studentName }}</span>
                  <span class="text-sm font-black text-emerald-600">{{ student.averageScore.toFixed(1) }}%</span>
                </div>
              }
              @if (data()!.topFive.length === 0) {
                <p class="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>
              }
            </div>
          </div>

          <!-- Bottom 5 -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <span><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span> أقل 5 طلاب (يحتاجون دعم)
            </h3>
            <div class="space-y-3">
              @for (student of data()!.bottomFive; track student.studentUserId; let i = $index) {
                <div class="flex items-center gap-3 p-3 rounded-xl bg-red-50/50">
                  <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black bg-red-100 text-red-600">
                    {{ i + 1 }}
                  </span>
                  <span class="flex-1 text-sm font-bold text-slate-800">{{ student.studentName }}</span>
                  <span class="text-sm font-black text-red-600">{{ student.averageScore.toFixed(1) }}%</span>
                </div>
              }
              @if (data()!.bottomFive.length === 0) {
                <p class="text-sm text-slate-400 text-center py-4">لا توجد بيانات</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ClassAnalyticsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly aiService = inject(AiAnalyticsService);

  data = signal<ClassAnalyticsDashboardDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  classId = 0;
  subjectId = 0;

  maxDistCount = signal<number>(1);

  sessionRate = signal<number>(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.classId = Number(params.get('classId')) || 0;
      this.subjectId = Number(params.get('subjectId')) || 0;
      this.loadAnalytics();
    });
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getClassAnalytics(this.classId, this.subjectId).subscribe({
      next: (res) => {
        this.data.set(res);
        const maxCount = Math.max(...res.distribution.map((d) => d.count), 1);
        this.maxDistCount.set(maxCount);
        const rate = res.sessionsScheduled > 0 ? (res.sessionsCompleted / res.sessionsScheduled) * 100 : 0;
        this.sessionRate.set(rate);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل تحليلات الفصل. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      },
    });
  }
}
