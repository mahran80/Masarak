# UI & Functionality Inventory — Perspective 7: Cross-Role Pages & Subscription Flows

> **Audit Scope**: Covers all global, multi-role accessible routes, routed components, SignalR interactive chat, user profile management, and end-to-end Stripe subscription checkout workflows. Grounded strictly in Angular 19+ standalone components, real-time WebSockets, and reactive stores.

---

## 1. SignalR Real-Time Multi-Room Chat (`Chat`)

- **Route Path & Guards**:
  - Route: `/dashboard/chat` (also redirect from `/chat`)
  - Guard: `AuthGuard` (accessible to all authenticated roles: Admin, Teacher, Student, Parent)
  - Breadcrumb: `'المحادثات'`
- **File Paths**:
  - TypeScript: [chat.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/signalR/Component/chat/chat.ts)
  - Template: [chat.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/signalR/Component/chat/chat.html)
  - Styling: [chat.css](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/signalR/Component/chat/chat.css)
- **UI Sections & Visual States**:
  - **Full-Height Container**: `h-[calc(100vh-8rem)]`, rounded-3xl container with RTL layout.
  - **Channels / Rooms Sidebar (Width: 80 / 320px)**:
    - Sidebar Header: Chat icon with title `"المحادثات"`.
    - Room Groupings: Rendered via `store.groupedRooms()` tracking `group.groupName` (e.g., Grade Communities, Teacher Staff Rooms).
    - Room Item Button:
      - Active State: `bg-blue-50 border-r-4 border-r-[#4F8CD4] text-blue-900 font-black ring-1 ring-[#4F8CD4]/10`.
      - Inactive State: `hover:bg-slate-50 text-slate-600 font-bold`.
      - Hash `#` channel icon or community icon.
      - Unread count pill badge `@if (room.messageCount > 0)` (capped at `99+`).
  - **Main Chat Conversation Area**:
    - **Room Header Bar**: Channel name `#{{ selectedRoom()?.name }}`, room type label (`مجتمع المرحلة الدراسية` vs `مجتمع المعلمين`).
    - **Messages Scrollable Feed (`#messages-container`)**:
      - Empty State: Illustrated chat bubble with `"لا توجد رسائل سابقة. كن أول من يشارك!"`.
      - Message Stream:
        - **Sent by Current User**: Pushed to the left (`mr-auto items-start` in RTL), styled with `bg-blue-50 text-blue-950 rounded-2xl rounded-tl-sm border border-blue-200`, labeled `"أنت"`.
        - **Received from Others**: Pushed to the right (`ml-auto items-start` in RTL), styled with `bg-white text-slate-800 rounded-2xl rounded-tr-sm border border-slate-200`, labeled with sender's name (`msg.senderName`).
        - Formatted timestamp via `DatePipe` (`msg.sentAt | date:'shortTime'`).
    - **Message Composer Input Bar**:
      - Attachment icon button (for file uploads).
      - Multiline `<textarea>` with auto-expanding capability, binding `[(ngModel)]="message"`, supporting `(keydown.enter)="handleEnter($event)"`.
      - Send Button: Blue button with angled send arrow; disabled and grayed out if `!message.trim()`.
      - Keyboard shortcut helper footnote: `"اضغط Enter للإرسال، و Shift + Enter لسطر جديد"`.
  - **No Room Selected State**:
    - Central placeholder prompting user: `"اختر قناة من القائمة الجانبية للبدء في المحادثة"`.
- **Interactive Elements & Actions**:
  - `(click)="selectRoom(room.chatRoomId)"`: Leaves old SignalR room, sets `selectedRoomId`, joins new room via `ChatSignalRService.joinRoom(roomId)`, and fetches message history.
  - `(keydown.enter)="handleEnter($event)"`: Sends message immediately unless `Shift` key is held.
  - `(click)="send()"`: Dispatches message over WebSocket hub and clears input.
- **State & Signals**:
  - Store: `ChatStore` (signals for `rooms`, `groupedRooms`, `selectedRoomId`, `messages`)
  - `message = ''` (two-way bound)
  - `selectedRoom = computed(() => ...)`
  - `currentUserId` getter from `AuthStateService.user()?.userId`
  - Injected: `ChatApiService`, `ChatSignalRService`, `ChatStore`, `AuthStateService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Attachment button is currently a visual placeholder and does not yet trigger file upload.
  - Sidebar needs responsive drawer behavior on mobile viewports so users can collapse channels and focus on the chat thread.

---

## 2. Universal User Profile Management (`ProfilePageComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/profile` (own profile) & `/dashboard/parent/child-profile/:id` (child profile view)
  - Guard: `AuthGuard`
  - Breadcrumb: `'الملف الشخصي'` / `'ملف الطالب'`
- **File Paths**:
  - TypeScript: [profile-page.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/profile/pages/profile-page.component.ts)
  - Template: [profile-page.component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/profile/pages/profile-page.component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"الملف الشخصي"`, role badge, and link to change password (`/dashboard/change-password`).
  - **Profile Avatar Hero**:
    - Avatar image display with error fallback to `defaultAvatar` vector SVG.
    - Upload Photo button (hidden file input triggering `onFileSelected($event)`).
    - Remove Photo button (`removeAvatar()`) with spinner (`isUploading()`).
    - Max size warning (5MB limit).
  - **Profile Form (`profileForm`)**:
    - Full Name input (required, max 150 chars).
    - Phone number input (with `dir="ltr"`).
    - Country input.
    - Headline / Professional title input.
    - Bio textarea.
    - Save Changes button with spinner (`isSaving()`).
  - **Parent-Child View Mode (`studentId() !== null`)**:
    - Computes `isReadOnly()`: If a parent is viewing their child's profile, fields remain editable or read-only based on role permissions.
    - Academic enrollment details, class, grade level, and linkage info.
- **Interactive Elements & Actions**:
  - `onSave()`: Submits updated profile data via `profileService.updateProfile(...)` or `updateStudentProfile(...)`, updates global `AuthStateService` display name, and triggers success toast.
  - `onFileSelected(event)`: Validates 5MB limit and uploads new avatar via multipart form data.
  - `removeAvatar()`: Clears avatar URL.
- **State & Signals**:
  - `isLoading = signal(true)`
  - `isSaving = signal(false)`
  - `isUploading = signal(false)`
  - `profile = signal<UserProfileDto | null>(null)`
  - `studentId = signal<number | null>(null)`
  - `isReadOnly = computed(() => ...)`
  - `profileForm: FormGroup`
  - Injected: `FormBuilder`, `ProfileService`, `AuthStateService`, `ToastService`, `ActivatedRoute`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Phone number should include international country dial code dropdown selector.
  - Add image cropping/re-positioning modal before upload for a crisp round avatar.

---

## 3. Subscription Plans Catalog (`PlansPageComponent` & `PlansComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/plans` (also redirect from `/plans` and `/dashboard/student/plans`)
  - Guard: Accessible to all authenticated users (Student, Parent, etc.)
  - Breadcrumb: `'الخطط والاشتراكات'`
- **File Paths**:
  - Page TypeScript: [plans.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/pages/plans/plans.component.ts)
  - Base Component TypeScript: [plans-component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/plans-component/plans-component.ts)
  - Base Component Template: [plans-component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/plans-component/plans-component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"اختر الخطة المناسبة لك"`, subtitle explaining premium features (AI analysis, unlimited exams, smart parent reports).
  - **Loading Skeleton**: 3 pulsing card placeholders.
  - **Error Container**: Alert box with retry button.
  - **Plans Pricing Cards Grid**:
    - Tiered cards (e.g. Basic, Standard, Pro/Premium).
    - Featured / Popular tier highlight (colored badge, elevated shadow, ring border).
    - Price and billing interval (`شهرياً` / `سنوياً`).
    - Feature bullet points with checkmark icons.
    - CTA Button:
      - `"اشترك الآن"`: Triggers Stripe checkout.
      - `"خطتك الحالية"` (disabled if `disabledPlanId === plan.planId`).
      - Loading spinner if `checkingOutPlanId() === plan.planId`.
  - **Checkout Error Banner**: Displays inline error message if Stripe session initialization fails.
- **Interactive Elements & Actions**:
  - `onSelectPlan(plan)`:
    - If `handleCheckout` is false, emits `planSelected` event (used by Parent Subscriptions page).
    - If true, calls `subApi.initiateCheckout(plan.planId)` and redirects browser to Stripe hosted URL (`window.location.href = result.checkoutUrl`).
- **State & Signals**:
  - Inputs: `@Input() handleCheckout = true`, `@Input() disabledPlanId: number | null`, `@Input() isProcessingPlanId: number | null`
  - Output: `@Output() planSelected = new EventEmitter<PlanDto>()`
  - `plans = signal<PlanDto[]>([])`
  - `loading = signal(true)`
  - `error = signal<string | null>(null)`
  - `checkingOutPlanId = signal<number | null>(null)`
  - `checkoutError = signal<string | null>(null)`
  - Injected: `SubscriptionApiService`, `AuthStateService`, `Router`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Needs a Monthly / Annual billing toggle switch with a "Save 20%" discount badge for annual plans.

---

## 4. Student Personal Subscription Overview (`MySubscriptionPageComponent` & `MySubscriptionComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/my-subscription` (also redirect from `/my-subscription`)
  - Guard: `AuthGuard`
  - Breadcrumb: `'اشتراكي'`
- **File Paths**:
  - Page TypeScript: [my-subscription.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/pages/my-subscription/my-subscription.component.ts)
  - Base Component TypeScript: [my-subscription-component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/my-subscription-component/my-subscription-component.ts)
  - Base Component Template: [my-subscription-component.html](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/my-subscription-component/my-subscription-component.html)
- **UI Sections & Visual States**:
  - **Header Bar**: Title `"تفاصيل اشتراكي"`, subtitle.
  - **Active Subscription Card**:
    - Current Plan Name, price, status badge (نشط, منتهي, معلق).
    - Renewal / Expiration date countdown.
    - Change plan button linking to `/dashboard/plans`.
  - **Guardian Invitation Code Box (Student Specific)**:
    - Dedicated card: `"رمز ربط ولي الأمر"`.
    - Generates 6-character code via `AuthApiService.getLinkageCode()`.
    - Copy to clipboard button with `"تم النسخ!"` temporary confirmation tooltip.
    - Guidance note instructing the student to give this code to their parent.
  - **Subscription Billing History**:
    - Table displaying past invoices, payment dates, amounts, and Stripe receipt links.
- **Interactive Elements & Actions**:
  - `copyLinkageCode()`: Copies linkage code to system clipboard and sets `copied.set(true)` for 2 seconds.
  - `loadStatus()`, `loadHistory()`.
- **State & Signals**:
  - `status = signal<SubscriptionStatusResponse | null>(null)`
  - `history = signal<SubscriptionDto[]>([])`
  - `loading = signal(true)`
  - `linkageCode = signal<string | null>(null)`
  - `copied = signal(false)`
  - Injected: `SubscriptionApiService`, `AuthApiService`, `AuthStateService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - The linkage code box should have an instantaneous QR code option for parents to scan with their mobile phone cameras.

---

## 5. Stripe Checkout Success Verification (`CheckoutSuccessPageComponent` & `CheckoutSuccessComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/checkout-success` (also redirect from `/checkout-success`)
  - Guard: `AuthGuard`
  - Breadcrumb: `'تأكيد الاشتراك'`
- **File Paths**:
  - Page TypeScript: [checkout-success.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/pages/checkout-success/checkout-success.component.ts)
  - Base Component TypeScript: [checkout-success-component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/checkout-success-component/checkout-success-component.ts)
- **UI Sections & Visual States**:
  - **Centered Card Layout**: Max-width card centered in screen.
  - **State 1: Verifying (`isVerifying === true`)**:
    - Blue pulsating ring, spinner icon, title `"جاري تأكيد الدفع..."`, text `"يرجى الانتظار بينما نقوم بتأكيد اشتراكك مع البنك..."`.
  - **State 2: Success (`verificationSuccess === true`)**:
    - Emerald checkmark icon in circular badge, title `"تم الدفع بنجاح!"`, text `"تم تفعيل اشتراكك بنجاح. سيتم توجيهك تلقائياً..."`.
    - Auto-redirect timer returning to dashboard.
  - **State 3: Failed / Duplicate (`verificationSuccess === false`)**:
    - Red cross icon, title `"فشل التأكيد"`, text `"حدثت مشكلة أثناء تأكيد الدفع أو تم الدفع مسبقاً."`.
    - Return CTA button: `"العودة للوحة التحكم"`.
- **Interactive Elements & Actions**:
  - Extracts `session_id` query parameter from Stripe redirect.
  - Polls backend verification endpoint: `GET /api/subscription/verify-session?sessionId=...`.
  - Redirects user based on their role (`/dashboard/parent` or `/dashboard/student`).
- **State & Properties**:
  - `isVerifying = true`
  - `verificationSuccess = false`
  - Injected: `ActivatedRoute`, `HttpClient`, `Router`, `AuthStateService`.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Needs celebratory success sound or confetti animation to make payment completion feel rewarding.

---

## 6. Stripe Checkout Cancel Page (`CheckoutCancelPageComponent` & `CheckoutCancelComponent`)

- **Route Path & Guards**:
  - Route: `/dashboard/checkout-cancel` (also redirect from `/checkout-cancel`)
  - Guard: Public / Authenticated
  - Breadcrumb: `'إلغاء الاشتراك'`
- **File Paths**:
  - Page TypeScript: [checkout-cancel.component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/pages/checkout-cancel/checkout-cancel.component.ts)
  - Base Component TypeScript: [checkout-cancel-component.ts](file:///d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/subscription/components/checkout-cancel-component/checkout-cancel-component.ts)
- **UI Sections & Visual States**:
  - **Centered Reassurance Card**:
    - Gray circular icon with cross.
    - Title `"تم إلغاء عملية الدفع"`.
    - Reassurance note: `"لم يتم خصم أي مبالغ. يمكنك العودة لصفحة الخطط والاشتراك في أي وقت."`.
    - Primary CTA: `"عرض الخطط المتاحة"` linking to `/dashboard/plans`.
    - Secondary CTA: `"العودة للوحة التحكم"` linking to `/dashboard`.
- **Interactive Elements & Actions**:
  - Router links for recovery and continued platform exploration.
- **State & Properties**:
  - Pure presentational standalone component.
- **Known UI / Layout Pain Points & Stitch Redesign Notes**:
  - Can include a lightweight feedback prompt ("Why didn't you complete checkout? [Too expensive / Need more features / Just looking]").

---

## Perspective 7 Summary & Visual Redesign Matrix

| # | Route Path | Component Name | Key Visual State Highlights | Prime Stitch Redesign Opportunity |
|---|---|---|---|---|
| 1 | `/dashboard/chat` | `Chat` | Multi-room channels sidebar, RTL message bubbles, Enter shortcut | File attachment upload preview; responsive channel drawer on mobile |
| 2 | `/dashboard/profile` | `ProfilePageComponent` | Avatar upload with vector fallback, reactive form, child read-only mode | Image cropper modal; international phone dial code selector |
| 3 | `/dashboard/plans` | `PlansPageComponent` & `PlansComponent` | 3 pricing cards, feature checkmarks, Stripe checkout trigger | Monthly / Annual billing toggle with 20% discount badge |
| 4 | `/dashboard/my-subscription` | `MySubscriptionPageComponent` | Active plan card, student guardian linkage code with copy button | Dynamic QR code for instant phone camera scanning by parents |
| 5 | `/dashboard/checkout-success` | `CheckoutSuccessPageComponent` | 3-state verification card (spinner, success check, error) | Gamified confetti animation; animated return progress bar |
| 6 | `/dashboard/checkout-cancel` | `CheckoutCancelPageComponent` | Reassurance card explaining no charges were made | "Why did you cancel?" micro-survey with discount offer |
