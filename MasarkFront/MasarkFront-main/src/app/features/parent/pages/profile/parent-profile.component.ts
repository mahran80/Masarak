import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-parent-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-2xl border-2 border-white shadow-sm">
            ⚙️
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">إعدادات الحساب</h1>
            <p class="text-sm text-slate-500 mt-1">إدارة بياناتك الشخصية وحسابات أبنائك</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Personal Info Card -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 class="font-bold text-slate-800 flex items-center gap-2">
                <span>👤</span> المعلومات الشخصية
              </h2>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Avatar section -->
              <div class="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                  {{ userInitials }}
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800">{{ user?.fullName }}</h3>
                  <span class="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    ولي أمر
                  </span>
                </div>
              </div>

              <!-- Details grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">الاسم الكامل</label>
                  <p class="text-slate-800 font-medium">{{ user?.fullName }}</p>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">البريد الإلكتروني</label>
                  <p class="text-slate-800 font-medium" dir="ltr">{{ user?.email }}</p>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">رقم الهاتف</label>
                  <p class="text-slate-800 font-medium" dir="ltr">{{ user?.phone || 'غير مسجل' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">الدولة</label>
                  <p class="text-slate-800 font-medium">{{ user?.country || 'غير مسجل' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Linked Students Overview -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 class="font-bold text-slate-800 flex items-center gap-2">
                <span>👨‍👧‍👦</span> الأبناء المرتبطين
              </h2>
              <a routerLink="/dashboard/parent/children" class="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                إدارة الأبناء
              </a>
            </div>
            
            <div class="p-6">
              @if (parentService.hasStudents()) {
                <div class="flex flex-wrap gap-3">
                  @for (student of parentService.linkedStudents(); track student.studentUserId) {
                    <div class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg border border-slate-100 shadow-sm">
                        👦
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-800">{{ student.fullName }}</p>
                        <p class="text-xs text-slate-500 flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full" [ngClass]="student.hasActiveSubscription ? 'bg-emerald-500' : 'bg-orange-500'"></span>
                          {{ student.hasActiveSubscription ? 'نشط' : 'غير نشط' }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-slate-500">لا يوجد أبناء مرتبطين حالياً.</p>
              }
              
              <a routerLink="/dashboard/parent/onboarding/add-student" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <span>➕</span> إضافة طالب جديد
              </a>
            </div>
          </div>
        </div>

        <!-- Sidebar Options -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
            <a routerLink="/dashboard/change-password" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                🔐
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-800 text-sm">تغيير كلمة المرور</h3>
                <p class="text-xs text-slate-500">تحديث كلمة مرور حسابك</p>
              </div>
              <svg class="w-5 h-5 text-slate-400 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            
            <div class="h-px bg-slate-100 mx-4"></div>

            <a routerLink="/plans" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                💳
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-800 text-sm">الاشتراكات والباقات</h3>
                <p class="text-xs text-slate-500">تجديد أو ترقية اشتراك الأبناء</p>
              </div>
              <svg class="w-5 h-5 text-slate-400 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            
            <div class="h-px bg-slate-100 mx-4"></div>

            <a routerLink="/dashboard/chat" class="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
              <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                💬
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-slate-800 text-sm">التواصل والدعم</h3>
                <p class="text-xs text-slate-500">الرسائل ومحادثات المعلمين</p>
              </div>
              <svg class="w-5 h-5 text-slate-400 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <!-- Danger Zone -->
          <div class="bg-rose-50 rounded-2xl border border-rose-200 shadow-sm p-6 text-center">
            <h3 class="font-bold text-rose-800 mb-2">تسجيل الخروج</h3>
            <p class="text-sm text-rose-600 mb-4">إنهاء الجلسة الحالية وتأمين حسابك</p>
            <button (click)="logout()" class="w-full bg-white hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl border border-rose-200 transition-colors shadow-sm">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParentProfileComponent {
  private authState = inject(AuthStateService);
  private router = inject(Router);
  public parentService = inject(ParentService);

  get user() {
    return this.authState.user();
  }

  get userInitials() {
    if (!this.user?.fullName) return 'أ';
    const parts = this.user.fullName.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0][0] + parts[0][1];
  }

  logout() {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
