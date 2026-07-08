import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { ParentReportDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-smart-report',
  standalone: true,
  imports: [IconComponent, CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span class="text-blue-600"><app-icon name="chart" size="1.2em"></app-icon></span>
            التقارير الذكية
          </h1>
          <p class="text-sm text-slate-500 mt-1">تقرير الأداء الشامل المدعوم بالذكاء الاصطناعي</p>
        </div>
        
        <div class="flex items-center gap-3">
          <select 
            [value]="selectedMonth()" 
            (change)="onMonthChange($event)"
            class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="2026-01">يناير 2026</option>
            <option value="2026-02">فبراير 2026</option>
            <option value="2026-03">مارس 2026</option>
            <option value="2026-04">أبريل 2026</option>
            <option value="2026-05">مايو 2026</option>
            <option value="2026-06">يونيو 2026</option>
            <option value="2026-07">يوليو 2026</option>
            <option value="2026-08">أغسطس 2026</option>
            <option value="2026-09">سبتمبر 2026</option>
            <option value="2026-10">أكتوبر 2026</option>
            <option value="2026-11">نوفمبر 2026</option>
            <option value="2026-12">ديسمبر 2026</option>
          </select>
          <button 
            (click)="generateReport()"
            [disabled]="isGenerating()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2"
          >
            @if (isGenerating()) {
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري التوليد...
            } @else {
              <span><app-icon name="sparkles" size="1.2em"></app-icon></span> توليد التقرير
            }
          </button>
        </div>
      </div>

      <!-- State: Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64">
            <div class="w-1/3 h-6 bg-slate-200 rounded mb-4"></div>
            <div class="space-y-3">
              <div class="w-full h-4 bg-slate-100 rounded"></div>
              <div class="w-full h-4 bg-slate-100 rounded"></div>
              <div class="w-3/4 h-4 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div class="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64"></div>
        </div>
      } 
      
      <!-- State: Error -->
      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
          <h3 class="font-bold text-lg mb-1">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadReport()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      <!-- State: Empty (No Report Found) -->
      @else if (!report()) {
        <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
          <div class="text-5xl mb-4 opacity-50"><app-icon name="document-text" size="1.2em"></app-icon></div>
          <h3 class="text-lg font-bold text-slate-700 mb-2">لا يوجد تقرير لهذا الشهر</h3>
          <p class="text-slate-500 mb-6 max-w-sm mx-auto">لم يتم العثور على تقرير للطالب في الشهر المحدد. يمكنك توليد تقرير جديد باستخدام الزر أعلاه.</p>
        </div>
      }

      <!-- State: Loaded Report -->
      @else if (report(); as r) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1: AI Summary & Actions -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div class="absolute top-0 right-0 p-8 opacity-10">
                <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
              </div>
              <div class="relative z-10">
                <div class="flex items-center gap-2 mb-4 text-blue-100 text-sm font-medium">
                  <span><app-icon name="sparkles" size="1.2em"></app-icon></span> ملخص الذكاء الاصطناعي
                  <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-auto">تم التوليد: {{ r.generatedAt | date:'shortDate' }}</span>
                </div>
                <p class="text-lg leading-relaxed">{{ r.aiNarrative }}</p>
              </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span><app-icon name="book-open" size="1.2em"></app-icon></span> تفاصيل المواد والتحليل الفردي
              </h3>
              <div class="space-y-6">
                @for (sub of r.subjects; track sub.subjectName) {
                  <div class="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors bg-white shadow-sm">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                      <div class="flex items-center gap-3">
                        <h4 class="font-bold text-slate-800 text-xl">{{ sub.subjectName }}</h4>
                        <span class="px-3 py-1 rounded-full text-xs font-bold border"
                              [class.bg-emerald-50]="sub.performanceLevel === 'Strong'"
                              [class.text-emerald-700]="sub.performanceLevel === 'Strong'"
                              [class.border-emerald-200]="sub.performanceLevel === 'Strong'"
                              [class.bg-blue-50]="sub.performanceLevel === 'Average'"
                              [class.text-blue-700]="sub.performanceLevel === 'Average'"
                              [class.border-blue-200]="sub.performanceLevel === 'Average'"
                              [class.bg-orange-50]="sub.performanceLevel === 'NeedsImprovement'"
                              [class.text-orange-700]="sub.performanceLevel === 'NeedsImprovement'"
                              [class.border-orange-200]="sub.performanceLevel === 'NeedsImprovement'"
                              [class.bg-red-50]="sub.performanceLevel === 'AtRisk'"
                              [class.text-red-700]="sub.performanceLevel === 'AtRisk'"
                              [class.border-red-200]="sub.performanceLevel === 'AtRisk'">
                           @if(sub.performanceLevel === 'Strong') { ممتاز }
                           @else if(sub.performanceLevel === 'Average') { جيد }
                           @else if(sub.performanceLevel === 'NeedsImprovement') { يحتاج تحسين }
                           @else { في خطر }
                        </span>
                      </div>
                      <div class="text-right">
                        <span class="font-bold text-2xl block" 
                              [class.text-emerald-600]="sub.averageScore >= 85"
                              [class.text-blue-600]="sub.averageScore >= 70 && sub.averageScore < 85"
                              [class.text-orange-600]="sub.averageScore >= 50 && sub.averageScore < 70"
                              [class.text-red-600]="sub.averageScore < 50">
                          {{ sub.averageScore }}%
                        </span>
                        <span class="text-xs font-medium text-slate-500">حضور: {{ sub.attendancePercentage }}%</span>
                      </div>
                    </div>
                    
                    <!-- AI Narrative -->
                    <div class="text-slate-700 text-sm bg-gradient-to-l from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-100/50 mb-5 leading-relaxed relative overflow-hidden">
                      <div class="absolute -left-2 -top-2 text-4xl opacity-10"><app-icon name="sparkles" size="1.2em"></app-icon></div>
                      <span class="font-bold text-indigo-800 block mb-1 text-xs">رأي الذكاء الاصطناعي:</span>
                      {{ sub.aiSubjectNarrative }}
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <!-- Weaknesses -->
                      @if (sub.weakLessons && sub.weakLessons.length > 0) {
                        <div>
                          <h5 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <span><app-icon name="chart" size="1.2em"></app-icon></span> المهارات التي تحتاج تعزيز
                          </h5>
                          <div class="space-y-2">
                            @for (wl of sub.weakLessons; track wl.lessonTitle) {
                              <div class="bg-white rounded-lg p-3 border border-red-100 shadow-sm relative overflow-hidden">
                                <div class="absolute right-0 top-0 bottom-0 w-1 bg-red-400"></div>
                                <div class="flex justify-between items-center mb-1.5 pl-2">
                                  <span class="font-bold text-slate-800 text-sm">{{ wl.lessonTitle }}</span>
                                  <span class="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded-md">{{ wl.masteryPercentage }}% إتقان</span>
                                </div>
                                @if (wl.weakTopics && wl.weakTopics.length > 0) {
                                  <div class="flex flex-wrap gap-1.5 mt-2 pl-2">
                                    @for (topic of wl.weakTopics; track topic) {
                                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {{ topic }}
                                      </span>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      }

                      <!-- Recommendations -->
                      @if (sub.recommendations && sub.recommendations.length > 0) {
                        <div>
                          <h5 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <span><app-icon name="sparkles" size="1.2em"></app-icon></span> خطة التحسين المقترحة
                          </h5>
                          <ul class="space-y-2.5">
                            @for (rec of sub.recommendations; track rec) {
                              <li class="flex items-start gap-2.5 text-sm text-slate-700 bg-white p-3 rounded-lg border border-emerald-100/50 shadow-sm">
                                <span class="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                                  <i class="fa-solid fa-check text-[10px]"></i>
                                </span>
                                <span class="leading-relaxed">{{ rec }}</span>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Column 2: Overview Stats -->
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
              <h3 class="text-slate-500 font-semibold mb-2">المتوسط العام</h3>
              <div class="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 mb-4"
                   [class.border-emerald-500]="r.overallScore >= 85"
                   [class.border-blue-500]="r.overallScore >= 70 && r.overallScore < 85"
                   [class.border-orange-500]="r.overallScore >= 50 && r.overallScore < 70"
                   [class.border-red-500]="r.overallScore < 50">
                <span class="text-4xl font-bold text-slate-800">{{ r.overallScore }}<span class="text-xl text-slate-500">%</span></span>
              </div>
              <p class="text-sm font-medium"
                   [class.text-emerald-600]="r.overallScore >= 85"
                   [class.text-blue-600]="r.overallScore >= 70 && r.overallScore < 85"
                   [class.text-orange-600]="r.overallScore >= 50 && r.overallScore < 70"
                   [class.text-red-600]="r.overallScore < 50">
                @if (r.overallScore >= 85) { ممتاز }
                @else if (r.overallScore >= 70) { جيد جداً }
                @else if (r.overallScore >= 50) { متوسط }
                @else { يحتاج إلى تحسين }
              </p>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-slate-500 font-semibold">معدل الحضور العام</h3>
                <span class="text-2xl"><app-icon name="calendar" size="1.2em"></app-icon></span>
              </div>
              <div class="text-3xl font-bold text-slate-800 mb-2">{{ r.attendancePercentage }}%</div>
              <div class="w-full bg-slate-100 rounded-full h-2.5">
                <div class="bg-blue-600 h-2.5 rounded-full" [style.width.%]="r.attendancePercentage"></div>
              </div>
            </div>
            
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
               <h3 class="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">معلومات التقرير</h3>
               <div class="space-y-2 text-sm">
                 <div class="flex justify-between">
                   <span class="text-slate-500">الطالب:</span>
                   <span class="font-medium text-slate-800">{{ r.studentName }}</span>
                 </div>
                 <div class="flex justify-between">
                   <span class="text-slate-500">الشهر:</span>
                   <span class="font-medium text-slate-800">{{ r.reportMonth }}</span>
                 </div>
               </div>
            </div>
          </div>
          
        </div>
      }
    </div>
  `
})
export class SmartReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private aiService = inject(AiAnalyticsService);

  studentId = signal<number>(0);
  
  // To handle YYYY-MM
  selectedMonth = signal<string>(this.getCurrentMonth());
  
  report = signal<ParentReportDto | null>(null);
  isLoading = signal<boolean>(false);
  isGenerating = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('studentId');
      const month = params.get('month');
      
      if (id) {
        this.studentId.set(Number(id));
        if (month) {
          this.selectedMonth.set(month);
        }
        this.loadReport();
      }
    });
  }

  getCurrentMonth(): string {
    const d = new Date();
    // Default to a month in 2026 based on mock data availability, or current date if needed
    // Let's use 2026-04 as a default to match dummy data ranges
    return '2026-04';
  }

  onMonthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.selectedMonth.set(target.value);
      this.router.navigate(['/dashboard/parent/reports', this.studentId(), target.value]);
    }
  }

  loadReport() {
    this.isLoading.set(true);
    this.error.set(null);
    this.report.set(null);

    this.aiService.getParentReport(this.studentId(), this.selectedMonth()).subscribe({
      next: (res) => {
        this.report.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400) {
          // No report found for this month - this is an expected empty state
          this.report.set(null);
        } else {
          this.error.set('تعذر تحميل التقرير. يرجى المحاولة مرة أخرى.');
        }
        this.isLoading.set(false);
      }
    });
  }

  generateReport() {
    this.isGenerating.set(true);
    this.error.set(null);

    this.aiService.generateParentReport(this.studentId(), { 
      reportMonth: this.selectedMonth() 
    }).subscribe({
      next: (res) => {
        this.report.set(res);
        this.isGenerating.set(false);
      },
      error: () => {
        this.error.set('فشل توليد التقرير بسبب مشكلة في السيرفر أو اشتراك غير فعال.');
        this.isGenerating.set(false);
      }
    });
  }
}
