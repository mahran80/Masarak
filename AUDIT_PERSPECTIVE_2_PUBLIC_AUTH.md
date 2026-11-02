# Perspective 2: Public & Auth Perspective Audit
**Masarak Platform — Code-Grounded UI & Functionality Blueprint**

---

## 2.1 Landing Page (`LandingPageComponent`)

### Route Path & Guards
- **Route Path**: `/`, public, unguarded.
- **Breadcrumb Data**: None (root public landing).

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/landing/landing.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/landing/landing.html`

### UI Sections & Visual States
- **Top Public Navbar**:
  - Sticky header (`bg-white/80 backdrop-blur-md border-b border-slate-100`).
  - Masarak logo & brand identity.
  - Anchor navigation links: "المميزات" (Features), "كيف يعمل" (How it works), "الباقات" (Pricing), "آراء المستخدمين" (Testimonials), "تواصل معنا" (Contact).
  - Auth Action buttons:
    - "تسجيل الدخول" (Sign In) -> links to `/auth/login`.
    - "إنشاء حساب" (Sign Up) -> links to `/auth/register`.
- **Hero Section**:
  - Main marketing headline: "منظومة تعليمية متكاملة مدعومة بأحدث تقنيات الذكاء الاصطناعي".
  - Subtitle: Explaining smart tutoring, automated grading, and live interactive classes.
  - CTAs: "ابدأ تجربتك المجانية" (Get Started) button + "مشاهدة العرض التوضيحي" (Watch Demo) modal trigger.
  - Hero Dashboard Mockup: Dynamic browser frame previewing the student and teacher dashboard cards.
- **Value Pillars Showcase Grid**:
  - 4 Interactive Cards:
    1. "الذكاء الاصطناعي التكيفي": Personalized learning paths and weakness detection.
    2. "الفصول الافتراضية المباشرة": Integrated WebRTC/Agora live classes with whiteboard.
    3. "بنك الأسئلة والتقييم الآلي": Instant auto-grading and essay assessment.
    4. "تقارير المتابعة لأولياء الأمور": Transparent monthly PDF/digital performance reports.
- **Persona Interactive Tabs**:
  - Role switcher buttons: "للطلاب" (Students), "للمعلمين" (Teachers), "لأولياء الأمور" (Parents).
  - Dynamic card content updating based on `activeFeatureTab()`.
- **Pricing Tiers Grid**:
  - Monthly vs Annual toggle switch (`billingCycle() === 'monthly' | 'yearly'`).
  - 3 Pricing Tier Cards (Subject-based, Comprehensive Monthly, Full Curriculum Annual) with feature checklists and checkout buttons.
- **Footer**:
  - Sitemap links, copyright, social media links, privacy policy, and terms of service.

### Interactive Elements & Actions
- **Toggle Feature Persona**: `(click)="setPersonaTab('student' | 'teacher' | 'parent')"` updates `activeFeatureTab.set(tab)`.
- **Toggle Billing Cycle**: `(click)="toggleBillingCycle()"` switches between monthly and annual rates.
- **Hero CTA**: Navigates to `/auth/register`.
- **Pricing Plan CTA**: Navigates to `/auth/register?planId=:id`.
- **Login Button**: Navigates to `/auth/login`.

### State & Signals
- `activeFeatureTab = signal<'student' | 'teacher' | 'parent'>('student')`
- `billingCycle = signal<'monthly' | 'yearly'>('monthly')`
- `isVideoModalOpen = signal<boolean>(false)`

### Known UI/Layout Pain Points (Google Stitch Redesign)
- RTL layout direction requires all chevron arrows and list bullet icons to flip orientation cleanly.
- Hero mockup needs responsive scaling down on tablet viewports so it doesn't push the CTA below the fold.

---

## 2.2 Login Page (`Login`)

### Route Path & Guards
- **Route Path**: `/auth/login`, unguarded. Auto-redirects already-authenticated users to their respective dashboard (`/dashboard/admin`, `/dashboard/teacher`, etc.).
- **Breadcrumb Data**: None.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/login/login.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/login/login.html`

### UI Sections & Visual States
- **Split Screen Layout**:
  - **Left Side (Visual Brand Banner)**: Gradient banner (`bg-gradient-to-br from-blue-600 to-indigo-900`) with platform tagline and feature list (hidden on small mobile screens).
  - **Right Side (Form Card)**: Clean white card containing the authentication form.
- **Form Card Elements**:
  - Header: Logo icon, "تسجيل الدخول", and subtitle "أدخل بيانات حسابك للمتابعة".
  - **Error Alert Banner**: Shown when `errorMessage()` is set (`bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm`).
  - **Form Controls**:
    - Email Input: `<input type="email" formControlName="email">` with email icon and validation message.
    - Password Input: `<input [type]="showPassword() ? 'text' : 'password'" formControlName="password">` with lock icon.
    - Password Visibility Toggle: Eye / Eye-slash SVG button inside password input.
    - "تذكرني" (Remember Me) checkbox.
    - "نسيت كلمة المرور؟" (Forgot Password?) link.
    - Submit Button: "تسجيل الدخول" with spinning spinner when `isLoading() === true`.
    - Sign Up Footer Link: "ليس لديك حساب؟ إنشاء حساب جديد" linking to `/auth/register`.

### Interactive Elements & Actions
- **Submit Form**: `(ngSubmit)="onSubmit()"`:
  - Validates `loginForm`.
  - Sets `isLoading.set(true)`.
  - Calls `authApi.login({ email, password })`.
  - On success: stores JWT access token & user profile in `AuthStateService`, determines redirect path based on user role (`Admin` -> `/dashboard/admin`, `Teacher` -> `/dashboard/teacher`, `Student` -> `/dashboard/student`, `Parent` -> `/dashboard/parent`).
  - On failure: captures error and sets `errorMessage.set(err.error?.message || 'بيانات الدخول غير صحيحة')`.
- **Toggle Password Visibility**: `(click)="togglePassword()"` toggles `showPassword()`.
- **Forgot Password Link**: Navigates to `/auth/forgot-password`.
- **Sign Up Link**: Navigates to `/auth/register`.

### State & Signals
- `loginForm: FormGroup` (Controls: `email: ['', [Validators.required, Validators.email]]`, `password: ['', [Validators.required]]`, `rememberMe: [false]`)
- `isLoading = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- `showPassword = signal<boolean>(false)`
- **Injected Services**: `AuthApiService`, `AuthStateService`, `Router`, `FormBuilder`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- Browser autocomplete styles on Chrome/Safari can cause white background rectangles on dark theme inputs unless overridden with `transition: background-color 5000s ease-in-out 0s`.

---

## 2.3 Registration / Dual-Mode Signup (`Signup`)

### Route Path & Guards
- **Public Parent Registration**: `/auth/register`, unguarded. Default mode: `Parent`.
- **Parent Onboarding Add Child**: `/dashboard/parent/onboarding/add-student`, guarded by `authGuard`, `roleGuard(['Parent'])`. Route data: `{ mode: 'Student', breadcrumb: 'إضافة طالب' }`.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/signup.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/signup/Signup.html` *(Note capital S in filename)*

### UI Sections & Visual States
- **Mode-Aware Header**:
  - `Parent Mode`: "إنشاء حساب ولي أمر جديد - تابع مسار أبنائك التعليمي".
  - `Student Mode`: "إضافة حساب طالب جديد - ربط الطالب بحسابك مباشرة".
- **Dynamic Input Fields Grid**:
  - Full Name: `<input formControlName="fullName" placeholder="الاسم ثلاثي">`.
  - Email: `<input type="email" formControlName="email">`.
  - Phone: `<input type="tel" formControlName="phone" dir="ltr">`.
  - Country: Dropdown or text input for country of residence.
  - **Grade Selector (Student Mode Only)**:
    - `@if (isStudentMode())`: Dropdown `<select formControlName="academicGradeId">` populated dynamically via `academicApi.getGrades()`.
  - Password & Confirm Password inputs with live matching validation.
  - Linkage Code (auto-populated in Student mode from parent context).
- **Error Banner**: Displays server validation errors (e.g. email already exists).
- **Submit Button**:
  - "إنشاء الحساب" (Parent mode) vs "إضافة الطالب وتأكيد الربط" (Student mode).

### Interactive Elements & Actions
- **Submit**: `(ngSubmit)="register()"`:
  - If `mode === 'Parent'`: Calls `authApi.registerParent(...)`, shows success toast, and redirects to `/auth/login`.
  - If `mode === 'Student'`: Calls `authApi.registerStudent(...)`, links child to the parent's account, and redirects to `/dashboard/parent/children`.
- **Cancel Button (Student mode)**: Navigates back to `/dashboard/parent/children`.
- **Sign In Link (Parent mode)**: Navigates to `/auth/login`.

### State & Signals
- `registerForm: FormGroup` (Controls: `fullName`, `email`, `phone`, `country`, `password`, `confirmPassword`, `academicGradeId`)
- `isStudentMode = signal<boolean>(false)`
- `grades = signal<GradeDto[]>([])`
- `isLoading = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- **Injected Services**: `AuthApiService`, `AcademicApiService`, `AuthStateService`, `Router`, `ActivatedRoute`.

### Known UI/Layout Pain Points (Google Stitch Redesign)
- The template file is named `Signup.html` (PascalCase).
- Grade dropdown in Student mode must handle empty states if the academic API takes time to load.

---

## 2.4 Forgot Password (`ForgotPasswordComponent`)

### Route Path & Guards
- **Route Path**: `/auth/forgot-password`, unguarded.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/forgot-password-component/forgot-password-component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/forgot-password-component/forgot-password-component.html`

### UI Sections & Visual States
- **State A: Input Form**:
  - Header: Key icon, "استعادة كلمة المرور", "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور".
  - Email input control.
  - "إرسال الرابط" button with spinner.
  - Back link: "العودة لتسجيل الدخول".
- **State B: Submission Success**:
  - Checkmark illustration.
  - Text: "تم إرسال رابط إعادة التعيين بنجاح إلى بريدك الإلكتروني. يرجى فحص صندوق الوارد وصندوق الرسائل غير المرغوب فيها (Spam)".
  - Button: "العودة لتسجيل الدخول" -> `/auth/login`.

### Interactive Elements & Actions
- **Submit**: `(ngSubmit)="onSubmit()"`:
  - Calls `authApi.forgotPassword(email)`.
  - On success: switches view to `isSubmitted.set(true)`.
  - On error: displays error banner.

### State & Signals
- `forgotForm: FormGroup` (`email: ['', [Validators.required, Validators.email]]`)
- `isSubmitted = signal<boolean>(false)`
- `isLoading = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- **Injected Services**: `AuthApiService`, `FormBuilder`.

---

## 2.5 Reset Password (`ResetPasswordComponent`)

### Route Path & Guards
- **Route Path**: `/auth/reset-password`, unguarded.
- **Query Parameters**: `?email=...&token=...`

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/reset-password-component/reset-password-component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/reset-password-component/reset-password-component.html`

### UI Sections & Visual States
- **State A: Reset Form**:
  - Header: Shield lock icon, "تعيين كلمة مرور جديدة".
  - Inputs:
    - New Password input with visibility toggle.
    - Confirm New Password input.
  - Password criteria checklist: 8+ characters, uppercase letter, number, special character.
  - "حفظ كلمة المرور الجديدة" button.
- **State B: Token Invalid / Expired Alert**:
  - Shown if `email` or `token` query params are missing or rejected by backend.
  - Red alert card with "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" and button to request a new link.
- **State C: Success State**:
  - Success badge with button to navigate directly to `/auth/login`.

### Interactive Elements & Actions
- **Submit**: `(ngSubmit)="onSubmit()"`:
  - Calls `authApi.resetPassword({ email, token, newPassword })`.
  - On success: sets `isSuccess.set(true)`.

### State & Signals
- `resetForm: FormGroup` (`newPassword`, `confirmPassword`)
- `token = signal<string>('')`
- `email = signal<string>('')`
- `isLoading = signal<boolean>(false)`
- `isSuccess = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- **Injected Services**: `AuthApiService`, `ActivatedRoute`, `Router`.

---

## 2.6 Change Password (`ChangePasswordComponent`)

### Route Path & Guards
- **Route Path**: `/dashboard/change-password`, guarded by `authGuard`. Accessible to all roles.
- **Breadcrumb Data**: `{ breadcrumb: 'تغيير كلمة المرور' }`.

### File Paths
- **TypeScript**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/change-password-component/change-password-component.ts`
- **Template**: `d:/Masarak/MasarkFront/MasarkFront-main/src/app/features/auth/change-password-component/change-password-component.html`

### UI Sections & Visual States
- Embedded settings card inside the dashboard shell.
- Form fields:
  - Current Password: `<input type="password" formControlName="currentPassword">`.
  - New Password: `<input type="password" formControlName="newPassword">`.
  - Confirm New Password: `<input type="password" formControlName="confirmNewPassword">`.
- Password strength meter bars.
- Action Buttons:
  - "حفظ التغييرات" primary button.
  - "إلغاء" secondary button navigating back to `/dashboard`.
- Success Toast / Banner confirmation.

### Interactive Elements & Actions
- **Submit**: `(ngSubmit)="onSubmit()"`:
  - Calls `authApi.changePassword({ currentPassword, newPassword })`.
  - Displays success toast, resets form.

### State & Signals
- `changePasswordForm: FormGroup` (`currentPassword`, `newPassword`, `confirmNewPassword`)
- `isLoading = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- **Injected Services**: `AuthApiService`, `ToastService`, `Router`.
