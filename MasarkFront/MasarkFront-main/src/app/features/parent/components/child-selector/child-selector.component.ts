import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParentService } from '../../services/parent.service';

@Component({
  selector: 'app-child-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-64">
      <label class="block text-sm font-semibold text-slate-700 mb-1.5">اختر الطالب</label>
      <select 
        class="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm appearance-none"
        [value]="parentService.selectedStudentId() || ''"
        (change)="onStudentChange($event)">
        <option value="" disabled [selected]="!parentService.selectedStudentId()">اختر الطالب...</option>
        @for (student of parentService.linkedStudents(); track student.studentUserId) {
          <option [value]="student.studentUserId">
            {{ student.fullName }}
          </option>
        }
      </select>
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 pt-6 text-slate-500">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  `
})
export class ChildSelectorComponent {
  public parentService = inject(ParentService);

  onStudentChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.parentService.setSelectedStudent(Number(target.value));
    }
  }
}
