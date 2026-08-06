import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const ROUTE_TITLE_MAP: Record<string, string> = {
  '': 'منصة التعلم الذكية',
  '/auth/login': 'تسجيل الدخول',
  '/auth/register': 'إنشاء حساب جديد',
  '/auth/ForgotPassword': 'استعادة كلمة المرور',
  '/auth/ResetPassword': 'إعادة ضبط كلمة المرور',
  '/dashboard/student': 'لوحة الطالب',
  '/dashboard/teacher': 'لوحة المدرس',
  '/dashboard/teacher/courses': 'المقررات الدراسية',
  '/dashboard/teacher/students': 'قائمة الطلاب',
  '/dashboard/teacher/assignments': 'إدارة الواجبات',
  '/dashboard/teacher/exams': 'إدارة الاختبارات',
  '/dashboard/teacher/sessions': 'جدول الحصص والدروس',
  '/dashboard/teacher/assessment/grading': 'لوحة التصحيح والتقييم',
  '/dashboard/teacher/assessment/question-bank': 'بنك الأسئلة',
  '/dashboard/admin': 'لوحة الإدارة',
  '/dashboard/admin/users': 'إدارة المستخدمين',
  '/dashboard/admin/teachers': 'دليل المعلمين',
  '/dashboard/admin/academic': 'الإدارة الأكاديمية',
  '/dashboard/admin/performance': 'مؤشرات الأداء',
  '/dashboard/admin/system-health': 'حالة النظام والنظام التشغيلي',
  '/dashboard/admin/subscriptions': 'إدارة الاشتراكات',
  '/dashboard/admin/content-moderation': 'مراقبة المحتوى',
  '/dashboard/parent': 'لوحة ولي الأمر',
  '/dashboard/chat': 'المحادثات والرسائل',
  '/dashboard/profile': 'الملف الشخصي',
  '/plans': 'باقات الاشتراك',
  '/my-subscription': 'اشتراكي الحالي'
};

@Injectable({ providedIn: 'root' })
export class CustomTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    
    if (routeTitle) {
      this.title.setTitle(`${routeTitle} | مسارك`);
      return;
    }

    // Match path from map
    const urlWithoutParams = snapshot.url.split('?')[0];
    let matchedTitle = ROUTE_TITLE_MAP[urlWithoutParams];

    if (!matchedTitle) {
      // General prefix matching if dynamic route
      if (urlWithoutParams.startsWith('/dashboard/teacher/assessment')) {
        matchedTitle = 'التقييمات والاختبارات';
      } else if (urlWithoutParams.startsWith('/dashboard/teacher')) {
        matchedTitle = 'لوحة المدرس';
      } else if (urlWithoutParams.startsWith('/dashboard/student')) {
        matchedTitle = 'لوحة الطالب';
      } else if (urlWithoutParams.startsWith('/dashboard/admin')) {
        matchedTitle = 'لوحة الإدارة';
      } else if (urlWithoutParams.startsWith('/dashboard/parent')) {
        matchedTitle = 'لوحة ولي الأمر';
      }
    }

    if (matchedTitle) {
      this.title.setTitle(`${matchedTitle} | مسارك`);
    } else {
      this.title.setTitle('مسارك - منصة التعلم الذكية');
    }
  }
}
