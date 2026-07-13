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
  nav: { home: string; features: string; stages: string; journey: string; team: string; faq: string; start: string; login: string };
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
  nav: { home: 'الرئيسية', features: 'المميزات', stages: 'المراحل', journey: 'رحلة الطالب', team: 'فريق العمل', faq: 'الأسئلة الشائعة', start: 'ابدأ الآن', login: 'تسجيل الدخول' },
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

  /* ============ LOCALE & THEME (Fixed to AR / Light Mode) ============ */
  lang = signal<'ar'>('ar');
  dir = signal<'rtl'>('rtl');
  t = computed(() => AR);
  theme = signal<'light'>('light');

  @HostBinding('attr.data-theme') get themeAttr(): string { return this.theme(); }
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

    if (!document.getElementById('masarak-landing-fonts')) {
      const link = document.createElement('link');
      link.id = 'masarak-landing-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(link);
    }

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

    if (isPlatformBrowser(this.platformId)) {
      const link = document.getElementById('masarak-landing-fonts');
      if (link) link.remove();
    }
  }

  /* ============ ACTIONS ============ */
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