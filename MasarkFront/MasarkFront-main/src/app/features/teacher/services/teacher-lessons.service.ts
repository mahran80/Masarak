import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import {
  Lesson,
  LessonDetail,
  CreateLessonRequest,
  UpdateLessonRequest,
  ReorderLessonsRequest,
  CloneLessonRequest,
} from '../models/teacher-lessons.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherLessonsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teacher/lessons`;

  getLessons(taId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/teaching-assignments/${taId}`);
  }

  getLessonDetail(lessonId: number): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${this.apiUrl}/${lessonId}`);
  }

  createLesson(request: CreateLessonRequest): Observable<LessonDetail> {
    return this.http.post<LessonDetail>(this.apiUrl, request);
  }

  updateLesson(lessonId: number, request: UpdateLessonRequest): Observable<LessonDetail> {
    return this.http.put<LessonDetail>(`${this.apiUrl}/${lessonId}`, request);
  }

  deleteLesson(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${lessonId}`);
  }

  publishLesson(lessonId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${lessonId}/publish`, {});
  }

  reorderLessons(taId: number, request: ReorderLessonsRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/teaching-assignments/${taId}/reorder`, request);
  }

  cloneLesson(lessonId: number, request: CloneLessonRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${lessonId}/clone`, request);
  }

  attachContent(lessonId: number, contentItemId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${lessonId}/attach-content/${contentItemId}`, {});
  }

  detachContent(contentItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detach-content/${contentItemId}`);
  }

  attachExam(lessonId: number, examId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${lessonId}/attach-exam/${examId}`, {});
  }

  detachExam(examId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detach-exam/${examId}`);
  }

  attachAssignment(lessonId: number, assignmentId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${lessonId}/attach-assignment/${assignmentId}`, {});
  }

  detachAssignment(assignmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detach-assignment/${assignmentId}`);
  }
}
