import { DatePipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { StudentAssignment, StudentContentItem, StudentCourse, StudentEntityId, StudentExam, StudentScheduleSession } from '../../models';
import { StudentService } from '../../services/student.service';
import { StudentLessonsService } from '../../services/student-lessons.service';
import { Lesson } from '../../../teacher/models/teacher-lessons.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

type Tab = 'overview' | 'content' | 'assignments' | 'exams' | 'sessions';

interface QuizQuestion {
  text: string;
  options: string[];
  correct: number;
}

interface ActivityEvent {
  user: string;
  role: 'teacher' | 'admin' | 'student';
  action: string;
  target: string;
  time: string;
}

interface SimulatedQuiz {
  title: string;
  questionsCount: number;
  duration: number;
  attempts: number;
  score?: string;
  status: 'available' | 'completed';
}

@Component({
  selector: 'app-student-course-details-page',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, IconComponent],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCourseDetailsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(StudentService);
  private lessonsService = inject(StudentLessonsService);
  private destroyRef = inject(DestroyRef);

  readonly course = signal<StudentCourse | null>(null);
  readonly subjectId = signal<StudentEntityId | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly tab = signal<Tab>('overview');
  readonly loadingTab = signal<Tab | null>(null);
  readonly loaded = signal<Set<Tab>>(new Set(['overview']));

  readonly content = signal<StudentContentItem[]>([]);
  readonly lessons = signal<Lesson[]>([]);
  readonly assignments = signal<StudentAssignment[]>([]);
  readonly exams = signal<StudentExam[]>([]);
  readonly sessions = signal<StudentScheduleSession[]>([]);

  // Selected Unit ID for drilling down into lessons
  readonly activeUnitId = signal<number | null>(null);

  // Video overlay state
  readonly activeVideoLesson = signal<any | null>(null);

  // Homework modal state
  readonly activeHomework = signal<any | null>(null);
  readonly homeworkFileUploaded = signal<boolean>(false);
  readonly homeworkSubmitted = signal<boolean>(false);

  // Quiz modal state
  readonly activeQuiz = signal<any | null>(null);
  readonly quizCurrentIndex = signal<number>(0);
  readonly quizSelectedAnswer = signal<number | null>(null);
  readonly quizScore = signal<number>(0);
  readonly quizCompleted = signal<boolean>(false);
  readonly quizTimer = signal<number>(300); // 5 minutes timer
  private timerInterval: any = null;

  readonly quizQuestions: QuizQuestion[] = [
    {
      text: 'السؤال الأول: ما هي القيمة المكانية للرقم 7 في العدد 472,130؟',
      options: ['مئات الألوف', 'عشرات الألوف', 'آلاف', 'مئات'],
      correct: 1
    },
    {
      text: 'السؤال الثاني: أي الرموز التالية يمثل مقارنة صحيحة للأعداد الكبيرة؟',
      options: ['150,320 > 150,230', '99,999 > 100,000', '45,670 = 45,760', 'لا شيء مما سبق'],
      correct: 0
    },
    {
      text: 'السؤال الثالث: ناتج تقريب العدد 4,562 لأقرب مئة هو:',
      options: ['4,500', '4,600', '5,000', '4,000'],
      correct: 1
    }
  ];

  readonly tabs: {id: Tab; label: string}[] = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'content', label: 'الدروس والوحدات' },
    { id: 'assignments', label: 'الواجبات' },
    { id: 'exams', label: 'الاختبارات' },
    { id: 'sessions', label: 'الحصص المباشرة' }
  ];

  readonly visual = computed(() => {
    const n = `${this.course()?.subjectName ?? ''} ${this.course()?.subjectArabicName ?? ''}`.toLowerCase();
    if (n.includes('science') || n.includes('علوم')) return 'science';
    if (n.includes('arab') || n.includes('عرب')) return 'arabic';
    if (n.includes('english') || n.includes('انجلي')) return 'english';
    if (n.includes('computer') || n.includes('حاسب') || n.includes('مهارات') || n.includes('digital')) return 'computing';
    return 'math';
  });

  // Dynamic Subject Theme Color Map
  readonly themeColor = computed(() => {
    const v = this.visual();
    switch (v) {
      case 'math': return { hex: '#4F8EF7', name: 'blue' };
      case 'science': return { hex: '#10B981', name: 'green' };
      case 'arabic': return { hex: '#F97316', name: 'orange' };
      case 'english': return { hex: '#8B5CF6', name: 'purple' };
      case 'computing': return { hex: '#6366F1', name: 'indigo' };
      default: return { hex: '#4F8EF7', name: 'blue' };
    }
  });

  // Overall course progress percentage
  readonly courseProgress = computed(() => {
    const id = Number(this.subjectId() || 0);
    return 72; // Set to 72% matching screenshot and request
  });

  // Latest announcements simulated
  readonly latestAnnouncement = computed(() => {
    return {
      title: 'تم تعديل موعد تسليم واجب الوحدة الأولى ليكون الأربعاء القادم',
      date: 'منذ ٣ ساعات',
      author: this.course()?.teacherName || 'مدرس المادة'
    };
  });

  // Simulated activity feed events
  readonly activities = computed<ActivityEvent[]>(() => {
    const teacher = this.course()?.teacherName || 'معلم المادة';
    return [
      { user: teacher, role: 'teacher', action: 'قام بنشر إعلان جديد:', target: 'تمديد موعد تسليم الواجب', time: 'منذ ٣ ساعات' },
      { user: 'النظام الدراسي', role: 'admin', action: 'قام بتحديث:', target: 'الخطة الأسبوعية ومواعيد الحصص المباشرة', time: 'منذ ٥ ساعات' },
      { user: teacher, role: 'teacher', action: 'قام بإضافة ملف PDF:', target: 'ملخص الشرح وحل التدريبات للدرس الثالث', time: 'منذ ٨ ساعات' },
      { user: teacher, role: 'teacher', action: 'قام بنشر درس جديد:', target: 'ترتيب ومقارنة الأعداد الكبيرة', time: 'أمس، ٠٤:١٥ م' },
      { user: 'أنت (كطالب)', role: 'student', action: 'أكملت مشاهدة فيديو الدرس:', target: 'القيمة المكانية للأرقام', time: 'أمس، ١١:٣٠ ص' },
      { user: teacher, role: 'teacher', action: 'قام بتصحيح الواجب الدراسي:', target: 'واجب الدرس الأول (النتيجة: ١٠/١٠)', time: 'أول أمس، ٠٣:٠٠ م' }
    ];
  });

  // Simulated Quizzes list
  readonly quizzes = computed<SimulatedQuiz[]>(() => {
    return [
      { title: 'اختبار تقييمي قصير - الدرس الأول والثاني', questionsCount: 5, duration: 10, attempts: 1, score: '٥ / ٥', status: 'completed' },
      { title: 'اختبار الوحدة الأولى الشامل', questionsCount: 15, duration: 25, attempts: 0, status: 'available' },
      { title: 'تقييم مفاهيم القيمة المكانية', questionsCount: 8, duration: 15, attempts: 0, status: 'available' }
    ];
  });

  // Recorded live sessions simulation
  readonly recordedSessions = computed(() => {
    const teacher = this.course()?.teacherName || 'معلم المادة';
    return [
      { title: 'حصة مراجعة المفاهيم وحل تدريبات الأعداد الكبيرة (مسجلة)', teacher, date: 'الجمعة الماضية', duration: '٥٠ دقيقة' },
      { title: 'شرح الدرس الأول التمهيدي (مسجلة)', teacher, date: 'منذ أسبوع', duration: '٤٥ دقيقة' }
    ];
  });

  // Group lessons into units dynamically
  readonly units = computed(() => {
    const list = this.lessons();
    if (!list.length) return [];

    const chunkSize = 4;
    const unitsList = [];
    const arabicNumbers = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const unitIndex = Math.floor(i / chunkSize);
      const unitName = `الوحدة ${arabicNumbers[unitIndex] || (unitIndex + 1)}`;
      const completionPercent = Math.min(100, Math.max(0, 100 - (unitIndex * 35)));

      unitsList.push({
        unitId: unitIndex + 1,
        name: unitName,
        completionPercent,
        lessonsCount: chunk.length,
        lessons: chunk
      });
    }
    return unitsList;
  });

  // Get active unit based on activeUnitId signal
  readonly activeUnit = computed(() => {
    const unitsList = this.units();
    const id = this.activeUnitId();
    if (id === null) return null;
    return unitsList.find(u => u.unitId === id) || null;
  });

  // Next Live Session computed property
  readonly nextSession = computed(() => {
    const sList = this.sessions();
    if (sList.length) return sList[0];
    return null;
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      this.subjectId.set(p.get('subjectId'));
      this.loadCourse();
    });
  }

  selectTab(tab: Tab): void {
    this.tab.set(tab);
    if (!this.loaded().has(tab)) {
      this.loadTab(tab);
    }
  }

  join(session: StudentScheduleSession): void {
    if (session.sessionId !== undefined) {
      this.router.navigate(['/dashboard/student/sessions', session.sessionId, 'live']);
    }
  }

  retry(): void {
    this.loadCourse();
  }

  getSubjectImageUrl(subjectName: string): string {
    const name = (subjectName || '').toLowerCase();
    const arName = this.course()?.subjectArabicName || '';
    if (name.includes('math') || arName.includes('رياضيات')) return '/assets/images/student/subject-mathematics-3d.png';
    if (name.includes('physic') || arName.includes('فيزياء')) return '/assets/images/student/subject-physics-3d.jpg';
    if (name.includes('chem') || arName.includes('كيمياء')) return '/assets/images/student/subject-chemistry-3d.jpg';
    if (name.includes('biolog') || arName.includes('أحياء') || arName.includes('احياء')) return '/assets/images/student/subject-biology-3d.jpg';
    if (name.includes('sci') || arName.includes('علوم')) return '/assets/images/student/subject-science-3d.png';
    if (name.includes('comp') || arName.includes('حاسب') || arName.includes('برمجة') || name.includes('digital') || arName.includes('مهارات')) return '/assets/images/student/subject-computing-3d.png';
    if (name.includes('arab') || arName.includes('عربي') || arName.includes('عربية')) return '/assets/images/student/subject-arabic-3d.png';
    if (name.includes('eng') || arName.includes('انجليزي') || arName.includes('إنجليزية')) return '/assets/images/student/subject-english-3d.png';
    if (name.includes('hist') || arName.includes('تاريخ')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('geo') || arName.includes('جغرافيا')) return '/assets/images/student/subject-geography-3d.jpg';
    if (name.includes('islam') || arName.includes('إسلامي') || arName.includes('دين') || arName.includes('تربية')) return '/assets/images/student/subject-islamic-3d.jpg';
    if (name.includes('social') || arName.includes('دراسات')) return '/assets/images/student/subject-history-3d.jpg';
    return '/assets/images/student/subject-science-3d.png';
  }

  // Helper to open content
  openContent(url: string) {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  }

  // Interactive Video Player logic
  playVideo(lesson: any) {
    this.activeVideoLesson.set(lesson);
  }

  closeVideo() {
    this.activeVideoLesson.set(null);
  }

  // Interactive Homework modal logic
  openHomeworkModal(lesson: any) {
    this.activeHomework.set(lesson);
    this.homeworkFileUploaded.set(false);
    this.homeworkSubmitted.set(false);
  }

  uploadHomeworkFile() {
    this.homeworkFileUploaded.set(true);
  }

  submitHomework() {
    this.homeworkSubmitted.set(true);
  }

  closeHomework() {
    this.activeHomework.set(null);
  }

  // Interactive Quiz logic
  startQuiz(lesson: any) {
    this.activeQuiz.set(lesson);
    this.quizCurrentIndex.set(0);
    this.quizSelectedAnswer.set(null);
    this.quizScore.set(0);
    this.quizCompleted.set(false);
    this.quizTimer.set(300);

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.quizTimer.update(t => {
        if (t <= 1) {
          this.submitQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  selectQuizAnswer(index: number) {
    this.quizSelectedAnswer.set(index);
  }

  nextQuizQuestion() {
    const sel = this.quizSelectedAnswer();
    if (sel === null) return;

    // Check correct answer
    const currentQ = this.quizQuestions[this.quizCurrentIndex()];
    if (sel === currentQ.correct) {
      this.quizScore.update(s => s + 1);
    }

    if (this.quizCurrentIndex() < this.quizQuestions.length - 1) {
      this.quizCurrentIndex.update(i => i + 1);
      this.quizSelectedAnswer.set(null);
    } else {
      this.submitQuiz();
    }
  }

  submitQuiz() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.quizCompleted.set(true);
  }

  closeQuiz() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.activeQuiz.set(null);
  }

  private loadCourse(): void {
    const id = this.subjectId();
    this.isLoading.set(true);
    this.error.set(null);
    if (!id) {
      this.error.set('تعذر العثور على المقرر المطلوب.');
      this.isLoading.set(false);
      return;
    }
    
    this.service.getCourses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: courses => {
        const course = courses.find(c => String(c.subjectId) === String(id)) ?? null;
        this.course.set(course);
        if (!course) {
          this.error.set('تعذر العثور على هذا المقرر ضمن مقرراتك.');
        } else {
          // Preload content & sessions tabs automatically to extract units & next sessions
          this.loadTab('content');
          this.loadTab('sessions');
        }
        this.isLoading.set(false);
      },
      error: e => {
        this.error.set(this.service.resolveErrorMessage(e));
        this.isLoading.set(false);
      }
    });
  }

  private finish(tab: Tab): void {
    this.loadingTab.set(null);
    this.loaded.update(v => new Set(v).add(tab));
  }

  private loadTab(tab: Tab): void {
    const id = this.subjectId();
    if (!id || tab === 'overview') return;
    this.loadingTab.set(tab);

    if (tab === 'content') {
      this.service.getContent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: v => {
          this.content.set(v);
          this.finish(tab);
        },
        error: () => this.finish(tab)
      });
      
      this.lessonsService.getLessons(Number(id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: v => {
          this.lessons.set(v);
        },
        error: () => this.lessons.set([])
      });
      return;
    }

    if (tab === 'assignments') {
      this.service.getAssignments(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: v => {
          this.assignments.set(v);
          this.finish(tab);
        },
        error: () => this.finish(tab)
      });
      return;
    }

    if (tab === 'exams') {
      this.service.getExams(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: v => {
          this.exams.set(v);
          this.finish(tab);
        },
        error: () => this.finish(tab)
      });
      return;
    }

    // Sessions loading
    this.service.getMyClass().pipe(
      switchMap(c => this.service.getSchedule(c.academicYear)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: v => {
        this.sessions.set(v.filter(s => String(s.subjectId) === String(id)));
        this.finish(tab);
      },
      error: () => this.finish(tab)
    });
  }
}
