import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { StudentLessonsService } from '../../services/student-lessons.service';
import { Lesson, LessonDetail } from '../../../teacher/models/teacher-lessons.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, IconComponent],
  templateUrl: './student-lessons.component.html',
})
export class StudentLessonsComponent implements OnInit {
  private lessonsService = inject(StudentLessonsService);
  private http = inject(HttpClient);
  private location = inject(Location);

  subjects: any[] = [];
  selectedSubjectId: number | null = null;
  lessons: Lesson[] = [];
  lessonDetails: { [key: number]: LessonDetail } = {};
  expandedLessonId: number | null = null;

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    this.loadSubjects();
  }

  private cdr = inject(ChangeDetectorRef);

  loadSubjects() {
    this.http.get<any[]>(`${environment.apiUrl}/student/courses`).subscribe({
      next: (data) => {
        this.subjects = data;
        this.cdr.detectChanges();
      },
    });
  }

  onSelectSubject(event: any) {
    this.selectedSubjectId = +event.target.value;
    if (this.selectedSubjectId) {
      this.loadLessons();
    } else {
      this.lessons = [];
    }
  }

  loadLessons() {
    if (!this.selectedSubjectId) return;
    this.lessonsService.getLessons(this.selectedSubjectId).subscribe({
      next: (data) => {
        this.lessons = data;
        this.cdr.detectChanges();
      },
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
          }
        });
      }
    }
  }

  openContent(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
