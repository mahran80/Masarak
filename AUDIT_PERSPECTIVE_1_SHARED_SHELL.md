# Perspective 1: Shared Shell & Global Overlays Audit
**Masarak Platform — Code-Grounded UI & Functionality Blueprint**

---

## 1.1 Root Overlay Host & Bootstrap (`App`)

### Route Path & Guards
- **Route Path**: Root application bootstrap (`app.ts` / `app.html`), no route prefix.
- **Guards**: None (hosts `<router-outlet />` for all public and protected routes).

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/app.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/app.html`

### UI Sections & Visual States
- **Top Toast Host Layer**:
  - Direct template tag `<app-toast-container />` rendered at the very top.
  - Floating fixed position layer at `top-4 left-4 z-[9999]`.
- **Global Blocking Loader Layer**:
  - Direct template tag `<app-loading-overlay />`.
  - Driven by `loadingService.isLoading()` signal.
  - Renders a semi-transparent dark backdrop (`bg-slate-950/60 backdrop-blur-sm z-[9990]`) with a centered animated spinner and text "جاري التحميل...".
- **Global Confirm Dialog Modal Host**:
  - Direct template tag `<app-confirm-dialog />`.
  - Driven by `confirmDialogService.state()` signal.
  - Renders a centered modal (`z-[9998]`) with backdrop blur when `state().isOpen === true`.
- **Primary Router Outlet**:
  - `<router-outlet />` renders whichever route is currently active.

### Interactive Elements & Actions
- Intercepts and binds all application-level modal and notification events dispatched by child views.

### State & Signals
- **Injected Services**:
  - `ToastService` (`src/app/core/services/toast.service.ts`)
  - `LoadingService` (`src/app/core/services/loading.service.ts`)
  - `ConfirmDialogService` (`src/app/shared/services/confirm-dialog.service.ts`)

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Stacking order must remain strictly separated:
  - Base Layout / Views: `z-0` to `z-30`
  - Sticky Headers: `z-40`
  - Slide-over Drawers / Notification panel: `z-50`
  - Agora Live Video Room: `z-50`
  - Global Loader: `z-[9990]`
  - Confirmation Modal: `z-[9998]`
  - Toasts: `z-[9999]`

---

## 1.2 Dashboard Layout Shell (`DashboardLayoutComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard`, wraps child routes (`/dashboard/admin/*`, `/dashboard/teacher/*`, `/dashboard/student/*`, `/dashboard/parent/*`, `/dashboard/profile`, `/dashboard/chat`, etc.).
- **Guards**: `canActivate: [authGuard]`
- **Breadcrumb Data**: Parent router breadcrumb container.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/layouts/dashboard-layout/dashboard-layout.html`

### UI Sections & Visual States
- **Top Navigation Bar (Header)**:
  - Sticky top header (`h-16 bg-white border-b border-slate-200 sticky top-0 z-40`).
  - Mobile Menu Hamburger Toggle button (`lg:hidden`).
  - Platform Branding: Masarak logo SVG icon + "مسارك" title.
  - Route Breadcrumb container: `<app-breadcrumb />`.
  - Right Controls (RTL):
    - Notification Trigger Bell: `<app-notification-bell />`.
    - User Profile Pill Button: Circular avatar image / initials, user full name, role badge ("مدير النظام", "معلم", "طالب", "ولي أمر"), and down chevron.
- **Desktop Collapsible Sidebar**:
  - Fixed right-side sidebar in RTL (`fixed right-0 top-16 bottom-0 z-30 bg-white border-l border-slate-200 transition-all duration-300`).
  - Two visual width states:
    - Expanded: `w-64` (full icons + labels + group section titles).
    - Collapsed: `w-20` (icon-only rail with tooltips).
  - Navigation Groups (`@for (group of navGroups(); track group.title)`):
    - Group category header (`text-xs font-bold text-slate-400 uppercase px-3`).
    - Nav Items: Router link button with active state class `bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600 shadow-sm`.
  - Collapse / Expand Toggle Button at bottom of sidebar.
- **Mobile Navigation Drawer**:
  - Slide-over backdrop (`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden`) when `isMobileMenuOpen() === true`.
  - Slide-out navigation drawer with CDK focus trap (`cdkTrapFocus`) and header with close cross button.
- **User Profile Dropdown Menu**:
  - Popover dropdown anchored below user profile button when `isUserDropdownOpen() === true`.
  - Header: User avatar, full name, email, role badge.
  - Menu Items:
    - "الملف الشخصي" (Profile) -> `/dashboard/profile`
    - "تغيير كلمة المرور" (Change Password) -> `/dashboard/change-password`
    - "تسجيل الخروج" (Logout) -> Red icon and text.
- **Main Viewport Area**:
  - Dynamically margin-adjusted: `lg:mr-64` when expanded, `lg:mr-20` when collapsed.
  - Inner container: `<router-outlet />` wrapped in `<main class="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">`.

### Interactive Elements & Actions
- **Toggle Mobile Menu**: `(click)="toggleMobileMenu()"` toggles `isMobileMenuOpen()`.
- **Close Mobile Menu**: `(click)="closeMobileMenu()"` resets `isMobileMenuOpen.set(false)`.
- **Toggle Sidebar Collapse**: `(click)="toggleSidebar()"` toggles `sidebarCollapsed()`.
- **Toggle User Dropdown**: `(click)="toggleUserDropdown()"` toggles `isUserDropdownOpen()`.
- **Close User Dropdown**: Click outside directive / backdrop `(click)="closeUserDropdown()"`.
- **Logout Button**: `(click)="logout()"` -> calls `authState.clearAuth()` and navigates to `/auth/login`.

### State & Signals
- `sidebarCollapsed = signal<boolean>(false)`
- `isMobileMenuOpen = signal<boolean>(false)`
- `isUserDropdownOpen = signal<boolean>(false)`
- `isNotificationsOpen = signal<boolean>(false)`
- `navGroups = computed<NavGroup[]>(() => ...)` resolves tailored navigation items based on `authState.userRole()`.
- **Injected Services**:
  - `AuthStateService`
  - `Router`
  - `Renderer2`

### Known UI/Layout Pain Points (Google Stitch Redesign)
- The sidebar transition between `w-64` and `w-20` must cleanly hide text labels (`opacity-0 max-w-0`) to prevent text wrapping artifacts during the 300ms animation.
- In RTL, `border-r-4 border-blue-600` is on the right side of the item pill; ensure margin offsets (`mr-64` / `mr-20`) match the right-side dock.

---

## 1.3 Breadcrumb Component (`BreadcrumbComponent`)

### Route Path & Guards
- Shared UI component placed in page headers or top navbar.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/breadcrumb/breadcrumb.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/breadcrumb/breadcrumb.component.html`

### UI Sections & Visual States
- **Breadcrumb Nav Trail**:
  - Rendered with `<nav aria-label="Breadcrumb">`.
  - Ordered list `<ol class="flex items-center gap-1.5 text-xs sm:text-sm font-medium">`.
  - Parent Crumb: Text wrapped in `<a [routerLink]="item.url" class="text-slate-500 hover:text-blue-600 transition-colors">`.
  - Divider: Separator icon `<app-icon name="chevron-left" class="text-slate-300" />` (RTL direction).
  - Terminal Active Crumb: Text wrapped in `<span class="text-slate-900 font-bold" aria-current="page">`.
- **Input Driven vs Auto Route Driven**:
  - Supports manual override via `@Input() items: BreadcrumbItem[]`.
  - Defaults to automatic recursive inspection of `ActivatedRoute.snapshot`.

### Interactive Elements & Actions
- Click on any ancestor crumb triggers Angular router navigation to that crumb's route.

### State & Signals
- `breadcrumbs = signal<BreadcrumbItem[]>([])`
- **Injected Services**: `Router`, `ActivatedRoute`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Long titles (e.g. detailed exam names) must truncate with `max-w-[200px] truncate` on mobile screens to prevent header height blowouts.

---

## 1.4 Notification Bell & Slide-Over Panel (`NotificationBellComponent` & `NotificationPanelComponent`)

### Route Path & Guards
- Mounted inside `DashboardLayoutComponent` navbar.

### File Paths
- Bell TS: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/notification-bell/notification-bell.component.ts`
- Bell Template: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/notification-bell/notification-bell.component.html`
- Panel TS: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/notification-panel/notification-panel.component.ts`
- Panel Template: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/notification-panel/notification-panel.component.html`

### UI Sections & Visual States
- **Notification Bell Trigger**:
  - Button with bell SVG icon (`w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100`).
  - Unread Badge: Animated red/emerald pill (`absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse`). Capped at `99+`.
- **Notification Slide-Over Drawer**:
  - Fixed right slide-over drawer (`fixed top-0 bottom-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200`).
  - Drawer Header: "الإشعارات" title, Unread count chip, "تحديد الكل كمقروء" (Mark All as Read) button, and Close button.
  - Filter Tabs:
    - Tab 1: "الكل" (All)
    - Tab 2: "غير المقروءة" (Unread) with pill count.
  - **View States**:
    - `@if (isLoading())`: Animated pulse skeleton cards.
    - `@else if (filteredNotifications().length === 0)`: Empty state illustration with "لا توجد إشعارات جديدة".
    - `@else`: Scrollable list of notification items:
      - Category Icon: Colored circle based on category (`Exam` = Purple, `Attendance` = Green, `Alert` = Rose, `System` = Blue).
      - Title & Message preview.
      - Relative timestamp (e.g. "منذ 5 دقائق").
      - Unread indicator dot (`w-2 h-2 rounded-full bg-blue-600`).
      - Dismiss trash icon button on hover.

### Interactive Elements & Actions
- **Toggle Bell**: `(click)="toggle()"` -> emits to parent dashboard layout.
- **Close Drawer**: `(click)="close()"` -> resets drawer state.
- **Mark All Read**: `(click)="markAllAsRead()"` -> calls `notificationService.markAllAsRead()`.
- **Click Notification**: `(click)="onNotificationClick(item)"` -> marks notification as read, auto-navigates to `item.targetUrl` if defined.
- **Delete Single Notification**: `(click)="deleteNotification(item, $event)"` -> removes notification without triggering click navigation.

### State & Signals
- `unreadCount = signal<number>(0)`
- `notifications = signal<NotificationItem[]>([])`
- `filter = signal<'all' | 'unread'>('all')`
- `isLoading = signal<boolean>(false)`
- **Injected Services**: `NotificationService`, `Router`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Unread items (`bg-blue-50/50`) vs read items (`bg-white`) need distinct contrast in dark mode themes.

---

## 1.5 Confirmation Dialog Overlay (`ConfirmDialogComponent`)

### Route Path & Guards
- Injected globally via `ConfirmDialogService` into `app.html`.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/confirm-dialog/confirm-dialog.component.html`

### UI Sections & Visual States
- Centered modal container (`fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm`).
- Modal Card (`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-fade-in`):
  - Severity Icon:
    - `danger`: Red exclamation icon in soft red circle.
    - `warning`: Amber warning triangle in soft amber circle.
    - `info`: Blue information icon in soft blue circle.
  - Dialog Title (`text-xl font-black text-slate-900 mb-2`).
  - Dialog Message (`text-sm font-medium text-slate-600 leading-relaxed mb-6`).
  - Action Buttons Row:
    - Cancel button: `bg-slate-100 hover:bg-slate-200 text-slate-700`.
    - Confirm button: Color-coded based on severity (`danger` = `bg-rose-600 hover:bg-rose-700 text-white`).

### Interactive Elements & Actions
- **Confirm**: `(click)="onConfirm()"` -> resolves confirmation promise with `true` and closes modal.
- **Cancel**: `(click)="onCancel()"` -> resolves promise with `false` and closes modal.
- **Backdrop Click**: Dismisses as cancel.
- **Keyboard ESC**: Dismisses as cancel.

### State & Signals
- `state = this.confirmDialogService.state` signal (`{ isOpen: boolean, title: string, message: string, confirmText: string, cancelText: string, type: 'danger' | 'warning' | 'info' }`).
- **Injected Services**: `ConfirmDialogService`.

---

## 1.6 Child Context Bar (`ChildContextBarComponent`)

### Route Path & Guards
- Embedded at the top of parent views:
  - `/dashboard/parent/reports/:studentId`
  - `/dashboard/parent/alerts/:studentId`
  - `/dashboard/parent/attendance/:studentId`
  - `/dashboard/parent/schedule/:studentId`

### File Paths
- **TypeScript & Inline Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/parent/components/child-context-bar/child-context-bar.component.ts`

### UI Sections & Visual States
- Sticky bar container (`bg-white border-b border-slate-200 p-4 sticky top-16 z-20 shadow-sm`):
  - **Child Summary Badge**: Student avatar/initials, full name, grade name, and subscription active pill (`bg-emerald-100 text-emerald-800` vs `bg-rose-100 text-rose-800`).
  - **Child Switcher Dropdown**: Inline `<select>` allowing parent to switch between linked children on the fly.
  - **Sub-View Navigation Tabs**:
    - "التقارير الذكية" -> `/dashboard/parent/reports/:studentId`
    - "جدول الحصص" -> `/dashboard/parent/schedule/:studentId`
    - "تنبيهات الأداء" -> `/dashboard/parent/alerts/:studentId`
    - "سجل الحضور" -> `/dashboard/parent/attendance/:studentId`
    - Active tab highlighted with `bg-blue-50 text-blue-700 font-bold shadow-xs`.

### Interactive Elements & Actions
- **Switch Child**: `(change)="onChildSelect($event)"` -> updates router URL to the selected child ID for the active sub-tab.
- **Sub-tab Clicks**: Angular `[routerLink]` bindings with `routerLinkActive`.

### State & Signals
- `@Input({ required: true }) studentId!: number`
- `linkedStudents = this.parentService.linkedStudents`
- `selectedStudent = this.parentService.selectedStudent`
- **Injected Services**: `ParentService`, `Router`.

---

## 1.7 Toast Container (`ToastContainerComponent`)

### Route Path & Guards
- Mounted globally in `app.html`.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/toast-container/toast-container.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/toast-container/toast-container.component.html`

### UI Sections & Visual States
- Fixed floating toast stack (`fixed top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none`).
- Individual Toast Card (`pointer-events-auto bg-white rounded-xl shadow-xl border p-4 max-w-sm w-full flex items-start gap-3 animate-slide-in`):
  - `success`: Emerald icon & emerald accent border.
  - `error`: Rose icon & rose accent border.
  - `warning`: Amber icon & amber accent border.
  - `info`: Sky icon & sky accent border.
  - Dismiss button (cross icon).
  - Timeout countdown progress bar at bottom of toast.

### Interactive Elements & Actions
- **Dismiss**: `(click)="toastService.remove(toast.id)"`.

### State & Signals
- `toasts = this.toastService.toasts` signal.
- **Injected Services**: `ToastService`.

---

## 1.8 Loading Overlay (`LoadingOverlayComponent`)

### Route Path & Guards
- Mounted globally in `app.html`.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/loading-overlay/loading-overlay.component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/shared/components/loading-overlay/loading-overlay.component.html`

### UI Sections & Visual States
- Full-viewport blocking backdrop (`fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[9990] flex items-center justify-center`).
- Centered glassmorphic card with spinning ring spinner and optional progress message.
- Active only when `loadingService.isLoading() === true`.

### State & Signals
- `isLoading = this.loadingService.isLoading` signal.
- `message = this.loadingService.message` signal.
- **Injected Services**: `LoadingService`.
