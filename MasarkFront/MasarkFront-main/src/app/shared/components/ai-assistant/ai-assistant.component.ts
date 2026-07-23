import { Component, signal, computed, inject, ElementRef, ViewChild, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state-service';
import { StudentService } from '../../../features/student/services/student.service';
import { TeacherContextService } from '../../../features/teacher/services/teacher-context.service';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  attachments?: { name: string; type: string }[];
  liked?: boolean;
  disliked?: boolean;
}

interface QuickAction {
  title: string;
  desc: string;
  icon: string;
  gradient: string;
  prompt: string;
}

interface TabCategory {
  label: string;
  icon: string;
  prompt: string;
}

interface RoleConfig {
  roleNameAr: string;
  badgeClass: string;
  greeting: string;
  subGreeting: string;
  quickActions: QuickAction[];
  suggestions: string[];
  tabs: TabCategory[];
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements AfterViewChecked {
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly teacherContext = inject(TeacherContextService);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // UI state
  isOpen = signal<boolean>(false);
  isMinimized = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  inputValue = signal<string>('');
  currentUrl = signal<string>('');

  // Selected Tab state inside chat window
  activeTab = signal<number>(0);

  // Message list
  messages = signal<Message[]>([]);

  // Simulation flags for UI icons
  isRecording = signal<boolean>(false);
  attachedFiles = signal<{ name: string; type: string }[]>([]);

  // Dynamic user details
  userName = computed(() => this.authStateService.user()?.fullName ?? '');
  isAuthenticated = computed(() => this.authStateService.isAuthenticated());
  userRole = computed(() => this.authStateService.userRole());

  // Dynamic extra info
  detectedGradeName = signal<string>('');
  detectedSubjectName = signal<string>('');

  constructor() {
    // Listen to route changes to update currentUrl
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects || event.url || '');
      }
    });
    // Set initial URL
    this.currentUrl.set(this.router.url || '');

    // Watch auth status and fetch extra profile info
    effect(() => {
      if (this.isAuthenticated()) {
        this.loadUserExtraInfo();
      }
    });
  }

  // Helper: Detect gender by common Arabic female name lists and markers
  isFemaleName(name: string): boolean {
    if (!name) return false;
    const femaleEnds = ['ة', 'ى', 'اء', 'ام', 'ين'];
    const femaleNames = [
      'مريم', 'زينب', 'هدى', 'نهى', 'سارة', 'فاطمة', 'شروق', 'حبيبة', 'ياسمين', 
      'إيمان', 'منار', 'أسماء', 'ندى', 'نور', 'سلمى', 'رنا', 'منى', 'ضحى', 
      'آية', 'عبير', 'نورهان', 'رانيا', 'دعاء', 'رحمة', 'ندين', 'فريدة', 
      'روان', 'شهد', 'ملاك', 'جنا', 'ملك', 'نرمين', 'ماري', 'ساره', 'هبة', 'شيرين'
    ];
    const firstWord = name.trim().split(' ')[0];
    if (femaleNames.includes(firstWord)) return true;

    const lastChar = firstWord.charAt(firstWord.length - 1);
    const lastTwo = firstWord.slice(-2);
    if (femaleEnds.includes(lastChar) || lastTwo === 'ات' || lastTwo === 'ان') {
      const maleExclusions = [
        'أحمد', 'محمد', 'مروان', 'عثمان', 'سليمان', 'حسين', 'حسن', 'مصطفى', 
        'يحيى', 'مجدي', 'هاني', 'علي', 'رامي', 'شادي', 'سامي', 'فادي', 'علاء', 'سليمان'
      ];
      if (!maleExclusions.includes(firstWord)) {
        return true;
      }
    }
    return false;
  }

  detectedGender = computed<'male' | 'female'>(() => {
    const fullName = this.userName();
    return this.isFemaleName(fullName) ? 'female' : 'male';
  });

  // Dynamic Avatar selection (male/female student, teacher, parent, admin)
  avatarType = computed<'student_male' | 'student_female' | 'teacher' | 'parent' | 'admin'>(() => {
    const role = this.userRole();
    if (role === 'Student') {
      return this.detectedGender() === 'female' ? 'student_female' : 'student_male';
    } else if (role === 'Teacher') {
      return 'teacher';
    } else if (role === 'Parent') {
      return 'parent';
    } else {
      return 'admin';
    }
  });

  // Visibility Rules: Hide from public guest and authentication pages
  isVisible = computed(() => {
    if (!this.isAuthenticated()) {
      return false;
    }

    const url = this.currentUrl().toLowerCase();
    const publicPaths = [
      '/login',
      '/register',
      '/forgot-password',
      '/forgotpassword',
      '/reset-password',
      '/resetpassword',
      '/verify-email',
      '/verifyemail',
      '/landing',
      '/auth/'
    ];

    const isPublicPath = publicPaths.some(path => url.includes(path));
    if (isPublicPath) {
      return false;
    }

    return true;
  });

  // Dynamic role configs with dynamic names, grades, subjects, quick actions, and NO emojis
  activeConfig = computed<RoleConfig>(() => {
    const fullName = this.userName();
    const name = fullName.split(' ')[0] || 'بكم';
    const role = this.userRole();

    switch (role) {
      case 'Student':
        const gradeName = this.detectedGradeName() || 'الصف الثاني الثانوي';
        return {
          roleNameAr: gradeName,
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
          greeting: `مرحبًا ${fullName}`,
          subGreeting: 'يسعدني مساعدتك أثناء رحلتك التعليمية. يمكنني مساعدتك في فهم الدروس، حل الواجبات، مراجعة الاختبارات، وتنظيم خطة المذاكرة.',
          suggestions: [
            'اشرح معادلات الدرجة الأولى',
            'ساعدني في حل واجب اليوم',
            'اختبرني في مادة الفيزياء',
            'لخص الفصل الثالث',
            'أنشئ ملاحظات مراجعة'
          ],
          tabs: [
            { label: 'الدروس', icon: 'fa-book', prompt: 'اشرح لي درس اليوم' },
            { label: 'الاختبارات', icon: 'fa-bullseye', prompt: 'أنشئ لي اختبارًا سريعًا' },
            { label: 'الملفات', icon: 'fa-folder', prompt: 'لخص لي ملف PDF' },
            { label: 'الواجبات', icon: 'fa-clipboard-list', prompt: 'ساعدني في حل واجبي' },
            { label: 'خطة المذاكرة', icon: 'fa-calendar-days', prompt: 'ضع لي خطة مذاكرة' }
          ],
          quickActions: [
            { title: 'اشرح درس اليوم', desc: 'تفكيك وتبسيط المفاهيم الصعبة', icon: 'fa-book-open', gradient: 'bg-blue-50 text-blue-600 border-blue-100', prompt: 'اشرح لي درس اليوم' },
            { title: 'ساعدني في حل واجبي', desc: 'خطوات الحل للمسائل المختلفة', icon: 'fa-pen-fancy', gradient: 'bg-rose-50 text-rose-600 border-rose-100', prompt: 'ساعدني في حل واجبي' },
            { title: 'أنشئ اختبارًا سريعًا', desc: 'أسئلة تفاعلية لتقييم فهمك', icon: 'fa-graduation-cap', gradient: 'bg-indigo-50 text-indigo-600 border-indigo-100', prompt: 'أنشئ لي اختبارًا سريعًا' },
            { title: 'لخص هذا الدرس', desc: 'تلخيص ذكي للملفات والملاحظات', icon: 'fa-file-pdf', gradient: 'bg-amber-50 text-amber-600 border-amber-100', prompt: 'لخص هذا الدرس' },
            { title: 'ضع لي خطة مذاكرة', desc: 'تنظيم الوقت وجدول الدراسة', icon: 'fa-calendar-alt', gradient: 'bg-cyan-50 text-cyan-600 border-cyan-100', prompt: 'ضع لي خطة مذاكرة' },
            { title: 'مراجعة قبل الامتحان', desc: 'مراجعة سريعة لأهم الأفكار', icon: 'fa-clock-rotate-left', gradient: 'bg-yellow-50 text-yellow-600 border-yellow-100', prompt: 'مراجعة قبل الامتحان' },
            { title: 'ترجم الكلمات الصعبة', desc: 'الترجمة الفورية لأي نص', icon: 'fa-language', gradient: 'bg-emerald-50 text-emerald-600 border-emerald-100', prompt: 'ترجم الكلمات الصعبة' },
            { title: 'اشرح ملف PDF', desc: 'تحليل وتلخيص الملف المرفق', icon: 'fa-file-arrow-up', gradient: 'bg-purple-50 text-purple-600 border-purple-100', prompt: 'اشرح ملف PDF' },
            { title: 'اختبر معلوماتي', desc: 'تحدي سريع للتحقق من الفهم', icon: 'fa-circle-question', gradient: 'bg-pink-50 text-pink-600 border-pink-100', prompt: 'اختبر معلوماتي' },
            { title: 'ماذا يجب أن أذاكر اليوم؟', desc: 'توجيه دراسي بناء على مستواك', icon: 'fa-compass', gradient: 'bg-teal-50 text-teal-600 border-teal-100', prompt: 'ماذا يجب أن أذاكر اليوم؟' }
          ]
        };
      case 'Teacher':
        const subjectName = this.detectedSubjectName() || 'معلم الرياضيات';
        return {
          roleNameAr: subjectName,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          greeting: `مرحبًا أستاذ ${fullName}`,
          subGreeting: 'يمكنني مساعدتك في إعداد الدروس، إنشاء الاختبارات، تنظيم المحتوى، ومتابعة أداء الطلاب.',
          suggestions: [
            'أنشئ 10 أسئلة اختيار من متعدد',
            'حضّر درس الغد',
            'إعداد واجب منزلي جديد',
            'إنشاء نشاط صفّي تفاعلي'
          ],
          tabs: [
            { label: 'خطة درس', icon: 'fa-chalkboard-user', prompt: 'تحضير خطة درس' },
            { label: 'الاختبارات', icon: 'fa-list-check', prompt: 'إنشاء اختبار' },
            { label: 'الواجبات', icon: 'fa-file-signature', prompt: 'إعداد واجب منزلي' },
            { label: 'تحليل الطلاب', icon: 'fa-chart-line', prompt: 'تحليل أداء الطلاب' },
            { label: 'نشاط صفّي', icon: 'fa-gamepad', prompt: 'إنشاء نشاط صفّي' }
          ],
          quickActions: [
            { title: 'تحضير خطة درس', desc: 'صياغة أهداف وشرح الحصة القادمة', icon: 'fa-chalkboard-user', gradient: 'bg-blue-50 text-blue-600 border-blue-100', prompt: 'تحضير خطة درس' },
            { title: 'إنشاء اختبار', desc: 'صياغة أسئلة تقييمية متنوعة', icon: 'fa-list-check', gradient: 'bg-rose-50 text-rose-600 border-rose-100', prompt: 'إنشاء اختبار' },
            { title: 'إعداد واجب منزلي', desc: 'تمارين وتدريبات للحل البيتي', icon: 'fa-square-pen', gradient: 'bg-indigo-50 text-indigo-600 border-indigo-100', prompt: 'إعداد واجب منزلي' },
            { title: 'إنشاء ورقة عمل', desc: 'تمارين وتطبيقات مخصصة للدرس', icon: 'fa-file-alt', gradient: 'bg-amber-50 text-amber-600 border-amber-100', prompt: 'إنشاء ورقة عمل' },
            { title: 'إعداد بنك أسئلة', desc: 'تجميع أسئلة للمراجعات الشهرية', icon: 'fa-database', gradient: 'bg-cyan-50 text-cyan-600 border-cyan-100', prompt: 'إعداد بنك أسئلة' },
            { title: 'تلخيص الدرس', desc: 'اختصار وتلخيص محاور المنهج', icon: 'fa-compress', gradient: 'bg-yellow-50 text-yellow-600 border-yellow-100', prompt: 'تلخيص الدرس' },
            { title: 'تحليل أداء الطلاب', desc: 'متابعة وتفسير درجات الطلاب', icon: 'fa-chart-pie', gradient: 'bg-emerald-50 text-emerald-600 border-emerald-100', prompt: 'تحليل أداء الطلاب' },
            { title: 'إعداد جدول الأسبوع القادم', desc: 'تنظيم الحصص والتحضيرات', icon: 'fa-calendar-week', gradient: 'bg-purple-50 text-purple-600 border-purple-100', prompt: 'إعداد جدول الأسبوع القادم' },
            { title: 'إنشاء نشاط صفّي', desc: 'ألعاب وأنشطة تفاعلية للغرفة الصفية', icon: 'fa-gamepad', gradient: 'bg-pink-50 text-pink-600 border-pink-100', prompt: 'إنشاء نشاط صفّي' },
            { title: 'كتابة الأهداف التعليمية', desc: 'صياغة أهداف السلوك والمخرجات', icon: 'fa-bullseye', gradient: 'bg-teal-50 text-teal-600 border-teal-100', prompt: 'كتابة الأهداف التعليمية' }
          ]
        };
      case 'Parent':
        return {
          roleNameAr: 'ولي أمر',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
          greeting: `مرحبًا ${fullName}`,
          subGreeting: 'يمكنني مساعدتك في متابعة مستوى أبنائك، الواجبات، الاختبارات، والتقارير الدراسية.',
          suggestions: [
            'كيف أداء ابني الدراسي؟',
            'ما هي الواجبات المتأخرة على ابني؟',
            'اعرض تقرير أداء هذا الأسبوع'
          ],
          tabs: [
            { label: 'التقدم الدراسي', icon: 'fa-chart-line', prompt: 'متابعة تقدم ابني' },
            { label: 'الواجبات المتأخرة', icon: 'fa-clipboard-question', prompt: 'عرض الواجبات المتأخرة' },
            { label: 'الاختبارات', icon: 'fa-graduation-cap', prompt: 'الاختبارات القادمة' },
            { label: 'التقارير', icon: 'fa-file-invoice', prompt: 'التقرير الدراسي الأسبوعي' },
            { label: 'الحضور والغياب', icon: 'fa-calendar-check', prompt: 'ملخص الحضور والغياب' }
          ],
          quickActions: [
            { title: 'متابعة تقدم ابني', desc: 'مراجعة وتفسير الدرجات الأخيرة للابن', icon: 'fa-chart-line', gradient: 'bg-blue-50 text-blue-600 border-blue-100', prompt: 'متابعة تقدم ابني' },
            { title: 'عرض الواجبات المتأخرة', desc: 'مراجعة المهام والواجبات غير المحلولة', icon: 'fa-clipboard-list', gradient: 'bg-rose-50 text-rose-600 border-rose-100', prompt: 'عرض الواجبات المتأخرة' },
            { title: 'الاختبارات القادمة', desc: 'مواعيد وتفاصيل الامتحانات المقبلة', icon: 'fa-bullseye', gradient: 'bg-indigo-50 text-indigo-600 border-indigo-100', prompt: 'الاختبارات القادمة' },
            { title: 'التقرير الدراسي الأسبوعي', desc: 'ملخص أسبوعي وشامل لمستوى الأبناء', icon: 'fa-file-invoice', gradient: 'bg-amber-50 text-amber-600 border-amber-100', prompt: 'التقرير الدراسي الأسبوعي' },
            { title: 'ملخص الحضور والغياب', desc: 'تتبع الغيابات والمشاركات اليومية للابن', icon: 'fa-calendar-check', gradient: 'bg-cyan-50 text-cyan-600 border-cyan-100', prompt: 'ملخص الحضور والغياب' },
            { title: 'كيف أساعد ابني في المذاكرة؟', desc: 'إرشادات تربوية للبيت', icon: 'fa-heart', gradient: 'bg-yellow-50 text-yellow-600 border-yellow-100', prompt: 'كيف أساعد ابني في المذاكرة؟' },
            { title: 'توصيات دراسية للابن', desc: 'خطوات عملية لتحسين أداء الأبناء', icon: 'fa-lightbulb', gradient: 'bg-emerald-50 text-emerald-600 border-emerald-100', prompt: 'توصيات دراسية للابن' },
            { title: 'نقاط القوة والضعف', desc: 'تحليل الأداء الفردي والمواد الضعيفة', icon: 'fa-chart-pie', gradient: 'bg-purple-50 text-purple-600 border-purple-100', prompt: 'نقاط القوة والضعف لدى الابن' },
            { title: 'نصائح لتحسين التحصيل', desc: 'طرق تشجيع الأبناء والتفوق', icon: 'fa-graduation-cap', gradient: 'bg-pink-50 text-pink-600 border-pink-100', prompt: 'نصائح لتحسين التحصيل الدراسي' }
          ]
        };
      case 'Admin':
        return {
          roleNameAr: 'مدير النظام',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
          greeting: `مرحبًا ${fullName}`,
          subGreeting: 'يمكنني مساعدتك في الوصول السريع إلى التقارير والإحصائيات وإدارة المنصة.',
          suggestions: [
            'Show platform statistics',
            'Show active users',
            'Generate usage report'
          ],
          tabs: [
            { label: 'إحصائيات', icon: 'fa-chart-column', prompt: 'إحصائيات المنصة' },
            { label: 'المستخدمين', icon: 'fa-users', prompt: 'المستخدمين النشطين' },
            { label: 'النشاط', icon: 'fa-clock', prompt: 'نشاط المنصة اليوم' },
            { label: 'التقارير', icon: 'fa-file-shield', prompt: 'تقارير النظام' },
            { label: 'الأداء', icon: 'fa-server', prompt: 'أداء واستقرار المنصة' }
          ],
          quickActions: [
            { title: 'إحصائيات المنصة', desc: 'نظرة عامة على أداء المنصة الفني', icon: 'fa-gauge-high', gradient: 'bg-blue-50 text-blue-600 border-blue-100', prompt: 'إحصائيات المنصة' },
            { title: 'المستخدمين النشطين', desc: 'عدد وتفاصيل الحسابات النشطة الآن', icon: 'fa-users', gradient: 'bg-rose-50 text-rose-600 border-rose-100', prompt: 'المستخدمين النشطين' },
            { title: 'نشاط المنصة اليوم', desc: 'معدل التسجيلات والتفاعلات اليومية', icon: 'fa-chart-line', gradient: 'bg-indigo-50 text-indigo-600 border-indigo-100', prompt: 'نشاط المنصة اليوم' },
            { title: 'نظرة عامة على المقررات', desc: 'إحصائيات المناهج والملفات المنشورة', icon: 'fa-book', gradient: 'bg-amber-50 text-amber-600 border-amber-100', prompt: 'نظرة عامة على المقررات' },
            { title: 'نظرة عامة على المعلمين', desc: 'متابعة حسابات وتفاعلات المعلمين', icon: 'fa-person-chalkboard', gradient: 'bg-cyan-50 text-cyan-600 border-cyan-100', prompt: 'نظرة عامة على المعلمين' },
            { title: 'نظرة عامة على الطلاب', desc: 'متابعة تسجيلات ودرجات الطلاب', icon: 'fa-graduation-cap', gradient: 'bg-yellow-50 text-yellow-600 border-yellow-100', prompt: 'نظرة عامة على الطلاب' },
            { title: 'تقارير النظام', desc: 'ملخص التقارير الفنية واللوائح المحدثة', icon: 'fa-file-shield', gradient: 'bg-emerald-50 text-emerald-600 border-emerald-100', prompt: 'تقارير النظام' },
            { title: 'أداء واستقرار المنصة', desc: 'مراقبة الخوادم ومعدل الاستجابة', icon: 'fa-server', gradient: 'bg-purple-50 text-purple-600 border-purple-100', prompt: 'أداء واستقرار المنصة' }
          ]
        };
      default:
        return {
          roleNameAr: 'زائر',
          badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
          greeting: `مرحبًا بك`,
          subGreeting: 'يمكنني مساعدتك في التعرف على منصة مسارك وخدماتها المختلفة.',
          suggestions: [
            'ما هي خدمات منصة مسارك؟',
            'كيف يمكنني التسجيل؟'
          ],
          tabs: [
            { label: 'المنصة', icon: 'fa-info-circle', prompt: 'ما هي خدمات منصة مسارك؟' },
            { label: 'التسجيل', icon: 'fa-user-plus', prompt: 'كيف يمكنني التسجيل؟' }
          ],
          quickActions: [
            { title: 'ما هي خدمات منصة مسارك؟', desc: 'التعريف بميزات المنصة وخدماتها', icon: 'fa-info-circle', gradient: 'bg-blue-50 text-blue-600 border-blue-100', prompt: 'ما هي خدمات منصة مسارك؟' },
            { title: 'كيف يمكنني التسجيل؟', desc: 'خطوات إنشاء حساب وتفعيله', icon: 'fa-user-plus', gradient: 'bg-rose-50 text-rose-600 border-rose-100', prompt: 'كيف يمكنني التسجيل؟' }
          ]
        };
    }
  });

  loadUserExtraInfo() {
    const role = this.userRole();
    if (role === 'Student') {
      this.studentService.getProfile().subscribe({
        next: (profile) => {
          if (profile && profile.gradeName) {
            this.detectedGradeName.set(profile.gradeName);
          }
        },
        error: () => {
          this.detectedGradeName.set('الصف الثاني الثانوي');
        }
      });
    } else if (role === 'Teacher') {
      this.teacherContext.loadAssignments();
      setTimeout(() => {
        const assignments = this.teacherContext.assignments();
        if (assignments && assignments.length > 0) {
          const subjects = assignments.map(a => a.subjectName);
          const uniqueSubjects = Array.from(new Set(subjects));
          this.detectedSubjectName.set(`معلم ${uniqueSubjects.join(' و')}`);
        } else {
          this.detectedSubjectName.set('معلم الرياضيات');
        }
      }, 1000);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleAssistant(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.isMinimized.set(false);
    } else {
      this.isOpen.set(true);
      this.isMinimized.set(false);
    }
  }

  minimizeAssistant(event: MouseEvent): void {
    event.stopPropagation();
    this.isMinimized.set(!this.isMinimized());
  }

  closeAssistant(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.set(false);
    this.isMinimized.set(false);
  }

  sendPrompt(promptText: string): void {
    if (!promptText.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: promptText,
      timestamp: new Date()
    };

    if (this.attachedFiles().length > 0) {
      userMsg.attachments = [...this.attachedFiles()];
      this.attachedFiles.set([]);
    }

    this.messages.update(prev => [...prev, userMsg]);
    this.inputValue.set('');

    // Trigger typing state
    this.isTyping.set(true);
    this.scrollToBottom();

    // Simulate AI response
    setTimeout(() => {
      const responseText = this.generateSimulatedReply(promptText);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: responseText,
        timestamp: new Date()
      };
      this.messages.update(prev => [...prev, assistantMsg]);
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1500);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendPrompt(this.inputValue());
    }
  }

  triggerAttachment(): void {
    const fileNames = ['واجب_الرياضيات.pdf', 'ملخص_الفيزياء.docx', 'جدول_المذاكرة.png'];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const extension = randomFile.split('.').pop() || 'pdf';

    this.attachedFiles.update(prev => [...prev, { name: randomFile, type: extension }]);
  }

  removeAttachedFile(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.attachedFiles.update(prev => prev.filter((_, i) => i !== index));
  }

  triggerMicrophone(): void {
    if (this.isRecording()) {
      this.isRecording.set(false);
      this.inputValue.set('هذا تسجيل صوتي تجريبي تم تحويله إلى نص...');
    } else {
      this.isRecording.set(true);
      setTimeout(() => {
        if (this.isRecording()) {
          this.isRecording.set(false);
          this.inputValue.set('هذا تسجيل صوتي تجريبي تم تحويله إلى نص...');
        }
      }, 3000);
    }
  }

  clearChat(): void {
    this.messages.set([]);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Mock copy feedback
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  likeMessage(msg: Message): void {
    msg.liked = !msg.liked;
    if (msg.liked) msg.disliked = false;
  }

  dislikeMessage(msg: Message): void {
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false;
  }

  regenerateMessage(index: number): void {
    let userPrompt = '';
    for (let i = index - 1; i >= 0; i--) {
      if (this.messages()[i].sender === 'user') {
        userPrompt = this.messages()[i].text;
        break;
      }
    }

    if (!userPrompt) return;

    this.messages.update(prev => prev.filter((_, i) => i !== index));
    this.isTyping.set(true);

    setTimeout(() => {
      const responseText = this.generateSimulatedReply(userPrompt);
      const assistantMsg: Message = {
        sender: 'assistant',
        text: responseText,
        timestamp: new Date()
      };
      this.messages.update(prev => {
        const copy = [...prev];
        copy.splice(index, 0, assistantMsg);
        return copy;
      });
      this.isTyping.set(false);
      this.scrollToBottom();
    }, 1500);
  }

  selectTab(index: number, prompt: string): void {
    this.activeTab.set(index);
    this.sendPrompt(prompt);
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore scroll errors
    }
  }

  private generateSimulatedReply(input: string): string {
    const lowerInput = input.toLowerCase();

    // Student Replies
    if (lowerInput.includes('درس اليوم') || lowerInput.includes('معادلات') || lowerInput.includes('اشرح')) {
      return `شرح درس المعادلات من الدرجة الأولى:

المعادلة هي عبارة رياضية تحتوي على متغير واحد على الأقل، وتهدف لإيجاد قيمة هذا المتغير التي تجعل الطرفين متساويين.

مثال:
2x + 5 = 13
بطرح 5 من الطرفين نحصل على:
2x = 8
ثم نقسم على 2:
x = 4

هل تريد أمثلة إضافية؟`;
    }

    if (lowerInput.includes('quiz') || lowerInput.includes('اختبار') || lowerInput.includes('اختبرني')) {
      return `تفضل هذا السؤال القصير لتقييم مستواك:

أوجد قيمة x في المعادلة التالية:
3x - 4 = 11

أ) x = 3
ب) x = 5
ج) x = 7

اكتب الحرف المقابل للإجابة الصحيحة، وسأخبرك بالنتيجة فورًا!`;
    }

    if (lowerInput.includes('pdf') || lowerInput.includes('ملخص') || lowerInput.includes('لخص') || lowerInput.includes('summarize')) {
      return `تم تلخيص الملف بنجاح!
إليك أهم النقاط الواردة:
• المفهوم الأساسي: المعادلات وتطبيقاتها في الجبر.
• القانون العام: طريقة موازنة طرفي المعادلة الحسابية.
• تطبيقات عملية: أمثلة متنوعة للمتغيرات الفردية.

سأكون سعيدًا بشرح أي نقطة بالتفصيل إذا رغبت.`;
    }

    if (lowerInput.includes('خطة') || lowerInput.includes(' study plan') || lowerInput.includes('جدول')) {
      return `خطة دراسية مقترحة للأسبوع الحالي:
• السبت والأحد: مراجعة الجبر والكسور وحل المسائل (ساعة يوميًا).
• الإثنين والثلاثاء: العلوم والفيزياء وفهم القوانين (ساعة يوميًا).
• الأربعاء: اللغة العربية والإنجليزية وتدريبات التعبير والكتابة.
• الخميس والجمعة: حل اختبارات عامة وتقييم الأداء.

يمكنك إخباري بمواعيدك وسأعدل الجدول ليناسبك تمامًا!`;
    }

    if (lowerInput.includes('واجب') || lowerInput.includes('حل') || lowerInput.includes('homework') || lowerInput.includes('solve')) {
      return `بخصوص واجب اليوم:
تفضل خطوات الحل للتمرين المحدد:
1. أولاً: نحدد المعطيات المطلوبة في المسألة.
2. ثانياً: نطبق القانون المناسب (مثل معادلات الحركة أو النسبة المئوية).
3. ثالثاً: نعوض بالقيم للحصول على الناتج النهائي.

اكتب التمرين وسنقوم بحله معًا خطوة بخطوة.`;
    }

    if (lowerInput.includes('ترجم') || lowerInput.includes('translate')) {
      return `الترجمة الفورية جاهزة:
"Welcome to Masarak educational platform, your ideal way to achieve academic success and acquire modern skills."

هل تحتاج ترجمة نصوص أخرى أو شرح للقواعد الواردة؟`;
    }

    // Parent Replies
    if (lowerInput.includes('مستوى') || lowerInput.includes('أداء') || lowerInput.includes('درجات') || lowerInput.includes('تقدم')) {
      return `تقرير الأداء الدراسي للأبناء:
• الطالب يظهر تفوقًا ملحوظًا في الرياضيات والعلوم بنسبة 85%.
• يوجد تحسن مستمر في اللغة الإنجليزية مقارنة بالشهر الماضي.
• نوصي بالتركيز الإضافي على قواعد النحو في اللغة العربية لرفع التقييم العام.

هل تود اقتراح خطة مراجعة أسرية لتحسين نقاط الضعف؟`;
    }

    if (lowerInput.includes('حضور') || lowerInput.includes('مواظبة') || lowerInput.includes('غياب')) {
      return `سجل الحضور والمواظبة للأسبوع الحالي:
• نسبة حضور الحصص: 98% (ممتاز).
• المشاركة الصفية وتفاعل الطالب: إيجابي جداً وتلقى ثناءً من معلّمي المواد.
• لم يتم رصد أي غياب غير مبرر.

استمر في تشجيع الطالب للحفاظ على هذا المستوى الرائع!`;
    }

    if (lowerInput.includes('واجبات متأخرة') || lowerInput.includes('المتأخرة')) {
      return `الواجبات المتأخرة أو المعلقة:
• واجب الرياضيات (معادلات الخط المستقيم) - تاريخ التسليم النهائي كان أمس.
• ورقة عمل العلوم (الكهرباء الساكنة) - متبقي يوم واحد على موعد التسليم.

نوصي بمساعدة الطالب على إتمام هذه المهام اليوم للحفاظ على تقييمه الأكاديمي.`;
    }

    // Teacher Replies
    if (lowerInput.includes('خطة درس') || lowerInput.includes('تحضير')) {
      return `خطة تحضير الدرس المقترحة:
• المادة: الرياضيات / الجبر.
• موضوع الدرس: حل معادلتين آنيتين.
• الأهداف السلوكية: أن يتعلم الطالب كيفية الحذف والتعويض لإيجاد قيم المتغيرين.
• الأنشطة التفاعلية: مشاركة الطلاب في مجموعات لحل مسألة سباق السرعة.
• التقييم الختامي: اختبار قصير مكون من سؤالين في نهاية الحصة.

هل تود إضافة المزيد من التفاصيل أو الأنشطة؟`;
    }

    if (lowerInput.includes('إنشاء اختبار') || lowerInput.includes('إعداد اختبار')) {
      return `الاختبار القصير المقترح:
السؤال الأول: اختر الإجابة الصحيحة لـ 2x + 7 = 15.
أ) 4
ب) 5
ج) 8

السؤال الثاني: صح أم خطأ: القيمة المطلقة دائماً موجبة.
أ) صح
ب) خطأ

يمكنني توليد نموذج إجابة وتصدير الأسئلة في ملف إذا رغبت.`;
    }

    // Admin Replies
    if (lowerInput.includes('إحصائيات') || lowerInput.includes('تقرير أداء')) {
      return `إحصائيات أداء المنصة العام اليوم:
• إجمالي المستخدمين المسجلين: 12,450 مستخدم.
• المستخدمين النشطين اليوم: 4,890 مستخدم.
• سرعة استجابة الخادم: 120ms (ممتاز).
• معدل استخدام ميزات الذكاء الاصطناعي: 1,200 استعلام.

لا توجد أي بلاغات عن توقف أو مشاكل تقنية حالياً.`;
    }

    if (lowerInput.includes('المستخدمين') || lowerInput.includes('المشرفين') || lowerInput.includes('نشاط')) {
      return `تقرير نشاط الحسابات اليوم:
• الطلاب الجدد المسجلين اليوم: 45 طالب.
• المعلمين المسجلين اليوم: 6 معلمين.
• عمليات الدخول الناجحة: 3,450 عملية.
• طلبات الدعم الفني المعلقة: 2 فقط (قيد المتابعة).

هل تريد تصدير تقرير نشاط المستخدمين بصيغة Excel؟`;
    }

    // Default reply
    return `مرحبًا بك في مساعد مسارك.
أنا هنا لمساعدتك وتسهيل مهامك اليومية في المنصة.
كيف يمكنني مساعدتك الآن؟`;
  }
}
