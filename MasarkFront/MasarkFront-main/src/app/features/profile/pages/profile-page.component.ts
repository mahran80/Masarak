import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProfileService, UserProfileDto, UpdateProfileDto } from '../services/profile.service';
import { AuthStateService } from '../../../core/services/auth-state-service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, RouterLink],
  templateUrl: './profile-page.component.html'
})
export class ProfilePageComponent implements OnInit {
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
  readonly studentId = signal<number | null>(null);
  
  readonly isReadOnly = computed(() => {
    // If viewing someone else's profile (studentId is set)
    if (this.studentId() !== null) {
      return this.userRole() !== 'Parent'; // Only parents can edit their children
    }
    // If viewing own profile, everyone can edit
    return false;
  });

  profileForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    country: ['', [Validators.maxLength(100)]],
    headline: ['', [Validators.maxLength(150)]],
    bio: ['']
  });

  // Default vector avatar to prevent 404 Not Found error
  readonly defaultAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.studentId.set(parseInt(id, 10));
      }
      this.loadProfile();
    });
  }

  loadProfile(): void {
    this.isLoading.set(true);
    const studentId = this.studentId();
    const request$ = studentId 
      ? this.profileService.getStudentProfile(studentId)
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
    const studentId = this.studentId();
    
    const request$ = studentId
      ? this.profileService.updateStudentProfile(studentId, dto)
      : this.profileService.updateProfile(dto);

    request$.subscribe({
      next: (res) => {
        this.toast.success(res.message || 'تم تحديث الحساب بنجاح');
        if (!studentId) {
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

      const studentId = this.studentId();
      const request$ = studentId
        ? this.profileService.uploadStudentAvatar(studentId, file)
        : this.profileService.uploadAvatar(file);

      request$.subscribe({
        next: (res) => {
          this.toast.success('تم تحديث الصورة الشخصية');
          const newUrl = res.message;
          this.profile.update(p => p ? { ...p, avatarUrl: newUrl } : null);
          if (!studentId) {
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

    const studentId = this.studentId();
    const request$ = studentId
      ? this.profileService.removeStudentAvatar(studentId)
      : this.profileService.removeAvatar();

    request$.subscribe({
      next: () => {
        this.toast.success('تم إزالة الصورة الشخصية');
        this.profile.update(p => p ? { ...p, avatarUrl: undefined } : null);
        if (!studentId) {
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
    event.target.src = this.defaultAvatar;
  }
}
