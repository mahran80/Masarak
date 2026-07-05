import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentLessonsService } from '../../services/student-lessons.service';
import { Lesson, LessonDetail } from '../../../teacher/models/teacher-lessons.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-lessons.component.html',
})
export class StudentLessonsComponent implements OnInit {
  private lessonsService = inject(StudentLessonsService);
  private http = inject(HttpClient);

  subjects: any[] = [];
  selectedSubjectId: number | null = null;
  lessons: Lesson[] = [];
  lessonDetails: { [key: number]: LessonDetail } = {};
  expandedLessonId: number | null = null;

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects() {
    this.http.get<any[]>(`${environment.apiUrl}/student/courses`).subscribe({
      next: (data) => {
        this.subjects = data;
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
