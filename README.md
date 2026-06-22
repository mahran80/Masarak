# Masarak Angular Frontend — Phase 1

## Stack

- **Angular 17** — Standalone Components, Lazy Loading, Functional Guards
- **Tailwind CSS 3** — Utility-first styling, no component library
- **Angular Signals** — Reactive state management (no NgRx)
- **Reactive Forms** — All form validation via `FormBuilder`
- **JWT Auth** — Access + Refresh tokens stored in `localStorage`

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Angular CLI: `npm install -g @angular/cli@17`
- .NET backend running on `https://localhost:49179`

### Install & Run
```bash
cd frontend
npm install
ng serve
```

App runs at: **http://localhost:4200**

---

## Project Structure

```
src/app/
├── core/
│   └── auth-state.service.ts        # Signal-based auth state (singleton)
├── environments/
│   ├── environment.ts               # Dev config (API URL, Stripe redirect URLs)
│   └── environment.prod.ts          # Prod config
├── models/
│   ├── auth.models.ts               # All auth DTOs (mirrors AuthDTOs.cs)
│   └── subscription.models.ts       # Subscription/Plan/Parent DTOs
├── services/
│   ├── auth.service.ts              # Auth API calls
│   ├── subscription.service.ts      # Subscription + Plan API calls
│   └── parent.service.ts            # Parent linking API calls
├── interceptors/
│   └── auth.interceptor.ts          # JWT attach + 401 auto-refresh
├── guards/
│   ├── auth.guard.ts                # Requires authentication
│   ├── admin.guard.ts               # Requires Admin role
│   ├── parent.guard.ts              # Requires Parent role
│   └── guest.guard.ts               # Redirects authenticated users away from login/register
├── layout/
│   ├── main-layout/                 # Nav + footer wrapper
│   └── nav/                         # Top navigation with role-aware links
├── shared/components/
│   ├── loading-spinner/             # Reusable spinner (sm/md/lg)
│   ├── empty-state/                 # Empty list/error placeholder
│   ├── plan-card/                   # Subscription plan card
│   └── subscription-banner/         # "No subscription" alert banner
└── features/
    ├── auth/
    │   ├── components/auth-layout/  # Dark gradient wrapper for login/register
    │   └── pages/
    │       ├── login/               # POST /api/auth/login
    │       └── register/            # POST /api/auth/register
    ├── subscription/pages/
    │   ├── plans/                   # GET /api/plans  →  POST /api/subscriptions/checkout
    │   ├── my-subscription/         # GET /me + /me/history + GET /my-linkage-code
    │   ├── checkout-success/        # Stripe redirect landing page
    │   └── checkout-cancel/         # Stripe cancel landing page
    ├── parent/pages/
    │   ├── linked-students/         # GET /api/parent/linked-students (paged)
    │   └── link-student/            # POST /api/parent/link-student
    ├── admin/pages/
    │   └── subscriptions/           # GET/admin/subscriptions + activate + cancel
    └── dashboard/                   # Role-aware home page
```

---

## API Coverage Matrix

| Endpoint | Method | Frontend Service | Component/Page | Guard |
|---|---|---|---|---|
| `/api/auth/login` | POST | `AuthApiService.login` | `LoginComponent` | guestGuard |
| `/api/auth/register` | POST | `AuthApiService.register` | `RegisterComponent` | guestGuard |
| `/api/auth/logout` | POST | `AuthApiService.logout` | `NavComponent` | authGuard |
| `/api/auth/refresh` | POST | `AuthApiService.refresh` | `authInterceptor` | — |
| `/api/auth/change-password` | POST | `AuthApiService.changePassword` | *(Phase 2 profile page)* | authGuard |
| `/api/auth/my-linkage-code` | GET | `AuthApiService.getMyLinkageCode` | `MySubscriptionComponent` | authGuard (Student) |
| `/api/plans` | GET | `SubscriptionApiService.getPlans` | `PlansComponent` | — |
| `/api/subscriptions/checkout` | POST | `SubscriptionApiService.initiateCheckout` | `PlansComponent` | authGuard |
| `/api/subscriptions/me` | GET | `SubscriptionApiService.getMySubscriptionStatus` | `MySubscriptionComponent` | authGuard |
| `/api/subscriptions/me/history` | GET | `SubscriptionApiService.getMyHistory` | `MySubscriptionComponent` | authGuard |
| `/api/admin/subscriptions` | GET | `SubscriptionApiService.getAllSubscriptions` | `AdminSubscriptionsComponent` | adminGuard |
| `/api/subscriptions/admin/activate` | POST | `SubscriptionApiService.adminActivate` | `AdminSubscriptionsComponent` | adminGuard |
| `/api/subscriptions/admin/cancel/{id}` | POST | `SubscriptionApiService.adminCancel` | `AdminSubscriptionsComponent` | adminGuard |
| `/api/parent/link-student` | POST | `ParentApiService.linkStudent` | `LinkStudentComponent` | parentGuard |
| `/api/parent/linked-students` | GET | `ParentApiService.getLinkedStudents` | `LinkedStudentsComponent` | parentGuard |

**Total APIs: 15 | Integrated: 14 | Excluded from Phase 1 UI: 1\***

> \*`change-password` — service method exists and is ready. UI page deferred to Phase 2 profile settings.

---

## Routes

| Path | Component | Guard |
|---|---|---|
| `/login` | LoginComponent | guestGuard |
| `/register` | RegisterComponent | guestGuard |
| `/plans` | PlansComponent | — |
| `/dashboard` | DashboardComponent | authGuard |
| `/my-subscription` | MySubscriptionComponent | authGuard |
| `/parent/linked-students` | LinkedStudentsComponent | parentGuard |
| `/parent/link-student` | LinkStudentComponent | parentGuard |
| `/admin/subscriptions` | AdminSubscriptionsComponent | adminGuard |
| `/checkout/success` | CheckoutSuccessComponent | — |
| `/checkout/cancel` | CheckoutCancelComponent | — |

---

## Authentication Flow

1. User logs in → `POST /api/auth/login` returns `{ accessToken, refreshToken, user }`
2. Both tokens stored in `localStorage` via `AuthStateService`
3. Every HTTP request: `authInterceptor` attaches `Authorization: Bearer <token>`
4. On 401: interceptor calls `POST /api/auth/refresh` automatically, retries original request
5. On refresh failure: clears auth, redirects to `/login`
6. Logout: calls `POST /api/auth/logout` with `{ refreshToken }`, clears localStorage

---

## Environment Configuration

Edit `src/app/environments/environment.ts` for local dev:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:49179/api',
  stripeSuccessUrl: 'http://localhost:4200/checkout/success',
  stripeCancelUrl:  'http://localhost:4200/checkout/cancel',
};
```

> **CORS**: Add `http://localhost:4200` to `appsettings.json → Cors → AllowedOrigins`

---

## Backend CORS — Required Change

In `appsettings.json`, add `http://localhost:4200`:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4200"
  ]
}
```
