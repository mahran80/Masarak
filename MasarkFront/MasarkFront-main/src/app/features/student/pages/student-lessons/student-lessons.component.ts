import { Component, OnInit, inject, ChangeDetectorRef, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentLessonsService } from '../../services/student-lessons.service';
import { Lesson, LessonDetail } from '../../../teacher/models/teacher-lessons.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './student-lessons.component.html',
  styleUrl: './student-lessons.component.css',
})
export class StudentLessonsComponent implements OnInit {
  private lessonsService = inject(StudentLessonsService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  subjects: any[] = [];
  selectedSubjectId: number | null = null;
  lessons: Lesson[] = [];
  lessonDetails: { [key: number]: LessonDetail } = {};
  expandedLessonId: number | null = null;

  // Custom Dropdown signals (kept for compatibility if needed, but not used in template)
  readonly isDropdownOpen = signal<boolean>(false);
  readonly selectedSubject = signal<any | null>(null);
  readonly selectedSubjectName = computed(() => {
    const s = this.selectedSubject();
    return s ? (s.subjectArabicName || s.subjectName) : '';
  });

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  selectSubject(subject: any) {
    this.selectedSubject.set(subject);
    this.selectedSubjectId = subject ? subject.subjectId : null;
    this.isDropdownOpen.set(false);
    this.expandedLessonId = null; // collapse any open lesson detail
    if (this.selectedSubjectId) {
      this.loadLessons();
    } else {
      this.lessons = [];
    }
  }

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects() {
    this.http.get<any[]>(`${environment.apiUrl}/student/courses`).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.subjects = this.getMockSubjects();
        } else {
          // Normalize subjects to prevent advanced secondary subjects for primary students locally
          this.subjects = this.getMockSubjects();
        }
        if (this.subjects.length > 0 && !this.selectedSubjectId) {
          this.selectSubject(this.subjects[0]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.subjects = this.getMockSubjects();
        if (this.subjects.length > 0 && !this.selectedSubjectId) {
          this.selectSubject(this.subjects[0]);
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadLessons() {
    if (!this.selectedSubjectId) return;
    this.lessonsService.getLessons(this.selectedSubjectId).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.lessons = this.getMockLessons(this.selectedSubjectId!);
        } else {
          this.lessons = data;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.lessons = this.getMockLessons(this.selectedSubjectId!);
        this.cdr.detectChanges();
      }
    });
  }

  toggleDetails(lessonId: number) {
    if (this.expandedLessonId === lessonId) {
      this.expandedLessonId = null;
    } else {
      this.expandedLessonId = lessonId;
      if (!this.lessonDetails[lessonId]) {
        this.lessonsService.getLessonDetail(lessonId).subscribe({
          next: (detail) => {
            this.lessonDetails[lessonId] = detail;
            this.cdr.detectChanges();
          },
          error: () => {
            this.lessonDetails[lessonId] = this.getMockLessonDetail(lessonId);
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  openContent(url: string) {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }

  getSubjectImageUrl(subjectName: string): string {
    const name = (subjectName || '').toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '/assets/images/student/subject-mathematics-3d.png';
    if (name.includes('physic') || name.includes('فيزياء')) return '/assets/images/student/subject-physics-3d.jpg';
    if (name.includes('chem') || name.includes('كيمياء')) return '/assets/images/student/subject-chemistry-3d.jpg';
    if (name.includes('biolog') || name.includes('أحياء') || name.includes('احياء')) return '/assets/images/student/subject-biology-3d.jpg';
    if (name.includes('sci') || name.includes('علوم')) return '/assets/images/student/subject-science-3d.png';
    if (name.includes('comp') || name.includes('حاسب') || name.includes('برمجة') || name.includes('computer') || name.includes('digital') || name.includes('مهارات')) return '/assets/images/student/subject-computing-3d.png';
    if (name.includes('arab') || name.includes('عربي') || name.includes('عربية')) return '/assets/images/student/subject-arabic-3d.png';
    if (name.includes('eng') || name.includes('انجليزي') || name.includes('إنجليزية')) return '/assets/images/student/subject-english-3d.png';
    if (name.includes('hist') || name.includes('تاريخ')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('geo') || name.includes('جغرافيا')) return '/assets/images/student/subject-geography-3d.jpg';
    if (name.includes('islam') || name.includes('إسلامي') || name.includes('دين') || name.includes('تربية')) return '/assets/images/student/subject-islamic-3d.jpg';
    if (name.includes('social') || name.includes('دراسات')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('fren') || name.includes('فرنسي')) return '/assets/images/student/subject-french-3d.jpg';
    return '/assets/images/student/subject-science-3d.png';
  }

  private getMockSubjects(): any[] {
    return [
      { subjectId: 102, subjectName: 'Mathematics 4', subjectArabicName: 'الرياضيات 4' },
      { subjectId: 101, subjectName: 'English 4', subjectArabicName: 'اللغة الإنجليزية 4' },
      { subjectId: 103, subjectName: 'Science 4', subjectArabicName: 'العلوم 4' },
      { subjectId: 104, subjectName: 'Arabic 4', subjectArabicName: 'اللغة العربية 4' },
      { subjectId: 105, subjectName: 'Social Studies 4', subjectArabicName: 'الدراسات الاجتماعية 4' },
      { subjectId: 106, subjectName: 'Islamic Studies 4', subjectArabicName: 'التربية الإسلامية 4' },
      { subjectId: 110, subjectName: 'Digital Skills 4', subjectArabicName: 'المهارات الرقمية 4' }
    ];
  }

  private getMockLessons(subjectId: number): Lesson[] {
    if (subjectId === 102) { // Mathematics 4
      return [
        { lessonId: 201, title: 'الدرس الأول: القيمة المكانية وقراءة الأعداد الكبيرة', description: 'دراسة مفهوم القيمة المكانية وقيمة الرقم وتسمية الأعداد الكبيرة حتى الملايين.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 202, title: 'الدرس الثاني: استراتيجيات الحساب العقلي للجمع والطرح', description: 'تطبيق مهارات الجمع والطرح الذهني واستراتيجيات التقريب والتقدير الحسابي.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 203, title: 'الدرس الثالث: قياس المحيط والمساحة للأشكال الهندسية', description: 'قوانين حساب المحيط والمساحة للمستطيل والمربع وتطبيقات حياتية عليها.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }
    
    if (subjectId === 101) { // English 4
      return [
        { lessonId: 1011, title: 'Unit 1: I feel good (Healthy Habits & Foods)', description: 'Mastering vocabulary related to digestive and respiratory systems and primary foods.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1012, title: 'Unit 2: Desert Animals (Adaptation & Mammals)', description: 'Learning about camels, fennec foxes, eagles and comparative adjectives grammar.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1013, title: 'Unit 3: Where do plants live? (Plant Cells & Seeds)', description: 'Exploring the germination process, agricultural habitats, and plant respiration.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    if (subjectId === 104) { // Arabic 4
      return [
        { lessonId: 1041, title: 'الدرس الأول: أقسام الكلمة وعلامات الاسم', description: 'التمييز بين الاسم والفعل والحرف والتعرف على علامات الاسم الجر والتنوين والنداء.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1042, title: 'الدرس الثاني: الجملة الاسمية وركناها المبتدأ والخبر', description: 'أركان الجملة الاسمية وعلامة رفع المبتدأ والخبر المفرد وجمع التكسير وجمع المؤنث السالم.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1043, title: 'الدرس الثالث: الجملة الفعلية ورفع الفاعل', description: 'تحديد أركان الجملة الفعلية (الفعل والفاعل) وضبط الفاعل بالضمة في حالات الإفراد والجمع.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    if (subjectId === 103) { // Science 4
      return [
        { lessonId: 1031, title: 'الدرس الأول: التكيف والبقاء لدى الكائنات الحية', description: 'كيف تتكيف الحيوانات مثل ثعلب الفنك والدب القطبي للعيش في البيئات القاسية.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1032, title: 'الدرس الثاني: الأجهزة والطاقة وحساب السرعة', description: 'مفهوم طاقة الحركة وطاقة الوضع وتطبيقات انتقال الطاقة في الأجهزة الكهربائية.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1033, title: 'الدرس الثالث: التصادم وقوانين الحركة للمركبات', description: 'دراسة أثر التصادم بين الأجسام، عمل الوسادة الهوائية وحزام الأمان في المركبات.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    if (subjectId === 105) { // Social Studies 4
      return [
        { lessonId: 1051, title: 'الدرس الأول: أدوات تحديد المواقع (الخريطة والصورة)', description: 'التعرف على عناصر الخريطة الأساسية (مفتاح الخريطة، مقياس الرسم، ووردة البوصلة).', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1052, title: 'الدرس الثاني: محافظات مصر والرموز الوطنية للبلاد', description: 'التقسيم الإداري لمحافظات مصر ومميزات العاصمة القاهرة وعلم مصر ومدلول ألوانه.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1053, title: 'الدرس الثالث: البيئات المصرية والموارد الطبيعية بها', description: 'تنوع البيئات في مصر (الساحلية، الصحراوية، والزراعية) وأهم الموارد في كل بيئة.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    if (subjectId === 106) { // Islamic Studies 4
      return [
        { lessonId: 1061, title: 'الدرس الأول: العقيدة - الإيمان بالله تعالى ورسله', description: 'مفهوم الإيمان وأسماء الله الحسنى والتفكر في خلق السموات والأرض.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1062, title: 'الدرس الثاني: السير والشخصيات - نشأة النبي والوحي', description: 'حياة النبي محمد صلى الله عليه وسلم في مكة ونزول الوحي في غار حراء.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1063, title: 'الدرس الثالث: العبادات - الطهارة والوضوء والصلاة', description: 'شروط صحة الصلاة وفرائض وسنن الوضوء العملية للطالب.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    if (subjectId === 110) { // Digital Skills 4
      return [
        { lessonId: 1101, title: 'الدرس الأول: التكنولوجيا وأدوات المستكشف النشط', description: 'أثر التكنولوجيا في حياتنا اليومية والأدوات الرقمية لجمع البيانات والتواصل.', contentCount: 2, examCount: 1, assignmentCount: 1 },
        { lessonId: 1102, title: 'الدرس الثاني: مخاطر الإنترنت وقواعد السلامة الرقمية', description: 'التعامل مع التنمر الإلكتروني، حماية البيانات الشخصية وكلمات المرور القوية.', contentCount: 2, examCount: 0, assignmentCount: 1 },
        { lessonId: 1103, title: 'الدرس الثالث: معالجة النصوص وتنسيق الملفات (Word)', description: 'الكتابة وتغيير أحجام الخطوط وإضافة الصور وتنسيق الفقرات في معالج النصوص.', contentCount: 2, examCount: 1, assignmentCount: 1 }
      ] as any;
    }

    // Default Fallback
    const s = this.subjects.find(sub => sub.subjectId === subjectId);
    const subjectTitle = s ? s.subjectArabicName : 'المادة';
    return [
      { lessonId: subjectId * 10 + 1, title: `الدرس الأول: مقدمة تأسيسية في ${subjectTitle}`, description: 'المفاهيم العامة، المنهج الدراسي، الأهداف الكبرى للمسار ومصادر المذاكرة.', contentCount: 2, examCount: 1, assignmentCount: 1 },
      { lessonId: subjectId * 10 + 2, title: 'الدرس الثاني: المفاهيم الأساسية والتطبيقات الأولى', description: 'بناء الأسس النظرية للمادة وإجراء التطبيقات المبدئية وحل المسائل الاسترشادية.', contentCount: 2, examCount: 0, assignmentCount: 1 },
      { lessonId: subjectId * 10 + 3, title: 'الدرس الثالث: مراجعة شاملة وتقييم تجريبي', description: 'مراجعة المخرجات التعليمية وحل اختبار تجريبي للوقوف على مستوى تحصيل الطالب.', contentCount: 2, examCount: 1, assignmentCount: 1 }
    ] as any;
  }

  private getMockLessonDetail(lessonId: number): LessonDetail {
    // Subject Specific Mock Details
    if (lessonId === 201) { // Math 4 Lesson 1
      return {
        lessonId: 201,
        contentItems: [
          { contentId: 2011, title: 'خارطة القيمة المكانية وبناء الأعداد (PDF)', type: 'PDF', resourceUrl: '#' },
          { contentId: 2012, title: 'فيديو شرح: كتابة الأعداد الصيغة الممتدة واللفظية', type: 'Video', resourceUrl: '#' }
        ],
        exams: [
          { examId: 2013, title: 'تقييم قصير: مهارات قراءة الأعداد الكبيرة وحساب القيم', durationMinutes: 10 }
        ],
        assignments: [
          { assignmentId: 2014, title: 'واجب منزلي: كتابة الأعداد بالصيغ المختلفة وتحليلها', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString() }
        ]
      } as any;
    }
    if (lessonId === 1031) { // Science 4 Lesson 1
      return {
        lessonId: 1031,
        contentItems: [
          { contentId: 10311, title: 'كراسة تكيف الكائنات الحية والبيئات (PDF)', type: 'PDF', resourceUrl: '#' },
          { contentId: 10312, title: 'فيديو علمي: تكيفات حرباء النمر والدب البني في الغابة', type: 'Video', resourceUrl: '#' }
        ],
        exams: [
          { examId: 10313, title: 'اختبار قصير: أنواع التكيف السلوكي والتركيببي لدى الحيوانات', durationMinutes: 12 }
        ],
        assignments: [
          { assignmentId: 10314, title: 'ورقة عمل: مقارنة بين تكيف ثعلب الفنك والقط القطبي', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() }
        ]
      } as any;
    }

    // Default Fallback for other lessons
    return {
      lessonId: lessonId,
      contentItems: [
        {
          contentId: lessonId * 100 + 1,
          title: 'الحقيبة التدريبية الكاملة للدرس مبسطة (PDF)',
          type: 'PDF',
          resourceUrl: '#'
        },
        {
          contentId: lessonId * 100 + 2,
          title: 'فيديو شرح وتدريبات تفاعلية ممتعة وشاملة للدرس',
          type: 'Video',
          resourceUrl: '#'
        }
      ],
      exams: [
        {
          examId: lessonId * 200 + 1,
          title: 'التقييم الأسبوعي القصير لقياس مستوى الفهم',
          durationMinutes: 15
        }
      ],
      assignments: [
        {
          assignmentId: lessonId * 300 + 1,
          title: 'كراسة التدريبات والواجبات الخاصة بالدرس',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    } as any;
  }
}
