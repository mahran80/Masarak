import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { StudentAssignment, StudentContentItem, StudentCourse, StudentEntityId, StudentExam, StudentScheduleSession } from '../../models';
import { StudentService } from '../../services/student.service';
import { StudentLessonsService } from '../../services/student-lessons.service';
import { Lesson } from '../../../teacher/models/teacher-lessons.model';

type Tab = 'overview' | 'content' | 'assignments' | 'exams' | 'sessions';

@Component({ selector: 'app-student-course-details-page', standalone: true, imports: [DatePipe, RouterLink], templateUrl: './course-details.component.html', styleUrl: './course-details.component.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class StudentCourseDetailsPageComponent implements OnInit {
  private route = inject(ActivatedRoute); private router = inject(Router); private service = inject(StudentService); private lessonsService = inject(StudentLessonsService); private destroyRef = inject(DestroyRef);
  readonly course = signal<StudentCourse | null>(null); readonly subjectId = signal<StudentEntityId | null>(null); readonly isLoading = signal(true); readonly error = signal<string | null>(null); readonly tab = signal<Tab>('overview'); readonly loadingTab = signal<Tab | null>(null); readonly loaded = signal<Set<Tab>>(new Set(['overview']));
  readonly content = signal<StudentContentItem[]>([]); readonly lessons = signal<Lesson[]>([]); readonly assignments = signal<StudentAssignment[]>([]); readonly exams = signal<StudentExam[]>([]); readonly sessions = signal<StudentScheduleSession[]>([]);
  readonly tabs: {id: Tab; label: string}[] = [{id:'overview',label:'نظرة عامة'},{id:'content',label:'الدروس والمحتوى'},{id:'assignments',label:'الواجبات'},{id:'exams',label:'الاختبارات'},{id:'sessions',label:'الحصص المباشرة'}];
  readonly visual = computed(() => { const n = `${this.course()?.subjectName ?? ''} ${this.course()?.subjectArabicName ?? ''}`.toLowerCase(); return n.includes('science')||n.includes('علوم')?'science':n.includes('arab')||n.includes('عرب')?'arabic':n.includes('english')||n.includes('انجلي')?'english':n.includes('computer')||n.includes('حاسب')?'computing':'math'; });
  ngOnInit(): void { this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => { this.subjectId.set(p.get('subjectId')); this.loadCourse(); }); }
  selectTab(tab: Tab): void { this.tab.set(tab); if (!this.loaded().has(tab)) this.loadTab(tab); }
  join(session: StudentScheduleSession): void { if (session.sessionId !== undefined) this.router.navigate(['/dashboard/student/sessions', session.sessionId, 'live']); }
  retry(): void { this.loadCourse(); }
  private loadCourse(): void { const id=this.subjectId(); this.isLoading.set(true); this.error.set(null); if(!id){this.error.set('تعذر العثور على المقرر المطلوب.');this.isLoading.set(false);return;} this.service.getCourses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:courses=>{const course=courses.find(c=>String(c.subjectId)===String(id))??null;this.course.set(course);if(!course)this.error.set('تعذر العثور على هذا المقرر ضمن مقرراتك.');this.isLoading.set(false);},error:e=>{this.error.set(this.service.resolveErrorMessage(e));this.isLoading.set(false);}}); }
  private finish(tab: Tab): void { this.loadingTab.set(null); this.loaded.update(v=>new Set(v).add(tab)); }
  private loadTab(tab: Tab): void { const id=this.subjectId(); if(!id||tab==='overview')return; this.loadingTab.set(tab); if(tab==='content'){this.service.getContent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>{this.content.set(v);this.finish(tab)},error:()=>this.finish(tab)});this.lessonsService.getLessons(Number(id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>this.lessons.set(v),error:()=>this.lessons.set([])});return;} if(tab==='assignments'){this.service.getAssignments(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>{this.assignments.set(v);this.finish(tab)},error:()=>this.finish(tab)});return;} if(tab==='exams'){this.service.getExams(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>{this.exams.set(v);this.finish(tab)},error:()=>this.finish(tab)});return;} this.service.getMyClass().pipe(switchMap(c=>this.service.getSchedule(c.academicYear)),takeUntilDestroyed(this.destroyRef)).subscribe({next:v=>{this.sessions.set(v.filter(s=>String(s.subjectId)===String(id)));this.finish(tab)},error:()=>this.finish(tab)}); }
}
