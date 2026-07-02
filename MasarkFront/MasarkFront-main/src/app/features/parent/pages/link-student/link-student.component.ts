import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-link-student',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8" dir="rtl">
      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center relative overflow-hidden">
        
        <!-- Decorative background -->
        <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10"></div>
        
        @if (status() === 'validating') {
          <div class="relative z-10 animate-fade-in">
            <div class="w-20 h-20 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner">
              <svg class="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">جاري ربط حساب الطالب...</h2>
            <p class="text-slate-500">يرجى الانتظار بينما نقوم بالتحقق من الرمز وإتمام عملية الربط بشكل آمن.</p>
          </div>
        } 
        
        @else if (status() === 'success') {
          <div class="relative z-10 animate-fade-in">
            <div class="w-20 h-20 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm border-4 border-white">
              <span class="text-4xl">✅</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">تم الربط بنجاح!</h2>
            <p class="text-slate-500 mb-8">تم ربط حساب الطالب بحسابك بنجاح. يتم الآن توجيهك إلى لوحة التحكم...</p>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <div class="bg-emerald-500 h-1.5 rounded-full animate-[progress_2s_ease-in-out_forwards]"></div>
            </div>
          </div>
        } 
        
        @else if (status() === 'error') {
          <div class="relative z-10 animate-fade-in">
            <div class="w-20 h-20 bg-rose-100 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm">
              <span class="text-4xl">❌</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">فشل عملية الربط</h2>
            <p class="text-rose-600 bg-rose-50 p-4 rounded-xl text-sm mb-8 border border-rose-100">
              {{ errorMessage() }}
            </p>
            
            <a routerLink="/dashboard/parent" class="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              العودة للوحة التحكم
            </a>
          </div>
        }
        
        @else if (status() === 'invalid_link') {
          <div class="relative z-10 animate-fade-in">
            <div class="w-20 h-20 bg-orange-100 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm">
              <span class="text-4xl">🔗</span>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">رابط غير صالح</h2>
            <p class="text-slate-500 mb-8">الرابط الذي تحاول استخدامه غير صالح أو لا يحتوي على رمز الربط المطلوب. يرجى التأكد من الرابط الصحيح.</p>
            
            <a routerLink="/dashboard/parent" class="w-full flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
              الذهاب للوحة التحكم
            </a>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    @keyframes progress {
      0% { width: 0%; }
      100% { width: 100%; }
    }
  `]
})
export class LinkStudentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentService = inject(ParentService);

  status = signal<'validating' | 'success' | 'error' | 'invalid_link'>('validating');
  errorMessage = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (!code) {
        this.status.set('invalid_link');
      } else {
        this.processLinkage(code);
      }
    });
  }

  processLinkage(code: string) {
    this.status.set('validating');
    
    this.parentService.linkStudent(code).subscribe({
      next: () => {
        this.status.set('success');
        // Refresh linked students list
        this.parentService.fetchLinkedStudents().subscribe();
        
        // Auto redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard/parent']);
        }, 2000);
      },
      error: (err) => {
        this.status.set('error');
        // Handle specific error messages if possible
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else if (err.status === 400) {
          this.errorMessage.set('رمز الربط غير صالح أو منتهي الصلاحية.');
        } else if (err.status === 409) {
          this.errorMessage.set('هذا الطالب مرتبط بحسابك بالفعل.');
        } else {
          this.errorMessage.set('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        }
      }
    });
  }
}
