import { Component, Input, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ParentService } from '../../services/parent.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-child-context-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <nav class="bg-white rounded-xl border border-slate-200 shadow-sm p-2 mb-6 overflow-x-auto" dir="rtl" aria-label="تنقل الطالب">
      <div class="flex items-center gap-1 min-w-max">
        <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg ml-2 border border-slate-100">
          <span class="text-base">👤</span>
          <span class="text-sm font-bold text-slate-800">{{ childName() }}</span>
        </div>
        <a [routerLink]="['/dashboard/parent/reports', studentId]"
           routerLinkActive="bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
           class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 border border-transparent transition-all">
          <app-icon name="chart" [size]="14"></app-icon>
          التقرير الذكي
        </a>
        <a [routerLink]="['/dashboard/parent/attendance', studentId]"
           routerLinkActive="bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
           class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 border border-transparent transition-all">
          <app-icon name="calendar" [size]="14"></app-icon>
          سجل الحضور
        </a>
        <a [routerLink]="['/dashboard/parent/alerts', studentId]"
           routerLinkActive="bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
           class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 border border-transparent transition-all">
          <app-icon name="bell" [size]="14"></app-icon>
          التنبيهات
        </a>
        <a [routerLink]="['/dashboard/parent/schedule', studentId]"
           routerLinkActive="bg-blue-50 text-blue-700 border-blue-200 shadow-xs"
           class="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 border border-transparent transition-all">
          <app-icon name="clock" [size]="14"></app-icon>
          الجدول الأسبوعي
        </a>
      </div>
    </nav>
  `
})
export class ChildContextBarComponent implements OnInit {
  private readonly parentService = inject(ParentService);
  @Input({ required: true }) studentId!: number;

  readonly childName = computed(() => {
    const list = this.parentService.linkedStudents();
    const student = list.find(s => s.studentUserId === Number(this.studentId));
    return student?.fullName || 'الطالب';
  });

  ngOnInit() {
    if (!this.parentService.linkedStudents().length) {
      this.parentService.fetchLinkedStudents().subscribe();
    }
  }
}
