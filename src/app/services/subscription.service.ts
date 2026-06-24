import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  PlanDto, SubscriptionDto, SubscriptionStatusResponse,
  InitiateCheckoutRequest, CheckoutResult,
  AdminActivateRequest, PagedResult, SubscriptionFilter
} from '../models/subscription.models';
import { UserInfoDto } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/subscriptions`;
  private readonly planBase = `${environment.apiBaseUrl}/plans`;

  // ── Plans (public) ──────────────────────────────────────────────────────────
  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(this.planBase);
  }

  // ── Checkout ────────────────────────────────────────────────────────────────
  initiateCheckout(planId: number): Observable<CheckoutResult> {
    const body: InitiateCheckoutRequest = {
      planId,
      successUrl: environment.stripeSuccessUrl,
      cancelUrl:  environment.stripeCancelUrl,
    };
    return this.http.post<CheckoutResult>(`${this.base}/checkout`, body);
  }

  // ── User subscription ───────────────────────────────────────────────────────
  /** GET /api/subscriptions/me */
  getMySubscriptionStatus(): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(`${this.base}/me`);
  }

  /** GET /api/subscriptions/me/history */
  getMyHistory(): Observable<SubscriptionDto[]> {
    return this.http.get<SubscriptionDto[]>(`${this.base}/me/history`);
  }

  // ── Admin ───────────────────────────────────────────────────────────────────
  /** GET /api/admin/subscriptions?pageNumber=&pageSize=&status= */
  getAllSubscriptions(filter: SubscriptionFilter): Observable<PagedResult<SubscriptionDto>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize',   filter.pageSize.toString());
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<PagedResult<SubscriptionDto>>(
      `${environment.apiBaseUrl}/admin/subscriptions`, { params }
    );
  }

  /** POST /api/subscriptions/admin/activate */
  adminActivate(req: AdminActivateRequest): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.base}/admin/activate`, req);
  }

  /** POST /api/subscriptions/admin/cancel/{id} */
  adminCancel(subscriptionId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/cancel/${subscriptionId}`, { reason });
  }

  /** GET /api/admin/users?role= */
  getUsers(role?: string): Observable<UserInfoDto[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<UserInfoDto[]>(`${environment.apiBaseUrl}/admin/users`, { params });
  }
}
