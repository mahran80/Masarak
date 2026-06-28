import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'حدث خطأ غير معروف';
      if (error.error instanceof ErrorEvent) {
        errorMsg = `خطأ: ${error.error.message}`;
      } else {
        if (error.status === 401) {
          errorMsg = 'غير مصرح لك. يرجى تسجيل الدخول.';
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
      toastService.error(errorMsg);
      return throwError(() => error);
    })
  );
};
