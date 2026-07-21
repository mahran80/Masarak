import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicApiService } from '../../../../../core/services/academic-api-service';
import { TeacherDto } from '../../../../../models/academic.model';

const AR = {
  searchPlaceholder: 'ابحث باسم المعلم أو البريد الإلكتروني أو التخصص...',
  allSpecializations: 'كل التخصصات',
  totalTeachers: 'إجمالي المعلمين',
  teacher: 'معلم',
  teachers: 'معلمين',
  noSpecialization: 'بدون تخصص',
  hiringDate: 'تاريخ التعيين:',
  noBio: 'لا توجد نبذة متاحة.',
  assignedCourses: 'المواد والفصول المسندة:',
  noCourses: 'لا توجد مواد مسندة حالياً.',
  showing: 'عرض',
  of: 'من أصل',
  prev: 'السابق',
  next: 'التالي',
  systemAdmin: 'إدارة النظام',
  title: 'دليل المعلمين',
  desc: 'عرض جميع المعلمين المسجلين في النظام، تخصصاتهم والمواد التي يدرسونها.',
  failedLoad: 'فشل تحميل البيانات',
  errorConnection: 'حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.',
  retry: 'إعادة المحاولة',
  noMatching: 'لا يوجد معلمون مطابقون',
  noMatchingDesc: 'جرّب تعديل البحث أو اختيار تخصص آخر للوصول لنتائج أفضل.',
  loading: 'جاري تحميل دليل المعلمين...'
};

const EN = {
  searchPlaceholder: 'Search by teacher name, email, or specialization...',
  allSpecializations: 'All Specializations',
  totalTeachers: 'Total Teachers',
  teacher: 'Teacher',
  teachers: 'Teachers',
  noSpecialization: 'No Specialization',
  hiringDate: 'Hiring Date:',
  noBio: 'No biography available.',
  assignedCourses: 'Assigned Courses & Classes:',
  noCourses: 'No courses assigned currently.',
  showing: 'Showing',
  of: 'of',
  prev: 'Prev',
  next: 'Next',
  systemAdmin: 'System Administration',
  title: 'Teachers Directory',
  desc: 'View all teachers registered in the system, their specializations, and subjects taught.',
  failedLoad: 'Failed to load data',
  errorConnection: 'An error occurred while communicating with the server. Please check your connection and try again.',
  retry: 'Retry',
  noMatching: 'No matching teachers found',
  noMatchingDesc: 'Try refining your search or choosing a different specialization.',
  loading: 'Loading teachers directory...'
};

@Component({
  selector: 'app-teachers-directory',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule],
  template: `
    <div class="teachers-page-container space-y-4 px-4 py-6" [attr.dir]="lang() === 'ar' ? 'rtl' : 'ltr'">
      
      <!-- Teachers Hero Header -->
      <div class="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900/60 dark:to-slate-800/40 border border-blue-100/80 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <!-- Decorative background shapes -->
        <div class="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-500/5 rounded-full pointer-events-none"></div>
        
        <div class="space-y-2 relative z-10 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
          <span class="inline-flex items-center px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {{ trans().systemAdmin }}
          </span>
          <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {{ trans().title }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm max-w-xl leading-relaxed">
            {{ trans().desc }}
          </p>
        </div>
        
        <!-- Total Teachers Card -->
        <div class="shrink-0 w-full md:w-auto min-w-[200px] bg-white dark:bg-slate-800/60 border border-blue-100/60 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02] relative z-10">
          <div class="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <app-icon name="academic-cap" size="1.3em"></app-icon>
          </div>
          <div class="text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
            <div class="text-xs text-slate-400 dark:text-slate-500 font-bold">
              {{ trans().totalTeachers }}
            </div>
            <div class="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {{ teachers().length }} 
              <span class="text-xs text-slate-400 font-normal">{{ lang() === 'ar' ? trans().teacher : trans().teachers }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters Toolbar -->
      <div class="teachers-toolbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div class="flex-1 relative w-full">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="setSearchQuery($event)"
            [placeholder]="trans().searchPlaceholder"
            class="w-full ps-11 pe-4 py-2.5 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
          />
          <span class="absolute start-4 top-3.5 text-slate-400 dark:text-slate-500"><app-icon name="search" size="1.2em"></app-icon></span>
        </div>
        <div class="w-full sm:w-52 relative">
          <select 
            [ngModel]="selectedSpecialization()" 
            (ngModelChange)="setSelectedSpecialization($event)" 
            class="w-full ps-4 pe-10 py-2.5 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold cursor-pointer appearance-none"
          >
            <option value="">{{ trans().allSpecializations }}</option>
            @for (spec of specializations(); track spec) {
              <option [value]="spec">{{ spec }}</option>
            }
          </select>
          <span class="absolute end-4 top-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <app-icon name="chevron-down" size="1.2em"></app-icon>
          </span>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-summary flex justify-between items-center px-1">
        <span class="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          @if (filteredTeachers().length > 0) {
            {{ trans().showing }} {{ (currentPage() - 1) * pageSize() + 1 }}–{{ Math.min(currentPage() * pageSize(), filteredTeachers().length) }} {{ trans().of }} {{ filteredTeachers().length }} {{ lang() === 'ar' ? trans().teacher : trans().teachers }}
          } @else {
            {{ trans().showing }} 0 {{ trans().of }} 0 {{ lang() === 'ar' ? trans().teacher : trans().teachers }}
          }
        </span>
      </div>

      <!-- Loader / Error / Content States -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p class="text-xs text-slate-400 dark:text-slate-500 font-bold">
            {{ trans().loading }}
          </p>
        </div>
      } @else if (hasError()) {
        <!-- Error State -->
        <div class="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 max-w-md mx-auto">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto text-red-500 dark:text-red-400 shadow-inner">
            <app-icon name="exclamation-triangle" size="2em"></app-icon>
          </div>
          <div class="space-y-1.5 px-4">
            <h3 class="text-lg font-black text-slate-800 dark:text-slate-200">
              {{ trans().failedLoad }}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {{ trans().errorConnection }}
            </p>
          </div>
          <button 
            (click)="loadTeachers()" 
            class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10"
          >
            {{ trans().retry }}
          </button>
        </div>
      } @else {
        
        <!-- Teachers Grid -->
        <div class="teachers-grid">
          @for (teacher of paginatedTeachers(); track teacher.userId) {
            <div class="teacher-card group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200">
              
              <!-- Gradient accent bar -->
              <div class="h-[4px] w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
              
              <!-- Card Header -->
              <div class="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/10 flex items-center gap-3">
                <!-- Avatar -->
                <div class="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-inner group-hover:scale-[1.04] transition-transform duration-200 overflow-hidden shrink-0"
                     [ngClass]="getAvatarColorClass(teacher.userId)">
                  {{ teacher.fullName.charAt(0) || 'T' }}
                </div>
                
                <div class="space-y-1 min-w-0 flex-1 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  <h3 class="font-bold text-slate-800 dark:text-slate-100 text-[15px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" [title]="teacher.fullName">
                    {{ teacher.fullName }}
                  </h3>
                  @if (teacher.specialization) {
                    <span class="inline-flex text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-900/40">
                      {{ teacher.specialization }}
                    </span>
                  } @else {
                    <span class="inline-flex text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                      {{ trans().noSpecialization }}
                    </span>
                  }
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
                
                <!-- Contact & Date -->
                <div class="space-y-2 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                    <span class="text-slate-400 dark:text-slate-500 shrink-0"><app-icon name="mail" size="1.1em"></app-icon></span>
                    <span class="email-text select-all font-semibold" [title]="teacher.email">{{ teacher.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-500 dark:text-slate-500 text-[11px] font-semibold">
                    <span class="shrink-0"><app-icon name="calendar" size="1.1em"></app-icon></span>
                    <span>
                      {{ trans().hiringDate }} 
                      {{ teacher.hiringDate | date:'mediumDate' }}
                    </span>
                  </div>
                </div>

                <!-- Bio -->
                <div class="teacher-bio bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-xl flex flex-col justify-center text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  @if (teacher.bio) {
                    <p class="text-[12px] leading-relaxed m-0 text-slate-500 dark:text-slate-400 line-clamp-2 font-medium" [title]="teacher.bio">
                      {{ teacher.bio }}
                    </p>
                  } @else {
                    <p class="text-[12px] italic m-0 text-slate-400 dark:text-slate-500 font-medium text-center">
                      {{ trans().noBio }}
                    </p>
                  }
                </div>

                <!-- Assigned Subjects & Classes -->
                <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                  <h4 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {{ trans().assignedCourses }}
                  </h4>
                  @if (teacher.courses && teacher.courses.length > 0) {
                    <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1 scrollbar-thin">
                      @for (c of teacher.courses; track c.assignmentId) {
                        <div class="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/40 px-1.5 py-0.5 rounded font-bold transition-all hover:scale-[1.02]">
                          {{ c.subjectName }} - {{ c.className }}
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      {{ trans().noCourses }}
                    </p>
                  }
                </div>
              </div>

              <!-- Card Footer -->
              <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono font-bold">
                <span>UID: {{ teacher.userId }}</span>
                <span>TID: {{ teacher.teacherId }}</span>
              </div>
            </div>
          } @empty {
            <!-- Empty State -->
            <div class="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shadow-sm space-y-4">
              <div class="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-600 shadow-inner">
                <app-icon name="search" size="1.8em"></app-icon>
              </div>
              <div class="space-y-1.5">
                <h3 class="text-[16px] font-black text-slate-800 dark:text-slate-200">
                  {{ trans().noMatching }}
                </h3>
                <p class="text-slate-500 dark:text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                  {{ trans().noMatchingDesc }}
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Pagination Wrapper -->
        @if (totalPages() > 1) {
          <div class="pagination-wrapper flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            
            <!-- Results stats -->
            @if (filteredTeachers().length > 0) {
              <div class="text-xs text-slate-500 dark:text-slate-400 font-bold select-none text-right" [class.text-left]="lang() === 'en'" [class.text-right]="lang() === 'ar'">
                {{ trans().showing }}
                <span class="text-blue-600 dark:text-blue-400 font-black">{{ (currentPage() - 1) * pageSize() + 1 }}</span>–<span class="text-blue-600 dark:text-blue-400 font-black">{{ Math.min(currentPage() * pageSize(), filteredTeachers().length) }}</span> 
                {{ trans().of }}
                <span class="text-slate-700 dark:text-slate-200 font-black">{{ filteredTeachers().length }}</span> 
                {{ lang() === 'ar' ? trans().teacher : trans().teachers }}
              </div>
            }

            <!-- Page Buttons -->
            <div class="flex items-center gap-2">
              
              <!-- Prev Button -->
              <button 
                (click)="prevPage()" 
                [disabled]="currentPage() === 1"
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all select-none min-h-[38px]"
                [attr.aria-label]="trans().prev"
              >
                <app-icon [name]="lang() === 'ar' ? 'chevron-right' : 'chevron-left'" size="1.1em"></app-icon>
                <span>{{ trans().prev }}</span>
              </button>

              <!-- Numbers -->
              <div class="flex items-center gap-1">
                @for (p of pagesArray(); track p) {
                  <button
                    (click)="goToPage(p)"
                    [class.active-page]="p === currentPage()"
                    class="page-number-btn w-9.5 h-9.5 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none min-h-[38px]"
                    [attr.aria-current]="p === currentPage() ? 'page' : null"
                  >
                    {{ p }}
                  </button>
                }
              </div>

              <!-- Next Button -->
              <button 
                (click)="nextPage()" 
                [disabled]="currentPage() === totalPages()"
                class="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all select-none min-h-[38px]"
                [attr.aria-label]="trans().next"
              >
                <span>{{ trans().next }}</span>
                <app-icon [name]="lang() === 'ar' ? 'chevron-left' : 'chevron-right'" size="1.1em"></app-icon>
              </button>

            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .teachers-page-container {
      width: min(calc(100% - 32px), 1440px);
      margin-inline: auto;
    }

    .teachers-toolbar {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 210px !important;
      gap: 14px !important;
      align-items: center !important;
      padding: 14px 16px !important;
      border-radius: 18px !important;
    }

    .teachers-grid {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 18px !important;
    }

    .teacher-card {
      min-height: 300px !important;
      max-height: 320px !important;
      border-radius: 18px !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .teacher-card::before {
      content: "";
      height: 4px;
      display: block;
      background: linear-gradient(90deg, #2563EB, #4F46E5, #7C3AED);
    }

    .teacher-card:hover {
      transform: translateY(-3px) !important;
    }

    .teacher-bio {
      min-height: 54px !important;
      max-height: 54px !important;
      padding: 10px 12px !important;
    }

    .email-text {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      direction: ltr !important;
      text-align: start !important;
    }

    .results-summary {
      margin-top: 14px !important;
      margin-bottom: 14px !important;
      font-size: 13px !important;
    }

    .pagination-wrapper {
      margin-top: 22px !important;
      padding: 12px 14px !important;
      border-radius: 16px !important;
    }

    .page-number-btn {
      width: 38px !important;
      height: 38px !important;
      border-radius: 10px !important;
    }

    .active-page {
      background: linear-gradient(135deg, #2563EB 0%, #4F46E5 52%, #7C3AED 100%) !important;
      color: #FFFFFF !important;
      border-color: transparent !important;
      box-shadow: 0 8px 18px rgba(79, 70, 229, 0.22) !important;
    }

    /* Custom scrollbar for assigned courses/classes inside cards */
    .scrollbar-thin::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 999px;
    }
    :root[data-theme='dark'] .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #475569;
    }

    @media (max-width: 1024px) {
      .teachers-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .teachers-grid {
        grid-template-columns: 1fr !important;
      }
      .teachers-toolbar {
        grid-template-columns: 1fr !important;
      }
    }
  `]
})
export class TeachersDirectoryComponent implements OnInit {
  private readonly api = inject(AcademicApiService);

  teachers = signal<TeacherDto[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  
  searchQuery = signal('');
  selectedSpecialization = signal('');
  
  // Locale Support
  lang = signal<'ar' | 'en'>('ar');

  // Pagination support (pageSize = 6 as requested)
  currentPage = signal(1);
  pageSize = signal(6);
  
  protected readonly Math = Math;

  // Get distinct specializations for dropdown filter
  specializations = computed(() => {
    const specs = this.teachers()
      .map(t => t.specialization)
      .filter((s): s is string => !!s);
    return Array.from(new Set(specs));
  });

  filteredTeachers = computed(() => {
    let list = this.teachers();
    const query = this.searchQuery().trim().toLowerCase();
    const spec = this.selectedSpecialization();

    if (query) {
      list = list.filter(t => 
        t.fullName?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query) ||
        t.specialization?.toLowerCase().includes(query)
      );
    }

    if (spec) {
      list = list.filter(t => t.specialization === spec);
    }

    return list;
  });

  trans = computed(() => this.lang() === 'ar' ? AR : EN);

  totalPages = computed(() => {
    return Math.ceil(this.filteredTeachers().length / this.pageSize());
  });

  pagesArray = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  paginatedTeachers = computed(() => {
    const list = this.filteredTeachers();
    const size = this.pageSize();
    const maxPage = Math.max(1, Math.ceil(list.length / size));
    const activePage = Math.min(this.currentPage(), maxPage);
    const start = (activePage - 1) * size;
    return list.slice(start, start + size);
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }
    }
    this.loadTeachers();
  }

  loadTeachers() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.api.getTeachers().subscribe({
      next: (res: TeacherDto[]) => {
        this.teachers.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
    this.currentPage.set(1);
  }

  setSelectedSpecialization(s: string) {
    this.selectedSpecialization.set(s);
    this.currentPage.set(1);
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.scrollToTop();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.scrollToTop();
    }
  }

  goToPage(p: number) {
    this.currentPage.set(p);
    this.scrollToTop();
  }

  private scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getAvatarColorClass(userId: number): string {
    const classes = [
      'bg-gradient-to-br from-blue-600 to-blue-800',
      'bg-gradient-to-br from-indigo-600 to-indigo-800',
      'bg-gradient-to-br from-purple-600 to-purple-800',
      'bg-gradient-to-br from-emerald-600 to-emerald-800'
    ];
    return classes[userId % classes.length];
  }
}
