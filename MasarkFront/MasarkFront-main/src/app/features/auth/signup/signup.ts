import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api-service';
import { AuthStateService } from '../../../core/services/auth-state-service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { ParentService } from '../../parent/services/parent.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './Signup.html',
})
export class Signup {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApiService);
  public authState = inject(AuthStateService);
  private router = inject(Router);
  private parentService = inject(ParentService);
  private route = inject(ActivatedRoute);
  
  mode: 'Parent' | 'Student' = 'Parent';

  countryCodes = [
    { code: '+20', name: 'مصر (+20)', pattern: '^01[0125]\\d{8}$' },
    { code: '+966', name: 'السعودية (+966)', pattern: '^5\\d{8}$' },
    { code: '+971', name: 'الإمارات (+971)', pattern: '^5\\d{8}$' },
    { code: '+965', name: 'الكويت (+965)', pattern: '^[4-9]\\d{7}$' },
    { code: '+974', name: 'قطر (+974)', pattern: '^[3567]\\d{7}$' },
    { code: '+973', name: 'البحرين (+973)', pattern: '^[36]\\d{7}$' },
    { code: '+968', name: 'عمان (+968)', pattern: '^[79]\\d{7}$' }
  ];

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
  });

  ngOnInit() {
    // Determine mode from route data
    const routeMode = this.route.snapshot.data['mode'];
    if (routeMode === 'Student') {
      this.mode = 'Student';
      this.registerForm.controls.role.setValue('Student');
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
      this.authState.setError('كلمات المرور غير متطابقة');
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
    };

    this.authApi.register(requestData).subscribe({
      next: (res) => {
        this.authState.setLoading(false);
        if (res.success && res.accessToken && res.refreshToken && res.user) {
          // حفظ البيانات في الـ State والـ LocalStorage
          if (this.mode === 'Parent') {
            this.authState.setAuth({
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
              user: res.user,
            });
            this.router.navigate(['/dashboard/parent/onboarding/add-student']);
          } else {
            // Student Mode: Do not overwrite Parent auth.
            // Immediately call ParentService.linkStudent(res.user.studentLinkageCode)
            const linkageCode = (res.user as any).studentLinkageCode;
            if (linkageCode) {
              this.parentService.linkStudent(linkageCode).subscribe({
                next: () => {
                  this.parentService.fetchLinkedStudents().subscribe();
                  this.router.navigate(['/dashboard/parent']);
                },
                error: (err) => {
                  this.authState.setError('تم إنشاء حساب الطالب، ولكن فشل الربط التلقائي. يرجى الربط يدوياً عبر الكود.');
                  this.router.navigate(['/dashboard/parent']);
                }
              });
            } else {
              this.router.navigate(['/dashboard/parent']);
            }
          }
        } else {
          this.authState.setError(res.error || 'فشل إنشاء الحساب، يرجى المحاولة لاحقاً');
        }
      },
      error: (err) => {
        this.authState.setLoading(false);
        if (err.status === 400 && err.error && err.error.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          const firstErrorMessage = err.error.errors[firstErrorKey][0];
          this.authState.setError(`خطأ في البيانات: ${firstErrorMessage}`);
        } else if (err.error && err.error.message) {
          this.authState.setError(err.error.message);
        } else {
          this.authState.setError('حدث خطأ غير متوقع أثناء الاتصال بالسيرفر');
        }
      },
    });
  }
}
