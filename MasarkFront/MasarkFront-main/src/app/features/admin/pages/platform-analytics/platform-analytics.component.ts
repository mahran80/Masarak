import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { PlatformAnalyticsDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-8 pb-16 font-sans text-slate-800" dir="rtl">
      <!-- Header -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-[13px] font-semibold text-slate-400">
          <span>الرئيسية</span>
          <app-icon name="chevron-left" [size]="12"></app-icon>
          <span class="text-slate-700 font-bold">التحليلات</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#4F8CD4] shadow-sm">
            <app-icon name="building" [size]="20"></app-icon>
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-900">تحليلات المنصة</h1>
            <p class="text-[13px] font-semibold text-slate-500">نظرة شاملة على أداء المنصة والإحصائيات الرئيسية</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-5">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-pulse h-[116px]"></div>
          }
        </div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <app-icon name="exclamation-triangle" [size]="24"></app-icon>
          </div>
          <p class="text-[15px] font-bold">{{ error() }}</p>
          <button (click)="loadAnalytics()" class="mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-[13px]">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- KPI Cards — strictly white and blue with no rainbow colors -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          
          <!-- Active Students -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between hover:border-[#4F8CD4]/30 hover:shadow-md transition-all duration-200">
            <div class="flex flex-col min-w-0">
              <span class="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wide truncate">الطلاب النشطون</span>
              <span class="text-[28px] font-black text-slate-800 leading-none truncate">{{ data()!.totalActiveStudents }}</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#4F8CD4] shrink-0">
              <app-icon name="academic-cap" [size]="20"></app-icon>
            </div>
          </div>

          <!-- Teachers -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between hover:border-[#4F8CD4]/30 hover:shadow-md transition-all duration-200">
            <div class="flex flex-col min-w-0">
              <span class="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wide truncate">المعلمون</span>
              <span class="text-[28px] font-black text-slate-800 leading-none truncate">{{ data()!.totalTeachers }}</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#4F8CD4] shrink-0">
              <app-icon name="academic-cap" [size]="20"></app-icon>
            </div>
          </div>

          <!-- Active Subscriptions -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between hover:border-[#4F8CD4]/30 hover:shadow-md transition-all duration-200">
            <div class="flex flex-col min-w-0">
              <span class="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wide truncate">اشتراكات نشطة</span>
              <span class="text-[28px] font-black text-slate-800 leading-none truncate">{{ data()!.totalActiveSubscriptions }}</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#4F8CD4] shrink-0">
              <app-icon name="credit-card" [size]="20"></app-icon>
            </div>
          </div>

          <!-- Revenue -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between hover:border-[#4F8CD4]/30 hover:shadow-md transition-all duration-200">
            <div class="flex flex-col min-w-0">
              <span class="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wide truncate">إيرادات الشهر</span>
              <span class="text-[28px] font-black text-slate-800 leading-none flex items-baseline gap-1.5 truncate">
                {{ data()!.totalRevenueThisMonth.toFixed(0) }}
                <span class="text-[12px] font-bold text-slate-400">ر.س</span>
              </span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#4F8CD4] shrink-0">
              <app-icon name="wallet" [size]="20"></app-icon>
            </div>
          </div>

          <!-- Session Completion -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between hover:border-[#4F8CD4]/30 hover:shadow-md transition-all duration-200">
            <div class="flex flex-col min-w-0">
              <span class="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wide truncate">نسبة إكمال الحصص</span>
              <span class="text-[28px] font-black text-slate-800 leading-none flex items-baseline gap-1 truncate">
                {{ data()!.sessionCompletionRate.toFixed(0) }}
                <span class="text-[16px] font-bold text-slate-400">%</span>
              </span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#4F8CD4] shrink-0">
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
          </div>

        </div>

        <!-- Enrollment by Grade - Fixed text overlapping -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#4F8CD4] shadow-sm shrink-0">
              <app-icon name="users" [size]="16"></app-icon>
            </div>
            <h3 class="text-[15px] font-black text-slate-800">توزيع الطلاب حسب الصف</h3>
          </div>

          <div class="p-6">
            @if (data()!.enrollmentByGrade.length === 0) {
              <div class="py-12 flex flex-col items-center justify-center text-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <app-icon name="users" [size]="20"></app-icon>
                </div>
                <p class="text-[14px] font-bold text-slate-500">لا توجد بيانات تسجيل بعد</p>
              </div>
            } @else {
              <div class="flex flex-col gap-6">
                @for (grade of data()!.enrollmentByGrade; track grade.gradeName) {
                  <div class="flex items-center gap-4">
                    <!-- Grade Label -->
                    <span class="w-24 text-[13px] font-bold text-slate-700 shrink-0">{{ grade.gradeName }}</span>
                    
                    <!-- Progress Bar Track -->
                    <div class="flex-1 flex items-center gap-4">
                      <!-- Bar Fill Container -->
                      <div class="flex-1 bg-slate-100 rounded-full h-2.5 relative overflow-hidden shadow-inner">
                        <div class="absolute right-0 top-0 h-full bg-[#4F8CD4] rounded-full transition-all duration-700 ease-out"
                             [style.width.%]="maxEnrollment() > 0 ? (grade.studentCount / maxEnrollment() * 100) : 0">
                        </div>
                      </div>
                      
                      <!-- Value text placed strictly OUTSIDE the bar so it never clips -->
                      <span class="text-[13px] font-black text-slate-800 shrink-0 w-12 text-left">
                        {{ grade.studentCount }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Grade Heatmap Navigation - Modern Chips & Padding -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4">
          <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#4F8CD4] shadow-sm shrink-0">
                <app-icon name="globe" [size]="16"></app-icon>
              </div>
              <h3 class="text-[15px] font-black text-slate-800">خريطة حرارية حسب الصف</h3>
            </div>
            <p class="text-[12px] font-semibold text-slate-500">اختر صفاً لعرض خريطة الأداء الحرارية لجميع الفصول</p>
          </div>
          
          <div class="p-6">
            <div class="flex flex-wrap gap-3">
              @for (grade of data()!.enrollmentByGrade; track grade.gradeName; let i = $index) {
                <a [routerLink]="'/dashboard/admin/heatmap/' + (i + 1)"
                   class="group flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#4F8CD4]/40 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer no-underline">
                   <span class="text-[13px] font-bold text-slate-700 group-hover:text-[#4F8CD4] transition-colors">{{ grade.gradeName }}</span>
                  <span class="text-[11px] font-black bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 group-hover:bg-[#4F8CD4]/10 group-hover:text-[#4F8CD4] group-hover:border-[#4F8CD4]/20 transition-all">{{ grade.studentCount }} طالب</span>
                </a>
              }
            </div>
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
