import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { ParentReportDto } from '../../../../models/ai-analytics.model';

const AR = {
  PAGE_BADGE: "التقارير الذكية",
  PAGE_TITLE: "التقارير الذكية",
  PAGE_DESC: "تقرير الأداء الشامل المدعوم بالذكاء الاصطناعي",
  GENERATE_BTN: "توليد التقرير",
  GENERATING_BTN: "جاري التوليد...",
  ERROR_TITLE: "عذراً، حدث خطأ",
  RETRY_BTN: "إعادة المحاولة",
  EMPTY_TITLE: "لم يتم توليد التقرير بعد",
  EMPTY_DESC: "اختر الشهر ثم اضغط على توليد التقرير لعرض التحليل الأكاديمي الشامل.",
  AI_SUMMARY_TITLE: "ملخص الذكاء الاصطناعي",
  AI_GENERATED_AT: "تم التوليد بتاريخ:",
  SUBJECTS_SECTION_TITLE: "تفاصيل المواد والتحليل الفردي",
  SUBJECTS_SECTION_DESC: "تحليل أداء الطالب في كل مادة مع نقاط القوة والجوانب التي تحتاج إلى تعزيز.",
  AI_OPINION_LABEL: "رأي الذكاء الاصطناعي:",
  STRENGTHS_LABEL: "المهارات التي تميز بها",
  WEAKNESSES_LABEL: "المهارات التي تحتاج تعزيز",
  RECS_LABEL: "خطة التحسين المقترحة",
  OVERALL_AVG: "المتوسط العام",
  ATTENDANCE_AVG: "معدل الحضور العام",
  REPORT_INFO: "معلومات التقرير",
  STUDENT_LABEL: "الطالب:",
  MONTH_LABEL: "الشهر:",
  GENERATED_AT_LABEL: "تاريخ التوليد:",
  STATUS_LABEL: "حالة التقرير:",
  MASTERY_LABEL: "إتقان",
  PERF_STRONG: "ممتاز",
  PERF_AVERAGE: "جيد",
  PERF_NEEDS_IMPROVEMENT: "يحتاج تحسين",
  PERF_AT_RISK: "في خطر",
  PERF_OVERALL_STRONG: "ممتاز",
  PERF_OVERALL_AVERAGE: "جيد جداً",
  PERF_OVERALL_NEEDS_IMPROVEMENT: "متوسط",
  PERF_OVERALL_AT_RISK: "يحتاج إلى تحسين",
  ATTENDANCE_LABEL: "الحضور:",
};

const EN = {
  PAGE_BADGE: "Smart Reports",
  PAGE_TITLE: "Smart Reports",
  PAGE_DESC: "Comprehensive academic performance analysis powered by AI.",
  GENERATE_BTN: "Generate Report",
  GENERATING_BTN: "Generating...",
  ERROR_TITLE: "Oops! An error occurred",
  RETRY_BTN: "Retry",
  EMPTY_TITLE: "No report generated yet",
  EMPTY_DESC: "Select the month and click on Generate Report to view the detailed academic analysis.",
  AI_SUMMARY_TITLE: "AI Smart Narrative",
  AI_GENERATED_AT: "Generated at:",
  SUBJECTS_SECTION_TITLE: "Subject Details & Performance Analysis",
  SUBJECTS_SECTION_DESC: "Analysis of the student's performance in each subject, showcasing strengths and improvement plans.",
  AI_OPINION_LABEL: "AI Feedback:",
  STRENGTHS_LABEL: "Mastered Skills",
  WEAKNESSES_LABEL: "Skills Requiring Support",
  RECS_LABEL: "Proposed Improvement Plan",
  OVERALL_AVG: "Overall Average",
  ATTENDANCE_AVG: "Overall Attendance",
  REPORT_INFO: "Report Information",
  STUDENT_LABEL: "Student:",
  MONTH_LABEL: "Month:",
  GENERATED_AT_LABEL: "Generated on:",
  STATUS_LABEL: "Report Status:",
  MASTERY_LABEL: "mastery",
  PERF_STRONG: "Excellent",
  PERF_AVERAGE: "Good",
  PERF_NEEDS_IMPROVEMENT: "Needs Improvement",
  PERF_AT_RISK: "At Risk",
  PERF_OVERALL_STRONG: "Excellent",
  PERF_OVERALL_AVERAGE: "Very Good",
  PERF_OVERALL_NEEDS_IMPROVEMENT: "Average",
  PERF_OVERALL_AT_RISK: "Needs Improvement",
  ATTENDANCE_LABEL: "Attendance:",
};

@Component({
  selector: 'app-smart-report',
  standalone: true,
  imports: [IconComponent, CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in pb-12 w-full text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'" [attr.dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- 1. Report Page Hero / Toolbar -->
      <div class="relative overflow-hidden rounded-[24px] border border-blue-100/50 dark:border-slate-800/80 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-slate-900/40 dark:to-slate-800/30 p-6 md:p-8 shadow-[0_8px_30px_rgba(37,99,235,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- Decorative Blurs -->
        <div class="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="space-y-3 max-w-2xl relative z-10 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
          <!-- Badge -->
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/30 uppercase tracking-wider">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {{ t().PAGE_BADGE }}
          </span>
          <!-- Title & Desc -->
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {{ t().PAGE_TITLE }}
          </h1>
          <p class="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ t().PAGE_DESC }}
          </p>
        </div>

        <!-- Toolbar Controls -->
        <div class="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full lg:w-auto">
          <div class="relative w-full sm:w-[200px]">
            <select 
              [value]="selectedMonth()" 
              (change)="onMonthChange($event)"
              class="w-full h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 shadow-sm font-bold text-sm cursor-pointer appearance-none"
            >
              <option value="2026-01">{{ lang() === 'ar' ? 'يناير 2026' : 'January 2026' }}</option>
              <option value="2026-02">{{ lang() === 'ar' ? 'فبراير 2026' : 'February 2026' }}</option>
              <option value="2026-03">{{ lang() === 'ar' ? 'مارس 2026' : 'March 2026' }}</option>
              <option value="2026-04">{{ lang() === 'ar' ? 'أبريل 2026' : 'April 2026' }}</option>
              <option value="2026-05">{{ lang() === 'ar' ? 'مايو 2026' : 'May 2026' }}</option>
              <option value="2026-06">{{ lang() === 'ar' ? 'يونيو 2026' : 'June 2026' }}</option>
              <option value="2026-07">{{ lang() === 'ar' ? 'يوليو 2026' : 'July 2026' }}</option>
              <option value="2026-08">{{ lang() === 'ar' ? 'أغسطس 2026' : 'August 2026' }}</option>
              <option value="2026-09">{{ lang() === 'ar' ? 'سبتمبر 2026' : 'September 2026' }}</option>
              <option value="2026-10">{{ lang() === 'ar' ? 'أكتوبر 2026' : 'October 2026' }}</option>
              <option value="2026-11">{{ lang() === 'ar' ? 'نوفمبر 2026' : 'November 2026' }}</option>
              <option value="2026-12">{{ lang() === 'ar' ? 'ديسمبر 2026' : 'December 2026' }}</option>
            </select>
            <span class="absolute inset-y-0 flex items-center pointer-events-none text-slate-400 dark:text-slate-600" [class.left-3]="lang() === 'ar'" [class.right-3]="lang() === 'en'">
              <app-icon name="calendar" size="16"></app-icon>
            </span>
          </div>

          <button 
            (click)="generateReport()"
            [disabled]="isGenerating() || isLoading()"
            class="btn-generate-report w-full sm:w-auto flex items-center justify-center gap-2"
          >
            @if (isGenerating()) {
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ t().GENERATING_BTN }}</span>
            } @else {
              <app-icon name="sparkles" size="16"></app-icon>
              <span>{{ t().GENERATE_BTN }}</span>
            }
          </button>
        </div>
      </div>

      <!-- State: Loading -->
      @if (isLoading()) {
        <div class="space-y-6">
          <div class="h-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[22px] animate-pulse"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"></div>
            <div class="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"></div>
            <div class="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse"></div>
          </div>
          <div class="h-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[22px] animate-pulse"></div>
        </div>
      } 
      
      <!-- State: Error -->
      @else if (error()) {
        <div class="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-center flex flex-col items-center">
          <span class="text-3xl mb-2 text-red-500"><app-icon name="exclamation-triangle" size="1.2em"></app-icon></span>
          <h3 class="font-black text-lg mb-1">{{ t().ERROR_TITLE }}</h3>
          <p class="text-sm mb-4 font-bold">{{ error() }}</p>
          <button (click)="loadReport()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95">
            {{ t().RETRY_BTN }}
          </button>
        </div>
      }

      <!-- State: Empty (No Report Found) -->
      @else if (!report()) {
        <div class="w-full flex items-center justify-center py-12">
          <div class="empty-state-card text-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.02)] max-w-lg flex flex-col items-center">
            <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <app-icon name="document-text" size="24"></app-icon>
            </div>
            <h3 class="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
              {{ t().EMPTY_TITLE }}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-8 leading-relaxed max-w-xs font-bold">
              {{ t().EMPTY_DESC }}
            </p>
            <button (click)="generateReport()" [disabled]="isGenerating()" class="btn-generate-report flex items-center justify-center gap-2">
              @if (isGenerating()) {
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ t().GENERATING_BTN }}</span>
              } @else {
                <app-icon name="sparkles" size="14"></app-icon>
                <span>{{ t().GENERATE_BTN }}</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- State: Loaded Report -->
      @else if (report(); as r) {
        <!-- 2. AI Report Summary -->
        <div class="relative overflow-hidden rounded-[22px] border border-blue-500/10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-[0_12px_36px_rgba(79,70,229,0.18)]">
          <!-- Translucent Overlay / Decoration -->
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none"></div>
          <div class="absolute -left-8 -top-8 text-white/5 pointer-events-none">
            <app-icon name="sparkles" size="160"></app-icon>
          </div>
          
          <div class="relative z-10 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div class="flex items-center gap-2.5 font-bold text-sm text-blue-100">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shadow-sm">
                  <app-icon name="sparkles" size="16"></app-icon>
                </div>
                <span class="text-base font-extrabold text-white">{{ t().AI_SUMMARY_TITLE }}</span>
              </div>
              <span class="text-xs bg-white/15 px-3 py-1 rounded-full font-semibold border border-white/10">
                {{ t().AI_GENERATED_AT }} {{ r.generatedAt | date:'shortDate' }}
              </span>
            </div>
            <p class="text-sm md:text-base leading-relaxed text-blue-50/95 font-semibold text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              {{ r.aiNarrative }}
            </p>
          </div>
        </div>

        <!-- 3. Performance Summary Grid -->
        <div class="performance-summary-grid">
          <!-- Card 1: General Average -->
          <div class="performance-card flex flex-col justify-between p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {{ t().OVERALL_AVG }}
              </span>
              <div class="card-icon-circle bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <app-icon name="chart" size="20"></app-icon>
              </div>
            </div>
            
            <div class="flex items-center gap-6">
              <div class="relative flex items-center justify-center w-20 h-20 shrink-0">
                <!-- Semi-radial boundary color indicator -->
                <div class="absolute inset-0 rounded-full border-[6px]"
                     [class.border-red-500]="r.overallScore < 50"
                     [class.border-orange-500]="r.overallScore >= 50 && r.overallScore < 70"
                     [class.border-blue-500]="r.overallScore >= 70 && r.overallScore < 85"
                     [class.border-emerald-500]="r.overallScore >= 85">
                </div>
                <div class="absolute inset-1.5 rounded-full bg-white dark:bg-slate-900"></div>
                <span class="relative z-10 font-black text-lg text-slate-800 dark:text-slate-100">
                  {{ r.overallScore }}%
                </span>
              </div>
              
              <div class="space-y-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                <div class="text-2xl font-black text-slate-900 dark:text-white">{{ r.overallScore }}%</div>
                <p class="text-xs font-bold"
                   [class.text-red-500]="r.overallScore < 50"
                   [class.text-orange-500]="r.overallScore >= 50 && r.overallScore < 70"
                   [class.text-blue-500]="r.overallScore >= 70 && r.overallScore < 85"
                   [class.text-emerald-500]="r.overallScore >= 85">
                  @if (r.overallScore >= 85) { {{ t().PERF_OVERALL_STRONG }} }
                  @else if (r.overallScore >= 70) { {{ t().PERF_OVERALL_AVERAGE }} }
                  @else if (r.overallScore >= 50) { {{ t().PERF_OVERALL_NEEDS_IMPROVEMENT }} }
                  @else { {{ t().PERF_OVERALL_AT_RISK }} }
                </p>
              </div>
            </div>
          </div>

          <!-- Card 2: Attendance Average -->
          <div class="performance-card flex flex-col justify-between p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {{ t().ATTENDANCE_AVG }}
              </span>
              <div class="card-icon-circle bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <app-icon name="calendar" size="20"></app-icon>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="text-3xl font-black text-slate-900 dark:text-white">{{ r.attendancePercentage }}%</div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500" 
                     [class.bg-red-500]="r.attendancePercentage < 50"
                     [class.bg-amber-500]="r.attendancePercentage >= 50 && r.attendancePercentage < 75"
                     [class.bg-emerald-500]="r.attendancePercentage >= 75"
                     [style.width.%]="r.attendancePercentage">
                </div>
              </div>
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                {{ r.attendancePercentage >= 75 ? (lang() === 'ar' ? 'حضور ممتاز' : 'Excellent Attendance') : (lang() === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement') }}
              </p>
            </div>
          </div>

          <!-- Card 3: Report Info -->
          <div class="performance-card p-6 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <span class="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {{ t().REPORT_INFO }}
              </span>
              <div class="card-icon-circle bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <app-icon name="document-text" size="20"></app-icon>
              </div>
            </div>
            
            <div class="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div class="flex justify-between items-center">
                <span class="text-slate-400 dark:text-slate-500">{{ t().STUDENT_LABEL }}</span>
                <span class="font-extrabold text-slate-800 dark:text-slate-200">{{ r.studentName }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 dark:text-slate-500">{{ t().MONTH_LABEL }}</span>
                <span class="font-extrabold text-slate-800 dark:text-slate-200">{{ r.reportMonth }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 dark:text-slate-500">{{ t().STATUS_LABEL }}</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ lang() === 'ar' ? 'معتمد' : 'Verified' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Subjects Analysis Section -->
        <section class="subjects-section space-y-4 animate-section-fade">
          <div class="subjects-section__header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111E33] border border-slate-100 dark:border-slate-800/80 rounded-[18px] md:rounded-[20px] p-5 md:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.01)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
            <div class="subjects-section__heading flex items-start gap-4">
              <!-- Icon Container -->
              <div class="subjects-section__icon shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/8 text-[#2563EB] dark:from-blue-500/20 dark:to-purple-500/16 dark:text-[#93C5FD]">
                <app-icon name="book-open" size="20"></app-icon>
              </div>

              <div class="space-y-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                <h2 class="text-[20px] md:text-[24px] font-black text-slate-900 dark:text-white leading-tight m-0">
                  {{ t().SUBJECTS_SECTION_TITLE }}
                </h2>
                <!-- Accent Line -->
                <div class="accent-line h-[3px] w-12 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] my-2" [class.mr-0]="lang() === 'ar'" [class.ml-0]="lang() === 'en'" [class.ml-auto]="lang() === 'ar'" [class.mr-auto]="lang() === 'en'"></div>
                <p class="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 leading-[1.7] max-w-[720px] m-0">
                  {{ t().SUBJECTS_SECTION_DESC }}
                </p>
              </div>
            </div>
            
            <!-- Subject Count Badge -->
            @if (r.subjects && r.subjects.length > 0) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/30 uppercase tracking-wide">
                <span>{{ r.subjects.length }}</span>
                <span>{{ lang() === 'ar' ? 'مواد' : 'Subjects' }}</span>
              </span>
            }
          </div>

          <div class="subjects-section__content pt-1">
            @if (r.subjects && r.subjects.length > 0) {
              <div class="subjects-grid">
                @for (sub of r.subjects; track sub.subjectName) {
                  <div class="subject-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[20px] p-5 md:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-[0_10px_24px_rgba(37,99,235,0.03)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-all">
                    <!-- Card Header -->
                    <div class="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                      <div class="flex items-center gap-3 min-w-0">
                        <!-- Subject Badge Color -->
                        <div class="w-2.5 h-7 rounded-full shrink-0" 
                             [class.bg-blue-500]="sub.subjectName.includes('رياض') || sub.subjectName.toLowerCase().includes('math')"
                             [class.bg-emerald-500]="sub.subjectName.includes('علوم') || sub.subjectName.toLowerCase().includes('science')"
                             [class.bg-amber-500]="sub.subjectName.includes('عرب') || sub.subjectName.toLowerCase().includes('arab')"
                             [class.bg-purple-500]="sub.subjectName.includes('انجليز') || sub.subjectName.toLowerCase().includes('english') || sub.subjectName.toLowerCase().includes('lang')">
                        </div>
                        <h4 class="font-extrabold text-slate-800 dark:text-slate-100 text-lg truncate">{{ sub.subjectName }}</h4>
                      </div>
                      
                      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border"
                            [class.bg-emerald-50]="sub.performanceLevel === 'Strong'"
                            [class.text-emerald-700]="sub.performanceLevel === 'Strong'"
                            [class.border-emerald-100]="sub.performanceLevel === 'Strong'"
                            [class.dark:bg-emerald-950/20]="sub.performanceLevel === 'Strong'"
                            [class.dark:text-emerald-400]="sub.performanceLevel === 'Strong'"
                            [class.dark:border-emerald-900/30]="sub.performanceLevel === 'Strong'"
                            
                            [class.bg-blue-50]="sub.performanceLevel === 'Average'"
                            [class.text-blue-700]="sub.performanceLevel === 'Average'"
                            [class.border-blue-100]="sub.performanceLevel === 'Average'"
                            [class.dark:bg-blue-950/20]="sub.performanceLevel === 'Average'"
                            [class.dark:text-blue-400]="sub.performanceLevel === 'Average'"
                            [class.dark:border-blue-900/30]="sub.performanceLevel === 'Average'"
                            
                            [class.bg-orange-50]="sub.performanceLevel === 'NeedsImprovement'"
                            [class.text-orange-700]="sub.performanceLevel === 'NeedsImprovement'"
                            [class.border-orange-100]="sub.performanceLevel === 'NeedsImprovement'"
                            [class.dark:bg-orange-950/20]="sub.performanceLevel === 'NeedsImprovement'"
                            [class.dark:text-orange-400]="sub.performanceLevel === 'NeedsImprovement'"
                            [class.dark:border-orange-900/30]="sub.performanceLevel === 'NeedsImprovement'"
                            
                            [class.bg-rose-50]="sub.performanceLevel === 'AtRisk'"
                            [class.text-rose-700]="sub.performanceLevel === 'AtRisk'"
                            [class.border-rose-100]="sub.performanceLevel === 'AtRisk'"
                            [class.dark:bg-rose-950/20]="sub.performanceLevel === 'AtRisk'"
                            [class.dark:text-rose-400]="sub.performanceLevel === 'AtRisk'"
                            [class.dark:border-rose-900/30]="sub.performanceLevel === 'AtRisk'"
                      >
                        @if(sub.performanceLevel === 'Strong') { {{ t().PERF_STRONG }} }
                        @else if(sub.performanceLevel === 'Average') { {{ t().PERF_AVERAGE }} }
                        @else if(sub.performanceLevel === 'NeedsImprovement') { {{ t().PERF_NEEDS_IMPROVEMENT }} }
                        @else { {{ t().PERF_AT_RISK }} }
                      </span>
                    </div>

                    <!-- Subject Scores Info -->
                    <div class="flex justify-between items-center mb-5">
                      <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500 block">{{ t().ATTENDANCE_LABEL }}</span>
                        <span class="font-extrabold text-slate-700 dark:text-slate-300 text-sm mt-0.5 block">{{ sub.attendancePercentage }}%</span>
                      </div>
                      <div class="text-left" [class.text-right]="lang() === 'en'" [class.text-left]="lang() === 'ar'">
                        <span class="font-black text-2xl" 
                              [class.text-emerald-600]="sub.averageScore >= 85"
                              [class.text-blue-600]="sub.averageScore >= 70 && sub.averageScore < 85"
                              [class.text-orange-600]="sub.averageScore >= 50 && sub.averageScore < 70"
                              [class.text-red-600]="sub.averageScore < 50">
                          {{ sub.averageScore }}%
                        </span>
                      </div>
                    </div>

                    <!-- AI Narrative block -->
                    <div class="relative overflow-hidden bg-slate-50/70 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl mb-6">
                      <div class="absolute -left-2 -top-2 text-3xl opacity-10 text-indigo-500"><app-icon name="sparkles" size="16"></app-icon></div>
                      <span class="font-extrabold text-indigo-700 dark:text-indigo-400 block mb-1 text-xs">{{ t().AI_OPINION_LABEL }}</span>
                      <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold">{{ sub.aiSubjectNarrative }}</p>
                    </div>

                    <div class="space-y-6">
                      <!-- Weak Lessons List -->
                      @if (sub.weakLessons && sub.weakLessons.length > 0) {
                        <div class="space-y-3">
                          <h5 class="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 justify-start">
                            <span class="text-red-500"><app-icon name="exclamation-triangle" size="14"></app-icon></span>
                            {{ t().WEAKNESSES_LABEL }}
                          </h5>
                          <div class="space-y-2">
                            @for (wl of sub.weakLessons; track wl.lessonTitle) {
                              <div class="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 shadow-[0_4px_12px_rgba(15,23,42,0.01)]">
                                <div class="absolute inset-y-0 right-0 w-1 bg-red-400" [class.right-0]="lang() === 'ar'" [class.left-0]="lang() === 'en'" [class.left-auto]="lang() === 'ar'" [class.right-auto]="lang() === 'en'"></div>
                                <div class="flex justify-between items-center gap-4 text-xs font-semibold">
                                  <span class="font-bold text-slate-800 dark:text-slate-200 truncate">{{ wl.lessonTitle }}</span>
                                  <span class="shrink-0 px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md font-bold text-[10px] border border-red-100/50 dark:border-red-950/30">
                                    {{ wl.masteryPercentage }}% {{ t().MASTERY_LABEL }}
                                  </span>
                                </div>
                                
                                @if (wl.weakTopics && wl.weakTopics.length > 0) {
                                  <div class="flex flex-wrap gap-1 mt-2.5">
                                    @for (topic of wl.weakTopics; track topic) {
                                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-850">
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

                      <!-- AI Recommendations List -->
                      @if (sub.recommendations && sub.recommendations.length > 0) {
                        <div class="space-y-3">
                          <h5 class="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 justify-start">
                            <span class="text-emerald-500"><app-icon name="check-badge" size="14"></app-icon></span>
                            {{ t().RECS_LABEL }}
                          </h5>
                          <div class="space-y-2">
                            @for (rec of sub.recommendations; track rec) {
                              <div class="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-50/50 dark:border-emerald-950/20 shadow-[0_4px_12px_rgba(15,23,42,0.01)] font-semibold leading-relaxed">
                                <span class="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mt-0.5 border border-emerald-100/30 dark:border-emerald-950/20">
                                  <i class="fa-solid fa-check text-[9px]"></i>
                                </span>
                                <span class="flex-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">{{ rec }}</span>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Empty Subject State Card -->
              <div class="w-full flex items-center justify-center py-6 animate-section-fade">
                <div class="empty-state-card text-center p-8 bg-white dark:bg-[#111E33] border border-slate-100 dark:border-slate-800/80 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.01)] max-w-lg flex flex-col items-center">
                  <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl mb-4 shadow-inner">
                    <app-icon name="book-open" size="18"></app-icon>
                  </div>
                  <h3 class="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
                    {{ lang() === 'ar' ? 'لا توجد تفاصيل مواد متاحة لهذا التقرير' : 'No subject details available for this report' }}
                  </h3>
                  <p class="text-slate-500 dark:text-slate-400 text-xs mb-0 leading-relaxed font-bold">
                    {{ lang() === 'ar' ? 'ستظهر تفاصيل المواد بعد توفر درجات الطالب أو توليد تقرير مكتمل.' : 'Subject details will appear once student grades are available or a completed report is generated.' }}
                  </p>
                </div>
              </div>
            }
          </div>
        </section>
      }

    </div>
  `,
  styles: [`
    /* Hero button styling */
    .btn-generate-report {
      background: linear-gradient(135deg, #2563EB 0%, #4F46E5 52%, #7C3AED 100%) !important;
      color: #FFFFFF !important;
      font-weight: 700 !important;
      font-size: 13.5px !important;
      height: 44px !important;
      padding-inline: 22px !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25) !important;
      transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease !important;
      cursor: pointer !important;
      border: none !important;
      text-decoration: none !important;
      display: inline-flex !important;
      align-items: center !important;
    }
    .btn-generate-report:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3) !important;
      filter: brightness(1.05) !important;
    }
    .btn-generate-report:active {
      transform: translateY(0) scale(0.98) !important;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2) !important;
    }
    .btn-generate-report:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }

    /* Performance Grid styling */
    .performance-summary-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 16px !important;
    }
    @media (max-width: 1023px) {
      .performance-summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .performance-summary-grid > div:last-child {
        grid-column: span 2 / span 2 !important;
      }
    }
    @media (max-width: 639px) {
      .performance-summary-grid {
        grid-template-columns: 1fr !important;
      }
      .performance-summary-grid > div:last-child {
        grid-column: span 1 / span 1 !important;
      }
    }

    /* Performance card */
    .performance-card {
      background: #FFFFFF !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      border-radius: 18px !important;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.01) !important;
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease !important;
    }
    :root[data-theme='dark'] .performance-card {
      background: #111E33 !important;
      border-color: rgba(148, 163, 184, 0.12) !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15) !important;
    }
    .performance-card:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04) !important;
      border-color: rgba(37, 99, 235, 0.2) !important;
    }
    .card-icon-circle {
      width: 38px !important;
      height: 38px !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    /* Subjects grid */
    .subjects-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
      gap: 20px !important;
    }
    @media (max-width: 360px) {
      .subjects-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Subject card styling */
    .subject-card {
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease !important;
    }
    .subject-card:hover {
      transform: translateY(-3px) !important;
      border-color: rgba(37, 99, 235, 0.25) !important;
    }
    :root[data-theme='dark'] .subject-card:hover {
      border-color: rgba(37, 99, 235, 0.35) !important;
    }

    /* Empty state card styling */
    .empty-state-card {
      transition: transform 220ms ease !important;
    }
    .empty-state-card:hover {
      transform: translateY(-2px) !important;
    }

    /* New Subjects Section Header & Accent Line */
    .subjects-section {
      margin-top: 32px !important;
      display: block !important;
    }
    .subjects-section__header {
      background: #FFFFFF !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.01) !important;
      transition: background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease !important;
    }
    :root[data-theme='dark'] .subjects-section__header {
      background: #111E33 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15) !important;
    }
    .subjects-section__heading {
      display: flex !important;
      align-items: start !important;
      gap: 16px !important;
    }
    .subjects-section__icon {
      width: 46px !important;
      height: 46px !important;
      border-radius: 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(124, 58, 237, 0.08)) !important;
      color: #2563EB !important;
    }
    :root[data-theme='dark'] .subjects-section__icon {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.20), rgba(124, 58, 237, 0.16)) !important;
      color: #93C5FD !important;
      border: 1px solid rgba(148, 163, 184, 0.08) !important;
    }
    .accent-line {
      height: 3px !important;
      width: 48px !important;
      border-radius: 999px !important;
      background: linear-gradient(90deg, #2563EB, #7C3AED) !important;
    }
    .subjects-section__content {
      margin-top: 18px !important;
    }

    /* Animation */
    @keyframes sectionFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-section-fade {
      animation: sectionFadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }
    @media (prefers-reduced-motion: reduce) {
      .animate-section-fade {
        animation: none !important;
        transform: none !important;
      }
    }

    @media (max-width: 767px) {
      .subjects-section__header {
        padding: 16px !important;
      }
      .subjects-section__heading {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 12px !important;
      }
    }
  `]
})
export class SmartReportComponent implements OnInit, OnDestroy {
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

  lang = signal<'ar' | 'en'>('ar');
  t = computed(() => this.lang() === 'ar' ? AR : EN);
  private observer?: MutationObserver;

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

    if (typeof window !== 'undefined') {
      // Detect language from HTML dir attribute reactively
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }

      this.observer = new MutationObserver(() => {
        const currentLang = document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
        if (this.lang() !== currentLang) {
          this.lang.set(currentLang);
        }
      });
      this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  getCurrentMonth(): string {
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
          this.report.set(null);
        } else {
          this.error.set(this.lang() === 'ar' ? 'تعذر تحميل التقرير. يرجى المحاولة مرة أخرى.' : 'Unable to load report. Please try again.');
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
        this.error.set(this.lang() === 'ar' ? 'فشل توليد التقرير بسبب مشكلة في السيرفر أو اشتراك غير فعال.' : 'Report generation failed due to a server error or inactive subscription.');
        this.isGenerating.set(false);
      }
    });
  }
}
