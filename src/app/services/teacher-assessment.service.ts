import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  AssignmentDto, CreateAssignmentRequest, SubmissionDetailDto,
  ExamDto, CreateExamRequest, QuestionDto, AddQuestionRequest,
  GradeSubmissionRequest
} from '../models/assessment.models';

@Injectable({ providedIn: 'root' })
export class TeacherAssessmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/teacher/assessment`;

  // ── Assignments ────────────────────────────────────────────────────────────

  createAssignment(req: CreateAssignmentRequest): Observable<AssignmentDto> {
    return this.http.post<AssignmentDto>(`${this.base}/assignments`, req);
  }

  publishAssignment(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/assignments/${id}/publish`, {});
  }

  closeAssignment(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/assignments/${id}/close`, {});
  }

  getAssignments(taId: number): Observable<AssignmentDto[]> {
    return this.http.get<AssignmentDto[]>(`${this.base}/teaching-assignments/${taId}/assignments`);
  }

  // ── Submissions ────────────────────────────────────────────────────────────

  getSubmissions(assignmentId: number): Observable<SubmissionDetailDto[]> {
    return this.http.get<SubmissionDetailDto[]>(`${this.base}/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(submissionId: number, req: GradeSubmissionRequest): Observable<any> {
    return this.http.post(`${this.base}/submissions/${submissionId}/grade`, req);
  }

  getSubmissionFileUrl(submissionId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.base}/submissions/${submissionId}/file`);
  }

  // ── Exams ──────────────────────────────────────────────────────────────────

  createExam(req: CreateExamRequest): Observable<ExamDto> {
    return this.http.post<ExamDto>(`${this.base}/exams`, req);
  }

  publishExam(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/exams/${id}/publish`, {});
  }

  getExams(taId: number): Observable<ExamDto[]> {
    return this.http.get<ExamDto[]>(`${this.base}/teaching-assignments/${taId}/exams`);
  }

  // ── Questions ──────────────────────────────────────────────────────────────

  addQuestion(examId: number, req: AddQuestionRequest): Observable<QuestionDto> {
    return this.http.post<QuestionDto>(`${this.base}/exams/${examId}/questions`, req);
  }
}
