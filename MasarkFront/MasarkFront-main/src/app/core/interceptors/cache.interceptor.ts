import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// A simple cache map
const cache = new Map<string, { response: HttpResponse<any>; expiry: number }>();

// Cache duration: 3 minutes
const CACHE_TTL = 3 * 60 * 1000; 

// Cacheable endpoints (exact match or startsWith depending on how we match)
const CACHEABLE_ROUTES = [
  '/api/public/subjects',
  '/api/public/grades',
  '/api/admin/plans', // if exists
];

export const cacheInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  
  if (req.method !== 'GET') {
    return next(req);
  }

  const isCacheable = CACHEABLE_ROUTES.some(route => req.url.includes(route));

  if (!isCacheable) {
    return next(req);
  }

  const urlWithParams = req.urlWithParams;
  const cached = cache.get(urlWithParams);

  if (cached && cached.expiry > Date.now()) {
    return of(cached.response);
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(urlWithParams, {
          response: event,
          expiry: Date.now() + CACHE_TTL
        });
      }
    })
  );
};
