import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-parent-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">
            📅
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">سجل الحضور والغياب</h1>
            <p class="text-sm text-slate-500 mt-1">متابعة حضور الطالب في مختلف المواد</p>
          </div>
        </div>
        <select 
            [value]="selectedYear()" 
            (change)="onYearChange($event)"
            class="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option [value]="2026">العام الدراسي 2026</option>
            <option [value]="2025">العام الدراسي 2025</option>
        </select>
      </div>

      <!-- State: Loading -->
      @if (isLoading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1, 2, 3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse flex items-center gap-6">
              <div class="w-16 h-16 rounded-full bg-slate-200"></div>
              <div class="flex-1 space-y-3">
                <div class="w-1/2 h-5 bg-slate-200 rounded"></div>
                <div class="w-3/4 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          }
        </div>
      } 
      
      <!-- State: Error -->
      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block">⚠️</span>
          <h3 class="font-bold text-lg mb-1">عذراً، حدث خطأ</h3>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadAttendance()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      <!-- State: Empty -->
      @else if (attendanceData().length === 0) {
        <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm border-dashed">
          <div class="text-5xl mb-4 opacity-50">📋</div>
          <h3 class="text-lg font-bold text-slate-700 mb-2">لا توجد سجلات حضور</h3>
          <p class="text-slate-500 max-w-sm mx-auto">لم يتم تسجيل أي حضور أو غياب لهذا الطالب في العام الدراسي المحدد.</p>
        </div>
      }

      <!-- State: Data Loaded -->
      @else {
        <!-- Overall Summary Card -->
        <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 opacity-10">
            <svg class="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/></svg>
          </div>
          <div class="relative z-10 text-center md:text-right">
            <h2 class="text-2xl font-bold mb-2">معدل الحضور العام</h2>
            <p class="text-emerald-100">بناءً على {{ getTotalSessions() }} حصة مسجلة في جميع المواد</p>
          </div>
          <div class="relative z-10 flex items-center justify-center w-32 h-32 rounded-full border-8 border-white/20 bg-white/10 backdrop-blur-sm">
            <span class="text-4xl font-bold">{{ getOverallAttendanceRate() }}<span class="text-xl">%</span></span>
          </div>
        </div>

        <!-- Subjects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (subject of attendanceData(); track subject.subjectId) {
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <h3 class="text-lg font-bold text-slate-800 mb-4">{{ subject.subjectName || subject.courseName || 'مادة غير معروفة' }}</h3>
              
              <div class="flex items-center gap-6 mb-6">
                <!-- Circular Progress representing attendance rate -->
                <div class="relative w-20 h-20 flex-shrink-0">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5" />
                    <path [attr.stroke]="getAttendanceColor(subject.attendancePercentage || getCalculatedRate(subject))" 
                          [attr.stroke-dasharray]="(subject.attendancePercentage || getCalculatedRate(subject)) + ', 100'" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" stroke-width="3.5" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-sm font-bold text-slate-700">{{ subject.attendancePercentage || getCalculatedRate(subject) }}%</span>
                  </div>
                </div>

                <div class="space-y-2 flex-1">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500">حضور:</span>
                    <span class="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{{ subject.attendedSessions || 0 }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500">غياب:</span>
                    <span class="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{{ subject.missedSessions || subject.absentSessions || 0 }}</span>
                  </div>
                  <div class="flex justify-between items-center text-sm border-t border-slate-100 pt-1 mt-1">
                    <span class="text-slate-400">الإجمالي:</span>
                    <span class="font-semibold text-slate-700">{{ subject.totalSessions || 0 }}</span>
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
export class ParentAttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private parentService = inject(ParentService);

  studentId = signal<number>(0);
  selectedYear = signal<number>(2026);
  
  attendanceData = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('studentId');
      if (id) {
        this.studentId.set(Number(id));
        this.loadAttendance();
      }
    });
  }

  onYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.selectedYear.set(Number(target.value));
      this.loadAttendance();
    }
  }

  loadAttendance() {
    this.isLoading.set(true);
    this.error.set(null);

    this.parentService.getChildAttendance(this.studentId(), this.selectedYear()).subscribe({
      next: (res) => {
        this.attendanceData.set(res || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل سجل الحضور. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }

  getCalculatedRate(subject: any): number {
    const attended = subject.attendedSessions || 0;
    const total = subject.totalSessions || 1; // avoid division by zero
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  }

  getTotalSessions(): number {
    return this.attendanceData().reduce((acc, curr) => acc + (curr.totalSessions || 0), 0);
  }

  getOverallAttendanceRate(): number {
    const total = this.getTotalSessions();
    if (total === 0) return 0;
    
    const attended = this.attendanceData().reduce((acc, curr) => acc + (curr.attendedSessions || 0), 0);
    return Math.round((attended / total) * 100);
  }

  getAttendanceColor(rate: number): string {
    if (rate >= 90) return '#10b981'; // emerald-500
    if (rate >= 75) return '#3b82f6'; // blue-500
    if (rate >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  }
}
