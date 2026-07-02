import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { ChildSelectorComponent } from '../../components/child-selector/child-selector.component';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ChildSelectorComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">مرحباً بك، {{ parentName }}</h1>
          <p class="text-slate-500 mt-1">تابع تقدم أبنائك الأكاديمي بكل سهولة</p>
        </div>
        <a routerLink="onboarding/add-student" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200 flex items-center gap-2">
          <span>➕</span> إضافة طالب جديد
        </a>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">👨‍👧‍👦</div>
          <div>
            <p class="text-sm text-slate-500 font-medium">عدد الأبناء المرتبطين</p>
            <p class="text-2xl font-bold text-slate-800">{{ parentService.linkedStudents().length }}</p>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p class="text-sm text-slate-500 font-medium">الاشتراكات الفعالة</p>
            <p class="text-2xl font-bold text-slate-800">{{ activeSubscriptionsCount }}</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl">🎫</div>
          <div>
            <p class="text-sm text-slate-500 font-medium">الاشتراكات المنتهية</p>
            <p class="text-2xl font-bold text-slate-800">{{ inactiveSubscriptionsCount }}</p>
          </div>
        </div>
      </div>

      <!-- Child Specific Section -->
      @if (parentService.hasStudents()) {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8">
          <div class="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>👤</span> تفاصيل الطالب
            </h2>
            <app-child-selector></app-child-selector>
          </div>

          @if (parentService.selectedStudent()) {
            @if (parentService.selectedStudent()?.hasActiveSubscription) {
              <!-- Student HAS subscription: show feature links -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a [routerLink]="['reports', parentService.selectedStudentId()]" class="block p-5 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50">
                  <div class="text-blue-500 mb-3 text-2xl group-hover:scale-110 transition-transform">📊</div>
                  <h3 class="font-bold text-slate-800 mb-1">التقارير الذكية</h3>
                  <p class="text-sm text-slate-500">تقارير أداء شهرية مدعومة بالذكاء الاصطناعي</p>
                </a>

                <a [routerLink]="['alerts', parentService.selectedStudentId()]" class="block p-5 rounded-xl border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all group bg-slate-50">
                  <div class="text-rose-500 mb-3 text-2xl group-hover:scale-110 transition-transform">⚠️</div>
                  <h3 class="font-bold text-slate-800 mb-1">تنبيهات الأداء</h3>
                  <p class="text-sm text-slate-500">متابعة الانخفاض في المستوى أو الغياب</p>
                </a>

                <a [routerLink]="['attendance', parentService.selectedStudentId()]" class="block p-5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group bg-slate-50">
                  <div class="text-emerald-500 mb-3 text-2xl group-hover:scale-110 transition-transform">📅</div>
                  <h3 class="font-bold text-slate-800 mb-1">سجل الحضور</h3>
                  <p class="text-sm text-slate-500">متابعة حضور غياب الطالب في الحصص</p>
                </a>
              </div>
            } @else {
              <!-- Student has NO subscription: show subscribe prompt -->
              <div class="text-center py-10">
                <div class="text-5xl mb-4">🔒</div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">الطالب {{ parentService.selectedStudent()?.fullName }} ليس لديه اشتراك فعال</h3>
                <p class="text-slate-500 mb-6 max-w-md mx-auto">لعرض التقارير الذكية وتنبيهات الأداء وسجل الحضور، يرجى تفعيل اشتراك للطالب.</p>
                
                @if (subscribingError()) {
                  <div class="mb-4 mx-auto max-w-md bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                    {{ subscribingError() }}
                  </div>
                }

                <button
                  (click)="subscribeForSelectedChild()"
                  [disabled]="isSubscribing()"
                  class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md shadow-blue-200">
                  @if (isSubscribing()) {
                    <span class="animate-spin">⏳</span> جاري التحويل...
                  } @else {
                    <span>💳</span> تفعيل اشتراك للطالب
                  }
                </button>
              </div>
            }
          }
        </div>
      } @else {
        <div class="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-6xl mb-4">👦👧</div>
          <h3 class="text-lg font-bold text-slate-800 mb-2">لا يوجد أبناء مرتبطين بحسابك</h3>
          <p class="text-slate-500 mb-6 max-w-sm mx-auto">قم بإضافة أبنائك أو ربط حساباتهم الموجودة مسبقاً لمتابعة أدائهم الأكاديمي.</p>
          <a routerLink="onboarding/add-student" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md shadow-blue-200">
            <span>➕</span> إضافة طالب جديد
          </a>
        </div>
      }
    </div>
  `
})
export class ParentDashboardComponent implements OnInit {
  public parentService = inject(ParentService);
  private authState = inject(AuthStateService);

  isSubscribing = signal(false);
  subscribingError = signal<string | null>(null);

  get parentName() {
    return this.authState.user()?.fullName?.split(' ')[0] || 'ولي الأمر';
  }

  get activeSubscriptionsCount() {
    return this.parentService.linkedStudents().filter(s => s.hasActiveSubscription).length;
  }

  get inactiveSubscriptionsCount() {
    return this.parentService.linkedStudents().filter(s => !s.hasActiveSubscription).length;
  }

  ngOnInit() {
    this.parentService.fetchLinkedStudents().subscribe();
  }

  subscribeForSelectedChild() {
    const studentId = this.parentService.selectedStudentId();
    if (!studentId) return;

    this.isSubscribing.set(true);
    this.subscribingError.set(null);

    // Use planId=1 (Monthly plan) as default. The parent checkout flow
    // creates the subscription on the student's userId.
    this.parentService.subscribeForChild(
      studentId,
      1,
      environment.stripeSuccessUrl,
      environment.stripeCancelUrl
    ).subscribe({
      next: (result) => {
        this.isSubscribing.set(false);
        window.location.href = result.checkoutUrl;
      },
      error: (err) => {
        this.isSubscribing.set(false);
        this.subscribingError.set(err?.error?.message ?? 'حدث خطأ أثناء إنشاء الاشتراك. حاول مرة أخرى.');
      }
    });
  }
}
