import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { SubscriptionApiService } from '../services/subscription.service';

export const subscriptionGuard: CanActivateFn = () => {
  const subApi = inject(SubscriptionApiService);
  const router = inject(Router);

  return subApi.getMySubscriptionStatus().pipe(
    map(status => {
      if (status.hasActiveSubscription) return true;
      return router.createUrlTree(['/my-subscription']);
    }),
    catchError(() => of(router.createUrlTree(['/my-subscription'])))
  );
};
