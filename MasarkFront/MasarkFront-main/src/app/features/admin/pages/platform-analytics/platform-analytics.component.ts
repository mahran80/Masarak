import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { PlatformAnalyticsDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span class="text-blue-600">🏢</span>
          تحليلات المنصة
        </h1>
        <p class="text-sm text-slate-500 mt-1">نظرة شاملة على أداء المنصة والإحصائيات الرئيسية</p>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-32"></div>
          }
        </div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block">⚠️</span>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadAnalytics()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Active Students -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6"></div>
            <div class="relative z-10">
              <p class="text-blue-100 text-xs font-bold mb-2">الطلاب النشطون</p>
              <p class="text-3xl font-black">{{ data()!.totalActiveStudents }}</p>
              <span class="text-xl mt-2 block">👨‍🎓</span>
            </div>
          </div>

          <!-- Teachers -->
          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6"></div>
            <div class="relative z-10">
              <p class="text-emerald-100 text-xs font-bold mb-2">المعلمون</p>
              <p class="text-3xl font-black">{{ data()!.totalTeachers }}</p>
              <span class="text-xl mt-2 block">👩‍🏫</span>
            </div>
          </div>

          <!-- Active Subscriptions -->
          <div class="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6"></div>
            <div class="relative z-10">
              <p class="text-violet-100 text-xs font-bold mb-2">اشتراكات نشطة</p>
              <p class="text-3xl font-black">{{ data()!.totalActiveSubscriptions }}</p>
              <span class="text-xl mt-2 block">💳</span>
            </div>
          </div>

          <!-- Revenue -->
          <div class="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6"></div>
            <div class="relative z-10">
              <p class="text-amber-100 text-xs font-bold mb-2">إيرادات الشهر</p>
              <p class="text-2xl font-black">{{ data()!.totalRevenueThisMonth.toFixed(0) }}<span class="text-sm"> ج.م</span></p>
              <span class="text-xl mt-2 block">💰</span>
            </div>
          </div>

          <!-- Session Completion -->
          <div class="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-6 -translate-y-6"></div>
            <div class="relative z-10">
              <p class="text-rose-100 text-xs font-bold mb-2">نسبة إكمال الحصص</p>
              <p class="text-3xl font-black">{{ data()!.sessionCompletionRate.toFixed(0) }}%</p>
              <span class="text-xl mt-2 block">📅</span>
            </div>
          </div>
        </div>

        <!-- Enrollment by Grade -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span>🏫</span> توزيع الطلاب حسب الصف
          </h3>
          @if (data()!.enrollmentByGrade.length === 0) {
            <p class="text-sm text-slate-400 text-center py-6">لا توجد بيانات تسجيل بعد</p>
          } @else {
            <div class="space-y-3">
              @for (grade of data()!.enrollmentByGrade; track grade.gradeName) {
                <div class="flex items-center gap-4">
                  <span class="w-28 text-sm font-bold text-slate-700 shrink-0">{{ grade.gradeName }}</span>
                  <div class="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div class="h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-full flex items-center justify-end pr-2 transition-all"
                         [style.width.%]="maxEnrollment() > 0 ? (grade.studentCount / maxEnrollment() * 100) : 5"
                         [style.min-width.px]="32">
                      <span class="text-[10px] text-white font-black">{{ grade.studentCount }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Grade Heatmap Navigation -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🗺️</span> خريطة حرارية حسب الصف
          </h3>
          <p class="text-sm text-slate-500 mb-4">اختر صفاً لعرض خريطة الأداء الحرارية لجميع الفصول والمواد</p>
          <div class="flex flex-wrap gap-3">
            @for (grade of data()!.enrollmentByGrade; track grade.gradeName; let i = $index) {
              <a [routerLink]="'/dashboard/admin/heatmap/' + (i + 1)"
                 class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-sm font-bold text-slate-700 hover:text-blue-700 transition-all">
                🏫 {{ grade.gradeName }}
                <span class="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{{ grade.studentCount }} طالب</span>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class PlatformAnalyticsComponent implements OnInit {
  private readonly aiService = inject(AiAnalyticsService);

  data = signal<PlatformAnalyticsDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  maxEnrollment = signal<number>(1);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getPlatformAnalytics().subscribe({
      next: (res) => {
        this.data.set(res);
        const max = Math.max(...res.enrollmentByGrade.map((g) => g.studentCount), 1);
        this.maxEnrollment.set(max);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل تحليلات المنصة.');
        this.isLoading.set(false);
      },
    });
  }
}
