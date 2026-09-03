import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { ProfileService, LinkedChildDto } from '../../../profile/services/profile.service';

@Component({
  selector: 'app-children-list',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
            <app-icon name="family" size="1.2em"></app-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">قائمة الأبناء</h1>
            <p class="text-sm text-slate-500 mt-1">إدارة حسابات أبنائك المرتبطين بحسابك</p>
          </div>
        </div>
        <a routerLink="/dashboard/parent/onboarding/add-student" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-md shadow-blue-200 flex items-center gap-2">
          <span><app-icon name="plus" size="1.2em"></app-icon></span> إضافة طالب جديد
        </a>
      </div>

      @if (combinedStudents().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (student of combinedStudents(); track student.studentUserId) {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div class="p-6 flex-1">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm overflow-hidden text-slate-400 font-bold uppercase">
                    @if (student.avatarUrl) {
                      <img [src]="student.avatarUrl" [alt]="student.fullName" class="w-full h-full object-cover">
                    } @else {
                      {{ student.fullName.charAt(0) }}
                    }
                  </div>
                  @if (student.hasActiveSubscription) {
                    <span class="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                      <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      اشتراك فعال
                    </span>
                  } @else {
                    <span class="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-orange-200">
                      <span class="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                      غير فعال
                    </span>
                  }
                </div>
                
                <h3 class="text-lg font-bold text-slate-800 mb-1">{{ student.fullName }}</h3>
                <p class="text-sm text-slate-500 truncate" dir="ltr">{{ student.email }}</p>
              </div>
              
              <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 grid grid-cols-4 gap-2">
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/reports', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50">
                   <span class="text-xl"><app-icon name="chart" size="1.2em"></app-icon></span>
                   <span class="text-xs font-medium">التقارير</span>
                </a>
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/schedule', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50">
                   <span class="text-xl"><app-icon name="calendar" size="1.2em"></app-icon></span>
                   <span class="text-xs font-medium">الجدول</span>
                </a>
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/alerts', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50">
                   <span class="text-xl"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
                   <span class="text-xs font-medium">التنبيهات</span>
                </a>
                <a [routerLink]="student.hasActiveSubscription ? ['/dashboard/parent/attendance', student.studentUserId] : null" 
                   [class.opacity-50]="!student.hasActiveSubscription"
                   [class.cursor-not-allowed]="!student.hasActiveSubscription"
                   class="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors p-2 rounded-lg hover:bg-emerald-50">
                   <span class="text-xl"><app-icon name="clock" size="1.2em"></app-icon></span>
                   <span class="text-xs font-medium">الحضور</span>
                </a>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
          <div class="text-6xl mb-4 text-slate-300"><app-icon name="family" size="1.2em"></app-icon></div>
          <h3 class="text-xl font-bold text-slate-700 mb-2">لا يوجد طلاب مرتبطين بحسابك بعد</h3>
          <p class="text-slate-500 mb-6 max-w-md mx-auto">ابدأ بإضافة أول طالب أو استخدام رابط الدعوة لربط حساب موجود بحسابك كولي أمر.</p>
          <a routerLink="/dashboard/parent/onboarding/add-student" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md shadow-blue-200">
            <span><app-icon name="plus" size="1.2em"></app-icon></span> إنشاء حساب طالب جديد
          </a>
        </div>
      }
    </div>
  `
})
export class ChildrenListComponent implements OnInit {
  public parentService = inject(ParentService);
  private profileService = inject(ProfileService);

  private profileChildren = signal<LinkedChildDto[]>([]);

  public combinedStudents = computed(() => {
    const subs = this.parentService.linkedStudents();
    const profs = this.profileChildren();
    
    return subs.map(sub => {
      const prof = profs.find(p => p.userId === sub.studentUserId);
      return {
        ...sub,
        avatarUrl: prof?.avatarUrl
      };
    });
  });

  ngOnInit() {
    this.parentService.fetchLinkedStudents().subscribe();
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res.linkedChildren) {
          this.profileChildren.set(res.linkedChildren);
        }
      }
    });
  }
}
