import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-parent-profile',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-10 animate-fade-in relative z-10 pt-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      
      <!-- 1. Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-xl shadow-sm">
            <app-icon name="settings" size="1.2em"></app-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">حسابي والإعدادات</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">تعديل وعرض بياناتك الشخصية وحسابات الأبناء التابعين لك</p>
          </div>
        </div>
      </div>

      <!-- 2. Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <!-- Column 1: Profile Summary Card (Smaller space, left side visually) -->
        <div class="lg:col-span-1 space-y-6">
          
          <!-- Summary card -->
          <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 text-center shadow-sm relative overflow-hidden">
            <div class="relative z-10 flex flex-col items-center justify-center space-y-4">
              <!-- Avatar Container -->
              <div class="relative inline-block mb-2">
                <div class="w-28 h-28 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-4xl shadow-sm rounded-full overflow-hidden border-4 border-white dark:border-slate-800">
                  @if (user?.avatarUrl) {
                    <img [src]="user?.avatarUrl" class="w-full h-full object-cover" alt="Profile Picture" />
                  } @else {
                    {{ userInitials }}
                  }
                </div>
                
                <!-- Upload/Change Picture Button -->
                <button class="absolute bottom-1 left-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 border-2 border-white dark:border-slate-900" title="تغيير الصورة الشخصية">
                  <app-icon name="camera" size="14"></app-icon>
                </button>
              </div>
              
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white text-lg">{{ user?.fullName }}</h3>
                <span class="inline-flex mt-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-xl tracking-wider">ولي أمر</span>
              </div>
            </div>
          </div>

          <!-- Account Options Menu -->
          <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-3 shadow-sm">
            <a routerLink="/dashboard/change-password" class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div class="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><app-icon name="lock" size="18"></app-icon></div>
              <div class="flex-1 text-right min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">تغيير كلمة المرور</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تحديث كلمة مرور الحساب</p>
              </div>
            </a>

            <div class="h-px bg-slate-50 dark:bg-slate-800/60 mx-4 my-1"></div>

            <a routerLink="/dashboard/parent/subscriptions" class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div class="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors"><app-icon name="credit-card" size="18"></app-icon></div>
              <div class="flex-1 text-right min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">الاشتراكات والباقات</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">إدارة وتجديد اشتراك الأبناء</p>
              </div>
            </a>

            <div class="h-px bg-slate-50 dark:bg-slate-800/60 mx-4 my-1"></div>

            <a routerLink="/dashboard/chat" class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div class="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors"><app-icon name="chat" size="18"></app-icon></div>
              <div class="flex-1 text-right min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">التواصل والدعم</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">الرسائل ومحادثات المعلمين</p>
              </div>
            </a>
          </div>

          <!-- Danger Area -->
          <div class="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-6 rounded-[24px] text-center shadow-sm">
            <h4 class="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1">تسجيل الخروج من الحساب</h4>
            <p class="text-xs text-slate-500 mb-5">إنهاء جلسة المتابعة الحالية لتأمين حسابك</p>
            <button 
              (click)="logout()" 
              class="w-full bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
              تسجيل الخروج
            </button>
          </div>

        </div>

        <!-- Column 2: Basic Info Form Card (Takes larger space) -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-8 shadow-sm">
            <div class="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 mb-8">
              <h2 class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-3">
                <span class="text-blue-600 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl"><app-icon name="user" size="18"></app-icon></span>
                المعلومات الأساسية
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <!-- Full Name Field -->
              <div class="space-y-2 text-right">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                <input 
                  type="text" 
                  [value]="user?.fullName" 
                  readonly 
                  class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:outline-none cursor-default"
                />
              </div>

              <!-- Email Field -->
              <div class="space-y-2 text-right">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  [value]="user?.email" 
                  readonly 
                  dir="ltr"
                  class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:outline-none cursor-default text-right"
                />
              </div>

              <!-- Phone Field -->
              <div class="space-y-2 text-right">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                <div class="flex items-center gap-3" dir="ltr">
                  <div class="px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl flex items-center gap-2 shrink-0 cursor-default">
                    <span>🇪🇬</span>
                    <span class="text-slate-600 dark:text-slate-300">+20</span>
                  </div>
                  <input 
                    type="text" 
                    [value]="user?.phone || 'غير مسجل'" 
                    readonly 
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:outline-none cursor-default text-left"
                  />
                </div>
              </div>

              <!-- Country Field -->
              <div class="space-y-2 text-right">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">الدولة</label>
                <input 
                  type="text" 
                  [value]="user?.country || 'مصر'" 
                  readonly 
                  class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-medium focus:outline-none cursor-default"
                />
              </div>
            </div>

            <!-- Accent Help note & Contact Support -->
            <div class="mt-8 bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-sm">
              <div class="flex items-start gap-4 flex-1">
                <div class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm border border-blue-50 dark:border-blue-900/30">
                  <app-icon name="information-circle" size="24"></app-icon>
                </div>
                <div class="text-right">
                  <h4 class="font-black text-slate-900 dark:text-white mb-2 text-base">تحديث البيانات الأساسية</h4>
                  <p class="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    لتحديث الاسم، البريد الإلكتروني، أو بيانات أبنائك الأكاديمية، يُرجى التواصل مع فريق الدعم. نحن هنا لمساعدتك على مدار الساعة لتحديث الحساب بشكل رسمي وآمن.
                  </p>
                </div>
              </div>
              <div class="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                <a href="https://wa.me/201000000000" target="_blank" class="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <app-icon name="chat-bubble-left-ellipsis" size="18"></app-icon>
                  تواصل عبر واتساب
                </a>
                <a href="mailto:support@masarak.com" class="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black transition-all shadow-sm hover:shadow">
                  <app-icon name="envelope" size="18"></app-icon>
                  راسلنا بالبريد
                </a>
              </div>
            </div>
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
    return parts[0][0] + (parts[0][1] || '');
  }

  logout() {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
