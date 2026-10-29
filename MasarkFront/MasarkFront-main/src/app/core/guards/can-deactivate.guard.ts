import { CanDeactivateFn } from '@angular/router';

/**
 * Interface for components that need to confirm navigation away.
 * Implement this in any component that has unsaved state (e.g., active exam, live session).
 */
export interface CanComponentDeactivate {
  canDeactivate(): boolean;
}

/**
 * Generic canDeactivate guard that asks the component whether it's safe to navigate away.
 * If the component returns false, shows an Arabic confirmation dialog.
 */
export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component.canDeactivate && !component.canDeactivate()) {
    return confirm('لديك عمل غير محفوظ. هل أنت متأكد من رغبتك في مغادرة هذه الصفحة؟');
  }
  return true;
};
