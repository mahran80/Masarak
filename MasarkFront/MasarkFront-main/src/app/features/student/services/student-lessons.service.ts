import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { Lesson, LessonDetail } from '../../teacher/models/teacher-lessons.model';

@Injectable({
  providedIn: 'root',
})
export class StudentLessonsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/student/lessons`;

  getLessons(subjectId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/subjects/${subjectId}`);
  }

  getLessonDetail(lessonId: number): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${this.apiUrl}/${lessonId}`);
  }
}
