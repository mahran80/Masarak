import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal,
  HostListener,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface JourneyStep {
  index: string;
  title: string;
  desc: string;
  image: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing implements OnInit, OnDestroy {

  // ============ حالة الواجهة العامة ============
  isScrolled = signal(false);
  scrollY = signal(0);

  // ============ الأرقام المتتالية (قسم الانتشار) ============
  statIndex = signal(0);
  displayedStat = signal(0);
  stats = [
    { value: 40, suffix: '+', label: 'دولة حول العالم' },
    { value: 12000, suffix: '+', label: 'طالب مسجل' },
    { value: 98, suffix: '٪', label: 'رضا أولياء الأمور' }
  ];

  // ============ رحلة الطالب — تمرير أفقي مثبت ============
  journeyProgress = signal(0); // 0 -> 1
  activeJourneyIndex = signal(0);
  journeySteps: JourneyStep[] = [
    {
      index: '٠١',
      title: 'التسجيل واختيار المسار',
      desc: 'تحدد الصف الدراسي والمواد اللي محتاجها، ونجهزلك خطة مخصصة تناسب مستواك.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80'
    },
    {
      index: '٠٢',
      title: 'الحصص التفاعلية الحية',
      desc: 'تنضم لفصول مباشرة مع أفضل المعلمين وتتابع شرح المنهج المصري خطوة بخطوة.',
      image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1400&q=80'
    },
    {
      index: '٠٣',
      title: 'المراجعة الذكية',
      desc: 'بنك أسئلة محدث وتقارير أداء دورية تساعدك تعرف نقاط قوتك وضعفك بدقة.',
      image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=80'
    },
    {
      index: '٠٤',
      title: 'الدعم المستمر',
      desc: 'مساعد تعلم شخصي متواجد باستمرار، مع متابعة كاملة من أولياء الأمور طول العام.',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80'
    }
  ];

  // ============ الاشتراكات — حالة التركيز عند الـ hover ============
  hoveredPricing = signal<number | null>(null);

  // ============ المؤشر المخصص ============
  cursorX = signal(0);
  cursorY = signal(0);
  cursorActive = signal(false);
  cursorHover = signal(false);

  @ViewChild('journeySection') journeySectionRef?: ElementRef<HTMLElement>;
  @ViewChild('heroVisual') heroVisualRef?: ElementRef<HTMLElement>;

  private observer: IntersectionObserver | null = null;
  private statInterval: any = null;
  private rafId: any = null;
  private targetCursorX = 0;
  private targetCursorY = 0;
  private currentCursorX = 0;
  private currentCursorY = 0;
  private reduceMotion = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.initScrollReveal();
      this.startStatCycle();
      if (!this.reduceMotion) {
        this.startCursorLoop();
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const y = window.scrollY;
    this.scrollY.set(y);
    this.isScrolled.set(y > 20);
    this.updateJourneyProgress();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    this.targetCursorX = e.clientX;
    this.targetCursorY = e.clientY;
    this.cursorActive.set(true);
  }

  @HostListener('window:mouseleave', [])
  onMouseLeave(): void {
    this.cursorActive.set(false);
  }

  setCursorHover(state: boolean): void {
    this.cursorHover.set(state);
  }

  private updateJourneyProgress(): void {
    const el = this.journeySectionRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    let progress = (0 - rect.top) / total;
    progress = Math.min(1, Math.max(0, progress));
    this.journeyProgress.set(progress);
    const idx = Math.min(
      this.journeySteps.length - 1,
      Math.floor(progress * this.journeySteps.length)
    );
    this.activeJourneyIndex.set(idx);
  }

  // مقدار الإزاحة الأفقية لمسار الرحلة (بالنسبة المئوية)
  get journeyTrackOffset(): number {
    const steps = this.journeySteps.length;
    return this.journeyProgress() * (steps - 1) * 100;
  }

  private startCursorLoop(): void {
    const loop = () => {
      this.currentCursorX += (this.targetCursorX - this.currentCursorX) * 0.18;
      this.currentCursorY += (this.targetCursorY - this.currentCursorY) * 0.18;
      this.cursorX.set(this.currentCursorX);
      this.cursorY.set(this.currentCursorY);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private startStatCycle(): void {
    this.animateStatCount(0);
    this.statInterval = setInterval(() => {
      const next = (this.statIndex() + 1) % this.stats.length;
      this.statIndex.set(next);
      this.animateStatCount(next);
    }, 3200);
  }

  private animateStatCount(index: number): void {
    const target = this.stats[index].value;
    if (this.reduceMotion) {
      this.displayedStat.set(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.displayedStat.set(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  initScrollReveal(): void {
    if (this.reduceMotion) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const options = { root: null, threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);
    document.querySelectorAll('.reveal').forEach(el => this.observer?.observe(el));
  }

  setHoveredPricing(i: number | null): void {
    this.hoveredPricing.set(i);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.statInterval) clearInterval(this.statInterval);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}