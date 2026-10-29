# PHASE 2 — App Shell, Navigation & Visual Identity

> **Goal**: Change how the product looks and how people move through it. Replace the avatar-dropdown-only navigation with a persistent collapsible sidebar. Apply a cohesive visual identity through the semantic design tokens established in Phase 1. After this phase, the app has a modern, consistent, accessible shell with clear role-based navigation.

---

## 1. Scope

Phase 2 focuses on:
- Changing the token VALUES (palette, typeface, radius, shadow) established in Phase 1
- Building a new `DashboardLayout` with persistent sidebar + mobile drawer
- Moving plans/checkout inside the dashboard layout
- Expanding breadcrumbs to all pages
- Route-transition loading indicator
- Notification panel responsive fix
- All NAV-* findings and navigation architecture issues

Phase 2 does **NOT** include: role-specific journey improvements (P3), admin CRUD enhancements (P3), AI UX clarity (P3).

---

## 2. Prerequisites

| Prerequisite | Status |
|---|---|
| Phase 1 complete — zero P0, shared primitives available | Required |
| Design tokens defined in `tailwind.config.js` | From P1 T1-11 |
| `ConfirmDialog` available | From P1 T1-12 |
| `@angular/cdk` installed (if chosen in P1) | From P1 D1 |

---

## 3. Findings Addressed

| Finding ID | Source | Status | Task |
|---|---|---|---|
| NAV-01 / N6-01 / Jakob / Hick | R1, R3 | CONFIRMED P1 | T2-01 |
| NAV-04 | R3 | CONFIRMED P1 | T2-02 |
| NAV-05 / N3-03 | R1, R3 | CONFIRMED P2 | T2-03 |
| N8-01 (teacher 15+ items) | R1 | CONFIRMED P2 | T2-01 |
| Fitts (avatar 36px) | R1 | CONFIRMED P2 | T2-01 |
| Teacher assessment buried | R2 | CONFIRMED P1 | T2-01 |
| Teacher grading no breadcrumb | R2 | CONFIRMED P1 | T2-03 |
| NF-02 (notification no destination) | R3 | CONFIRMED P2 | T2-04 |
| S-02 (notification no loading) | R3 | CONFIRMED P2 | T2-04 |
| R-03 (dropdown w-64 mobile) | R3 | CONFIRMED MEDIUM | T2-01 |
| R-04 (notification 320px) | R3 | CONFIRMED MEDIUM | T2-04 |
| R-05 (exam grid-cols-5) | R3 | CONFIRMED MEDIUM | T2-05 |
| A-16 (focus:outline-none risk) | R3 | CONFIRMED P3 | T2-06 |
| N1-01 (no route loading) | R1 | CONFIRMED P2 | T2-07 |

---

## 4. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Keep current blue as primary** — `blue-600` (#2563eb) passes AA on white (4.68:1). Map to `brand` token. | User spec: "keep the current blue as primary unless contrast fails." It passes. |
| D2 | **Arabic-first typeface: Tajawal** (already in font stack) promoted to first position. Fallback: Inter, system sans-serif. | Tajawal is an Arabic-optimized Google Font already loaded. Inter serves Latin. No new font download needed. |
| D3 | **Sidebar width**: 280px expanded, 72px collapsed (icons only), 0px on mobile (off-canvas drawer). | Standard LMS pattern. 280px fits Arabic nav labels. 72px shows icons for recognition. |
| D4 | **No hamburger ON the avatar** — separate hamburger button (44×44px) at right of header on mobile. | Fitts's Law: 44px meets WCAG minimum. Separating menu from avatar follows platform conventions. |
| D5 | **Plans/checkout pages**: wrap in `DashboardLayout` with a back button. Remove standalone routes. | NAV-04: users lose navigation context. Wrapping them preserves the sidebar. |
| D6 | **Breadcrumbs**: route-data-driven via `data: { breadcrumb: 'Arabic label' }` on route definitions. `BreadcrumbComponent` reads `ActivatedRoute` snapshot chain. | Existing `BreadcrumbComponent` is only used on exams with static config. Convert to automatic. |
| D7 | **prefers-reduced-motion**: add `motion-reduce:transition-none` on all animated elements. | WCAG 2.3.3 — respect user motion preferences. |
| D8 | **Icons**: continue using existing `IconComponent` (inline SVG). Add any missing icons needed for sidebar groups. | No new icon library. The `IconComponent` already has 60+ icons. |

---

## 5. Tasks

### T2-01: New DashboardLayout with sidebar navigation
**Findings**: NAV-01, N6-01, Jakob, Hick, Fitts, N8-01, Teacher-assessment-buried, R-03
**Files**:
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.html` (rewrite)
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.ts` (extend)
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.css` (new/extend)

**Changes**:

1. **Layout structure**:
   ```
   ┌──────────────────────────────────────────────┐
   │ HEADER (64px, sticky top-0)                  │
   │ ┌──────┐ مسارك        🔔  ☰(mobile)  👤      │
   │ └──────┘                                      │
   ├──────────┬───────────────────────────────────┤
   │ SIDEBAR  │ MAIN CONTENT                      │
   │ 280/72px │ <router-outlet>                   │
   │          │ + breadcrumbs above content        │
   │ <nav>    │                                    │
   │ Groups:  │                                    │
   │ ─ Main   │                                    │
   │ ─ Tools  │                                    │
   │ ─ Other  │                                    │
   │          │                                    │
   │ ──────── │                                    │
   │ Profile  │                                    │
   │ Logout   │                                    │
   ├──────────┴───────────────────────────────────┤
   │ FOOTER                                        │
   └──────────────────────────────────────────────┘
   ```

2. **Sidebar HTML**: `<nav aria-label="القائمة الرئيسية">`, skip link `<a href="#main-content" class="sr-only focus:not-sr-only">تخطي إلى المحتوى</a>`, `aria-current="page"` on active link, visible focus ring on all items.

3. **Sidebar state**:
   - `sidebarExpanded = signal<boolean>(true)` — persisted in `localStorage`.
   - Collapse button at sidebar bottom toggles state.
   - On mobile (`< 1024px`): sidebar is off-canvas drawer, triggered by hamburger button.
   - Hamburger button: 44×44px minimum, `aria-label="القائمة"`, `aria-expanded`.
   - Drawer has backdrop, `Escape` closes, focus trapped inside when open.

4. **Role-based grouped IA**:

   **Student** (3 groups):
   | Group | Items | Route | Icon |
   |---|---|---|---|
   | الرئيسية | لوحة التحكم | `student` | `chart` |
   | التعلم | دروسي | `student/courses` | `book` |
   | | الدروس والوحدات | `student/lessons` | `book-open` |
   | | مكتبة الدروس | `student/library` | `archive` |
   | | الواجبات | `student/assignments` | `clipboard-document-list` |
   | | الاختبارات | `student/exams` | `document-check` |
   | النتائج | الدرجات | `student/grades` | `clipboard-document-check` |
   | | الجدول الأسبوعي | `student/schedule` | `calendar` |
   | | رؤى التعلم | `student/insights` | `trend-up` |
   | أخرى | المحادثات | `/dashboard/chat` | `chat` |
   | | الخطط والاشتراكات | `student/plans` | `credit-card` |

   **Teacher** (3 groups — assessment tools FIRST-LEVEL):
   | Group | Items | Route | Icon |
   |---|---|---|---|
   | الرئيسية | لوحة المدرس | `teacher` | `chart` |
   | التدريس | المقررات | `teacher/courses` | `book-open` |
   | | الدروس | `teacher/lessons` | `academic-cap` |
   | | الطلاب | `teacher/students` | `users` |
   | | الحصص المباشرة | `teacher/sessions` | `video` |
   | التقييمات | الواجبات | `teacher/assessment/assignments/create` | `clipboard-document-list` |
   | | الاختبارات | `teacher/exams` | `document-check` |
   | | إنشاء اختبار | `teacher/assessment/exams/create` | `pencil-square` |
   | | بنك الأسئلة | `teacher/assessment/question-bank` | `folder-open` |
   | | لوحة التصحيح | `teacher/assessment/grading` | `check-badge` |
   | أخرى | المحادثات | `/dashboard/chat` | `chat` |

   **Admin** (3 groups):
   | Group | Items | Route | Icon |
   |---|---|---|---|
   | الرئيسية | نظرة عامة | `admin` | `chart` |
   | الإدارة | إدارة المستخدمين | `admin/users` | `users` |
   | | دليل المعلمين | `admin/teachers` | `user` |
   | | الإدارة الأكاديمية | `admin/academic` | `building` |
   | | جدول الحصص | `admin/schedule` | `calendar` |
   | | إدارة المحتوى | `admin/content-moderation` | `shield` |
   | | إدارة الاشتراكات | `admin/subscriptions` | `credit-card` |
   | | إدارة الخطط | `admin/plans` | `clipboard-document-list` |
   | التقارير والذكاء | تقارير الأداء | `admin/performance` | `trend-up` |
   | | تحليلات المنصة | `admin/platform-analytics` | `chart` |
   | | قوالب الذكاء الاصطناعي | `admin/prompt-editor` | `robot` |

   **Parent** (2 groups):
   | Group | Items | Route | Icon |
   |---|---|---|---|
   | الرئيسية | لوحة التحكم | `parent` | `home` |
   | | أبنائي | `parent/children` | `family` |
   | أخرى | الخطط والاشتراكات | `parent/subscriptions` | `credit-card` |
   | | المحادثات | `/dashboard/chat` | `chat` |

5. **Avatar menu** (top-right of header): keeps ONLY `حسابي` (profile), `تغيير كلمة المرور`, `تسجيل الخروج` (with ConfirmDialog from P1).

**Effort**: 16h

### T2-02: Plans/checkout inside dashboard layout
**Findings**: NAV-04
**Files**:
- `MasarkFront/.../app.routes.ts`
- Plans component template (minor — add back link)

**Changes**:
1. Move routes for `plans`, `checkout-success`, `checkout-cancel` from root level INTO the `dashboard` children.
2. Update guard: these pages need `authGuard` (user must be logged in to subscribe).
3. Add route data: `{ breadcrumb: 'الخطط والاشتراكات' }`.
4. Student nav link changes from `/plans` to relative `student/plans` → redirect to the new dashboard child route.
5. Legacy redirects: add `{ path: 'plans', redirectTo: '/dashboard/student/plans' }` at root for bookmarks.

**Effort**: 3h

### T2-03: Route-data-driven breadcrumbs on all pages
**Findings**: NAV-05, N3-03, Teacher grading no breadcrumb
**Files**:
- `MasarkFront/.../shared/components/breadcrumb/breadcrumb.component.ts` (rewrite)
- `MasarkFront/.../shared/components/breadcrumb/breadcrumb.component.html` (rewrite)
- `MasarkFront/.../app.routes.ts` (add `data.breadcrumb` to all routes)
- `MasarkFront/.../features/student/routes/student.routes.ts` (add `data.breadcrumb`)
- `MasarkFront/.../features/parent/routes/parent.routes.ts` (add `data.breadcrumb`)

**Changes**:
1. `BreadcrumbComponent` rewrite:
   - Inject `ActivatedRoute` and `Router`.
   - On route change, walk `route.snapshot` → `firstChild` chain, collecting `data.breadcrumb` labels.
   - Render as `<nav aria-label="مسار التنقل"><ol>...<li><a routerLink="...">{{ label }}</a></li>...</ol></nav>`.
   - Home icon as first crumb (لوحة التحكم).
   - Current page is `<li aria-current="page">` (no link, bold).
2. Add to `DashboardLayout` template above `<router-outlet>`.
3. Add `data: { breadcrumb: '...' }` to ALL route definitions. Examples:
   - `teacher/assessment/grading` → `{ breadcrumb: 'لوحة التصحيح' }`
   - `teacher/assessment/grading/exam/:studentExamId` → `{ breadcrumb: 'تصحيح الاختبار' }`
   - `parent/reports/:studentId` → `{ breadcrumb: 'التقرير الذكي' }`
   - `admin/academic` → `{ breadcrumb: 'الإدارة الأكاديمية' }`
4. Remove the old static breadcrumb usage from `exams.component.ts` imports (or keep for backward compat).

**Effort**: 5h

### T2-04: Notification panel improvements
**Findings**: NF-02, S-02, R-04
**Files**:
- `MasarkFront/.../shared/components/notification-panel/notification-panel.component.html`
- `MasarkFront/.../shared/components/notification-panel/notification-panel.component.ts`

**Changes**:
1. **Loading state**: Show skeleton loading rows while `notificationService.isLoading()` (add signal if not present).
2. **Responsive**: Change `w-80` to `w-80 max-sm:w-[calc(100vw-2rem)]` so it doesn't overflow on small screens.
3. **Click destination**: When notification has a `relatedUrl` or type-based route, navigate on click instead of just marking read.
   - If notification type is `ExamGraded` → navigate to `student/exams`.
   - If type is `SessionStarted` → navigate to session live room.
   - Default: just mark read (current behavior).
4. Remove "عرض كل الإشعارات" dead link entirely (no all-notifications page exists; or add a route stub).

**Effort**: 4h

### T2-05: Exam question navigator responsive fix
**Findings**: R-05
**Files**:
- `MasarkFront/.../features/student/pages/exams/exams.component.html`

**Changes**:
1. At L289, change `grid-cols-5` to `grid-cols-4 sm:grid-cols-5 md:grid-cols-6`:
   - 4 columns on mobile (fits 44px buttons).
   - 5 on small tablet.
   - 6 on desktop (more room).

**Effort**: 0.5h

### T2-06: Fix focus:outline-none for High Contrast Mode
**Findings**: A-16
**Files**:
- Global `styles.css` or individual templates

**Changes**:
1. Add to `styles.css` `@layer base`:
   ```css
   @media (forced-colors: active) {
     *:focus { outline: 2px solid ButtonText !important; }
   }
   ```
2. This ensures Windows High Contrast Mode shows outlines even when `focus:outline-none` is applied.

**Effort**: 0.5h

### T2-07: Route-transition loading indicator
**Findings**: N1-01
**Files**:
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.ts`
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.html`

**Changes**:
1. In `DashboardLayoutComponent`, inject `Router` and listen to `Router.events`:
   - On `NavigationStart` → show `LoadingOverlayComponent`.
   - On `NavigationEnd` / `NavigationCancel` / `NavigationError` → hide.
2. Add `<app-loading-overlay *ngIf="isNavigating()" />` in template above `<router-outlet>`.
3. Use existing `LoadingOverlayComponent` (shared component already exists).

**Effort**: 2h

### T2-08: Visual identity token updates
**Findings**: Design system cohesion (Step B findings)
**Files**:
- `MasarkFront/MasarkFront-main/tailwind.config.js`
- `MasarkFront/MasarkFront-main/src/styles.css`

**Changes**:
1. **Font order**: Change to `['Tajawal', 'Inter', 'sans-serif']` — Arabic-first.
2. **Type scale**: Add:
   ```js
   fontSize: {
     'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
     'headline-md': ['24px', { lineHeight: '32px', fontWeight: '700' }],
     'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
     'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
     'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
     'label-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
     'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
   }
   ```
3. **Border radius**: standardize `'card': '16px'`, `'input': '12px'`, `'button': '12px'`, `'badge': '9999px'`.
4. **Shadows**: add `'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)'`.
5. **RTL utilities**: in `styles.css`:
   ```css
   .ms-auto { margin-inline-start: auto; }
   .me-auto { margin-inline-end: auto; }
   .ps-4 { padding-inline-start: 1rem; }
   .pe-4 { padding-inline-end: 1rem; }
   ```
   (Tailwind 3.4 has logical properties support via `rtl:` variant — use it.)
6. **WCAG AA contrast check**: all token pairs. `blue-600` on white = 4.68:1 ✅. Danger `red-600` on white = 4.62:1 ✅. Success `emerald-600` on white = 4.53:1 ✅. Warning `amber-600` on white = 3.6:1 ❌ → darken to `amber-700` (#b45309) = 5.1:1 ✅.
7. **prefers-reduced-motion**: add `@media (prefers-reduced-motion: reduce)` rule in `styles.css` to disable transitions.

**Effort**: 4h

---

## 6. Wireframes (ASCII)

### Desktop Layout (sidebar expanded)
```
RTL: sidebar on RIGHT
┌──────────────────────────────────────────────────────────────┐
│ HEADER   مسارك Masarak                     🔔    👤 أحمد ▾   │
├───────────────────────────────────┬──────────────────────────┤
│                                   │ ≡ الرئيسية              │
│    📍 لوحة التحكم > الاختبارات    │                          │
│                                   │   📊 لوحة التحكم        │
│    ┌─────────────────────────┐   │                          │
│    │     PAGE CONTENT        │   │ ≡ التعلم                 │
│    │                         │   │   📖 دروسي               │
│    │                         │   │   📚 الدروس والوحدات     │
│    │                         │   │   🗃 مكتبة الدروس       │
│    │                         │   │   📋 الواجبات            │
│    │                         │   │   ✅ الاختبارات          │
│    │                         │   │                          │
│    │                         │   │ ≡ النتائج                │
│    │                         │   │   📊 الدرجات             │
│    │                         │   │   📅 الجدول الأسبوعي     │
│    │                         │   │   📈 رؤى التعلم          │
│    │                         │   │                          │
│    │                         │   │ ──────────               │
│    │                         │   │   💬 المحادثات            │
│    │                         │   │   💳 الخطط               │
│    └─────────────────────────┘   │                          │
│                                   │  [«] طي القائمة         │
├───────────────────────────────────┴──────────────────────────┤
│ FOOTER   © 2026 منصة مسارك التعليمية                         │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout (drawer closed)
```
┌────────────────────┐
│ مسارك    🔔  ☰ 👤  │ ← hamburger 44×44px
├────────────────────┤
│ 📍 لوحة التحكم    │ ← breadcrumb
│                    │
│  PAGE CONTENT      │
│                    │
│                    │
├────────────────────┤
│ FOOTER             │
└────────────────────┘
```

### Mobile Layout (drawer open)
```
┌────────────────────┐
│ مسارك    🔔  ✕ 👤  │
├────────────────────┤
│ ┌────────────────┐ │
│ │  SIDEBAR       │ │ ← off-canvas, backdrop behind
│ │  full links    │ │
│ │  grouped IA    │ │
│ │                │ │
│ │  تسجيل الخروج  │ │
│ └────────────────┘ │
└────────────────────┘
```

---

## 7. Verification Checklist

- [ ] Desktop: sidebar visible on page load, shows grouped IA per role
- [ ] Desktop: click collapse button → sidebar shrinks to 72px (icons only)
- [ ] Desktop: hover collapsed sidebar item → tooltip shows Arabic label
- [ ] Mobile: sidebar hidden, hamburger button visible (44px touch target)
- [ ] Mobile: tap hamburger → drawer slides in from right (RTL)
- [ ] Mobile: tap backdrop or press Escape → drawer closes, focus returns to hamburger
- [ ] Keyboard: Tab through sidebar → every item has visible focus ring
- [ ] Keyboard: `aria-current="page"` on active link (verify with screen reader)
- [ ] Skip link: Tab from page load → first Tab stop is "تخطي إلى المحتوى" → click → focus moves to main content
- [ ] Breadcrumbs: navigate to `teacher/assessment/grading/exam/123` → see "لوحة التحكم > التقييمات > لوحة التصحيح > تصحيح الاختبار"
- [ ] Plans page: accessible via sidebar "الخطط والاشتراكات" → opens inside dashboard layout with sidebar visible
- [ ] Route change: see loading overlay briefly during lazy-load transitions
- [ ] Notification panel: doesn't overflow on 320px screen width
- [ ] Notification click: if type `ExamGraded`, navigates to exams page
- [ ] Exam navigator: 4 columns on mobile, 5 on tablet
- [ ] `prefers-reduced-motion: reduce`: no animations/transitions
- [ ] Windows High Contrast Mode: focus outlines visible
- [ ] Contrast: warning color changed from `amber-600` to `amber-700` (passes AA)

---

## 8. Definition of Done

1. **Sidebar visible on desktop** with grouped role-based IA; collapsible
2. **Mobile drawer** with hamburger, backdrop, focus trap, Escape
3. **All navigation findings resolved**: NAV-01, NAV-04, NAV-05
4. **Breadcrumbs on every page** via route data — automatic, no per-component setup
5. **Route-transition loading** using existing `LoadingOverlayComponent`
6. **Visual tokens applied**: Tajawal-first font, type scale, radius, shadow, contrast-checked
7. **RTL**: `dir="rtl"` throughout, logical Tailwind properties for spacing
8. **Responsive**: sidebar → drawer on mobile, notification panel responsive, exam grid responsive
9. **No regressions**: all Phase 1 fixes intact, all GOOD items preserved
10. **Build succeeds** with zero new errors

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Sidebar overlaps content on medium screens (1024-1280px) | Medium | Use `lg:` breakpoint for expanded sidebar; test at 1024px |
| RTL drawer animation direction wrong | Medium | Test `transform: translateX(100%)` for RTL slide-in |
| Breadcrumb labels too long for mobile | Low | Truncate with `text-ellipsis` after 2nd crumb; show full on hover |
| Changing font to Tajawal-first affects layout metrics | Low | Tajawal and Inter have similar x-height; test all pages |
| Existing `ButtonComponent` consumers break after token rename | Low | P1 T1-11 already fixed `ButtonComponent`; verify no regressions |
| Route data `breadcrumb` requires touching 50+ route definitions | Medium | Batch change; any missed route just won't show a breadcrumb (graceful degradation) |

---

## 10. Handoff to Phase 3

Phase 2 delivers:
- ✅ Persistent sidebar with grouped IA per role
- ✅ Mobile-responsive drawer with accessibility
- ✅ Breadcrumbs on all pages
- ✅ Plans/checkout inside dashboard
- ✅ Visual identity tokens applied
- ✅ Route-transition loading indicator
- ✅ Notification panel improved

Phase 3 should:
1. Improve role-specific journeys (parent per-child context, lesson→assignment links, exam result→performance links)
2. Address admin 6-tab cognitive load
3. Add pre-exam instructions screen
4. Cross-link student performance ↔ insights
5. Address Add-vs-Link student confusion for parents

