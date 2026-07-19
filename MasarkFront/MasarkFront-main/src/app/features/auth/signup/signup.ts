import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthApiService } from '../../../core/services/auth-api-service';
import { AuthStateService } from '../../../core/services/auth-state-service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { ParentService } from '../../parent/services/parent.service';

const AR = {
  egyptBadge: 'أبناء مصر بالخارج',
  prop1: 'تعلم تفاعلي متكامل للطلاب بالخارج',
  prop2: 'تقارير دورية ومتابعة دقيقة لولي الأمر',
  loginLink: 'تسجيل الدخول',
  titleParent: 'حساب ولي أمر جديد',
  titleStudent: 'تسجيل بيانات الطالب',
  subParent: 'يسعدنا انضمامك إلينا لمتابعة ورعاية مسيرة أبنائك التعليمية خطوة بخطوة.',
  subStudent: 'أدخل بيانات الطالب للبدء في تخصيص مساره التعليمي.',
  heroHeadlineParent: 'تابع رحلة طفلك التعليمية بثقة',
  heroSubheadlineParent: 'منصة تعليمية ذكية لدعم الطلاب المصريين بالخارج.',
  heroHeadlineStudent: 'ابدأ رحلتك التعليمية مع المنهج المصري',
  heroSubheadlineStudent: 'من أي مكان في العالم',
  fullNameLabel: 'الاسم بالكامل',
  fullNamePlaceholder: 'أدخل الاسم ثلاثياً كما بالبطاقة',
  emailLabel: 'البريد الإلكتروني',
  emailPlaceholder: 'example@mail.com',
  phoneLabel: 'رقم الهاتف المحمول',
  phonePlaceholder: '010xxxxxxxx',
  passwordLabel: 'كلمة المرور',
  passwordPlaceholder: 'أدخل كلمة المرور',
  confirmPasswordLabel: 'تأكيد كلمة المرور',
  confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
  gradeLabel: 'المرحلة الدراسية',
  gradePlaceholder: 'اختر المرحلة الدراسية',
  submitButton: 'أنشئ حسابك الآن',
  haveAccount: 'لديك حساب بالفعل؟',
  fullNameRequired: 'يرجى إدخال الاسم بالكامل.',
  emailInvalid: 'البريد الإلكتروني غير صحيح.',
  phoneInvalid: 'رقم الهاتف غير صالح. يرجى التحقق من المدخلات.',
  passwordMismatch: 'كلمات المرور غير متطابقة.',
  gradeRequired: 'المرحلة الدراسية مطلوبة.',
  pwStrength: 'قوة كلمة المرور: ',
  pwWeak: 'ضعيفة',
  pwMedium: 'متوسطة',
  pwStrong: 'قوية ومحمية',
  reqLength: '8 أحرف كحد أدنى',
  reqUpper: 'حرف كبير (A-Z)',
  reqLower: 'حرف صغير (a-z)',
  reqNumber: 'رقم واحد على الأقل',
  reqSpecial: 'رمز خاص (@#$%)',
  successTitle: 'تم إنشاء الحساب بنجاح!',
  successSub: 'يسعدنا انضمامك إلينا، جاري تهيئة لوحة التحكم الخاصة بك.',
  loadingText: 'جارٍ تجهيز رحلتك التعليمية...'
};

const EN = {
  egyptBadge: 'Egyptian Students Abroad',
  prop1: 'Integrated interactive learning for students abroad',
  prop2: 'Periodic reports and close tracking for parents',
  loginLink: 'Log In',
  titleParent: 'Create Parent Account',
  titleStudent: 'Register Student Data',
  subParent: 'Create your account to track your kids\' learning journey easily.',
  subStudent: 'Add new student details to link to your account.',
  heroHeadlineParent: 'Track your child\'s learning journey with confidence',
  heroSubheadlineParent: 'A smart educational platform supporting Egyptian students abroad.',
  heroHeadlineStudent: 'Start your learning journey with the Egyptian curriculum',
  heroSubheadlineStudent: 'From anywhere in the world',
  fullNameLabel: 'Full Name',
  fullNamePlaceholder: 'Enter full name (three names)',
  emailLabel: 'Email Address',
  emailPlaceholder: 'example@mail.com',
  phoneLabel: 'Mobile Number',
  phonePlaceholder: '010xxxxxxxx',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter password',
  confirmPasswordLabel: 'Confirm Password',
  confirmPasswordPlaceholder: 'Confirm password',
  gradeLabel: 'Grade Level',
  gradePlaceholder: 'Select grade level',
  submitButton: 'Create Account Now',
  haveAccount: 'Already have an account?',
  fullNameRequired: 'Please enter your full name.',
  emailInvalid: 'Invalid email address.',
  phoneInvalid: 'Invalid phone number. Please check inputs.',
  passwordMismatch: 'Passwords do not match.',
  gradeRequired: 'Grade level is required.',
  pwStrength: 'Password strength: ',
  pwWeak: 'Weak',
  pwMedium: 'Medium',
  pwStrong: 'Strong & Secure',
  reqLength: 'At least 8 characters',
  reqUpper: 'Uppercase letter (A-Z)',
  reqLower: 'Lowercase letter (a-z)',
  reqNumber: 'At least one number',
  reqSpecial: 'Special character (@#$%)',
  successTitle: 'Account created successfully!',
  successSub: 'Welcome to Masarak! We are preparing your dashboard.',
  loadingText: 'Preparing your learning journey...'
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
})
export class Signup implements OnInit {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  public authState = inject(AuthStateService);
  private router = inject(Router);
  private parentService = inject(ParentService);
  private route = inject(ActivatedRoute);

  mode: 'Parent' | 'Student' = 'Parent';
  grades: any[] = [];
  showPassword = false;
  showConfirmPassword = false;
  isSuccess = false;

  lang = signal<'ar' | 'en'>('ar');
  theme = signal<'light' | 'dark'>('light');
  showLangDropdown = signal<boolean>(false);
  currentSlide = signal<number>(0);
  t = computed(() => this.lang() === 'ar' ? AR : EN);

  countryCodes = [
    { code: '+20', flag: '🇪🇬', name: '🇪🇬 مصر (+20)', pattern: '^01[0125]\\d{8}$' },
    { code: '+966', flag: '🇸🇦', name: '🇸🇦 السعودية (+966)', pattern: '^5\\d{8}$' },
    { code: '+971', flag: '🇦🇪', name: '🇦🇪 الإمارات (+971)', pattern: '^5\\d{8}$' },
    { code: '+965', flag: '🇰🇼', name: '🇰🇼 الكويت (+965)', pattern: '^[4-9]\\d{7}$' },
    { code: '+974', flag: '🇶🇦', name: '🇶🇦 قطر (+974)', pattern: '^[3567]\\d{7}$' },
    { code: '+973', flag: '🇧🇭', name: '🇧🇭 البحرين (+973)', pattern: '^[36]\\d{7}$' },
    { code: '+968', flag: '🇴🇲', name: '🇴🇲 عمان (+968)', pattern: '^[79]\\d{7}$' },
    { code: '+962', flag: '🇯🇴', name: '🇯🇴 الأردن (+962)', pattern: '^7[789]\\d{7}$' },
    { code: '+964', flag: '🇮🇶', name: '🇮🇶 العراق (+964)', pattern: '^7[5789]\\d{9}$' },
    { code: '+961', flag: '🇱🇧', name: '🇱🇧 لبنان (+961)', pattern: '^[378]\\d{6}$' },
    { code: '+212', flag: '🇲🇦', name: '🇲🇦 المغرب (+212)', pattern: '^[567]\\d{8}$' },
    { code: '+213', flag: '🇩🇿', name: '🇩🇿 الجزائر (+213)', pattern: '^[567]\\d{8}$' },
    { code: '+216', flag: '🇹🇳', name: '🇹🇳 تونس (+216)', pattern: '^[2459]\\d{7}$' },
    { code: '+218', flag: '🇱🇾', name: '🇱🇾 ليبيا (+218)', pattern: '^9[1-5]\\d{7}$' },
    { code: '+249', flag: '🇸🇩', name: '🇸🇩 السودان (+249)', pattern: '^9[01269]\\d{7}$' }
  ];

  get passwordValue(): string {
    return this.registerForm.controls.password.value || '';
  }
  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.passwordValue);
  }
  get hasLowercase(): boolean {
    return /[a-z]/.test(this.passwordValue);
  }
  get hasNumber(): boolean {
    return /[0-9]/.test(this.passwordValue);
  }
  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue);
  }
  get hasMinLength(): boolean {
    return this.passwordValue.length >= 8;
  }
  get strengthScore(): number {
    let score = 0;
    if (this.hasUppercase) score++;
    if (this.hasLowercase) score++;
    if (this.hasNumber) score++;
    if (this.hasSpecialChar) score++;
    if (this.hasMinLength) score++;
    return score;
  }

  // بناء حقول الفورم مع الـ Validation
  registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    countryCode: ['+20'],
    phone: [''],
    country: ['Egypt'],
    role: ['Parent' as 'Student' | 'Parent', [Validators.required]],
    gradeId: ['', []],
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

    // Determine mode from route data
    const routeMode = this.route.snapshot.data['mode'];
    if (routeMode === 'Student') {
      this.mode = 'Student';
      this.registerForm.controls.role.setValue('Student');
      this.registerForm.controls.gradeId.setValidators([Validators.required]);
      this.registerForm.controls.gradeId.updateValueAndValidity();

      this.authApi.getPublicGrades().subscribe({
        next: (res) => this.grades = res,
        error: (err) => console.error('Failed to load grades', err)
      });
    } else {
      this.mode = 'Parent';
      this.registerForm.controls.role.setValue('Parent');
      this.updatePhoneValidation();
    }

    // Listen to country code changes to update validation
    this.registerForm.controls.countryCode.valueChanges.subscribe(() => {
      if (this.mode === 'Parent') {
        this.updatePhoneValidation();
      }
    });
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

  updatePhoneValidation() {
    const selectedCode = this.registerForm.controls.countryCode.value;
    const country = this.countryCodes.find(c => c.code === selectedCode);
    if (country) {
      this.registerForm.controls.phone.setValidators([Validators.required, Validators.pattern(country.pattern)]);
    } else {
      this.registerForm.controls.phone.setValidators([Validators.required]);
    }
    this.registerForm.controls.phone.updateValueAndValidity();
  }

  onSubmit() {
    // 1. التحقق من صحة الفورم
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValues = this.registerForm.getRawValue();

    // 2. التحقق من تطابق كلمتي المرور
    if (formValues.password !== formValues.confirmPassword) {
      this.authState.setError(this.lang() === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    // 3. بدء عملية التسجيل
    this.authState.setLoading(true);
    this.authState.setError(null);

    let finalPhone: string | undefined = undefined;
    if (this.mode === 'Parent' && formValues.phone) {
      finalPhone = `${formValues.countryCode}${formValues.phone}`;
    }

    const requestData: RegisterRequest = {
      fullName: formValues.fullName,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword,
      phone: finalPhone,
      country: formValues.country || undefined,
      role: formValues.role,
      gradeId: formValues.gradeId ? Number(formValues.gradeId) : undefined,
    };

    this.authApi.register(requestData).subscribe({
      next: (res) => {
        this.authState.setLoading(false);
        if (res.success && res.accessToken && res.refreshToken && res.user) {
          this.isSuccess = true;
          // حفظ البيانات في الـ State والـ LocalStorage
          if (this.mode === 'Parent') {
            this.authState.setAuth({
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
              user: res.user,
            });
            setTimeout(() => {
              this.router.navigate(['/add-student']);
            }, 1800);
          } else {
            // Student Mode: Do not overwrite Parent auth.
            // Immediately call ParentService.linkStudent(res.user.studentLinkageCode)
            const linkageCode = (res.user as any).studentLinkageCode;
            if (linkageCode) {
              this.parentService.linkStudent(linkageCode).subscribe({
                next: () => {
                  this.parentService.fetchLinkedStudents().subscribe();
                  setTimeout(() => {
                    this.router.navigate(['/dashboard/parent']);
                  }, 1800);
                },
                error: (err) => {
                  this.authState.setError(this.lang() === 'ar' ? 'تم إنشاء حساب الطالب، ولكن فشل الربط التلقائي. يرجى الربط يدوياً عبر الكود.' : 'Student account created, but automatic linking failed. Please link manually using the code.');
                  setTimeout(() => {
                    this.router.navigate(['/dashboard/parent']);
                  }, 1800);
                }
              });
            } else {
              setTimeout(() => {
                this.router.navigate(['/dashboard/parent']);
              }, 1800);
            }
          }
        } else {
          this.authState.setError(res.error || (this.lang() === 'ar' ? 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً' : 'Account creation failed, please try again later'));
        }
      },
      error: (err) => {
        this.authState.setLoading(false);
        console.error('Signup error details:', err);
        if (err.status === 400 && err.error && err.error.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          const firstErrorMessage = err.error.errors[firstErrorKey][0];
          this.authState.setError((this.lang() === 'ar' ? 'خطأ في البيانات: ' : 'Data error: ') + firstErrorMessage);
        } else if (err.error && err.error.message) {
          this.authState.setError(err.error.message);
        } else if (err.error && typeof err.error === 'string') {
          this.authState.setError(err.error);
        } else if (err.message) {
          this.authState.setError(err.message);
        } else {
          this.authState.setError(this.lang() === 'ar' ? 'حدث خطأ غير متوقع أثناء الاتصال بالسيرفر' : 'An unexpected server error occurred');
        }
      },
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
