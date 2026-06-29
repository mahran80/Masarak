import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';

interface StudentRecord {
  name: string;
  avatar: string;
  className: string;
  attendancePercent: number;
  submittedAssignments: number;
  totalAssignments: number;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول';
}

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [NgClass],
  templateUrl: './teacher-students.html',
  styleUrl: './teacher-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherStudents {
  readonly searchQuery = signal('');
  readonly selectedClass = signal('الكل');

  readonly allStudents = signal<StudentRecord[]>([
    { name: 'أحمد محمد العلي', avatar: '👨‍🎓', className: 'الصف الأول الثانوي (أ)', attendancePercent: 98, submittedAssignments: 12, totalAssignments: 12, grade: 'ممتاز' },
    { name: 'خالد عبد الله الشمري', avatar: '👨‍🎓', className: 'الصف الأول الثانوي (أ)', attendancePercent: 92, submittedAssignments: 10, totalAssignments: 12, grade: 'جيد جداً' },
    { name: 'سارة يوسف أحمد', avatar: '👩‍🎓', className: 'الصف الأول الثانوي (أ)', attendancePercent: 84, submittedAssignments: 8, totalAssignments: 12, grade: 'مقبول' },
    { name: 'محمد حسن الزهراني', avatar: '👨‍🎓', className: 'الصف الأول الثانوي (ب)', attendancePercent: 96, submittedAssignments: 11, totalAssignments: 12, grade: 'ممتاز' },
    { name: 'ليلى عمر القحطاني', avatar: '👩‍🎓', className: 'الصف الأول الثانوي (ب)', attendancePercent: 88, submittedAssignments: 9, totalAssignments: 12, grade: 'جيد' },
    { name: 'عمر فهد الدوسري', avatar: '👨‍🎓', className: 'الصف الثاني الثانوي (أ)', attendancePercent: 78, submittedAssignments: 7, totalAssignments: 12, grade: 'مقبول' },
  ]);

  readonly classes = computed(() => {
    const unique = [...new Set(this.allStudents().map(s => s.className))];
    return ['الكل', ...unique];
  });

  readonly filteredStudents = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cls = this.selectedClass();
    return this.allStudents().filter(s => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q);
      const matchesClass = cls === 'الكل' || s.className === cls;
      return matchesSearch && matchesClass;
    });
  });

  gradeColor(grade: StudentRecord['grade']): string {
    const colors: Record<string, string> = {
      'ممتاز': 'bg-emerald-50 text-emerald-700',
      'جيد جداً': 'bg-blue-50 text-blue-700',
      'جيد': 'bg-amber-50 text-amber-700',
      'مقبول': 'bg-rose-50 text-rose-700',
    };
    return colors[grade] ?? 'bg-slate-100 text-slate-600';
  }

  attendanceColor(pct: number): string {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 80) return 'text-amber-500';
    return 'text-rose-500';
  }
}
