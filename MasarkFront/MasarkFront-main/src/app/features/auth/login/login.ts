import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../core/services/auth-api-service';
import { AuthStateService } from '../../../core/services/auth-state-service';

const AR = {
  egyptBadge: 'أبناء مصر بالخارج',
  prop1: 'تعلم تفاعلي متكامل للطلاب بالخارج',
  prop2: 'تقارير دورية ومتابعة دقيقة لولي الأمر',
  createNewAccount: 'إنشاء حساب جديد',
  title: 'تسجيل الدخول',
  subtitle: 'سعداء بعودتك! يرجى إدخال بياناتك للمتابعة.',
  heroHeadline: 'ابدأ رحلتك التعليمية مع المنهج المصري',
  heroDescription: 'من أي مكان في العالم',
  emailLabel: 'البريد الإلكتروني',
  emailPlaceholder: 'example@mail.com',
  passwordLabel: 'كلمة المرور',
  passwordPlaceholder: 'أدخل كلمة المرور',
  forgotPassword: 'نسيت كلمة السر؟',
  submitButton: 'تسجيل الدخول',
  noAccount: 'ليس لديك حساب؟',
  registerLink: 'سجل الآن',
  emailRequired: 'البريد الإلكتروني مطلوب.',
  emailInvalid: 'صيغة البريد الإلكتروني غير صحيحة.',
  passwordRequired: 'كلمة المرور مطلوبة.',
  loadingText: 'جارٍ تجهيز رحلتك التعليمية...',
  successTitle: 'تم تسجيل الدخول بنجاح!',
  successSub: 'أهلاً بك مجدداً في منصة مسارك التعليمية.'
};

const EN = {
  egyptBadge: 'Egyptian Students Abroad',
  prop1: 'Integrated interactive learning for students abroad',
  prop2: 'Periodic reports and close tracking for parents',
  createNewAccount: 'Create an account',
  title: 'Log In',
  subtitle: 'Welcome back! Please enter your details to continue.',
  heroHeadline: 'Start your learning journey with the Egyptian curriculum',
  heroDescription: 'From anywhere in the world',
  emailLabel: 'Email Address',
  emailPlaceholder: 'example@mail.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter your password',
  forgotPassword: 'Forgot password?',
  submitButton: 'Log In',
  noAccount: "Don't have an account?",
  registerLink: 'Register now',
  emailRequired: 'Email address is required.',
  emailInvalid: 'Invalid email address format.',
  passwordRequired: 'Password is required.',
  loadingText: 'Preparing your learning journey...',
  successTitle: 'Logged in successfully!',
  successSub: 'Welcome back to Masarak learning platform.'
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  public authState = inject(AuthStateService);
  private router = inject(Router);

  showPassword = false;
  isSuccess = false;

  lang = signal<'ar' | 'en'>('ar');
  theme = signal<'light' | 'dark'>('light');
  showLangDropdown = signal<boolean>(false);
  currentSlide = signal<number>(0);
  t = computed(() => this.lang() === 'ar' ? AR : EN);

  // بناء الفورم مع الـ Validation
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.currentSlide.update(s => (s + 1) % 4);
      }, 4500);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }

      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        this.theme.set(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    }
  }

  toggleLanguage() {
    const next = this.lang() === 'ar' ? 'en' : 'ar';
    this.lang.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', next);
      document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    }
  }

  setLang(lang: 'ar' | 'en') {
    this.lang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    }
  }

  toggleTheme() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      document.body.setAttribute('data-theme', next);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authState.setLoading(true);
    this.authState.setError(null);

    const credentials = this.loginForm.getRawValue();

    this.authApi.login(credentials).subscribe({
      next: (res) => {
        this.authState.setLoading(false);

        if (res.success && res.accessToken && res.refreshToken && res.user) {
          this.isSuccess = true;
          // حفظ البيانات في الـ State والـ LocalStorage
          this.authState.setAuth({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            user: res.user,
          });

          const userRole = res.user.role;
          // التوجيه التلقائي حسب دور المستخدم مع تأخير عرض شاشة النجاح
          setTimeout(() => {
            this.redirectBasedOnRole(userRole);
          }, 1200);
        } else {
          this.authState.setError(res.error || (this.lang() === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
        }
      },
      error: (err) => {
        this.authState.setLoading(false);
        if (err.status === 400 || err.status === 401) {
          const apiMsg = err.error?.message || err.error;
          this.authState.setError(
            typeof apiMsg === 'string' 
              ? apiMsg 
              : (this.lang() === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
          );
        } else if (err.error && err.error.message) {
          this.authState.setError(err.error.message);
        } else {
          this.authState.setError(this.lang() === 'ar' ? 'حدث خطأ في الاتصال بالسيرفر، حاول مجدداً' : 'Server connection error, please try again');
        }
      },
    });
  }

  private redirectBasedOnRole(role: string) {
    if (role === 'Admin') this.router.navigate(['/dashboard/admin']);
    else if (role === 'Teacher') this.router.navigate(['/dashboard/teacher']);
    else if (role === 'Student') this.router.navigate(['/dashboard/student']);
    else if (role === 'Parent') this.router.navigate(['/dashboard/parent']);
    else this.router.navigate(['/chat']);
  }
}
