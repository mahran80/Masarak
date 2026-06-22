import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
  HttpErrorResponse, HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError } from 'rxjs';
import { AuthStateService } from '../core/auth-state.service';
import { AuthApiService } from '../services/auth.service';
import { Router } from '@angular/router';

// Module-level refresh lock — shared across all interceptor calls
let isRefreshing = false;
const refreshSubject$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authState  = inject(AuthStateService);
  const authApi    = inject(AuthApiService);
  const router     = inject(Router);

  const token = authState.accessToken();
  const authedReq = token ? addToken(req, token) : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) return throwError(() => error);

      // Skip auth endpoints to avoid infinite loops
      if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
        authState.clearAuth();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return handle401(req, next, authState, authApi, router);
    })
  );
};

function addToken<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authState: AuthStateService,
  authApi: AuthApiService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    // Queue behind ongoing refresh
    return refreshSubject$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap(newToken => next(addToken(req, newToken)))
    );
  }

  isRefreshing = true;
  refreshSubject$.next(null);

  const currentToken  = authState.accessToken() ?? '';
  const refreshToken  = authState.getRefreshToken() ?? '';

  if (!refreshToken) {
    isRefreshing = false;
    authState.clearAuth();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token'));
  }

  return authApi.refresh(currentToken, refreshToken).pipe(
    switchMap(res => {
      isRefreshing = false;
      if (res.success && res.accessToken && res.refreshToken) {
        authState.updateTokens(res.accessToken, res.refreshToken);
        refreshSubject$.next(res.accessToken);
        return next(addToken(req, res.accessToken));
      }
      authState.clearAuth();
      router.navigate(['/login']);
      return throwError(() => new Error('Refresh failed'));
    }),
    catchError(err => {
      isRefreshing = false;
      authState.clearAuth();
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
}
