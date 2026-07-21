import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

const errorCopy: Record<string, string> = {
  'User already has an active subscription': 'لديك اشتراك نشط بالفعل. يمكنك متابعة استخدام باقتك الحالية من صفحة الاشتراكات.',
  'Failed to load plans.': 'تعذر تحميل باقات الاشتراك الآن. حاول مرة أخرى بعد قليل.',
  'Could not start checkout. Please try again.': 'تعذر بدء عملية الدفع الآن. حاول مرة أخرى بعد قليل.',
};

const localizeError = (message: string): string => errorCopy[message] ?? message;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'حدث خطأ غير معروف';
      if (error.error instanceof ErrorEvent) {
        errorMsg = `خطأ: ${error.error.message}`;
      } else {
        if (error.status === 401) {
          errorMsg = 'غير مصرح لك. يرجى تسجيل الدخول.';
          router.navigate(['/auth/login']);
        } else if (error.status === 402) {
          errorMsg = 'مطلوب اشتراك فعال للوصول إلى هذا المحتوى.';
          router.navigate(['/plans']);
        } else if (error.status === 403) {
          errorMsg = 'ليس لديك صلاحية للوصول.';
        } else if (error.status === 404) {
          errorMsg = 'المورد غير موجود.';
        } else if (error.status === 500) {
          errorMsg = 'خطأ في الخادم.';
        } else if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
      }
      toastService.error(localizeError(errorMsg));
      return throwError(() => error);
    })
  );
};
