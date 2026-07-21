import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TeacherLessonsService } from '../../../services/teacher-lessons.service';
import { Lesson, LessonDetail } from '../../../models/teacher-lessons.model';
import { environment } from '../../../../../../environments/environment';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-lessons-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './lessons-manager.component.html',
  styleUrls: ['./lessons-manager.component.scss'],
})
export class LessonsManagerComponent implements OnInit {
  private lessonsService = inject(TeacherLessonsService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  teachingAssignments: any[] = [];
  selectedTaId: number | null = null;
  lessons: Lesson[] = [];
  lessonDetails: { [key: number]: LessonDetail } = {};
  lessonsPage = 1;
  lessonsPageSize = 9;
  isLoadingLessons = false;
  lessonsError = '';

  lessonForm: FormGroup;
  isEditMode = false;
  editingLessonId: number | null = null;
  showForm = false;
  
  showCloneModal = false;
  cloningLessonId: number | null = null;
  cloneForm: FormGroup;

  expandedLessonId: number | null = null;

  constructor() {
    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
    });

    this.cloneForm = this.fb.group({
      targetTaIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTeachingAssignments();
  }

  loadTeachingAssignments() {
    this.http.get<any[]>(`${environment.apiUrl}/teacher/assignments`).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.teachingAssignments = data;
          this.cdr.detectChanges();
        });
      },
    });
  }

  onSelectTa(event: any) {
    this.selectedTaId = +event.target.value;
    this.lessonsPage = 1;
    if (this.selectedTaId) {
      this.loadLessons();
    } else {
      this.lessons = [];
    }
  }

  loadLessons() {
    if (!this.selectedTaId) return;
    this.isLoadingLessons = true;
    this.lessonsError = '';
    this.lessonsService.getLessons(this.selectedTaId).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.lessons = data.sort((a, b) => a.orderNum - b.orderNum);
          this.lessonsPage = Math.min(this.lessonsPage, this.lessonsTotalPages);
          this.isLoadingLessons = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.isLoadingLessons = false;
        this.lessonsError = 'تعذّر تحميل الدروس. يرجى المحاولة مرة أخرى.';
        this.cdr.detectChanges();
      },
    });
  }

  get selectedAssignment(): any | null {
    return this.teachingAssignments.find(ta => ta.id === this.selectedTaId) || null;
  }

  get lessonsTotalPages(): number {
    return Math.max(1, Math.ceil(this.lessons.length / this.lessonsPageSize));
  }

  get paginatedLessons(): Lesson[] {
    const start = (this.lessonsPage - 1) * this.lessonsPageSize;
    return this.lessons.slice(start, start + this.lessonsPageSize);
  }

  get lessonsRangeStart(): number {
    return this.lessons.length ? (this.lessonsPage - 1) * this.lessonsPageSize + 1 : 0;
  }

  get lessonsRangeEnd(): number {
    return Math.min(this.lessonsPage * this.lessonsPageSize, this.lessons.length);
  }

  setLessonsPage(page: number): void {
    this.lessonsPage = Math.min(Math.max(page, 1), this.lessonsTotalPages);
  }

  changeLessonsPageSize(event: Event): void {
    this.lessonsPageSize = Number((event.target as HTMLSelectElement).value);
    this.lessonsPage = 1;
  }

  paginationPages(): number[] {
    if (this.lessonsTotalPages <= 7) {
      return Array.from({ length: this.lessonsTotalPages }, (_, index) => index + 1);
    }
    const pages = new Set([1, this.lessonsTotalPages, this.lessonsPage - 1, this.lessonsPage, this.lessonsPage + 1]);
    const sorted = [...pages].filter(page => page > 0 && page <= this.lessonsTotalPages).sort((a, b) => a - b);
    const result: number[] = [];
    sorted.forEach((page, index) => {
      if (index && page - sorted[index - 1] > 1) result.push(0);
      result.push(page);
    });
    return result;
  }

  openCreateForm() {
    this.isEditMode = false;
    this.editingLessonId = null;
    this.lessonForm.reset();
    this.showForm = true;
  }

  openEditForm(lesson: Lesson) {
    this.isEditMode = true;
    this.editingLessonId = lesson.lessonId;
    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description,
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.lessonForm.reset();
  }

  submitForm() {
    if (this.lessonForm.invalid || !this.selectedTaId) return;

    if (this.isEditMode && this.editingLessonId) {
      this.lessonsService.updateLesson(this.editingLessonId, this.lessonForm.value).subscribe({
        next: () => {
          this.loadLessons();
          this.cancelForm();
        },
      });
    } else {
      const createReq = {
        teachingAssignmentId: this.selectedTaId,
        ...this.lessonForm.value,
      };
      this.lessonsService.createLesson(createReq).subscribe({
        next: () => {
          this.loadLessons();
          this.cancelForm();
        },
      });
    }
  }

  deleteLesson(lessonId: number) {
    if (confirm('Are you sure you want to delete this lesson? Items will NOT be deleted, only detached.')) {
      this.lessonsService.deleteLesson(lessonId).subscribe({
        next: () => this.loadLessons(),
      });
    }
  }

  publishLesson(lessonId: number) {
    if (confirm('Publish this lesson? Students will be able to see it.')) {
      this.lessonsService.publishLesson(lessonId).subscribe({
        next: () => this.loadLessons(),
      });
    }
  }

  moveUp(index: number) {
    if (index === 0) return;
    const item = this.lessons[index];
    this.lessons[index] = this.lessons[index - 1];
    this.lessons[index - 1] = item;
    this.updateOrder();
  }

  moveDown(index: number) {
    if (index === this.lessons.length - 1) return;
    const item = this.lessons[index];
    this.lessons[index] = this.lessons[index + 1];
    this.lessons[index + 1] = item;
    this.updateOrder();
  }

  updateOrder() {
    const orderedIds = this.lessons.map(l => l.lessonId);
    if (this.selectedTaId) {
      this.lessonsService.reorderLessons(this.selectedTaId, { lessonIdsInOrder: orderedIds }).subscribe({
        next: () => this.loadLessons()
      });
    }
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
          }
        });
      }
    }
  }

  // Clone operations
  openCloneModal(lessonId: number) {
    this.cloningLessonId = lessonId;
    this.showCloneModal = true;
    this.cloneForm.reset({ targetTaIds: [] });
  }

  closeCloneModal() {
    this.showCloneModal = false;
    this.cloningLessonId = null;
  }

  toggleCloneTa(taId: number, event: any) {
    const current = this.cloneForm.value.targetTaIds || [];
    if (event.target.checked) {
      this.cloneForm.patchValue({ targetTaIds: [...current, taId] });
    } else {
      this.cloneForm.patchValue({ targetTaIds: current.filter((id: number) => id !== taId) });
    }
  }

  submitClone() {
    if (this.cloneForm.invalid || !this.cloningLessonId) return;
    this.lessonsService.cloneLesson(this.cloningLessonId, this.cloneForm.value).subscribe({
      next: () => {
        alert('Lesson cloned successfully!');
        this.closeCloneModal();
      }
    });
  }

  // Detach Operations
  detachContent(lessonId: number, contentId: number) {
    if(confirm('Detach this content?')) {
      this.lessonsService.detachContent(contentId).subscribe(() => {
        this.lessonsService.getLessonDetail(lessonId).subscribe((d: any) => this.lessonDetails[lessonId] = d);
        this.loadLessons();
      });
    }
  }
  detachExam(lessonId: number, examId: number) {
    if(confirm('Detach this exam?')) {
      this.lessonsService.detachExam(examId).subscribe(() => {
        this.lessonsService.getLessonDetail(lessonId).subscribe((d: any) => this.lessonDetails[lessonId] = d);
        this.loadLessons();
      });
    }
  }
  detachAssignment(lessonId: number, assignmentId: number) {
    if(confirm('Detach this assignment?')) {
      this.lessonsService.detachAssignment(assignmentId).subscribe(() => {
        this.lessonsService.getLessonDetail(lessonId).subscribe((d: any) => this.lessonDetails[lessonId] = d);
        this.loadLessons();
      });
    }
  }
}
