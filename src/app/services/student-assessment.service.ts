import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  AssignmentDto, SubmitAssignmentRequest, ExamDto,
  ExamAttemptDto, SaveAnswerRequest, ExamResultDto
} from '../models/assessment.models';

@Injectable({ providedIn: 'root' })
export class StudentAssessmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/student/assessment`;

  // ── Assignments ────────────────────────────────────────────────────────────

  getAssignments(subjectId: number): Observable<AssignmentDto[]> {
    return this.http.get<AssignmentDto[]>(`${this.base}/subjects/${subjectId}/assignments`);
  }

  submitAssignment(assignmentId: number, req: SubmitAssignmentRequest, file?: File): Observable<any> {
    const formData = new FormData();
    if (req.textContent) {
      formData.append('textContent', req.textContent);
    }
    if (file) {
      formData.append('file', file);
    }
    return this.http.post(`${this.base}/assignments/${assignmentId}/submit`, formData);
  }

  // ── Exams ──────────────────────────────────────────────────────────────────

  getOpenExams(subjectId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.base}/subjects/${subjectId}/exams`);
  }

  startExam(examId: number): Observable<ExamAttemptDto> {
    return this.http.post<ExamAttemptDto>(`${this.base}/exams/${examId}/start`, {});
  }

  saveAnswer(studentExamId: number, req: SaveAnswerRequest, file?: File): Observable<void> {
    const formData = new FormData();
    formData.append('questionId', req.questionId.toString());
    if (req.answerText) {
      formData.append('answerText', req.answerText);
    }
    if (req.selectedOptionId) {
      formData.append('selectedOptionId', req.selectedOptionId);
    }
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<void>(`${this.base}/student-exams/${studentExamId}/answers`, formData);
  }

  submitExam(studentExamId: number): Observable<ExamResultDto> {
    return this.http.post<ExamResultDto>(`${this.base}/student-exams/${studentExamId}/submit`, {});
  }

  getExamResult(studentExamId: number): Observable<ExamResultDto> {
    return this.http.get<ExamResultDto>(`${this.base}/student-exams/${studentExamId}/result`);
  }
}
