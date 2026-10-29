# PHASE 1 — Critical Fixes & Accessible Foundations

> **Goal**: Close every remaining P0 and every P1 that does not depend on the new shell. Build the shared accessible primitives that all later phases reuse. After this phase, zero P0s remain, the app builds, and every already-deployed fix is preserved.

---

## 1. Scope

Phase 1 focuses on:
- Accessibility primitives (shared ConfirmDialog, FormField, leave-guard)
- Remaining P0 (failed-autosave handling)
- P1 fixes that are independent of the new layout (label association, ARIA, form validation, logout confirmation, icon-only button labels, grade `nameAr` fallback)
- All 10 Quick Wins from Report 3 Section B (assigned here or marked "superseded by P2")
- Semantic design tokens set to CURRENT look (no visual change yet)

Phase 1 does **NOT** include: sidebar navigation (P2), breadcrumb expansion (P2), visual redesign (P2), role journey improvements (P3).

---

## 2. Prerequisites

| Prerequisite | Status |
|---|---|
| Angular 21 workspace builds (`ng build` succeeds) | ✅ Verified |
| Previous session fixes on `HabibaUi` branch present | ✅ 27 files modified + `can-deactivate.guard.ts` |
| Node ≥ 22, npm ≥ 11, Tailwind 3.4 installed | ✅ In `package.json` |
| Angular CDK NOT installed | ❌ Not in `package.json` — focus trapping will be manual or install `@angular/cdk` |

**Decision**: Install `@angular/cdk` for `A11yModule` (focus trap, live announcer). It is Angular-official and adds no UI framework. Add via `npm install @angular/cdk`.

---

## 3. Findings Addressed

| Finding ID | Source | Status | Task |
|---|---|---|---|
| Doherty (network fail) | R1 | CONFIRMED P1 | T1-01 |
| A-01 | R3 | CONFIRMED P2 | T1-02 |
| A-06 | R3 | CONFIRMED P2 | T1-02 |
| A-12 | R3 | CONFIRMED P2 | T1-03 |
| A-17 (teacher links) | R3 | PARTIAL FIX | T1-04 |
| A-19 | R3 | CONFIRMED P2 | T1-05 |
| A-23 (spinner aria) | R3 | PARTIAL FIX | T1-06 |
| A-25 | R3 | CONFIRMED P2 | T1-07 |
| F-04 | R3 | CONFIRMED P2 | T1-08 |
| Grade nameAr null | R2 | CONFIRMED P1 | T1-09 |
| Norman-Signifiers (pencil hidden) | R1 | CONFIRMED P2 | T1-07 |
| Logout no confirm | R3 | CONFIRMED P3 | T1-10 |
| — (design tokens) | New | ENABLER | T1-11 |
| — (ConfirmDialog) | New | ENABLER | T1-12 |
| — (FormField) | New | ENABLER | T1-13 |
| — (leave-guard + beforeunload) | New | ENABLER | T1-14 |

### Quick Wins Assignment (Report 3 Section B):

| # | Quick Win | Status |
|---|---|---|
| 1 | `aria-label="قائمة المستخدم"` on avatar | ✅ Already fixed |
| 2 | `role="menu"` + `aria-expanded` on dropdown | ✅ Already fixed |
| 3 | `role="alert"` on error divs | ✅ Already fixed |
| 4 | `aria-live="polite"` on toast | ✅ Already fixed |
| 5 | `for`/`id` on login/signup labels | ✅ Already fixed |
| 6 | Gate DevController to dev only | ✅ Already fixed |
| 7 | `focus:bg-slate-50` on nav links | PARTIALLY — teacher links still missing → T1-04 |
| 8 | Error auto-dismiss → never | ✅ Already fixed |
| 9 | `aria-hidden="true"` on spinner SVGs | PARTIALLY — login done, other pages → T1-06 |
| 10 | `aria-label="إغلاق"` on toast close | ✅ Already fixed |

---

## 4. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Install `@angular/cdk` | Focus trapping, overlay, live announcer are complex to build correctly. CDK is the Angular-official solution with zero UI opinion. |
| D2 | Design tokens use Tailwind `extend` config, NOT CSS custom properties | `ButtonComponent` used `--color-primary` etc. which are undefined. We'll define a token layer via Tailwind config `extend.colors` / `extend.spacing` mapped to current values, then `ButtonComponent` will be rewritten to use Tailwind classes. |
| D3 | `ConfirmDialog` is a service + component pair | Inject `ConfirmDialogService`, call `service.confirm({ title, body, confirmLabel, cancelLabel })` → returns `Observable<boolean>`. Component uses CDK `FocusTrap`, `role="alertdialog"`, Esc closes, focus returns to trigger. All copy in Arabic. |
| D4 | Error feedback NEVER auto-dismisses; success auto-dismisses at 5s | Consistent with Nielsen H9. Already implemented for academic-management; generalize pattern. |
| D5 | `beforeunload` helper is a standalone function, NOT duplicated per component | Single `installBeforeUnload(condition: () => boolean)` utility. Already used by `canDeactivate` guard; extend to also set `window.onbeforeunload`. |
| D6 | Network failure during exam: show inline banner, retry 3× with exponential backoff | `ExamAttemptStore` error handler currently silently fails. Add `saveFailed` signal, retry logic, and a visible banner. Do NOT auto-submit if save is failing. |
| D7 | Logout gets ConfirmDialog ("هل تريد تسجيل الخروج؟") | Low friction addition; prevents accidental logout. |

---

## 5. Tasks

### T1-01: Failed autosave / offline handling (Doherty)
**Findings**: Doherty (R1)
**Files**:
- `MasarkFront/.../services/exam-attempt.store.ts`
- `MasarkFront/.../pages/exams/exams.component.html`

**Changes**:
1. In `ExamAttemptStore`:
   - Add `saveFailed = signal<boolean>(false)` and `saveRetryCount = signal<number>(0)`.
   - In the `error` handler of `autoSaveTrigger` subscription (L88-91):
     - Set `saveFailed(true)`.
     - If `saveRetryCount() < 3`: schedule retry after `2^retryCount * 2000ms`, increment count.
     - If `saveRetryCount() >= 3`: stop retrying, keep `saveFailed(true)`.
   - In `next` handler (L82-86): reset `saveFailed(false)`, `saveRetryCount(0)`.
2. In `exams.component.html`, after the autosave status section (~L328):
   - Add conditional banner:
   ```html
   @if (store.saveFailed()) {
     <div role="alert" class="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-2">
       <svg ...exclamation icon...></svg>
       فشل الحفظ التلقائي. تحقق من اتصالك بالإنترنت. إجاباتك محفوظة محلياً وسيتم إعادة المحاولة.
     </div>
   }
   ```
**Effort**: 3h

### T1-02: Semantic HTML on auth pages (`<main>`, `<h1>`)
**Findings**: A-01, A-06
**Files**:
- `MasarkFront/.../auth/login/login.html`
- `MasarkFront/.../auth/signup/signup.html` (verify `<h1>` present from prev session)
- `MasarkFront/.../auth/forgot-password-component/forgot-password-component.html`
- `MasarkFront/.../auth/change-password-component/change-password-component.html`

**Changes**:
1. Wrap each auth page root `<div class="min-h-screen">` with `<main class="min-h-screen">`.
2. Login: change `<h2>تسجيل الدخول</h2>` to `<h1 class="text-2xl ...">تسجيل الدخول</h1>`.
3. Forgot-password: verify/add `<h1>`.
4. Verify signup and change-password already have `<h1>` from previous fixes.

**Effort**: 1h

### T1-03: Academic management modal label association
**Findings**: A-12
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. Find all `<label>` in modal sections. Add `for="modal-{field}"` attributes.
2. Add matching `id="modal-{field}"` on corresponding `<input>` / `<select>` elements.
3. Field names: `modal-name`, `modal-nameAr`, `modal-code`, `modal-stage`, `modal-order`, `modal-maxCapacity`, `modal-isActive`.

**Effort**: 1h

### T1-04: Focus indicators on all nav links
**Findings**: A-17
**Files**:
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.html`

**Changes**:
1. Add `focus:bg-slate-50` to every `<a>` in Teacher nav section (L83-121) that only has `hover:bg-slate-50`.
2. Add `focus:bg-slate-50` to Admin nav links (L122-161) if missing.
3. Add `focus:bg-slate-50` to Parent nav links (L162-175) if missing.
4. Add `focus:bg-rose-50` to logout button (L187).
5. Verify Student nav links already have it from previous session.

**Effort**: 0.5h

### T1-05: Notification bell aria-label
**Findings**: A-19
**Files**:
- `MasarkFront/.../shared/components/notification-bell/notification-bell.component.html`

**Changes**:
1. Add `aria-label="الإشعارات"` to the `<button>` at L2.
2. Add `[attr.aria-label]="'الإشعارات (' + notificationService.unreadCount() + ' غير مقروءة)'"` for dynamic count.

**Effort**: 0.5h

### T1-06: Spinner aria-hidden across all pages
**Findings**: A-23
**Files**:
- `MasarkFront/.../auth/signup/signup.html`
- `MasarkFront/.../auth/forgot-password-component/forgot-password-component.html`
- `MasarkFront/.../auth/change-password-component/change-password-component.html`
- Any other page with `<svg class="animate-spin">`

**Changes**:
1. Search all templates for `animate-spin` SVGs.
2. Add `aria-hidden="true"` to each.
3. Login already fixed in previous session — verify.

**Effort**: 1h

### T1-07: Icon-only button accessible names (edit pencil + others)
**Findings**: A-25, Norman-Signifiers
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. Find edit pencil button (icon-only, `opacity-0 group-hover:opacity-100`).
2. Add `aria-label="تعديل"`.
3. Change `opacity-0` to `opacity-0 sm:group-hover:opacity-100 max-sm:opacity-100` so it's always visible on touch/small screens.
4. Search for any other icon-only buttons across admin components and add aria-labels.

**Effort**: 1h

### T1-08: Academic management modal client-side validation
**Findings**: F-04
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`
- `MasarkFront/.../admin/components/academic-management/academic-management.ts`

**Changes**:
1. In HTML: Add `required` attribute on modal `<input>` for name, code (subject), stage (grade), order (grade).
2. In HTML: Add `<small role="alert" class="text-red-500 text-xs">` validation error messages below each required field.
3. In TS `saveModal()`: The `name?.trim()` check already exists (L196). Add checks for:
   - Subject: `code?.trim()` (already at L209).
   - Grade: `stage` is a number, `order` is a number > 0.

**Effort**: 1.5h

### T1-09: Grade nameAr fallback in signup
**Findings**: Grade nameAr null (R2)
**Files**:
- `MasarkFront/.../auth/signup/signup.html`

**Changes**:
1. At L221, change:
   ```html
   <option [ngValue]="grade.gradeId">{{ grade.nameAr }}</option>
   ```
   to:
   ```html
   <option [ngValue]="grade.gradeId">{{ grade.nameAr || grade.name || 'مرحلة ' + grade.gradeId }}</option>
   ```

**Effort**: 0.5h

### T1-10: Logout confirmation dialog
**Findings**: Logout no confirm (R3 #38)
**Files**:
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.ts`
- `MasarkFront/.../layouts/dashboard-layout/dashboard-layout.html`

**Changes**:
1. After T1-12 (ConfirmDialog) is available, inject `ConfirmDialogService` in `DashboardLayoutComponent`.
2. Replace `logout()` method to first call:
   ```ts
   this.confirmDialog.confirm({
     title: 'تسجيل الخروج',
     body: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
     confirmLabel: 'تسجيل الخروج',
     cancelLabel: 'إلغاء',
     variant: 'danger'
   }).subscribe(confirmed => {
     if (confirmed) { /* existing logout logic */ }
   });
   ```
3. In HTML L186: change `(click)="logout(); closeMenus()"` — `logout()` will handle dialog + closeMenus internally.

**Effort**: 1h (after T1-12)

### T1-11: Semantic design tokens (Tailwind config)
**Findings**: Enabler for P2 visual redesign
**Files**:
- `MasarkFront/MasarkFront-main/tailwind.config.js`

**Changes**:
1. Remove the DUPLICATE `module.exports` (L1-10 is dead code, overridden by L12-42).
2. Add semantic color tokens mapped to CURRENT values (no visual change):
   ```js
   colors: {
     // Existing tokens (keep)
     primary: "#002045",
     // Semantic aliases mapped to current Tailwind palette
     'brand': { DEFAULT: '#2563eb', light: '#dbeafe', dark: '#1d4ed8' }, // blue-600/100/700
     'success': { DEFAULT: '#059669', light: '#d1fae5' }, // emerald-600/100
     'warning': { DEFAULT: '#d97706', light: '#fef3c7' }, // amber-600/100
     'danger': { DEFAULT: '#dc2626', light: '#fee2e2' },  // red-600/100
     'surface': { DEFAULT: '#f8fafc', alt: '#f1f5f9', inverse: '#1e293b' }, // slate-50/100/800
     'border': { DEFAULT: '#e2e8f0', strong: '#cbd5e1' }, // slate-200/300
   }
   ```
3. Add spacing token: `'touch-target': '2.75rem'` (44px — WCAG minimum).
4. Add borderRadius token: `'card': '1rem'`, `'input': '0.75rem'`, `'button': '0.75rem'`.
5. Fix `ButtonComponent` to use Tailwind classes instead of undefined CSS vars.

**Effort**: 3h

### T1-12: Shared ConfirmDialog (service + component)
**Findings**: Enabler for T1-10, P2, P3
**Files** (NEW):
- `MasarkFront/.../shared/components/confirm-dialog/confirm-dialog.component.ts`
- `MasarkFront/.../shared/components/confirm-dialog/confirm-dialog.component.html`
- `MasarkFront/.../shared/services/confirm-dialog.service.ts`

**Specification**:
- `ConfirmDialogService`:
  - `confirm(options: { title: string; body: string; confirmLabel: string; cancelLabel: string; variant?: 'danger' | 'warning' | 'default'; detail?: string }): Observable<boolean>`
  - Shows the component as an overlay.
- `ConfirmDialogComponent`:
  - `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
  - CDK `cdkTrapFocus` (or manual focus trap if CDK not installed).
  - `Escape` key closes (returns `false`).
  - Focus returns to trigger element on close.
  - Buttons: confirm (styled per variant) + cancel (outline).
  - All text props received from service — Arabic copy provided by caller.
  - Semi-transparent backdrop, centered card, RTL layout.
- **Replaces** the inline `confirmAction` signal pattern in Academic Management (extract and reuse).

**Effort**: 5h

### T1-13: Shared FormField component
**Findings**: Enabler for consistent form accessibility
**Files** (NEW):
- `MasarkFront/.../shared/components/form-field/form-field.component.ts`
- `MasarkFront/.../shared/components/form-field/form-field.component.html`

**Specification**:
- Inputs: `label: string`, `fieldId: string`, `errorMessage: string | null`, `required: boolean`.
- Template:
  ```html
  <div class="mb-4">
    <label [for]="fieldId" class="block text-sm font-semibold text-slate-700 mb-1.5">
      {{ label }}
      <span *ngIf="required" class="text-danger">*</span>
    </label>
    <ng-content></ng-content> <!-- projects the <input>/<select> -->
    <small *ngIf="errorMessage" [id]="fieldId + '-error'" role="alert"
           class="text-red-500 text-xs mt-1 block font-medium">
      {{ errorMessage }}
    </small>
  </div>
  ```
- Consumer adds `[id]="fieldId"` and `[attr.aria-describedby]="errorMessage ? fieldId + '-error' : null"` on the projected input.

**Effort**: 2h

### T1-14: Reusable leave-guard + beforeunload helper
**Findings**: Enabler — extends existing `can-deactivate.guard.ts`
**Files**:
- `MasarkFront/.../core/guards/can-deactivate.guard.ts` (existing)
- `MasarkFront/.../core/helpers/before-unload.helper.ts` (NEW)

**Changes**:
1. Create `installBeforeUnload(conditionFn: () => boolean): () => void` helper that:
   - Sets `window.addEventListener('beforeunload', handler)`.
   - Returns a cleanup function.
   - Handler calls `event.preventDefault()` if `conditionFn()` returns `false`.
2. In `exams.component.ts` `ngOnInit()`: call `installBeforeUnload(() => this.canDeactivate())`.
3. On `ngOnDestroy()`: call the cleanup function.
4. Verify the existing `canDeactivate` guard already shows a `confirm()` dialog — enhance to use `ConfirmDialogService` when available (T1-12), with Arabic text:
   - Title: "مغادرة الصفحة"
   - Body: "لديك بيانات غير محفوظة. هل أنت متأكد أنك تريد المغادرة؟"
   - Confirm: "مغادرة"
   - Cancel: "البقاء"

**Effort**: 2h

---

## 6. Wireframes (ASCII)

### ConfirmDialog (T1-12)
```
┌─────────────────────────────────────────┐
│          ╔══════════════════════╗        │
│          ║    تسجيل الخروج      ║ (h2)   │
│          ╠══════════════════════╣        │
│          ║                      ║        │
│          ║  هل أنت متأكد أنك    ║        │
│          ║  تريد تسجيل الخروج؟  ║        │
│          ║                      ║        │
│          ║  [إلغاء]  [تسجيل    ]║        │
│          ║           [الخروج   ]║        │
│          ╚══════════════════════╝        │
│         (backdrop: bg-black/50)          │
└─────────────────────────────────────────┘
```

### Failed Autosave Banner (T1-01)
```
┌─────────────────────────────────────────┐
│  ⚠ فشل الحفظ التلقائي. تحقق من اتصالك │
│    بالإنترنت. إجاباتك محفوظة محلياً     │
│    وسيتم إعادة المحاولة.                │
└─────────────────────────────────────────┘
```

---

## 7. Verification Checklist

- [ ] `ng build` succeeds with zero errors
- [ ] All existing tests pass (`ng test` if tests exist)
- [ ] Tab through login → signup → forgot-password → change-password: all labels associated, all errors announced, all spinners hidden from AT
- [ ] Open exam → answer questions → disconnect network → see warning banner → reconnect → autosave resumes
- [ ] Open exam → click "تسليم الاختبار" → see styled Arabic confirm dialog (not browser `confirm()`)
- [ ] Click logout → see confirm dialog → cancel returns to page → confirm logs out
- [ ] Academic management → create grade without name → see inline validation error
- [ ] Keyboard: Tab through avatar menu → see focus indicator on every item → Escape closes
- [ ] Screen reader: notification bell announces "الإشعارات (X غير مقروءة)"
- [ ] Grade dropdown in signup: if backend returns null `nameAr`, fallback to `name` is shown
- [ ] Pencil edit icon visible on mobile without hover

---

## 8. Definition of Done

1. **Zero P0 findings remaining** (all P0s are either already fixed or addressed in this phase)
2. **All P1 findings that don't depend on the new shell are resolved**
3. **Build succeeds** with no new errors (existing CS8981/CS8602 warnings acceptable)
4. **Shared primitives** (`ConfirmDialog`, `FormField`, `beforeunload` helper) are created and used by at least one consumer each
5. **Design tokens** defined in Tailwind config; `ButtonComponent` compiles without undefined CSS vars
6. **All 10 Quick Wins** either done or superseded (see table in section 3)
7. **No regressions** in GOOD items: forgot-password `for`/`id`, change-password mismatch validator, exam navigator/timer/progress, SignalR notifications, `confirmAction` pattern in Academic Management

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `@angular/cdk` adds unexpected bundle size | Low | CDK modules are tree-shakable; only import `A11yModule` / `OverlayModule` |
| Rewriting `ButtonComponent` to Tailwind breaks existing consumers | Medium | Search all imports of `ButtonComponent` first; if none exist (likely — pages use inline classes), the rewrite is safe |
| `beforeunload` event is inconsistent across browsers | Low | Use `event.preventDefault()` + `event.returnValue = ''` pattern; tested in Chrome/FF/Safari |
| `ConfirmDialog` blocks exam auto-submit on timer expiry | Medium | Timer expiry calls `submitActiveExam(true)` which skips the confirm dialog (force=true); verify this path still works |

---

## 10. Handoff to Phase 2

Phase 1 delivers:
- ✅ Zero P0s, minimal P1s remaining (only NAV-01/NAV-04/NAV-05 which are P2-shell-dependent)
- ✅ `ConfirmDialog` ready for reuse in sidebar logout, destructive admin actions, etc.
- ✅ `FormField` ready for reuse in new forms
- ✅ Design tokens in Tailwind config — Phase 2 changes the VALUES
- ✅ `ButtonComponent` uses Tailwind — Phase 2 adds new semantic color tokens
- ✅ `beforeunload` helper ready for any page that needs leave protection

Phase 2 should:
1. Change token VALUES (palette, typeface, radius, shadow)
2. Build the new `DashboardLayout` with persistent sidebar
3. Move plans/checkout inside dashboard layout
4. Expand breadcrumbs to all pages
