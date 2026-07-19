import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { ProfileService, LinkedChildDto } from '../../../profile/services/profile.service';

const AR = {
  PAGE_BADGE: "أبنائي",
  PAGE_TITLE: "أبنائي",
  PAGE_DESC: "تابع بيانات أبنائك، اشتراكاتهم، حضورهم وتقاريرهم التعليمية من مكان واحد.",
  ADD_STUDENT_CTA: "إضافة طالب جديد",
  TOTAL_STUDENTS: "إجمالي الأبناء",
  ACTIVE_SUBS: "الاشتراكات الفعالة",
  STUDENTS_SECTION_TITLE: "الأبناء المسجلون",
  STUDENTS_SECTION_DESC: "اختر ملف الطالب لعرض الأداء الأكاديمي والحضور والتنبيهات.",
  STUDENT_CLASS_LABEL: "الصف الأول الإعدادي",
  STATUS_ACTIVE: "نشط",
  STATUS_INACTIVE: "غير نشط",
  REPORT_CARD_TITLE: "تقارير الأداء الدراسي",
  ALERT_CARD_TITLE: "إشعارات وتنبيهات الغياب",
  ATTENDANCE_CARD_TITLE: "سجل حضور الحصص المباشرة",
  EMPTY_TITLE: "لم تتم إضافة أي طالب بعد",
  EMPTY_DESC: "أضف طالباً لبدء متابعة مستواه الدراسي وحضوره وتقاريره اليومية.",
  EMPTY_CTA: "ربط طالب جديد"
};

const EN = {
  PAGE_BADGE: "My Children",
  PAGE_TITLE: "My Children",
  PAGE_DESC: "Monitor your children's profiles, active subscriptions, attendance, and academic reports all in one place.",
  ADD_STUDENT_CTA: "Add New Student",
  TOTAL_STUDENTS: "Total Children",
  ACTIVE_SUBS: "Active Subscriptions",
  STUDENTS_SECTION_TITLE: "Registered Children",
  STUDENTS_SECTION_DESC: "Select a student profile to view academic performance, attendance, and alerts.",
  STUDENT_CLASS_LABEL: "First Prep Grade",
  STATUS_ACTIVE: "Active",
  STATUS_INACTIVE: "Inactive",
  REPORT_CARD_TITLE: "Academic Performance Reports",
  ALERT_CARD_TITLE: "Attendance Alerts & Notices",
  ATTENDANCE_CARD_TITLE: "Live Sessions Attendance Log",
  EMPTY_TITLE: "No students added yet",
  EMPTY_DESC: "Add a student to start monitoring their academic level, attendance, and daily reports.",
  EMPTY_CTA: "Link New Student"
};

@Component({
  selector: 'app-children-list',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-fade-in pb-12 w-full" [attr.dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- 1. Page Hero Section -->
      <div class="relative overflow-hidden rounded-[24px] border border-blue-100/50 dark:border-slate-800/80 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-slate-900/40 dark:to-slate-800/30 p-6 md:p-8 shadow-[0_8px_30px_rgba(37,99,235,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
        <!-- Decorative Blurs -->
        <div class="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="space-y-3 max-w-2xl text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
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
          
          <!-- CTA Button -->
          <a routerLink="/add-student" class="btn-add-student shrink-0 flex items-center justify-center gap-2">
            <app-icon name="plus" size="16"></app-icon>
            <span>{{ t().ADD_STUDENT_CTA }}</span>
          </a>
        </div>
      </div>

      @if (combinedStudents().length > 0) {
        <!-- 2. Statistics Grid -->
        <div class="stats-grid">
          <!-- Card 1: Total Children -->
          <div class="stat-card stat-card-blue flex flex-col justify-center">
            <div class="flex items-center justify-between">
              <div class="space-y-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {{ t().TOTAL_STUDENTS }}
                </span>
                <h4 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {{ combinedStudents().length }}
                </h4>
              </div>
              <div class="stat-icon-container bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <app-icon name="users" size="24"></app-icon>
              </div>
            </div>
          </div>

          <!-- Card 2: Active Subscriptions -->
          <div class="stat-card stat-card-green flex flex-col justify-center">
            <div class="flex items-center justify-between">
              <div class="space-y-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {{ t().ACTIVE_SUBS }}
                </span>
                <h4 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {{ combinedStudents().filter(s => s.hasActiveSubscription).length }}
                </h4>
              </div>
              <div class="stat-icon-container bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <app-icon name="check-badge" size="24"></app-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Children Section Header -->
        <div class="space-y-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
          <h2 class="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
            {{ t().STUDENTS_SECTION_TITLE }}
          </h2>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {{ t().STUDENTS_SECTION_DESC }}
          </p>
        </div>

        <!-- 4. Children Cards Grid -->
        <div class="students-grid">
          @for (student of combinedStudents(); track student.studentUserId) {
            <div class="student-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[20px] shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.04)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] flex flex-col justify-between overflow-hidden">
              
              <!-- Upper Info Section -->
              <div class="p-5 md:p-6 pb-4">
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-800/30 flex items-center justify-center font-bold overflow-hidden shrink-0 shadow-inner">
                    @if (student.avatarUrl) {
                      <img [src]="student.avatarUrl" [alt]="student.fullName" class="w-full h-full object-cover">
                    } @else {
                      <app-icon name="user" size="22" class="text-blue-600 dark:text-blue-400"></app-icon>
                    }
                  </div>
                  
                  <!-- Name & Email -->
                  <div class="min-w-0 flex-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                    <h3 class="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-snug truncate">
                      {{ student.fullName }}
                    </h3>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5 truncate" dir="ltr">
                      {{ student.email }}
                    </p>
                  </div>
                </div>

                <!-- Grade & Status -->
                <div class="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <span class="text-[12px] text-slate-500 dark:text-slate-400 font-extrabold">
                    {{ t().STUDENT_CLASS_LABEL }}
                  </span>

                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border"
                        [class.bg-emerald-50]="student.hasActiveSubscription"
                        [class.text-emerald-700]="student.hasActiveSubscription"
                        [class.border-emerald-100]="student.hasActiveSubscription"
                        [class.dark:bg-emerald-900/20]="student.hasActiveSubscription"
                        [class.dark:text-emerald-400]="student.hasActiveSubscription"
                        [class.dark:border-emerald-900/30]="student.hasActiveSubscription"
                        [class.bg-rose-50]="!student.hasActiveSubscription"
                        [class.text-rose-700]="!student.hasActiveSubscription"
                        [class.border-rose-100]="!student.hasActiveSubscription"
                        [class.dark:bg-rose-900/20]="!student.hasActiveSubscription"
                        [class.dark:text-rose-400]="!student.hasActiveSubscription"
                        [class.dark:border-rose-900/30]="!student.hasActiveSubscription"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="student.hasActiveSubscription" [class.bg-rose-500]="!student.hasActiveSubscription"></span>
                    {{ student.hasActiveSubscription ? t().STATUS_ACTIVE : t().STATUS_INACTIVE }}
                  </span>
                </div>
              </div>

              <!-- Bottom Action Rows -->
              <div class="p-4 bg-slate-50/40 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                <!-- Reports Action -->
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/reports', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="student-action-row group flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-850 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="action-icon-box bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      <app-icon name="chart" size="16"></app-icon>
                    </div>
                    <span class="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {{ t().REPORT_CARD_TITLE }}
                    </span>
                  </div>
                  <app-icon [name]="lang() === 'ar' ? 'chevron-left' : 'chevron-right'" size="14" class="action-arrow text-slate-400 transition-all"></app-icon>
                </a>

                <!-- Alerts Action -->
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/alerts', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="student-action-row group flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-850 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="action-icon-box bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                      <app-icon name="exclamation-triangle" size="16"></app-icon>
                    </div>
                    <span class="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {{ t().ALERT_CARD_TITLE }}
                    </span>
                  </div>
                  <app-icon [name]="lang() === 'ar' ? 'chevron-left' : 'chevron-right'" size="14" class="action-arrow text-slate-400 transition-all"></app-icon>
                </a>

                <!-- Attendance Action -->
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/attendance', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="student-action-row group flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-850 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="action-icon-box bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <app-icon name="calendar" size="16"></app-icon>
                    </div>
                    <span class="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {{ t().ATTENDANCE_CARD_TITLE }}
                    </span>
                  </div>
                  <app-icon [name]="lang() === 'ar' ? 'chevron-left' : 'chevron-right'" size="14" class="action-arrow text-slate-400 transition-all"></app-icon>
                </a>
              </div>

            </div>
          }
        </div>
      @} @else {
        <!-- Empty State -->
        <div class="w-full flex items-center justify-center py-12">
          <div class="empty-state-card text-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.02)] max-w-lg flex flex-col items-center">
            <!-- Circular Icon Shape -->
            <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">
              <app-icon name="users" size="24"></app-icon>
            </div>
            <h3 class="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">
              {{ t().EMPTY_TITLE }}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-8 leading-relaxed max-w-xs font-bold">
              {{ t().EMPTY_DESC }}
            </p>
            <a routerLink="/add-student" class="btn-add-student flex items-center justify-center gap-2">
              <app-icon name="plus" size="14"></app-icon>
              <span>{{ t().EMPTY_CTA }}</span>
            </a>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* Hero button styling */
    .btn-add-student {
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
    .btn-add-student:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3) !important;
      filter: brightness(1.05) !important;
    }
    .btn-add-student:active {
      transform: translateY(0) scale(0.98) !important;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2) !important;
    }

    /* Statistics Grid styling */
    .stats-grid {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 16px !important;
    }
    @media (max-width: 639px) {
      .stats-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Stat Card styling */
    .stat-card {
      min-height: 110px !important;
      padding: 20px !important;
      border-radius: 16px !important;
      background: #FFFFFF !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.01) !important;
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease !important;
    }
    :root[data-theme='dark'] .stat-card {
      background: #111E33 !important;
      border-color: rgba(148, 163, 184, 0.12) !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15) !important;
    }
    .stat-card:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04) !important;
    }
    :root[data-theme='dark'] .stat-card:hover {
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25) !important;
    }
    .stat-card-blue:hover {
      border-color: rgba(37, 99, 235, 0.4) !important;
    }
    .stat-card-green:hover {
      border-color: rgba(16, 185, 129, 0.4) !important;
    }
    .stat-icon-container {
      width: 46px !important;
      height: 46px !important;
      border-radius: 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 220ms ease !important;
      flex-shrink: 0 !important;
    }
    .stat-card:hover .stat-icon-container {
      transform: scale(1.08) !important;
    }

    /* Students Cards Grid styling */
    .students-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
      gap: 20px !important;
    }
    @media (max-width: 360px) {
      .students-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Student Card styling */
    .student-card {
      transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease !important;
    }
    .student-card:hover {
      transform: translateY(-4px) !important;
      border-color: rgba(37, 99, 235, 0.25) !important;
    }
    :root[data-theme='dark'] .student-card:hover {
      border-color: rgba(37, 99, 235, 0.35) !important;
    }

    /* Student Card Action Row styling */
    .student-action-row {
      text-decoration: none !important;
    }
    .action-icon-box {
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    [dir='rtl'] .student-action-row:hover .action-arrow {
      transform: translateX(-4px) !important;
    }
    [dir='ltr'] .student-action-row:hover .action-arrow {
      transform: translateX(4px) !important;
    }

    /* Empty state styling */
    .empty-state-card {
      transition: transform 220ms ease !important;
    }
    .empty-state-card:hover {
      transform: translateY(-2px) !important;
    }
  `]
})
export class ChildrenListComponent implements OnInit, OnDestroy {
  public parentService = inject(ParentService);
  private profileService = inject(ProfileService);

  private profileChildren = signal<LinkedChildDto[]>([]);

  activeSlide = 0;
  slides = [
    { title: 'متابعة أداء الأبناء في مسارك', desc: 'تتبع مستوى أبنائك الدراسي والتقارير الأكاديمية أولاً بأول من مكان واحد.' },
    { title: 'تقارير ذكية مدعومة بالذكاء الاصطناعي', desc: 'تحليل دقيق لنقاط القوة والضعف والمهارات لمساعدة الطلاب على التفوق.' },
    { title: 'تنبيهات الحضور المباشرة', desc: 'إشعارات لحظية بكافة غيابات واختبارات أبنائك للبقاء على اطلاع مستمر.' }
  ];

  lang = signal<'ar' | 'en'>('ar');
  t = computed(() => this.lang() === 'ar' ? AR : EN);
  private observer?: MutationObserver;
  private intervalId?: any;

  public combinedStudents = computed(() => {
    const subs = this.parentService.linkedStudents();
    const profs = this.profileChildren();
    
    return subs.map(sub => {
      const prof = profs.find(p => p.userId === sub.studentUserId);
      return {
        ...sub,
        avatarUrl: prof?.avatarUrl
      };
    });
  });

  ngOnInit() {
    this.parentService.fetchLinkedStudents().subscribe();
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.linkedChildren) {
          this.profileChildren.set(res.linkedChildren);
        }
      }
    });

    // Auto rotate slides
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => {
        this.activeSlide = (this.activeSlide + 1) % this.slides.length;
      }, 4500);

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
}
