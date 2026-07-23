import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentCourse } from '../../models';

@Component({
  selector: 'app-student-course-card',
  standalone: true,
  imports: [CommonModule],
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
    if (name.includes('computer') || name.includes('comput') || arName.includes('حاسب') || arName.includes('برمجة') || arName.includes('تكنولوجيا')) return 'computer';
    if (name.includes('history') || arName.includes('تاريخ')) return 'history';
    if (name.includes('geograph') || arName.includes('جغرافيا') || arName.includes('جغرافية')) return 'geography';
    if (name.includes('islam') || arName.includes('إسلامية') || arName.includes('دين') || arName.includes('تربية إسلامية')) return 'islamic';
    
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
      case 'french': return '/assets/images/student/subject-french-3d.jpg';
      default: return '/assets/images/student/subject-science-3d.png';
    }
  });

  // Simulated progress percentage based on subject ID
  readonly progress = computed(() => {
    const id = String(this.course().subjectId || '0');
    // Simple deterministic hash to get percentage between 62% and 98%
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash += id.charCodeAt(i);
    }
    return 62 + (hash % 37);
  });
}
