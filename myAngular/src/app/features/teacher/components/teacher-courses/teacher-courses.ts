import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';

type FileType = 'مجلد' | 'فيديو' | 'PDF' | 'مستند';

interface CourseFile {
  name: string;
  type: FileType;
  date: string;
  size: string;
  icon: string;
}

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [NgClass],
  templateUrl: './teacher-courses.html',
  styleUrl: './teacher-courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherCourses {
  readonly filterType = signal<string>('الكل');
  readonly viewMode = signal<'list' | 'grid'>('list');

  readonly allFiles = signal<CourseFile[]>([
    { name: 'الدرس الأول: مقدمة في الجبر', type: 'مجلد', date: '15/10/2023', size: '--', icon: '📁' },
    { name: 'شرح الفيديو: المعادلات الخطية', type: 'فيديو', date: '14/10/2023', size: '150 MB', icon: '▶️' },
    { name: 'ملف PDF: تمارين الوحدة', type: 'PDF', date: '12/10/2023', size: '2.5 MB', icon: '📄' },
    { name: 'الدرس الثاني: الجبر المتقدم', type: 'مجلد', date: '20/10/2023', size: '--', icon: '📁' },
    { name: 'شرح الفيديو: المثلثات', type: 'فيديو', date: '18/10/2023', size: '200 MB', icon: '▶️' },
    { name: 'ملف PDF: مراجعة الوحدة الثانية', type: 'PDF', date: '22/10/2023', size: '3.1 MB', icon: '📄' },
  ]);

  readonly filterOptions = ['الكل', 'مجلدات', 'فيديوهات', 'PDF'];

  readonly filteredFiles = computed(() => {
    const f = this.filterType();
    return this.allFiles().filter(file => {
      if (f === 'الكل') return true;
      if (f === 'مجلدات') return file.type === 'مجلد';
      if (f === 'فيديوهات') return file.type === 'فيديو';
      if (f === 'PDF') return file.type === 'PDF';
      return true;
    });
  });

  setFilter(filter: string): void {
    this.filterType.set(filter);
  }

  toggleView(): void {
    this.viewMode.set(this.viewMode() === 'list' ? 'grid' : 'list');
  }
}
