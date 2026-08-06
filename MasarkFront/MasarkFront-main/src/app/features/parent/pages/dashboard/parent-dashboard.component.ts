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
      
      <!-- 2. Premium Image Hero Section -->
      <div class="parent-static-hero flex flex-col justify-center select-none">
        
        <!-- Floating particles and glow spots -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div class="absolute -top-16 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-20 -left-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute top-10 left-[20%] w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
          <div class="absolute top-[30%] right-[30%] w-2 h-2 bg-white rounded-full opacity-40"></div>
          <div class="absolute bottom-[20%] left-[45%] w-2 h-2 bg-white rounded-full opacity-50"></div>
          <div class="absolute top-[15%] left-[50%] w-1.5 h-1.5 bg-purple-200 rounded-full opacity-70"></div>
        </div>
        
        <!-- Main Content Wrapper -->
        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full px-8 md:px-14 py-8 h-full">
          
          <!-- Text Content (Right side in RTL, Left side in LTR) -->
          <div class="w-full md:max-w-[55%] space-y-5" [style.textAlign]="lang() === 'ar' ? 'right' : 'left'">
            
            <!-- User Info Badge & Date -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-[11px] font-extrabold text-white shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{{ t().ROLE_LABEL }}</span>
              </div>
              <span class="text-[11px] font-semibold text-white/90 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
                <app-icon name="calendar" size="14" class="text-white"></app-icon>
                {{ todayDate }}
              </span>
            </div>

            <!-- Welcome Title & Subtitle -->
            <div class="space-y-3">
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                {{ t().WELCOME_BACK }} <span class="text-blue-100">{{ parentFullName }}</span>
              </h1>
              <p class="text-sm md:text-base text-white/90 max-w-xl leading-relaxed font-semibold drop-shadow-md">
                {{ t().HERO_SUBTITLE }}
              </p>
            </div>

            <!-- CTA Actions -->
            <div class="flex flex-wrap items-center gap-4 pt-2">
              <a routerLink="/add-student" class="px-7 py-3 bg-white hover:bg-blue-50 text-blue-700 rounded-2xl text-sm font-black transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 flex items-center gap-2 border border-white/50">
                <app-icon name="plus" size="18"></app-icon>
                <span>{{ t().ADD_STUDENT }}</span>
              </a>
            </div>
          </div>

          <!-- Hero Illustration Image (Father & Son) -->
          <div class="parent-hero-img-wrap"
               [style.left]="lang() === 'ar' ? '0' : 'auto'"
               [style.right]="lang() === 'en' ? '0' : 'auto'">
            <!-- Glow spots behind illustration image -->
            <div class="absolute -bottom-10 w-72 h-72 bg-cyan-400/25 rounded-full blur-[80px] z-0"
                 [style.left]="lang() === 'ar' ? '-2.5rem' : 'auto'"
                 [style.right]="lang() === 'en' ? '-2.5rem' : 'auto'"></div>
            <div class="absolute top-10 w-48 h-48 bg-purple-400/20 rounded-full blur-[60px] z-0"
                 [style.left]="lang() === 'ar' ? '5rem' : 'auto'"
                 [style.right]="lang() === 'en' ? '5rem' : 'auto'"></div>
            
            <img src="/assets/images/dashboard-heroes/parent-hero.png" 
                 [style.objectPosition]="lang() === 'ar' ? 'bottom left' : 'bottom right'"
                 alt="ولي الأمر والطالب">
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
    </div>`,
  styles: [`
    :host { display: block; }
    
    .parent-static-hero {
      position: relative;
      overflow: hidden;
      border-radius: 30px !important;
      min-height: 340px !important;
      background: linear-gradient(105deg, #0284c7 0%, #2563eb 45%, #7c3aed 100%) !important;
      box-shadow: 0 20px 50px rgba(37, 99, 235, 0.18) !important;
    }

    :host-context(.dark) .parent-static-hero,
    .dark .parent-static-hero {
      background: linear-gradient(135deg, #083344 0%, #1e1b4b 50%, #4c1d95 100%) !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35) !important;
    }

    .parent-hero-img-wrap {
      display: none;
    }

    @media (min-width: 768px) {
      .parent-hero-img-wrap {
        display: block !important;
        position: absolute;
        bottom: 0;
        height: 100%;
        width: 45%;
        pointer-events: none;
        z-index: 10;
        overflow: hidden;
      }
    }

    .parent-hero-img-wrap img {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.25));
      transition: transform 0.7s ease-out;
    }

    .parent-hero-img-wrap img:hover {
      transform: scale(1.05);
    }

    .stats-card {
      transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
    }
    :root[data-theme='dark'] .stats-card {
      border-color: rgba(148, 163, 184, 0.12) !important;
      background: #111E33 !important;
    }
    .stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 38px -10px rgba(15, 23, 42, 0.06), 0 10px 20px -8px rgba(15, 23, 42, 0.04) !important;
    }
    :root[data-theme='dark'] .stats-card:hover {
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
    }
    .stats-card-blue:hover { border-color: rgba(37, 99, 235, 0.4) !important; }
    .stats-card-purple:hover { border-color: rgba(124, 58, 237, 0.4) !important; }
    .stats-card-green:hover { border-color: rgba(16, 185, 129, 0.4) !important; }
    
    .stats-card:hover .stats-card-icon-container {
      transform: scale(1.08) translateY(-2px);
    }
    .stats-card-icon-container {
      transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
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
