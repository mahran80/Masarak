import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { AuthStateService } from '../../../../core/services/auth-state-service';

const AR = {
  PAGE_TITLE: "لوحة التحكم",
  ROLE_LABEL: "ولي أمر",
  TODAY_DATE: "التاريخ اليوم",
  ADD_STUDENT: "إضافة طالب",
  WELCOME_BACK: "مرحباً بك مجدداً،",
  HERO_SUBTITLE: "متابعة شاملة لتقدم أبنائك الأكاديمي، إدارة الاشتراكات، ومراقبة الحضور والتقييمات من مكان واحد.",
  HERO_SLIDE_1_TITLE: "أبناؤك في أيدٍ أمينة",
  HERO_SLIDE_1_DESC: "تابع تقدمهم الدراسي وتقاريرهم الدورية بشكل مباشر ولحظي عبر نظامنا المتكامل.",
  HERO_SLIDE_2_TITLE: "متابعة الحضور والغياب",
  HERO_SLIDE_2_DESC: "اطّلع على التزام أبنائك بالحصص المباشرة ومعدلات تفاعلهم بدقة متناهية.",
  HERO_SLIDE_3_TITLE: "توصيات مخصصة للتحسين",
  HERO_SLIDE_3_DESC: "نظامنا الذكي يحلل الأداء ويقدم خطط تقوية مستمرة لضمان أفضل مسار أكاديمي.",
  HERO_SLIDE_4_TITLE: "متابعة الإنجازات والجوائز",
  HERO_SLIDE_4_DESC: "حفّز أبناءك عند حصولهم على تقييمات متميزة وشهادات تقدير على جهودهم.",
  HERO_SLIDE_5_TITLE: "إدارة الاشتراكات بكل سهولة",
  HERO_SLIDE_5_DESC: "جدد باقات المقررات، تابع الفواتير وراقب المدفوعات من مكان واحد بأمان.",
  STATS_TOTAL_CHILDREN: "الأبناء المرتبطين",
  STATS_AVG_GRADES: "متوسط الدرجات الأكاديمية",
  STATS_ATTENDANCE_RATE: "معدل الحضور والالتزام",
  STATS_ACTIVE_SUBS: "الاشتراكات الفعالة",
  STATS_TOTAL_LABEL: "إجمالي",
  STATS_STABLE: "مستقر",
  CHILDREN_SECTION_TITLE: "ملفات الأبناء الأكاديمية",
  CHILDREN_SECTION_SUB: "اختر ملف الطالب لعرض التفاصيل الأكاديمية والتقارير المخصصة.",
  ACTIVE_SUB: "اشتراك نشط",
  INACTIVE_SUB: "غير مشترك",
  ATTENDANCE_LABEL: "الحضور",
  GRADES_LABEL: "الدرجات",
  AI_RECOMMENDATION_TITLE: "توصية الذكاء الاصطناعي الأكاديمية",
  AI_RECOMMENDATION_DESC: "بناءً على تحليل بيانات أداء الطالب في الأسابيع الماضية، نوصي بمراجعة مكثفة لقواعد النحو والصرف وتخصيص ساعتين إضافيتين للتدريبات التفاعلية لرفع المعدل العام.",
  AI_RECOMMENDATION_CTA: "الاطلاع على الخطة",
  PERFORMANCE_OVERVIEW_TITLE: "نظرة عامة على الأداء",
  MONTHLY_ATTENDANCE: "معدل الحضور الشهري",
  GRADES_BY_SUBJECT: "الدرجات بالمواد الأساسية",
  QUICK_ACTIONS_TITLE: "إجراءات سريعة",
  ACTION_RENEW: "تجديد الاشتراك",
  ACTION_REPORTS: "التقارير",
  ACTION_CHAT: "التواصل والملاحظات",
  ACTION_DOWNLOAD: "تحميل التقرير",
  URGENT_NOTIFICATIONS: "تنبيهات هامة",
  RECENT_ACTIVITIES: "الأنشطة الأخيرة",
  MATH_EXAM_ALERT: "اختبار الرياضيات غداً صباحاً",
  MATH_EXAM_ALERT_SUB: "يرجى التأكد من استعداد الطالب",
  SCIENCE_TEACHER_MSG: "رسالة جديدة من معلم العلوم",
  SCIENCE_TEACHER_MSG_SUB: "منذ ساعتين",
  ENGLISH_SUB_ALERT: "اشتراك اللغة الإنجليزية ينتهي قريباً",
  ENGLISH_SUB_ALERT_SUB: "يتبقى 3 أيام",
  ACTIVITY_CHEMISTRY: "أكمل درس كيمياء العناصر",
  ACTIVITY_CHEMISTRY_SUB: "اليوم، 10:45 ص",
  ACTIVITY_RECOMMENDATION: "توصية مراجعة جديدة نشطة",
  ACTIVITY_RECOMMENDATION_SUB: "أمس، 02:00 م",
  ACTIVITY_GRADE: "حصل على تقييم 95% في الواجب",
  ACTIVITY_GRADE_SUB: "الأربعاء، 11:30 ص",
  ACTIVATE_SUB_TITLE: "تفعيل مقرر الطالب التعليمي",
  ACTIVATE_SUB_DESC: "المقرر الخاص بالطالب مغلق حالياً. يرجى تفعيل الاشتراك لتتمكن من الوصول لجميع أدوات التقييم الذكية، التقارير المفصلة، والمتابعة الأكاديمية.",
  ACTIVATE_SUB_CTA: "تفعيل الاشتراك الآن",
  SUBSCRIBING_PROGRESS: "جاري التحويل...",
  NO_CHILDREN_TITLE: "لا يوجد أبناء مرتبطين بحسابك بعد",
  NO_CHILDREN_DESC: "البدء سهل جداً في مسارك! أضف أبنائك الآن أو اربط حساباتهم الأكاديمية لمتابعة حضورهم، درجاتهم، ومراجعة تقارير أدائهم بضغطة زر.",
  NO_CHILDREN_CTA: "إضافة طالب جديد",
  MATH: "الرياضيات",
  SCIENCE: "العلوم الطبيعية",
  ARABIC: "اللغة العربية",
  GRADE_LEVEL: "الصف الأول الإعدادي"
};

const EN = {
  PAGE_TITLE: "Parent Dashboard",
  ROLE_LABEL: "Parent",
  TODAY_DATE: "Today's Date",
  ADD_STUDENT: "Add Student",
  WELCOME_BACK: "Welcome back,",
  HERO_SUBTITLE: "Comprehensive monitoring of your children's academic progress, managing subscriptions, and tracking attendance and grades all in one place.",
  HERO_SLIDE_1_TITLE: "Your Children in Safe Hands",
  HERO_SLIDE_1_DESC: "Track their academic progress and periodic reports directly and in real-time through our integrated system.",
  HERO_SLIDE_2_TITLE: "Attendance and Absence Tracking",
  HERO_SLIDE_2_DESC: "Monitor your children's commitment to live classes and their engagement levels with extreme accuracy.",
  HERO_SLIDE_3_TITLE: "Personalized Improvement Recommendations",
  HERO_SLIDE_3_DESC: "Our smart system analyzes performance and provides continuous support plans to ensure the best academic path.",
  HERO_SLIDE_4_TITLE: "Tracking Achievements and Awards",
  HERO_SLIDE_4_DESC: "Motivate your children when they receive outstanding evaluations and certificates of appreciation for their efforts.",
  HERO_SLIDE_5_TITLE: "Easy Subscription Management",
  HERO_SLIDE_5_DESC: "Renew course packages, track invoices, and monitor payments securely in one place.",
  STATS_TOTAL_CHILDREN: "Linked Children",
  STATS_AVG_GRADES: "Average Academic Grades",
  STATS_ATTENDANCE_RATE: "Attendance & Commitment Rate",
  STATS_ACTIVE_SUBS: "Active Subscriptions",
  STATS_TOTAL_LABEL: "Total",
  STATS_STABLE: "Stable",
  CHILDREN_SECTION_TITLE: "Children's Academic Profiles",
  CHILDREN_SECTION_SUB: "Select a student profile to view academic details and personalized reports.",
  ACTIVE_SUB: "Active Subscription",
  INACTIVE_SUB: "Unsubscribed",
  ATTENDANCE_LABEL: "Attendance",
  GRADES_LABEL: "Grades",
  AI_RECOMMENDATION_TITLE: "AI Academic Recommendation",
  AI_RECOMMENDATION_DESC: "Based on analysis of the student's performance data in past weeks, we recommend an intensive review of grammar rules and allocating two additional hours for interactive exercises to raise the overall average.",
  AI_RECOMMENDATION_CTA: "View Plan",
  PERFORMANCE_OVERVIEW_TITLE: "Performance Overview",
  MONTHLY_ATTENDANCE: "Monthly Attendance Rate",
  GRADES_BY_SUBJECT: "Grades by Core Subjects",
  QUICK_ACTIONS_TITLE: "Quick Actions",
  ACTION_RENEW: "Renew Subscription",
  ACTION_REPORTS: "Reports",
  ACTION_CHAT: "Communication & Chats",
  ACTION_DOWNLOAD: "Download Report",
  URGENT_NOTIFICATIONS: "Important Alerts",
  RECENT_ACTIVITIES: "Recent Activities",
  MATH_EXAM_ALERT: "Math Exam Tomorrow Morning",
  MATH_EXAM_ALERT_SUB: "Please ensure student readiness",
  SCIENCE_TEACHER_MSG: "New message from Science Teacher",
  SCIENCE_TEACHER_MSG_SUB: "2 hours ago",
  ENGLISH_SUB_ALERT: "English Subscription Expires Soon",
  ENGLISH_SUB_ALERT_SUB: "3 days remaining",
  ACTIVITY_CHEMISTRY: "Completed Chemistry of Elements lesson",
  ACTIVITY_CHEMISTRY_SUB: "Today, 10:45 AM",
  ACTIVITY_RECOMMENDATION: "New review recommendation active",
  ACTIVITY_RECOMMENDATION_SUB: "Yesterday, 02:00 PM",
  ACTIVITY_GRADE: "Received 95% evaluation in assignment",
  ACTIVITY_GRADE_SUB: "Wednesday, 11:30 AM",
  ACTIVATE_SUB_TITLE: "Activate Student's Curriculum",
  ACTIVATE_SUB_DESC: "The student's curriculum is currently locked. Please activate subscription to access all smart evaluation tools, detailed reports, and academic tracking.",
  ACTIVATE_SUB_CTA: "Activate Subscription Now",
  SUBSCRIBING_PROGRESS: "Redirecting...",
  NO_CHILDREN_TITLE: "No children linked to your account yet",
  NO_CHILDREN_DESC: "Getting started is very easy on Masarak! Add your children now or link their academic accounts to follow their attendance, grades, and review their performance reports with the click of a button.",
  NO_CHILDREN_CTA: "Add New Student",
  MATH: "Mathematics",
  SCIENCE: "Natural Sciences",
  ARABIC: "Arabic Language",
  GRADE_LEVEL: "1st Prep Grade"
};

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-8 md:space-y-12 animate-fade-in relative z-10 pb-24 w-full" [attr.dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- 2. Premium Hero Section -->
      <div class="relative overflow-hidden rounded-[28px] border border-blue-50/80 dark:border-slate-800/80 bg-gradient-to-br from-[#EFF6FF] to-[#F4F1FF] dark:from-[#0B172A] dark:to-[#111E33] p-8 md:p-10 lg:p-12 shadow-[0_12px_32px_rgba(37,99,235,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
        <!-- Background Decorative Blur Shapes -->
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <!-- Text Content -->
          <div class="flex-1 space-y-6 w-full text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
            <!-- User Info Badge & Date -->
            <div class="flex flex-wrap items-center gap-3 justify-start">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
                <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>{{ t().ROLE_LABEL }}</span>
              </div>
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-white/40 dark:bg-slate-800/40 px-3 py-1 rounded-lg border border-slate-100/50 dark:border-slate-700/50">
                <app-icon name="calendar" size="14" class="text-blue-600 dark:text-blue-400"></app-icon>
                {{ todayDate }}
              </span>
            </div>

            <!-- Welcome Title -->
            <div class="space-y-2">
              <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {{ t().WELCOME_BACK }} <span class="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">{{ parentFullName }}</span>
              </h1>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                {{ t().HERO_SUBTITLE }}
              </p>
            </div>

            <!-- Carousel Slides (Inside Hero) -->
            <div class="relative min-h-[95px] pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              @if (activeSlide() === 0) {
                <div class="animate-fade-in space-y-2">
                  <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{{ t().HERO_SLIDE_1_TITLE }}</h2>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">{{ t().HERO_SLIDE_1_DESC }}</p>
                </div>
              } @else if (activeSlide() === 1) {
                <div class="animate-fade-in space-y-2">
                  <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{{ t().HERO_SLIDE_2_TITLE }}</h2>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">{{ t().HERO_SLIDE_2_DESC }}</p>
                </div>
              } @else if (activeSlide() === 2) {
                <div class="animate-fade-in space-y-2">
                  <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{{ t().HERO_SLIDE_3_TITLE }}</h2>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">{{ t().HERO_SLIDE_3_DESC }}</p>
                </div>
              } @else if (activeSlide() === 3) {
                <div class="animate-fade-in space-y-2">
                  <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{{ t().HERO_SLIDE_4_TITLE }}</h2>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">{{ t().HERO_SLIDE_4_DESC }}</p>
                </div>
              } @else if (activeSlide() === 4) {
                <div class="animate-fade-in space-y-2">
                  <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">{{ t().HERO_SLIDE_5_TITLE }}</h2>
                  <p class="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">{{ t().HERO_SLIDE_5_DESC }}</p>
                </div>
              }
            </div>

            <!-- Dots Indicator & Actions -->
            <div class="flex items-center justify-between gap-4 pt-4">
              <div class="flex items-center gap-1.5">
                @for (idx of [0, 1, 2, 3, 4]; track idx) {
                  <button 
                    (click)="setSlide(idx)" 
                    class="h-1.5 rounded-full transition-all duration-300 focus:outline-none"
                    [class.w-6]="activeSlide() === idx" [class.bg-blue-600]="activeSlide() === idx" [class.dark:bg-blue-500]="activeSlide() === idx"
                    [class.w-1.5]="activeSlide() !== idx" [class.bg-slate-300]="activeSlide() !== idx" [class.dark:bg-slate-700]="activeSlide() !== idx"
                    [attr.aria-label]="'Slide ' + (idx + 1)"
                  ></button>
                }
              </div>

              <a routerLink="/add-student" class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(37,99,235,0.2)] hover:-translate-y-0.5">
                <app-icon name="plus" size="16"></app-icon>
                <span>{{ t().ADD_STUDENT }}</span>
              </a>
            </div>
          </div>

          <!-- Illustration / Image Section -->
          <div class="hidden md:flex w-[35%] relative overflow-hidden items-center justify-center select-none">
            <div class="relative w-full aspect-square max-w-[220px] p-4 flex items-center justify-center bg-white/20 dark:bg-slate-800/20 backdrop-blur-md rounded-[22px] border border-white/40 dark:border-slate-700/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_24px_rgba(37,99,235,0.04)]">
              <!-- Inline SVG Illustration -->
              <svg viewBox="0 0 200 200" class="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(79,70,229,0.12)] animate-float-illustration" aria-hidden="true">
                <defs>
                  <linearGradient id="svgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2563EB" />
                    <stop offset="50%" stop-color="#4F46E5" />
                    <stop offset="100%" stop-color="#7C3AED" />
                  </linearGradient>
                  <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <circle cx="100" cy="100" r="80" fill="url(#svgGrad)" opacity="0.04" />
                <circle cx="100" cy="100" r="65" fill="none" stroke="url(#svgGrad)" stroke-width="1.2" stroke-dasharray="3 5" opacity="0.2" />

                <!-- Book Base -->
                <path d="M45,135 C70,130 95,138 100,140 C105,138 130,130 155,135 L155,80 C130,75 105,83 100,85 C95,83 70,75 45,80 Z" fill="#FFFFFF" class="dark:fill-slate-800" stroke="url(#svgGrad)" stroke-width="2.5" />
                <path d="M45,135 C70,130 95,138 100,140 L100,85 C95,83 70,75 45,80 Z" fill="#F8FAFC" class="dark:fill-slate-700/50" stroke="url(#svgGrad)" stroke-width="1" />

                <!-- Graduation Cap -->
                <g transform="translate(10, -5)">
                  <polygon points="90,45 125,55 90,65 55,55" fill="url(#svgGrad)" filter="url(#svgGlow)" opacity="0.75" />
                  <polygon points="90,45 125,55 90,65 55,55" fill="url(#svgGrad)" />
                  <path d="M70,59 L70,70 C70,75 110,75 110,70 L110,59" fill="#1E293B" class="dark:fill-slate-900" stroke="url(#svgGrad)" stroke-width="1.5" />
                  <path d="M90,55 L120,62 L120,78" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
                  <circle cx="120" cy="78" r="2.5" fill="#F59E0B" />
                </g>

                <!-- Floating sparkles -->
                <path d="M148,45 L150,51 L156,53 L150,55 L148,61 L146,55 L140,53 L146,51 Z" fill="#F59E0B" />
                <path d="M50,110 L51,114 L55,115 L51,116 L50,120 L49,116 L45,115 L49,114 Z" fill="#7C3AED" opacity="0.7" />
                
                <!-- Trophy -->
                <g transform="translate(138, 92)" opacity="0.9">
                  <rect x="6" y="16" width="8" height="3" rx="1" fill="#F59E0B" />
                  <path d="M3,4 L17,4 L15,12 C14,14 6,14 5,12 Z" fill="#F59E0B" />
                  <path d="M2,6 C1,6 1,9 3,9 M18,6 C19,6 19,9 17,9" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" />
                </g>

                <!-- Dashboard Chart -->
                <g transform="translate(32, 45)" opacity="0.85">
                  <rect x="2" y="2" width="22" height="15" rx="2" fill="#F8FAFC" class="dark:fill-slate-800" stroke="#2563EB" stroke-width="2" />
                  <line x1="0" y1="17" x2="26" y2="17" stroke="#2563EB" stroke-width="2" />
                  <path d="M6,12 L10,8 L14,10 L18,6" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Summary Cards (Stats) -->
      @if (parentService.hasStudents()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <!-- Card 1: Linked Children -->
          <div class="stats-card stats-card-blue bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-slate-100/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors"></div>
            <div class="flex items-start justify-between mb-4 relative z-10">
              <div class="w-12 h-12 rounded-[14px] bg-[#EEF5FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0 stats-card-icon-container">
                <app-icon name="users" size="22"></app-icon>
              </div>
              <span class="text-[11px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md">{{ t().STATS_TOTAL_LABEL }}</span>
            </div>
            <div class="relative z-10 mt-auto text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              <h3 class="text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight mb-2">{{ parentService.linkedStudents().length }}</h3>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t().STATS_TOTAL_CHILDREN }}</p>
            </div>
          </div>

          <!-- Card 2: Average Grades -->
          <div class="stats-card stats-card-purple bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-slate-100/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors"></div>
            <div class="flex items-start justify-between mb-4 relative z-10">
              <div class="w-12 h-12 rounded-[14px] bg-[#F4F1FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0 stats-card-icon-container">
                <app-icon name="trophy" size="22"></app-icon>
              </div>
              <span class="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded-md flex items-center gap-1"><app-icon name="arrow-trending-up" size="10"></app-icon> +2%</span>
            </div>
            <div class="relative z-10 mt-auto text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              <h3 class="text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight mb-2">92.5<span class="text-xl text-slate-400">%</span></h3>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t().STATS_AVG_GRADES }}</p>
            </div>
          </div>

          <!-- Card 3: Attendance Rate -->
          <div class="stats-card stats-card-green bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-slate-100/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/20 transition-colors"></div>
            <div class="flex items-start justify-between mb-4 relative z-10">
              <div class="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 stats-card-icon-container">
                <app-icon name="check-circle" size="22"></app-icon>
              </div>
              <span class="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-1 rounded-md flex items-center gap-1"><app-icon name="arrow-trending-up" size="10"></app-icon> {{ t().STATS_STABLE }}</span>
            </div>
            <div class="relative z-10 mt-auto text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              <h3 class="text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight mb-2">94.8<span class="text-xl text-slate-400">%</span></h3>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t().STATS_ATTENDANCE_RATE }}</p>
            </div>
          </div>

          <!-- Card 4: Active Subscriptions -->
          <div class="stats-card stats-card-blue bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border border-slate-100/80 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors"></div>
            <div class="flex items-start justify-between mb-4 relative z-10">
              <div class="w-12 h-12 rounded-[14px] bg-[#EEF5FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0 stats-card-icon-container">
                <app-icon name="credit-card" size="22"></app-icon>
              </div>
            </div>
            <div class="relative z-10 mt-auto text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              <h3 class="text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight mb-2">{{ activeSubscriptionsCount }}</h3>
              <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ t().STATS_ACTIVE_SUBS }}</p>
            </div>
          </div>
        </div>
      }

      <!-- 4. Children Selection Grid -->
      @if (parentService.hasStudents()) {
        <div class="pt-4">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div class="text-right w-full" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
              <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{{ t().CHILDREN_SECTION_TITLE }}</h2>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ t().CHILDREN_SECTION_SUB }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (student of parentService.linkedStudents(); track student.studentUserId) {
              <div 
                (click)="parentService.setSelectedStudent(student.studentUserId)"
                class="student-card bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-2 transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden"
                [class.border-[#2563EB]]="parentService.selectedStudentId() === student.studentUserId"
                [class.border-transparent]="parentService.selectedStudentId() !== student.studentUserId"
                [class.shadow-[0_8px_30px_rgba(37,99,235,0.12)]]="parentService.selectedStudentId() === student.studentUserId"
              >
                <!-- Active Indicator -->
                @if (parentService.selectedStudentId() === student.studentUserId) {
                  <div class="absolute top-0 right-1/2 translate-x-1/2 w-16 h-1 bg-[#2563EB] rounded-b-full"></div>
                }

                <div class="flex items-start justify-between mb-6">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      {{ student.fullName[0] }}
                    </div>
                    <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                      <h3 class="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">{{ student.fullName }}</h3>
                      <span class="text-[13px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">{{ t().GRADE_LEVEL }}</span>
                    </div>
                  </div>

                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                        [class.bg-emerald-50]="student.hasActiveSubscription"
                        [class.text-emerald-700]="student.hasActiveSubscription"
                        [class.dark:bg-emerald-900/30]="student.hasActiveSubscription"
                        [class.dark:text-emerald-400]="student.hasActiveSubscription"
                        [class.bg-rose-50]="!student.hasActiveSubscription"
                        [class.text-rose-700]="!student.hasActiveSubscription"
                        [class.dark:bg-rose-900/30]="!student.hasActiveSubscription"
                        [class.dark:text-rose-400]="!student.hasActiveSubscription"
                  >
                    <span class="w-2 h-2 rounded-full" [class.bg-emerald-500]="student.hasActiveSubscription" [class.bg-rose-500]="!student.hasActiveSubscription"></span>
                    {{ student.hasActiveSubscription ? t().ACTIVE_SUB : t().INACTIVE_SUB }}
                  </span>
                </div>

                <div class="flex items-center justify-between mt-auto pt-5 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col items-start">
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">{{ t().ATTENDANCE_LABEL }}</span>
                      <span class="text-sm font-black text-slate-900 dark:text-white">{{ (student.studentUserId % 12) + 88 }}%</span>
                    </div>
                    <div class="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    <div class="flex flex-col items-start">
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">{{ t().GRADES_LABEL }}</span>
                      <span class="text-sm font-black text-slate-900 dark:text-white">{{ (student.studentUserId % 8) + 90 }}%</span>
                    </div>
                  </div>
                  <button class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 text-slate-400 group-hover:text-blue-600 transition-colors flex items-center justify-center"
                          [attr.aria-label]="lang() === 'ar' ? 'عرض ملف الابن' : 'View child profile'">
                    <app-icon [name]="lang() === 'ar' ? 'chevron-left' : 'chevron-right'" size="14"></app-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- 5. Detailed Analytics Panels -->
      @if (parentService.hasStudents() && parentService.selectedStudent()) {
        <div class="pt-8">
          @if (parentService.selectedStudent()?.hasActiveSubscription) {

            <!-- 5.1 AI Recommendation -->
            <div class="bg-gradient-to-r from-purple-50 via-white to-purple-50 dark:from-purple-900/20 dark:via-slate-900 dark:to-purple-900/10 border border-purple-100/80 dark:border-purple-900/40 p-6 md:p-8 rounded-[24px] flex flex-col md:flex-row md:items-center gap-6 mb-10 shadow-[0_4px_24px_rgba(124,58,237,0.04)] relative overflow-hidden">
              <!-- Background Sparkles -->
              <div class="absolute -top-10 -right-10 text-purple-200 dark:text-purple-900/20 opacity-50 rotate-12">
                <app-icon name="sparkles" size="120"></app-icon>
              </div>
              
              <div class="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 relative z-10 shadow-inner border border-purple-200/50 dark:border-purple-800/50">
                <app-icon name="sparkles" size="28"></app-icon>
              </div>
              <div class="flex-1 relative z-10 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                <div class="flex items-center gap-2 mb-2 justify-start">
                  <h4 class="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">{{ t().AI_RECOMMENDATION_TITLE }}</h4>
                  <span class="bg-purple-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">Beta</span>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">
                  {{ t().AI_RECOMMENDATION_DESC }}
                </p>
              </div>
              <button class="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-slate-700 rounded-xl text-sm font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-700 hover:border-purple-200 transition-all shrink-0 relative z-10 shadow-sm">
                {{ t().AI_RECOMMENDATION_CTA }}
              </button>
            </div>

            <div class="flex flex-col lg:flex-row gap-8 mb-10">
              <!-- 5.2 Charts Grid (Main Content 66%) -->
              <div class="w-full lg:w-2/3 space-y-8">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xl font-black text-slate-900 dark:text-white tracking-tight text-right w-full" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">{{ t().PERFORMANCE_OVERVIEW_TITLE }}</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Attendance Trend -->
                  <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col justify-between h-[220px]">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="font-bold text-slate-900 dark:text-white text-sm">{{ t().MONTHLY_ATTENDANCE }}</h3>
                      <span class="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md font-bold">94.8%</span>
                    </div>
                    
                    <div class="relative h-28 w-full mt-auto">
                      <svg class="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                        <path d="M 0 80 Q 75 50 150 70 T 300 20" fill="none" stroke="#2563EB" stroke-width="4" stroke-linecap="round"/>
                        <path d="M 0 80 Q 75 50 150 70 T 300 20 L 300 100 L 0 100 Z" fill="url(#attendanceArea)" />
                        <circle cx="150" cy="70" r="5" fill="#2563EB" stroke="#ffffff" stroke-width="2" />
                        <circle cx="300" cy="20" r="5" fill="#2563EB" stroke="#ffffff" stroke-width="2" />
                        <defs>
                          <linearGradient id="attendanceArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.15" />
                            <stop offset="100%" stop-color="#2563EB" stop-opacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  <!-- Grades by Subject -->
                  <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex flex-col h-[220px]">
                    <div class="flex items-center justify-between mb-6">
                      <h3 class="font-bold text-slate-900 dark:text-white text-sm text-right w-full" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">{{ t().GRADES_BY_SUBJECT }}</h3>
                    </div>
                    
                    <div class="space-y-5 mt-auto text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                      <div class="space-y-2">
                        <div class="flex justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          <span>{{ t().MATH }}</span><span>94%</span>
                        </div>
                        <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div class="h-full bg-blue-600 rounded-full" style="width: 94%"></div>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          <span>{{ t().SCIENCE }}</span><span>88%</span>
                        </div>
                        <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div class="h-full bg-indigo-500 rounded-full" style="width: 88%"></div>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          <span>{{ t().ARABIC }}</span><span>72%</span>
                        </div>
                        <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full" style="width: 72%"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick Actions Block -->
                <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 md:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.03)] mt-6">
                  <h3 class="font-bold text-slate-900 dark:text-white text-sm mb-6 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">{{ t().QUICK_ACTIONS_TITLE }}</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a routerLink="subscriptions" class="quick-action-card group bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 p-5 rounded-[16px] border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900 text-center flex flex-col items-center gap-3 transition-all">
                      <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><app-icon name="credit-card" size="20"></app-icon></div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{{ t().ACTION_RENEW }}</span>
                    </a>

                    <a [routerLink]="['reports', parentService.selectedStudentId()]" class="quick-action-card group bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 p-5 rounded-[16px] border border-transparent hover:border-purple-100 dark:hover:border-purple-900 text-center flex flex-col items-center gap-3 transition-all">
                      <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><app-icon name="chart-pie" size="20"></app-icon></div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">{{ t().ACTION_REPORTS }}</span>
                    </a>

                    <a routerLink="/dashboard/chat" class="quick-action-card group bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 p-5 rounded-[16px] border border-transparent hover:border-blue-100 dark:hover:border-blue-900 text-center flex flex-col items-center gap-3 transition-all">
                      <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><app-icon name="chat" size="20"></app-icon></div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{{ t().ACTION_CHAT }}</span>
                    </a>

                    <a [routerLink]="['reports', parentService.selectedStudentId()]" class="quick-action-card group bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/10 p-5 rounded-[16px] border border-transparent hover:border-amber-100 dark:hover:border-amber-900 text-center flex flex-col items-center gap-3 transition-all">
                      <div class="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform"><app-icon name="document-arrow-down" size="20"></app-icon></div>
                      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{{ t().ACTION_DOWNLOAD }}</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- 5.3 Sidebar Analytics (Right Column 33%) -->
              <div class="w-full lg:w-1/3 flex flex-col gap-6">
                <!-- Recent Notifications -->
                <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  <h3 class="font-bold text-slate-900 dark:text-white text-sm mb-6 flex items-center gap-2 justify-start"><app-icon name="bell" size="18" class="text-amber-500"></app-icon> {{ t().URGENT_NOTIFICATIONS }}</h3>
                  
                  <div class="space-y-4">
                    <div class="flex items-start gap-3 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
                      <div class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 text-rose-500"><app-icon name="exclamation-circle" size="16"></app-icon></div>
                      <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                        <p class="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-1">{{ t().MATH_EXAM_ALERT }}</p>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().MATH_EXAM_ALERT_SUB }}</span>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div class="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-sm flex items-center justify-center shrink-0 text-blue-500"><app-icon name="envelope" size="16"></app-icon></div>
                      <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                        <p class="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-1">{{ t().SCIENCE_TEACHER_MSG }}</p>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().SCIENCE_TEACHER_MSG_SUB }}</span>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div class="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 shadow-sm flex items-center justify-center shrink-0 text-amber-500"><app-icon name="clock" size="16"></app-icon></div>
                      <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                        <p class="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-1">{{ t().ENGLISH_SUB_ALERT }}</p>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().ENGLISH_SUB_ALERT_SUB }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Student Timeline -->
                <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)] flex-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  <h3 class="font-bold text-slate-900 dark:text-white text-sm mb-6 flex items-center gap-2 justify-start"><app-icon name="clock" size="18" class="text-blue-500"></app-icon> {{ t().RECENT_ACTIVITIES }}</h3>
                  
                  <div class="relative border-slate-100 dark:border-slate-800 space-y-6"
                       [class.pl-3]="lang() === 'en'" [class.pr-3]="lang() === 'ar'"
                       [class.border-l-2]="lang() === 'en'" [class.border-r-2]="lang() === 'ar'">
                    <div class="relative">
                      <span class="absolute top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900"
                            [class.-left-[18px]]="lang() === 'en'" [class.-right-[18px]]="lang() === 'ar'"></span>
                      <div [class.pl-5]="lang() === 'en'" [class.pr-5]="lang() === 'ar'">
                        <h4 class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{{ t().ACTIVITY_CHEMISTRY }}</h4>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().ACTIVITY_CHEMISTRY_SUB }}</span>
                      </div>
                    </div>
                    <div class="relative">
                      <span class="absolute top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white dark:ring-slate-900"
                            [class.-left-[18px]]="lang() === 'en'" [class.-right-[18px]]="lang() === 'ar'"></span>
                      <div [class.pl-5]="lang() === 'en'" [class.pr-5]="lang() === 'ar'">
                        <h4 class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{{ t().ACTIVITY_RECOMMENDATION }}</h4>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().ACTIVITY_RECOMMENDATION_SUB }}</span>
                      </div>
                    </div>
                    <div class="relative">
                      <span class="absolute top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900"
                            [class.-left-[18px]]="lang() === 'en'" [class.-right-[18px]]="lang() === 'ar'"></span>
                      <div [class.pl-5]="lang() === 'en'" [class.pr-5]="lang() === 'ar'">
                        <h4 class="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{{ t().ACTIVITY_GRADE }}</h4>
                        <span class="text-[11px] text-slate-500 font-medium">{{ t().ACTIVITY_GRADE_SUB }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          @} @else {
            <!-- Student has NO subscription -->
            <div class="text-center py-20 px-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.04)] max-w-3xl mx-auto flex flex-col items-center mt-10 relative overflow-hidden">
              <!-- Background decorations -->
              <div class="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div class="w-24 h-24 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-500 dark:text-rose-400 rounded-3xl flex items-center justify-center shadow-inner mb-8">
                <app-icon name="lock-closed" size="36"></app-icon>
              </div>
              
              <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{{ t().ACTIVATE_SUB_TITLE }}</h3>
              <p class="text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto text-base font-medium leading-relaxed">
                {{ t().ACTIVATE_SUB_DESC }}
              </p>
              
              @if (subscribingError()) {
                <div class="mb-6 w-full max-w-md bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 rounded-xl p-4 text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                  <app-icon name="exclamation-triangle" size="18"></app-icon>
                  {{ subscribingError() }}
                </div>
              }

              <button
                (click)="subscribeForSelectedChild()"
                [disabled]="isSubscribing()"
                class="flex items-center justify-center gap-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 text-white px-10 py-4 rounded-xl text-base font-bold transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-1 w-full max-w-xs">
                @if (isSubscribing()) {
                  <span class="animate-spin"><app-icon name="arrow-path" size="20"></app-icon></span> {{ t().SUBSCRIBING_PROGRESS }}
                } @else {
                  <span><app-icon name="credit-card" size="20"></app-icon></span> {{ t().ACTIVATE_SUB_CTA }}
                }
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-20 px-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.04)] max-w-3xl mx-auto flex flex-col items-center mt-12 relative overflow-hidden">
          <div class="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="w-64 h-48 mb-10 relative">
            <div class="absolute inset-0 bg-blue-100 dark:bg-slate-800 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
            <img src="assets/images/parent_dashboard_hero_2.jpg" class="w-full h-full object-cover rounded-3xl relative z-10 shadow-lg border border-white/50 dark:border-slate-700" alt="Learning illustration" />
          </div>
          
          <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{{ t().NO_CHILDREN_TITLE }}</h3>
          <p class="text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto text-base font-medium leading-relaxed">
            {{ t().NO_CHILDREN_DESC }}
          </p>
          <a routerLink="/add-student" class="flex items-center justify-center gap-3 bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-95 text-white px-10 py-4 rounded-xl text-base font-bold transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-1">
            <span><app-icon name="plus" size="20"></app-icon></span> {{ t().NO_CHILDREN_CTA }}
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-card {
      transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stats-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08) !important;
    }
    .stats-card-blue:hover { border-color: rgba(37, 99, 235, 0.6) !important; }
    .stats-card-purple:hover { border-color: rgba(124, 58, 237, 0.6) !important; }
    .stats-card-green:hover { border-color: rgba(16, 185, 129, 0.6) !important; }
    
    .stats-card:hover .stats-card-icon-container {
      transform: scale(1.08);
    }
    .stats-card-icon-container {
      transition: transform 250ms ease;
    }
    
    .student-card {
      transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .student-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(37, 99, 235, 0.08) !important;
    }
    
    .quick-action-card {
      transition: all 220ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .quick-action-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04) !important;
    }
    .quick-action-card:active {
      transform: translateY(0) scale(0.97);
    }

    @keyframes floatIllustration {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }
    .animate-float-illustration {
      animation: floatIllustration 5s ease-in-out infinite;
    }
  `]
})
export class ParentDashboardComponent implements OnInit, OnDestroy {
  public parentService = inject(ParentService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  activeSlide = signal(0);
  isSubscribing = signal(false);
  subscribingError = signal<string | null>(null);

  lang = signal<'ar' | 'en'>('ar');
  t = computed(() => this.lang() === 'ar' ? AR : EN);
  private observer?: MutationObserver;
  private intervalId?: any;

  get parentFullName() {
    return this.authState.user()?.fullName || (this.lang() === 'ar' ? 'ولي الأمر' : 'Parent');
  }

  get todayDate() {
    const currentLang = this.lang() === 'ar' ? 'ar-EG' : 'en-US';
    return new Date().toLocaleDateString(currentLang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get activeSubscriptionsCount() {
    return this.parentService.linkedStudents().filter(s => s.hasActiveSubscription).length;
  }

  get inactiveSubscriptionsCount() {
    return this.parentService.linkedStudents().filter(s => !s.hasActiveSubscription).length;
  }

  ngOnInit() {
    this.parentService.fetchLinkedStudents().subscribe();
    
    // Auto-cycle the hero carousel slide every 8 seconds
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => {
        this.activeSlide.update(idx => (idx + 1) % 5);
      }, 8000);

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
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setSlide(index: number) {
    this.activeSlide.set(index);
  }

  subscribeForSelectedChild() {
    const studentId = this.parentService.selectedStudentId();
    if (!studentId) return;

    // Redirect to subscription options page
    this.router.navigate(['/dashboard/parent/subscriptions']);
  }
}
