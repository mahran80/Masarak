import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'default';

export interface ConfirmDialogOptions {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: ConfirmDialogVariant;
  detail?: string;
}

export interface ConfirmDialogRequest extends ConfirmDialogOptions {
  subject: Subject<boolean>;
  previousActiveElement: HTMLElement | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly currentDialog = signal<ConfirmDialogRequest | null>(null);

  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    const subject = new Subject<boolean>();
    const previousActiveElement = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null;

    this.currentDialog.set({
      ...options,
      variant: options.variant ?? 'default',
      subject,
      previousActiveElement
    });

    return subject.asObservable();
  }

  resolve(confirmed: boolean): void {
    const req = this.currentDialog();
    if (req) {
      this.currentDialog.set(null);
      req.subject.next(confirmed);
      req.subject.complete();
      if (req.previousActiveElement && typeof req.previousActiveElement.focus === 'function') {
        setTimeout(() => req.previousActiveElement?.focus(), 0);
      }
    }
  }
}
