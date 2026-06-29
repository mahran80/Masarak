import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';

type FileType = 'مجلد' | 'فيديو' | 'PDF' | 'مستند';

interface CourseFile {
  name: string;
  type: FileType;
  date: string;
  size: string;
  icon: string;
  url?: string;
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
    { name: 'الدرس الأول: مقدمة في الجبر', type: 'مجلد', date: '15/10/2023', size: '--', icon: '📁', url: '#' },
    { name: 'شرح الفيديو: المعادلات الخطية', type: 'فيديو', date: '14/10/2023', size: '150 MB', icon: '▶️', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { name: 'ملف PDF: تمارين الوحدة', type: 'PDF', date: '12/10/2023', size: '2.5 MB', icon: '📄', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { name: 'الدرس الثاني: الجبر المتقدم', type: 'مجلد', date: '20/10/2023', size: '--', icon: '📁', url: '#' },
    { name: 'شرح الفيديو: المثلثات', type: 'فيديو', date: '18/10/2023', size: '200 MB', icon: '▶️', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { name: 'ملف PDF: مراجعة الوحدة الثانية', type: 'PDF', date: '22/10/2023', size: '3.1 MB', icon: '📄', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const today = new Date().toLocaleDateString('en-GB');
      
      let type: FileType = 'مستند';
      let icon = '📄';
      if (file.type.includes('video')) {
        type = 'فيديو';
        icon = '▶️';
      } else if (file.type.includes('pdf')) {
        type = 'PDF';
        icon = '📄';
      }

      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const url = URL.createObjectURL(file);
      
      const newFile: CourseFile = {
        name: file.name,
        type,
        date: today,
        size: `${sizeInMB} MB`,
        icon,
        url
      };

      this.allFiles.update(files => [newFile, ...files]);
      
      // Reset input
      input.value = '';
    }
  }

  openFile(file: CourseFile): void {
    if (file.url && file.url !== '#') {
      const a = document.createElement('a');
      a.href = file.url;
      a.target = '_blank';
      a.click();
    } else if (file.type === 'مجلد') {
      alert('المجلدات لا يمكن فتحها في هذه الواجهة التجريبية.');
    } else {
      alert('هذا الملف هو نموذج للعرض فقط ولا يمكن فتحه.');
    }
  }
}
