import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentCourse } from '../../models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-student-course-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCourseCardComponent {
  readonly course = input.required<StudentCourse>();
  readonly selected = input<boolean>(false);
  readonly viewDetails = output<StudentCourse>();

  // Resolve unique keys to assign vector arts
  readonly subjectKey = computed(() => {
    const name = (this.course().subjectName || '').toLowerCase();
    const arName = this.course().subjectArabicName || '';
    
    if (name.includes('math') || arName.includes('رياضيات')) return 'math';
    if (name.includes('physic') || arName.includes('فيزياء')) return 'physics';
    if (name.includes('chem') || arName.includes('كيمياء')) return 'chemistry';
    if (name.includes('biolog') || arName.includes('أحياء') || arName.includes('احياء')) return 'biology';
    if (name.includes('arabic') || name.includes('عربي') || arName.includes('عربية') || arName.includes('عربي') || arName.includes('اللغة العربية')) return 'arabic';
    if (name.includes('english') || arName.includes('إنجليزية') || arName.includes('انجليزية') || arName.includes('اللغة الإنجليزية')) return 'english';
    if (name.includes('french') || arName.includes('فرنسية') || arName.includes('فرنسي')) return 'french';
    if (name.includes('computer') || name.includes('comput') || arName.includes('حاسب') || arName.includes('برمجة') || arName.includes('تكنولوجيا') || arName.includes('مهارات') || name.includes('digital')) return 'computer';
    if (name.includes('history') || arName.includes('تاريخ')) return 'history';
    if (name.includes('geograph') || arName.includes('جغرافيا') || arName.includes('جغرافية')) return 'geography';
    if (name.includes('islam') || arName.includes('إسلامية') || arName.includes('دين') || arName.includes('تربية إسلامية') || arName.includes('تربية دينية')) return 'islamic';
    if (name.includes('social') || arName.includes('دراسات')) return 'social';
    
    return 'science'; // fallback
  });

  // Maps each subjectKey to its large premium 3D illustration path
  readonly imageUrl = computed(() => {
    const key = this.subjectKey();
    switch (key) {
      case 'math': return '/assets/images/student/subject-mathematics-3d.png';
      case 'science': return '/assets/images/student/subject-science-3d.png';
      case 'arabic': return '/assets/images/student/subject-arabic-3d.png';
      case 'english': return '/assets/images/student/subject-english-3d.png';
      case 'computer': return '/assets/images/student/subject-computing-3d.png';
      case 'chemistry': return '/assets/images/student/subject-chemistry-3d.jpg';
      case 'physics': return '/assets/images/student/subject-physics-3d.jpg';
      case 'biology': return '/assets/images/student/subject-biology-3d.jpg';
      case 'history': return '/assets/images/student/subject-history-3d.jpg';
      case 'geography': return '/assets/images/student/subject-geography-3d.jpg';
      case 'islamic': return '/assets/images/student/subject-islamic-3d.jpg';
      case 'social': return '/assets/images/student/subject-history-3d.jpg';
      case 'french': return '/assets/images/student/subject-french-3d.jpg';
      default: return '/assets/images/student/subject-science-3d.png';
    }
  });

  // Maps each subject to its theme accent hex colors
  readonly themeColor = computed(() => {
    const key = this.subjectKey();
    switch (key) {
      case 'math': return { hex: '#4F8EF7', name: 'blue' };
      case 'science': return { hex: '#10B981', name: 'green' };
      case 'arabic': return { hex: '#F97316', name: 'orange' };
      case 'english': return { hex: '#8B5CF6', name: 'purple' };
      case 'geography':
      case 'history':
      case 'social': return { hex: '#F59E0B', name: 'gold' };
      case 'islamic': return { hex: '#14B8A6', name: 'teal' };
      case 'computer': return { hex: '#6366F1', name: 'indigo' };
      default: return { hex: '#4F8EF7', name: 'blue' };
    }
  });

  // Simulated metrics based on subject ID to keep cards consistent yet dynamic
  readonly lessonsCount = computed(() => {
    const idStr = String(this.course().subjectId || '0');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash += idStr.charCodeAt(i);
    return 10 + (hash % 9);
  });

  readonly assignmentsCount = computed(() => {
    const idStr = String(this.course().subjectId || '0');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash += idStr.charCodeAt(i);
    return 2 + (hash % 5);
  });

  readonly lastActivity = computed(() => {
    const idStr = String(this.course().subjectId || '0');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) hash += idStr.charCodeAt(i);
    const activities = ['تحديث أمس', 'نشط اليوم', 'تحديث منذ يومين', 'تحديث منذ ٣ أيام'];
    return activities[hash % activities.length];
  });
}
