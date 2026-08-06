import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface SubscriptionPlanModel {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  isPopular?: boolean;
  features: { text: string; included: boolean }[];
  ctaText: string;
  accentColor: string;
}

@Component({
  selector: 'app-student-subscription-page',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class StudentSubscriptionPageComponent {
  readonly selectedBillingCycle = signal<'monthly' | 'annual'>('monthly');

  readonly plans = signal<SubscriptionPlanModel[]>([
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      price: '199',
      period: 'شهرياً',
      description: 'مثالية للطلاب الراغبين في مراجعة الدروس والمناهج بشكل مستقل.',
      features: [
        { text: 'الوصول لجميع المواد الدراسية للصف المحدد', included: true },
        { text: 'مشاهدة الفيديو والدروس المسجلة بدقة عالية', included: true },
        { text: 'تحميل المذكرات والملخصات صيغة PDF', included: true },
        { text: 'حضور الجلسات التفاعلية المباشرة', included: false },
        { text: 'استخدام المساعد الذكي التفاعلي 24/7', included: false }
      ],
      ctaText: 'اشترك بالباقة الأساسية',
      accentColor: '#4F8EF7'
    },
    {
      id: 'pro',
      name: 'الباقة المتقدمة',
      badge: 'الخيار الأكثر طلباً 🌟',
      price: '349',
      period: 'شهرياً',
      description: 'الخيار التفاعلي الأفضل للحصول على المراجعات المباشرة والمساعد الذكي.',
      isPopular: true,
      features: [
        { text: 'كل مميزات الباقة الأساسية بالكامل', included: true },
        { text: 'حضور الجلسات التفاعلية المباشرة مع المعلمين', included: true },
        { text: 'استخدام المساعد التعليمي الذكي 24/7 بلا حدود', included: true },
        { text: 'اختبارات تفاعلية وشيتات محلولة خطوة بخطوة', included: true },
        { text: 'تقارير أداء ومتابعة دورية مع ولي الأمر', included: true }
      ],
      ctaText: 'اشترك بالباقة الأكثر طلباً',
      accentColor: '#7A5AF8'
    },
    {
      id: 'ultimate',
      name: 'الباقة السنوية المتميزة',
      badge: 'توفير 35%',
      price: '2,499',
      period: 'سنوياً',
      description: 'تغطية شاملة طوال العام الدراسي مع مراجعات ليلة الامتحان.',
      features: [
        { text: 'جميع مميزات الباقة المتقدمة طوال العام الدراسي', included: true },
        { text: 'مراجعات ليلة الامتحان والاستشارات الشاملة', included: true },
        { text: 'بنك أسئلة ونماذج امتحانات استرشادية حصرية', included: true },
        { text: 'دعم فني وأكاديمي مخصص 24/7', included: true },
        { text: 'شهادات تقدير وجوائز متفوقين للمتميزين', included: true }
      ],
      ctaText: 'اشترك بالباقة السنوية',
      accentColor: '#6EC6FF'
    }
  ]);

  readonly faqs = signal<{ question: string; answer: string; isOpen?: boolean }[]>([
    {
      question: 'كيف يمكنني الترقية أو تغيير باقتي المالية؟',
      answer: 'يمكنك الترقية في أي وقت من خلال اختيار الباقة المطلوبة ودفع الفارق، وسيتم تفعيل المميزات الجديدة فوراً.',
      isOpen: true
    },
    {
      question: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
      answer: 'نعم، يمكنك إلغاء الاشتراك في أي وقت وسيظل حسابك نشطاً حتى نهاية الفترة المدفوعة.',
      isOpen: false
    },
    {
      question: 'ما هي وسائل الدفع المتاحة على منصة مسارك؟',
      answer: 'ندعم جميع كروت الفيزا، الماستركارد، ميزة، وفودافون كاش، وأمان، ومنافذ فوري.',
      isOpen: false
    }
  ]);

  toggleFaq(index: number): void {
    this.faqs.update(list =>
      list.map((item, i) => i === index ? { ...item, isOpen: !item.isOpen } : item)
    );
  }

  scrollToPlans(): void {
    const el = document.getElementById('pricing-plans-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
