import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

/**
 * Interface for components that need to confirm navigation away.
 * Implement this in any component that has unsaved state (e.g., active exam, live session).
 */
export interface CanComponentDeactivate {
  canDeactivate(): boolean;
}

/**
 * Generic canDeactivate guard that asks the component whether it's safe to navigate away.
 * If the component returns false, displays the accessible ConfirmDialog.
 */
export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate && !component.canDeactivate()) {
    const confirmDialog = inject(ConfirmDialogService);
    return confirmDialog.confirm({
      title: 'مغادرة الصفحة',
      body: 'لديك بيانات غير محفوظة. هل أنت متأكد أنك تريد المغادرة؟',
      confirmLabel: 'مغادرة',
      cancelLabel: 'البقاء',
      variant: 'warning'
    });
  }
  return true;
};

