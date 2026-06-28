import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddQuestionRequest,
  CreateAssignmentRequest,
  CreateExamRequest,
  ExamGradingReview,
  GradeStudentAnswerRequest,
  GradeSubmissionRequest,
  PendingGradingDashboard,
  TeacherAssignment,
  TeacherExam,
  TeacherQuestion,
  TeacherSubmissionDetail,
  UpdateQuestionRequest,
} from '../models/teacher-assessment.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherAssessmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teacher/assessment`;

  // --- Assignments ---
  
  getAssignments(teachingAssignmentId: number): Observable<TeacherAssignment[]> {
    return this.http.get<TeacherAssignment[]>(`${this.baseUrl}/teaching-assignments/${teachingAssignmentId}/assignments`);
  }

  createAssignment(request: CreateAssignmentRequest): Observable<TeacherAssignment> {
    return this.http.post<TeacherAssignment>(`${this.baseUrl}/assignments`, request);
  }

  publishAssignment(assignmentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/assignments/${assignmentId}/publish`, {});
  }

  closeAssignment(assignmentId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/assignments/${assignmentId}/close`, {});
  }

  getSubmissions(assignmentId: number): Observable<TeacherSubmissionDetail[]> {
    return this.http.get<TeacherSubmissionDetail[]>(`${this.baseUrl}/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(submissionId: number, request: GradeSubmissionRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/submissions/${submissionId}/grade`, request);
  }

  getSubmissionFileUrl(submissionId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.baseUrl}/submissions/${submissionId}/file`);
  }

  // --- Exams ---

  getExams(teachingAssignmentId: number): Observable<TeacherExam[]> {
    return this.http.get<TeacherExam[]>(`${this.baseUrl}/teaching-assignments/${teachingAssignmentId}/exams`);
  }

  createExam(request: CreateExamRequest): Observable<TeacherExam> {
    return this.http.post<TeacherExam>(`${this.baseUrl}/exams`, request);
  }

  publishExam(examId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/exams/${examId}/publish`, {});
  }

  closeExam(examId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/exams/${examId}/close`, {});
  }

  addQuestion(examId: number, request: AddQuestionRequest): Observable<TeacherQuestion> {
    return this.http.post<TeacherQuestion>(`${this.baseUrl}/exams/${examId}/questions`, request);
  }

  updateQuestion(examId: number, questionId: number, request: UpdateQuestionRequest): Observable<TeacherQuestion> {
    return this.http.put<TeacherQuestion>(`${this.baseUrl}/exams/${examId}/questions/${questionId}`, request);
  }

  deleteQuestion(examId: number, questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exams/${examId}/questions/${questionId}`);
  }

  // --- Grading Dashboard ---

  getPendingGrading(): Observable<PendingGradingDashboard> {
    return this.http.get<PendingGradingDashboard>(`${this.baseUrl}/grading/pending`);
  }

  getStudentExamForReview(studentExamId: number): Observable<ExamGradingReview> {
    return this.http.get<ExamGradingReview>(`${this.baseUrl}/grading/student-exams/${studentExamId}`);
  }

  gradeStudentAnswer(answerId: number, request: GradeStudentAnswerRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/grading/answers/${answerId}`, request);
  }
}
