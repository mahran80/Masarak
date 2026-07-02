import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { PerformanceAlertDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-child-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-800">تنبيهات الأداء</h1>
          <p class="text-sm text-slate-500 mt-1">تنبيهات مبكرة حول المستوى الأكاديمي والحضور</p>
        </div>
      </div>

      @if (isLoading()) {
        <div class="space-y-4">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse flex gap-4">
              <div class="w-10 h-10 bg-slate-200 rounded-full"></div>
              <div class="flex-1 space-y-3">
                <div class="w-1/4 h-5 bg-slate-200 rounded"></div>
                <div class="w-3/4 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block">⚠️</span>
          <h3 class="font-bold text-lg mb-1">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadAlerts()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      } @else if (alerts().length === 0) {
        <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
          <div class="text-6xl mb-4 text-emerald-400">✨</div>
          <h3 class="text-xl font-bold text-slate-700 mb-2">أداء ممتاز، لا توجد تنبيهات!</h3>
          <p class="text-slate-500 mb-6 max-w-md mx-auto">لم نرصد أي انخفاض في مستوى الطالب أو أي مشاكل في الحضور. استمروا في هذا الأداء الرائع.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (alert of alerts(); track alert.performanceAlertId) {
            <div class="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col relative"
                 [ngClass]="{
                   'border-red-200': alert.severity === 'High',
                   'border-orange-200': alert.severity === 'Medium',
                   'border-amber-200': alert.severity === 'Low'
                 }">
              
              <!-- Color strip at top -->
              <div class="h-1.5 w-full"
                   [ngClass]="{
                     'bg-red-500': alert.severity === 'High',
                     'bg-orange-500': alert.severity === 'Medium',
                     'bg-amber-500': alert.severity === 'Low'
                   }"></div>
              
              <div class="p-6 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">
                      @if (alert.alertType === 'LowAttendance') { 🕒 }
                      @else if (alert.alertType === 'LowExamScore') { 📝 }
                      @else { 📊 }
                    </span>
                    <h3 class="font-bold text-slate-800 text-lg">
                      @if (alert.alertType === 'LowAttendance') { غياب متكرر }
                      @else if (alert.alertType === 'LowExamScore') { درجة منخفضة في اختبار }
                      @else { انخفاض في الأداء }
                    </h3>
                  </div>
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                        [ngClass]="{
                          'bg-red-100 text-red-700': alert.severity === 'High',
                          'bg-orange-100 text-orange-700': alert.severity === 'Medium',
                          'bg-amber-100 text-amber-700': alert.severity === 'Low'
                        }">
                    @if (alert.severity === 'High') { هام جداً }
                    @else if (alert.severity === 'Medium') { متوسط }
                    @else { عادي }
                  </span>
                </div>
                
                <p class="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {{ alert.message }}
                </p>
                
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm grid grid-cols-2 gap-4 mt-auto">
                  <div>
                    <span class="text-slate-400 block text-xs mb-1">الموضوع</span>
                    <span class="font-semibold text-slate-700">{{ alert.subjectName || 'عام' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-xs mb-1">تاريخ التنبيه</span>
                    <span class="font-semibold text-slate-700" dir="ltr">{{ alert.createdAt | date:'shortDate' }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ChildAlertsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private aiService = inject(AiAnalyticsService);

  studentId = signal<number>(0);
  alerts = signal<PerformanceAlertDto[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('studentId');
      if (id) {
        this.studentId.set(Number(id));
        this.loadAlerts();
      }
    });
  }

  loadAlerts() {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getStudentAlerts(this.studentId()).subscribe({
      next: (res) => {
        // Map alertType to mock severity for UI compatibility
        const mappedRes = res.map(a => {
          let severity = 'Medium';
          if (a.alertType === 'LowAttendance' && a.triggerValue < a.threshold - 10) {
            severity = 'High';
          } else if (a.alertType === 'LowExamScore' && a.triggerValue < 50) {
            severity = 'High';
          } else if (a.alertType === 'LowExamScore' && a.triggerValue >= 50 && a.triggerValue < 70) {
            severity = 'Medium';
          } else if (a.alertType === 'MissedAssignments' && a.triggerValue > 3) {
            severity = 'High';
          } else if (a.triggerValue >= a.threshold) {
             severity = 'Low';
          }
          return { ...a, severity };
        });

        // Sort alerts by severity and date (High first, newest first)
        const severityWeight: any = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const sorted = mappedRes.sort((a, b) => {
          const sevA = a.severity || 'Medium';
          const sevB = b.severity || 'Medium';
          if (severityWeight[sevA] !== severityWeight[sevB]) {
            return severityWeight[sevB] - severityWeight[sevA];
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        this.alerts.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل التنبيهات الخاصة بهذا الطالب. يرجى التأكد من حالة الاشتراك.');
        this.isLoading.set(false);
      }
    });
  }
}
