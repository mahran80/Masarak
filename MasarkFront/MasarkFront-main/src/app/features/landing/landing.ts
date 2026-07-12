import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal,
  computed,
  HostListener,
  HostBinding
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

/* ============================================================
   TYPES
   ============================================================ */
type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';

interface HeroSlide { tag: string; title: string; highlight: string; subtitle: string; }
interface AiTip { label: string; text: string; }
interface StatItem { value: number; suffix: string; label: string; }
interface FeatureItem { icon: string; title: string; description: string; }
interface StageItem { title: string; range: string; description: string; }
interface ProcessStep { index: string; title: string; description: string; }
interface TeamMember { name: string; role: string; description: string; }
interface Testimonial { name: string; role: string; quote: string; }
interface FaqItem { question: string; answer: string; }

interface Dictionary {
  nav: { home: string; features: string; stages: string; journey: string; team: string; faq: string; start: string };
  hero: { slides: HeroSlide[]; ctaPrimary: string; ctaGhost: string };
  aiTips: AiTip[];
  aiCardLabel: string;
  stats: StatItem[];
  featuresHead: { eyebrow: string; title: string; sub: string };
  features: FeatureItem[];
  stagesHead: { eyebrow: string; title: string; sub: string };
  stages: StageItem[];
  aiSectionHead: { eyebrow: string; title: string; sub: string };
  aiSection: { title: string; desc: string }[];
  aiPanel: { title: string; badge: string; accuracyLabel: string; accuracyDesc: string };
  processHead: { eyebrow: string; title: string; sub: string };
  process: ProcessStep[];
  teamHead: { eyebrow: string; title: string; sub: string };
  team: TeamMember[];
  testimonialsHead: { eyebrow: string; title: string };
  testimonials: Testimonial[];
  faqHead: { eyebrow: string; title: string };
  faqs: FaqItem[];
  finalCta: { title: string; sub: string; primary: string };
  footer: { desc: string; quickLinks: string; stagesTitle: string; contact: string; rights: string; accredited: string };
}

/* ============================================================
   NON-TRANSLATED MEDIA
   Kept separate from the text dictionary on purpose — swapping an
   image should never require touching translation strings.
   Source: Unsplash (free license), verified reachable.
   ============================================================ */
const MEDIA = {
  hero: 'https://images.unsplash.com/photo-1758270705290-62b6294dd044?fm=jpg&q=80&w=1600&auto=format&fit=crop',
  aiPanel: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  stages: [
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?fm=jpg&q=80&w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?fm=jpg&q=80&w=900&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1758685848174-e061c6486651?fm=jpg&q=80&w=900&auto=format&fit=crop'
  ]
};

/* ============================================================
   CONTENT
   ============================================================ */
const AR: Dictionary = {
  nav: { home: 'الرئيسية', features: 'المميزات', stages: 'المراحل', journey: 'رحلة الطالب', team: 'فريق العمل', faq: 'الأسئلة الشائعة', start: 'ابدأ الآن' },
  hero: {
    ctaPrimary: 'ابدأ رحلة التعلم',
    ctaGhost: 'استكشف المنصة',
    slides: [
      { tag: 'إدارة تعليمية ذكية', title: 'مدرستك المصرية', highlight: 'أينما كنت', subtitle: 'نظام إدارة تعلم شامل يجمع المنهج الرسمي والذكاء الاصطناعي في تجربة واحدة لطلاب مصر بالخارج.' },
      { tag: 'فصول حية', title: 'تفاعل مباشر', highlight: 'بلا انقطاع', subtitle: 'منصة تواصل مستمر بين الطالب والمعلم وولي الأمر لضمان الجودة والمتابعة.' }
    ]
  },
  aiCardLabel: 'مساعد مسارك',
  aiTips: [
    { label: 'تحليل الأداء', text: 'نسبة الإنجاز ممتازة — وقت مراجعة الوحدات القادمة.' },
    { label: 'توصية', text: 'حل الاختبار التجريبي الآن يرفع نسبة الجاهزية.' }
  ],
  stats: [
    { value: 12, suffix: '+', label: 'مرحلة دراسية مغطاة' },
    { value: 100, suffix: '%', label: 'تتبع شامل للأداء' },
    { value: 24, suffix: '/7', label: 'وصول للمحتوى' },
    { value: 98, suffix: '%', label: 'رضا أولياء الأمور' }
  ],
  featuresHead: { eyebrow: 'النظام البيئي', title: 'أدوات إدارة أكاديمية متكاملة', sub: 'كل ما تحتاجه المؤسسة التعليمية والطالب في منصة واحدة تعتمد على بنية برمجية قوية.' },
  features: [
    { icon: 'video_camera_front', title: 'حصص تفاعلية', description: 'جدولة تلقائية وإدارة كاملة للمحاضرات المباشرة عبر المنصة.' },
    { icon: 'quiz', title: 'اختبارات ذكية', description: 'بنك أسئلة وتصحيح آلي مع تقارير أداء فورية لكل طالب.' },
    { icon: 'analytics', title: 'إدارة أكاديمية', description: 'تتبع الحضور، الاشتراكات، والتقدم الأكاديمي بسلاسة.' }
  ],
  stagesHead: { eyebrow: 'المراحل الدراسية', title: 'مسار مصمم لكل مرحلة عمرية', sub: 'محتوى وأدوات مختلفة تناسب قدرات واحتياجات كل طالب.' },
  stages: [
    { title: 'المرحلة الابتدائية', range: 'من الصف الأول إلى السادس', description: 'تأسيس قوي في القراءة والحساب من خلال دروس تفاعلية قصيرة ومحفزة.' },
    { title: 'المرحلة الإعدادية', range: 'من الصف الأول إلى الثالث', description: 'تعميق الفهم وبناء مهارات حل المسائل استعدادًا للمرحلة الثانوية.' },
    { title: 'المرحلة الثانوية', range: 'من الصف الأول إلى الثالث', description: 'مسار مكثف للتفوق الدراسي وجاهزية كاملة لامتحان السفارة.' }
  ],
  aiSectionHead: { eyebrow: 'ذكاء المنصة', title: 'توزيع وتحليل آلي بالذكاء الاصطناعي', sub: 'نظام توزيع ذكي للطلاب على الفصول، مصحوباً بتحليلات تنبؤية لرفع الكفاءة.' },
  aiSection: [
    { title: 'تعيين الطلاب المدعوم بالذكاء الاصطناعي', desc: 'توزيع آلي يعتمد على مستويات التقييم لضمان توازن الفصول.' },
    { title: 'تحليل بيانات المؤسسة', desc: 'لوحات تحكم تبرز اتجاهات الأداء والنمو الأكاديمي للإدارة.' }
  ],
  aiPanel: { title: 'تحليل الأداء التنبؤي', badge: 'يعمل بالذكاء الاصطناعي', accuracyLabel: 'دقة التحليل', accuracyDesc: 'توقع الأداء بناءً على منحنى تقدم الطالب' },
  processHead: { eyebrow: 'مسار الطالب', title: 'رحلة تعلم مُهيكلة خطوة بخطوة', sub: 'مسار واضح وموجه لضمان عدم تشتت الطالب.' },
  process: [
    { index: '01', title: 'التسجيل', description: 'بناء الملف الأكاديمي للطالب.' },
    { index: '02', title: 'الأساسيات', description: 'تجاوز المتطلبات القبلية للمرحلة.' },
    { index: '03', title: 'فتح الوحدات', description: 'فتح تدريجي لمحتوى المنهج.' },
    { index: '04', title: 'التقييم', description: 'حل الاختبارات وتسليم المشاريع.' },
    { index: '05', title: 'التقدم', description: 'متابعة حية لنسبة الإنجاز.' }
  ],
  teamHead: { eyebrow: 'وراء المنصة', title: 'تميز هندسي وأكاديمي', sub: 'تم بناء مسارك بأيدي نخبة من المطورين والخبراء الأكاديميين.' },
  team: [
    { name: 'آلاء وليد جاد', role: 'قائد المشروع ومطور Full-Stack', description: 'هندسة معمارية وبناء البنية التحتية الأساسية لنظام إدارة التعلم.' },
    { name: 'ريهام محمد', role: 'مستشار المناهج الأكاديمية', description: 'ضمان التوافق التام للمحتوى وطرق التقييم مع المعايير الرسمية.' },
    { name: 'حبيبة محمد', role: 'تصميم تجربة وواجهة المستخدم', description: 'ابتكار واجهات استخدام سلسة تدعم جميع الأعمار.' },
    { name: 'أحمد مهران', role: 'مطور Full-Stack', description: 'تطوير وتأمين العمليات الخلفية لضمان استقرار المنصة.' },
    { name: 'أحمد غانم', role: 'مطور Full-Stack', description: 'هندسة قواعد البيانات وتحسين سرعة استجابة النظام.' },
    { name: 'عمرو طارق', role: 'مطور Full-Stack', description: 'دمج تقنيات الذكاء الاصطناعي وتطوير لوحات التحكم.' }
  ],
  testimonialsHead: { eyebrow: 'التأثير', title: 'قصص نجاح من المنصة' },
  testimonials: [
    { name: 'أ. ياسر', role: 'مدير مدرسة', quote: 'المنصة سهلت علينا إدارة الجداول والمدفوعات الأكاديمية بشكل لا يصدق.' },
    { name: 'منى حسين', role: 'ولية أمر', quote: 'رحلة التعلم المنظمة خلتني أقدر أتابع تطور بنتي خطوة بخطوة بدون تعقيد.' },
    { name: 'كريم سعيد', role: 'طالب', quote: 'المنصة بتفتح الدروس بالتدريج، وده خلاني أركز أحسن ومحسش بتشتت.' }
  ],
  faqHead: { eyebrow: 'أسئلة شائعة', title: 'كل ما تحتاج معرفته قبل البدء' },
  faqs: [
    { question: 'هل يمكن للإدارة تتبع نمو المستخدمين والإيرادات؟', answer: 'نعم، لوحة تحكم المدير توفر نظرة عامة حية على الإيرادات، الطلاب النشطين، والاتجاهات.' },
    { question: 'كيف يتم تطبيق نظام الرحلة التعليمية؟', answer: 'يتم قفل الأسابيع المتقدمة حتى يُنهي الطالب متطلبات الأسبوع الحالي بنجاح.' },
    { question: 'هل المنهج معتمد رسميًا؟', answer: 'نعم، جميع المواد مطابقة بالكامل للمنهج الرسمي المصري المعتمد لكل الصفوف الدراسية.' }
  ],
  finalCta: { title: 'جاهز لتجربة تعليمية مختلفة؟', sub: 'انضم لبيئة تعلم ذكية ومتكاملة مصممة لطلاب مصر بالخارج.', primary: 'سجّل الآن' },
  footer: { desc: 'نظام إدارة تعلم ذكي لربط المؤسسة، المعلم، الطالب، وولي الأمر.', quickLinks: 'روابط هامة', stagesTitle: 'المراحل', contact: 'تواصل معنا', rights: '© 2026 Masarak. جميع الحقوق محفوظة.', accredited: 'منصة معتمدة تقنياً وأكاديمياً.' }
};

const EN: Dictionary = {
  nav: { home: 'Home', features: 'Features', stages: 'Stages', journey: 'Journey', team: 'Team', faq: 'FAQ', start: 'Start Now' },
  hero: {
    ctaPrimary: 'Start Learning',
    ctaGhost: 'Explore Platform',
    slides: [
      { tag: 'Smart Educational Management', title: 'Your Egyptian School', highlight: 'Anywhere', subtitle: 'A comprehensive LMS combining the official curriculum and AI in one experience for Egyptian students abroad.' },
      { tag: 'Live Classes', title: 'Direct Interaction', highlight: 'Uninterrupted', subtitle: 'Continuous communication between student, teacher, and parent for quality and follow-up.' }
    ]
  },
  aiCardLabel: 'Masarak Assistant',
  aiTips: [
    { label: 'Performance', text: 'Completion rate is excellent — time to review upcoming modules.' },
    { label: 'Recommendation', text: 'Taking the mock exam now will increase readiness.' }
  ],
  stats: [
    { value: 12, suffix: '+', label: 'Grades Covered' },
    { value: 100, suffix: '%', label: 'Performance Tracking' },
    { value: 24, suffix: '/7', label: 'Content Access' },
    { value: 98, suffix: '%', label: 'Parent Satisfaction' }
  ],
  featuresHead: { eyebrow: 'Ecosystem', title: 'Integrated Academic Tools', sub: 'Everything the institution and student need in one platform built on robust architecture.' },
  features: [
    { icon: 'video_camera_front', title: 'Live Sessions', description: 'Automatic scheduling and full management of live lectures via the platform.' },
    { icon: 'quiz', title: 'Smart Exams', description: 'Question bank and automated grading with instant performance reports.' },
    { icon: 'analytics', title: 'Academic Mgmt', description: 'Track attendance, subscriptions, and academic progress smoothly.' }
  ],
  stagesHead: { eyebrow: 'Educational Stages', title: 'A path designed for every age group', sub: 'Different content and tools that match every student\u2019s abilities and needs.' },
  stages: [
    { title: 'Primary Stage', range: 'Grades 1 to 6', description: 'A strong foundation in reading and math through short, engaging interactive lessons.' },
    { title: 'Preparatory Stage', range: 'Grades 1 to 3', description: 'Deepening understanding and problem-solving skills ahead of secondary school.' },
    { title: 'Secondary Stage', range: 'Grades 1 to 3', description: 'An intensive track for academic excellence and full embassy-exam readiness.' }
  ],
  aiSectionHead: { eyebrow: 'Platform Intelligence', title: 'AI Assignment & Analytics', sub: 'Smart student assignment to classes accompanied by predictive analytics.' },
  aiSection: [
    { title: 'AI-Backed Student Assignment', desc: 'Automated distribution based on evaluation levels to ensure balanced classes.' },
    { title: 'Enterprise Data Analysis', desc: 'Dashboards highlighting performance trends and academic growth for management.' }
  ],
  aiPanel: { title: 'Predictive Performance Analysis', badge: 'Powered by AI', accuracyLabel: 'Analysis Accuracy', accuracyDesc: 'Performance prediction based on the learning curve' },
  processHead: { eyebrow: 'Student Journey', title: 'Structured Step-by-Step Path', sub: 'A clear, guided path ensuring students remain focused.' },
  process: [
    { index: '01', title: 'Registration', description: 'Building the student\u2019s academic profile.' },
    { index: '02', title: 'Fundamentals', description: 'Passing the stage prerequisites.' },
    { index: '03', title: 'Unlocking', description: 'Gradual curriculum opening.' },
    { index: '04', title: 'Assessment', description: 'Taking exams & submitting projects.' },
    { index: '05', title: 'Progress', description: 'Live completion tracking.' }
  ],
  teamHead: { eyebrow: 'Behind the Platform', title: 'Engineering & Academic Excellence', sub: 'Masarak was built by an elite team of developers and academic experts.' },
  team: [
    { name: 'Alaa Walid Gad', role: 'Project Lead & Full-Stack Dev', description: 'Architecting and building the core LMS infrastructure.' },
    { name: 'Reham Mohamed', role: 'Curriculum Advisor', description: 'Ensuring total alignment of content and assessments with official standards.' },
    { name: 'Habiba Mohamed', role: 'UI/UX Designer', description: 'Creating seamless interfaces that support all ages.' },
    { name: 'Ahmed Mehran', role: 'Full-Stack Dev', description: 'Developing and securing backend operations for platform stability.' },
    { name: 'Ahmed Ghanem', role: 'Full-Stack Dev', description: 'Database engineering and optimizing system response speeds.' },
    { name: 'Amr Tarek', role: 'Full-Stack Dev', description: 'Integrating AI tools and developing administrative dashboards.' }
  ],
  testimonialsHead: { eyebrow: 'Impact', title: 'Success Stories' },
  testimonials: [
    { name: 'Mr. Yasser', role: 'School Admin', quote: 'The platform made managing schedules and academic payments incredibly easy.' },
    { name: 'Mona Hussein', role: 'Parent', quote: 'The structured journey lets me track my daughter\u2019s progress step-by-step.' },
    { name: 'Karim Saeed', role: 'Student', quote: 'The platform unlocks lessons gradually, helping me focus without getting overwhelmed.' }
  ],
  faqHead: { eyebrow: 'FAQ', title: 'Everything you need to know before starting' },
  faqs: [
    { question: 'Can management track user growth and revenue?', answer: 'Yes, the admin dashboard provides a live overview of revenue, active students, and trends.' },
    { question: 'How does the learning journey system work?', answer: 'Future weeks are locked until the student successfully finishes the current week\u2019s requirements.' },
    { question: 'Is the curriculum officially accredited?', answer: 'Yes, all subjects fully match the official Egyptian curriculum for every grade.' }
  ],
  finalCta: { title: 'Ready for a different experience?', sub: 'Join a smart, integrated learning environment built for Egyptian students abroad.', primary: 'Sign Up Now' },
  footer: { desc: 'A smart LMS connecting the institution, teacher, student, and parent.', quickLinks: 'Quick Links', stagesTitle: 'Stages', contact: 'Contact Us', rights: '© 2026 Masarak. All rights reserved.', accredited: 'Technically and academically accredited.' }
};

const DICTS: Record<Lang, Dictionary> = { ar: AR, en: EN };

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingPageComponent implements OnInit, OnDestroy {

  media = MEDIA;

  /* ============ UI STATE ============ */
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  activeSection = signal<string>('home');

  /* ============ LOCALE & THEME (scoped to this component only) ============ */
  lang = signal<Lang>('ar');
  dir = computed(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));
  t = computed(() => DICTS[this.lang()]);
  theme = signal<Theme>('light');

  @HostBinding('attr.data-theme') get themeAttr(): Theme { return this.theme(); }
  @HostBinding('attr.dir') get dirAttr(): string { return this.dir(); }

  /* ============ HERO SLIDER ============ */
  activeSlide = signal(0);
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  /* ============ AI INSIGHT TICKER ============ */
  activeTipIndex = signal(0);
  typedTip = signal('');
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private tipCycleTimer: ReturnType<typeof setInterval> | null = null;

  /* ============ STAT COUNTERS ============ */
  displayedStats = signal<number[]>([]);
  private statsAnimated = false;

  /* ============ FAQ (own signal — never mutates the translation dictionary) ============ */
  openFaqIndex = signal<number | null>(0);

  private scrollObserver: IntersectionObserver | null = null;
  private reduceMotion = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.displayedStats.set(this.t().stats.map(() => 0));

    if (!isPlatformBrowser(this.platformId)) return;

    const savedTheme = localStorage.getItem('masarak-landing-theme') as Theme | null;
    const savedLang = localStorage.getItem('masarak-landing-lang') as Lang | null;

    if (savedTheme) this.theme.set(savedTheme);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) this.theme.set('dark');

    if (savedLang) this.lang.set(savedLang);

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.onWindowScroll();
    this.initScrollReveal();
    this.startHeroAutoplay();
    this.startAiTipCycle();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.tipCycleTimer) clearInterval(this.tipCycleTimer);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.scrollObserver?.disconnect();
  }

  /* ============ ACTIONS ============
     Theme/lang are scoped to this component's host element only
     (via HostBinding above) — they never touch document.documentElement,
     so they can't affect any other route or component in the app. */
  toggleTheme(): void {
    this.theme.update(th => (th === 'light' ? 'dark' : 'light'));
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('masarak-landing-theme', this.theme());
  }

  toggleLang(): void {
    this.lang.update(l => (l === 'ar' ? 'en' : 'ar'));
    this.activeSlide.set(0);
    this.activeTipIndex.set(0);
    this.statsAnimated = false;
    this.displayedStats.set(this.t().stats.map(() => 0));
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('masarak-landing-lang', this.lang());
    this.typeCurrentTip();
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(open => !open); }
  closeMobileMenu(): void { this.isMobileMenuOpen.set(false); }

  toggleFaq(index: number): void {
    this.openFaqIndex.update(current => (current === index ? null : index));
  }

  /* ============ SCROLL LOGIC ============ */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const currentScroll = window.scrollY;
    this.isScrolled.set(currentScroll > 12);

    const sections = ['home', 'features', 'stages', 'journey', 'team', 'faq'];
    let current = 'home';
    const scrollPosition = currentScroll + 200;

    for (const section of sections) {
      const el = document.getElementById(section);
      if (el && scrollPosition >= el.offsetTop) current = section;
    }

    if (this.activeSection() !== current) this.activeSection.set(current);
  }

  /* ============ HERO AUTOPLAY ============ */
  private startHeroAutoplay(): void {
    if (this.reduceMotion) return;
    this.slideTimer = setInterval(() => {
      this.activeSlide.update(i => (i + 1) % this.t().hero.slides.length);
    }, 6500);
  }

  /* ============ AI TIP TYPING TICKER ============ */
  private startAiTipCycle(): void {
    this.typeCurrentTip();
    if (this.reduceMotion) return;
    this.tipCycleTimer = setInterval(() => {
      this.activeTipIndex.update(i => (i + 1) % this.t().aiTips.length);
      this.typeCurrentTip();
    }, 5200);
  }

  private typeCurrentTip(): void {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    const tips = this.t().aiTips;
    const fullText = tips[this.activeTipIndex() % tips.length].text;

    if (this.reduceMotion) { this.typedTip.set(fullText); return; }

    this.typedTip.set('');
    let charIndex = 0;
    const typeNext = () => {
      charIndex++;
      this.typedTip.set(fullText.slice(0, charIndex));
      if (charIndex < fullText.length) this.typingTimer = setTimeout(typeNext, 28);
    };
    typeNext();
  }

  /* ============ STAT COUNTERS ============ */
  private animateStats(): void {
    if (this.statsAnimated) return;
    this.statsAnimated = true;
    const stats = this.t().stats;

    if (this.reduceMotion) { this.displayedStats.set(stats.map(s => s.value)); return; }

    const duration = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayedStats.set(stats.map(s => Math.round(s.value * eased)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ============ SCROLL REVEAL ============ */
  private initScrollReveal(): void {
    if (this.reduceMotion) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    this.scrollObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          if (entry.target.classList.contains('js-stats-trigger')) this.animateStats();
          this.scrollObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal, .js-stats-trigger').forEach(el => this.scrollObserver?.observe(el));
  }

  trackByIndex(index: number): number {
    return index;
  }
}