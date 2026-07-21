import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'danger';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  show(message: string, title = '', type: ToastType = 'info'): void {
    const toast: ToastMessage = {
      id: this.nextId++,
      message,
      title,
      type
    };
    this._toasts.update(list => [toast, ...list]);

    window.setTimeout(() => this.remove(toast.id), 4500);
  }

  success(message: string, title = 'نجاح'): void {
    this.show(message, title, 'success');
  }

  error(message: string, title = 'خطأ'): void {
    this.show(message, title, 'danger');
  }

  info(message: string, title = 'معلومة'): void {
    this.show(message, title, 'info');
  }

  warning(message: string, title = 'تنبيه'): void {
    this.show(message, title, 'warning');
  }

  remove(id: number): void {
    this._toasts.update(list => list.filter(toast => toast.id !== id));
  }
}
