import {
  Component,
  AfterViewInit,
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
interface ProcessStep { index: string; title: string; description: string; icon: string; }
interface TeamMember { name: string; role: string; description: string; }
interface Testimonial { name: string; role: string; quote: string; }
interface FaqItem { question: string; answer: string; }

interface Dictionary {
  nav: { home: string; features: string; stages: string; journey: string; faq: string; start: string; brand: string; register: string; login: string };
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
   ============================================================ */
const MEDIA = {
  heroImages: [
    '/assets/images/hero/hero-learning-1.png',
    '/assets/images/hero/hero-learning-2.png',
    '/assets/images/hero/hero-learning-3.png'
  ],
  aiPanel: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?fm=jpg&q=80&w=1200&auto=format&fit=crop',
  stages: [
    '/assets/images/stages/primary.jpg',
    '/assets/images/stages/preparatory.jpg',
    '/assets/images/stages/secondary.jpg'
  ]
};

/* ============================================================
   CONTENT
   ============================================================ */
const AR: Dictionary = {
  nav: { home: 'الرئيسية', features: 'المميزات', stages: 'المراحل', journey: 'رحلة الطالب', faq: 'الأسئلة الشائعة', start: 'ابدأ الآن', brand: 'مسارك', register: 'سجل الآن', login: 'تسجيل الدخول' },
  hero: {
    ctaPrimary: 'سجل الآن',
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
  featuresHead: { eyebrow: 'المميزات', title: 'لماذا تختار مسارك؟', sub: 'نجمع بين جودة التعليم المصري وأحدث التقنيات العالمية لنضمن تفوق ابنك الدراسي.' },
  features: [
    { icon: 'video_camera_front', title: 'حصص مباشرة', description: 'تفاعل مباشر مع نخبة من أفضل المعلمين المصريين في فصول افتراضية تفاعلية وعالية الجودة.' },
    { icon: 'verified', title: 'منهج معتمد', description: 'نقدم المنهج المصري الرسمي المعتمد من وزارة التربية والتعليم لجميع المراحل الدراسية.' },
    { icon: 'public', title: 'تعلم من أي مكان', description: 'منصة سحابية متكاملة تتيح لك الوصول لدروسك وواجباتك من أي جهاز في أي وقت حول العالم.' },
    { icon: 'bar_chart', title: 'تقارير ذكية', description: 'تحليل دقيق لنقاط القوة والضعف لكل طالب باستخدام خوارزميات الذكاء الاصطناعي.' },
    { icon: 'contact_page', title: 'امتحانات إلكترونية', description: 'نظام تقييم مستمر يحاكي نظام امتحانات السفارة لتدريب الطلاب على أجواء الاختبارات.' },
    { icon: 'groups', title: 'متابعة ولي الأمر', description: 'تطبيق خاص لأولياء الأمور لمتابعة حضور وغياب ومستوى الأبناء الأكاديمي لحظة بلحظة.' }
  ],
  stagesHead: { eyebrow: 'المراحل الدراسية', title: 'مسار مصمم لكل مرحلة عمرية', sub: 'محتوى وأدوات مختلفة تناسب قدرات واحتياجات كل طالب.' },
  stages: [
    { title: 'المرحلة الابتدائية', range: 'من الصف الأول إلى السادس', description: 'تأسيس قوي في القراءة والحساب من خلال دروس تفاعلية قصيرة ومحفزة.' },
    { title: 'المرحلة الإعدادية', range: 'من الصف الأول إلى الثالث', description: 'تعميق الفهم وبناء مهارات حل المسائل استعدادًا للمرحلة الثانوية.' },
    { title: 'المرحلة الثانوية', range: 'من الصف الأول إلى الثالث', description: 'مسار مكثف للتفوق الدراسي وجاهزية كاملة لامتحان السفارة.' }
  ],
  aiSectionHead: { eyebrow: 'تقنيات الذكاء الاصطناعي', title: 'توجيه وتوزيع آلي مدعوم بالذكاء الاصطناعي', sub: 'منظومة ذكية لتوزيع الطلاب على الفصول بشكل متوازن، مع تحليلات بيانية متقدمة لتوقع وتطوير الأداء الأكاديمي.' },
  aiSection: [
    { title: 'التوزيع الذكي للفصول', desc: 'خوارزميات متطورة تدمج الطلاب تلقائياً في الفصول الدراسية المناسبة بناءً على مستويات التقييم لضمان التوازن والفاعلية.' },
    { title: 'لوحات تحكم تنبؤية للإدارة', desc: 'تحليلات بيانية متكاملة تساعد الكادر الإداري والتعليمي في تحسين مخرجات التعلم واتخاذ القرارات السليمة.' }
  ],
  aiPanel: { title: 'التحليلات التنبؤية للأداء', badge: 'يعمل بالذكاء الاصطناعي', accuracyLabel: 'دقة التوقعات الأكاديمية', accuracyDesc: 'توقع أداء الطلاب وسلوكهم التعليمي بناءً على منحنيات التعلم التراكمية.' },
  processHead: { eyebrow: 'كيف تعمل المنصة؟', title: 'رحلة تعلم ذكية متكاملة خطوة بخطوة', sub: 'خطوات بسيطة ومدروسة ترافق الطالب وولي أمره من البداية وحتى تحقيق النجاح والتفوق.' },
  process: [
    { index: '01', title: 'إنشاء الحساب', description: 'سجل حسابك كطالب أو ولي أمر لتفعيل الملف التعليمي الخاص بك والبدء مباشرة.', icon: 'person_add' },
    { index: '02', title: 'اختيار المرحلة الدراسية', description: 'حدد مرحلتك الأكاديمية والصف الدراسي للوصول إلى خطتك التعليمية المناسبة.', icon: 'layers' },
    { index: '03', title: 'بدء التعلم', description: 'احضر حصصك المباشرة وتفاعل مع معلمين مؤهلين واستمتع بالدروس التفاعلية.', icon: 'menu_book' },
    { index: '04', title: 'متابعة التقدم', description: 'شاهد مستوى استيعابك وتقارير أداء فورية لمتابعة مدى جاهزيتك للاختبارات.', icon: 'insights' },
    { index: '05', title: 'تحقيق النجاح', description: 'استعد تماماً لامتحان السفارة وتفوق في دراستك بجاهزية أكاديمية متكاملة.', icon: 'emoji_events' }
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
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {

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
  activeHeroImage = signal(0);
  private heroImageTimer: ReturnType<typeof setInterval> | null = null;
  private heroImagePointerStartX: number | null = null;
  heroParallaxX = signal(0);
  heroParallaxY = signal(0);

  /* ============ STATS ============ */
  animationProgress = signal(0);
  displayedStats = computed(() => {
    const stats = this.t().stats;
    const progress = this.animationProgress();
    if (this.reduceMotion) {
      return stats.map(s => s.value);
    }
    const eased = 1 - Math.pow(1 - progress, 3);
    return stats.map(s => Math.round(s.value * eased));
  });

  /* ============ FAQ (own signal — never mutates the translation dictionary) ============ */
  openFaqIndex = signal<number | null>(0);

  private scrollObserver: IntersectionObserver | null = null;
  private reduceMotion = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
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
    this.startHeroAutoplay();
    this.startHeroImageAutoplay();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) this.initScrollReveal();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.heroImageTimer) clearInterval(this.heroImageTimer);
    this.scrollObserver?.disconnect();

    if (isPlatformBrowser(this.platformId)) {
      const link = document.getElementById('masarak-landing-fonts');
      if (link) link.remove();
    }
  }

  /* ============ ACTIONS ============ */

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(open => !open); }
  closeMobileMenu(): void { this.isMobileMenuOpen.set(false); }

  onHeroPointerMove(event: PointerEvent): void {
    if (this.reduceMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const hero = event.currentTarget as HTMLElement;
    const rect = hero.getBoundingClientRect();
    this.heroParallaxX.set(((event.clientX - rect.left) / rect.width - 0.5) * 12);
    this.heroParallaxY.set(((event.clientY - rect.top) / rect.height - 0.5) * 10);
  }

  resetHeroParallax(): void {
    this.heroParallaxX.set(0);
    this.heroParallaxY.set(0);
  }

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

  /* ============ HERO IMAGE SLIDER ============ */
  nextHeroImage(): void {
    this.activeHeroImage.update(index => (index + 1) % this.media.heroImages.length);
  }

  previousHeroImage(): void {
    this.activeHeroImage.update(index => (index - 1 + this.media.heroImages.length) % this.media.heroImages.length);
  }

  selectHeroImage(index: number): void {
    this.activeHeroImage.set(index);
    this.startHeroImageAutoplay();
  }

  pauseHeroImageAutoplay(): void {
    if (this.heroImageTimer) clearInterval(this.heroImageTimer);
    this.heroImageTimer = null;
  }

  resumeHeroImageAutoplay(): void {
    this.startHeroImageAutoplay();
  }

  onHeroImagePointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    this.heroImagePointerStartX = event.clientX;
    this.pauseHeroImageAutoplay();
  }

  onHeroImagePointerUp(event: PointerEvent): void {
    if (this.heroImagePointerStartX === null) return;
    const distance = event.clientX - this.heroImagePointerStartX;
    this.heroImagePointerStartX = null;

    if (Math.abs(distance) >= 48) {
      if (distance < 0) this.nextHeroImage();
      else this.previousHeroImage();
    }

    this.resumeHeroImageAutoplay();
  }

  private startHeroImageAutoplay(): void {
    this.pauseHeroImageAutoplay();
    if (this.reduceMotion) return;
    this.heroImageTimer = setInterval(() => this.nextHeroImage(), 5000);
  }

  /* ============ STATS ============ */
  private animateStats(): void {
    if (this.animationProgress() > 0) return;

    if (this.reduceMotion) {
      this.animationProgress.set(1);
      return;
    }

    const duration = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      this.animationProgress.set(progress);
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
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );
    document.querySelectorAll('.reveal, .js-stats-trigger').forEach(el => this.scrollObserver?.observe(el));

    // Safety net: if an element is already inside the viewport at load time
    // (e.g. on a fast connection or a short page), the observer's first
    // callback can occasionally be missed. Force-check once after paint.
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-visible');
        }
      });

      const statsTrigger = document.querySelector('.js-stats-trigger');
      if (statsTrigger) {
        const rect = statsTrigger.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          this.animateStats();
        }
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}