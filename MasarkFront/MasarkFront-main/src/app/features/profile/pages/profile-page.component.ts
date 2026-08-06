import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProfileService, UserProfileDto, UpdateProfileDto } from '../services/profile.service';
import { AuthStateService } from '../../../core/services/auth-state-service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { getRoleAvatarUrl } from '../../../shared/utils/role-avatar';

const AR = {
  PAGE_BADGE: "حسابي",
  PAGE_TITLE: "الملف الشخصي",
  PAGE_DESC: "حدّث معلوماتك الشخصية وبيانات التواصل وإعدادات حسابك.",
  CARD_TITLE: "البيانات الشخصية",
  CARD_DESC: "تأكد من صحة بياناتك لتسهيل التواصل معك.",
  FULL_NAME: "الاسم الكامل",
  EMAIL: "البريد الإلكتروني",
  PHONE: "رقم الهاتف",
  COUNTRY: "الدولة",
  HEADLINE_TEACHER: "المسمى الوظيفي (Specialization)",
  HEADLINE_PARENT: "العنوان الوصفي (Headline)",
  BIO: "نبذة شخصية (Bio)",
  SAVE_CHANGES: "حفظ التغييرات",
  SAVING: "جاري الحفظ...",
  INFO_TITLE: "معلومات الحساب",
  INFO_DESC: "لتغيير البريد الإلكتروني أو رقم الهاتف المسجل، يرجى التواصل مع فريق الدعم الفني لحماية أمان حسابك.",
  CONTACT_SUPPORT: "تواصل عبر واتساب",
  REMOVE_AVATAR: "إزالة الصورة",
  CHANGE_AVATAR: "تغيير الصورة",
  ROLE_ADMIN: "مدير النظام",
  ROLE_TEACHER: "معلم",
  ROLE_PARENT: "ولي أمر",
  ROLE_STUDENT: "طالب",
  ACADEMIC_STATUS: "الحالة الأكاديمية",
  ACTIVE: "نشط",
  NO_BIO: "لا يوجد معلومات إضافية.",
  REQUIRED_FIELD: "هذا الحقل مطلوب",
  INVALID_PHONE: "رقم الهاتف غير صالح"
};

const EN = {
  PAGE_BADGE: "My Account",
  PAGE_TITLE: "Profile Settings",
  PAGE_DESC: "Update your personal details, contact info, and account settings.",
  CARD_TITLE: "Personal Information",
  CARD_DESC: "Make sure your information is accurate to facilitate communication.",
  FULL_NAME: "Full Name",
  EMAIL: "Email Address",
  PHONE: "Phone Number",
  COUNTRY: "Country",
  HEADLINE_TEACHER: "Specialization (Headline)",
  HEADLINE_PARENT: "Headline",
  BIO: "Biography (Bio)",
  SAVE_CHANGES: "Save Changes",
  SAVING: "Saving...",
  INFO_TITLE: "Account Information",
  INFO_DESC: "To change your registered email or phone number, please contact technical support to protect your account security.",
  CONTACT_SUPPORT: "Contact support via WhatsApp",
  REMOVE_AVATAR: "Remove Photo",
  CHANGE_AVATAR: "Change Photo",
  ROLE_ADMIN: "System Administrator",
  ROLE_TEACHER: "Teacher",
  ROLE_PARENT: "Parent",
  ROLE_STUDENT: "Student",
  ACADEMIC_STATUS: "Academic Status",
  ACTIVE: "Active",
  NO_BIO: "No additional information provided.",
  REQUIRED_FIELD: "This field is required",
  INVALID_PHONE: "Invalid phone number"
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  public readonly authState = inject(AuthStateService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly profile = signal<UserProfileDto | null>(null);

  readonly userRole = this.authState.userRole;
  roleLabel(role: string | null | undefined): string {
    const normalized = (role ?? '').replace(/[\s_-]/g, '').toLowerCase();
    if (['admin', 'administrator', 'systemadministrator', 'superadmin'].includes(normalized)) return this.t().ROLE_ADMIN;
    if (normalized === 'teacher') return this.t().ROLE_TEACHER;
    if (normalized === 'parent') return this.t().ROLE_PARENT;
    if (normalized === 'student') return this.t().ROLE_STUDENT;
    return role || this.t().ROLE_STUDENT;
  }
  readonly isReadOnly = computed(() => this.userRole() !== 'Teacher' && this.userRole() !== 'Parent');
  
  studentId: number | null = null;
  lang = signal<'ar' | 'en'>('ar');
  t = computed(() => this.lang() === 'ar' ? AR : EN);
  private observer?: MutationObserver;

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    country: ['', [Validators.maxLength(100)]],
    headline: ['', [Validators.maxLength(150)]],
    bio: ['']
  });

  // Default vector avatar to prevent 404 Not Found error
  readonly defaultAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  readonly displayAvatarUrl = computed(() => {
    const currentProfile = this.profile();
    return currentProfile?.avatarUrl
      || getRoleAvatarUrl(currentProfile?.role ?? this.userRole(), currentProfile?.fullName);
  });

  getInitials = computed(() => {
    const name = this.profile()?.fullName || '';
    if (!name) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.studentId = parseInt(id, 10);
      }
      this.loadProfile();
    });

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }

      this.observer = new MutationObserver(() => {
        const currentLang = document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
        if (this.lang() !== currentLang) {
          this.lang.set(currentLang);
        }
      });
      this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  loadProfile(): void {
    this.isLoading.set(true);
    const request$ = this.studentId 
      ? this.profileService.getStudentProfile(this.studentId)
      : this.profileService.getProfile();

    request$.subscribe({
      next: (data) => {
        this.profile.set(data);
        if (!this.isReadOnly()) {
          this.profileForm.patchValue({
            fullName: data.fullName,
            phone: data.phone,
            country: data.country,
            headline: data.headline,
            bio: data.bio
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error('حدث خطأ أثناء تحميل بيانات الحساب');
        this.isLoading.set(false);
      }
    });
  }

  onSave(): void {
    if (this.profileForm.invalid || this.isReadOnly()) return;
    this.isSaving.set(true);

    const dto: UpdateProfileDto = this.profileForm.value;
    
    const request$ = this.studentId
      ? this.profileService.updateStudentProfile(this.studentId, dto)
      : this.profileService.updateProfile(dto);

    request$.subscribe({
      next: (res) => {
        this.toast.success(res.message || 'تم تحديث الحساب بنجاح');
        if (!this.studentId) {
          this.authState.updateProfileDetails(dto.fullName);
        }
        this.profile.update(p => p ? { ...p, fullName: dto.fullName, phone: dto.phone, country: dto.country, headline: dto.headline, bio: dto.bio } : null);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toast.error('حدث خطأ أثناء تحديث الحساب');
        this.isSaving.set(false);
      }
    });
  }

  onFileSelected(event: any): void {
    if (this.isReadOnly()) return;
    const file: File = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
        return;
      }
      this.isUploading.set(true);

      const request$ = this.studentId
        ? this.profileService.uploadStudentAvatar(this.studentId, file)
        : this.profileService.uploadAvatar(file);

      request$.subscribe({
        next: (res) => {
          this.toast.success('تم تحديث الصورة الشخصية');
          const newUrl = res.message;
          this.profile.update(p => p ? { ...p, avatarUrl: newUrl } : null);
          if (!this.studentId) {
             this.authState.updateAvatar(newUrl);
          }
          this.isUploading.set(false);
        },
        error: () => {
          this.toast.error('فشل في رفع الصورة');
          this.isUploading.set(false);
        }
      });
    }
  }

  removeAvatar(): void {
    if (this.isReadOnly()) return;
    this.isUploading.set(true);

    const request$ = this.studentId
      ? this.profileService.removeStudentAvatar(this.studentId)
      : this.profileService.removeAvatar();

    request$.subscribe({
      next: () => {
        this.toast.success('تم إزالة الصورة الشخصية');
        this.profile.update(p => p ? { ...p, avatarUrl: undefined } : null);
        if (!this.studentId) {
           this.authState.updateAvatar(null);
        }
        this.isUploading.set(false);
      },
      error: () => {
        this.toast.error('فشل في إزالة الصورة');
        this.isUploading.set(false);
      }
    });
  }

  onAvatarError(event: any): void {
    event.target.onerror = null;
    const currentProfile = this.profile();
    event.target.src = getRoleAvatarUrl(
      currentProfile?.role ?? this.userRole(),
      currentProfile?.fullName,
    );
  }
}
