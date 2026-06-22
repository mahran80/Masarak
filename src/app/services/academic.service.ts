import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  GradeDto, CreateGradeRequest, UpdateGradeRequest,
  SubjectDto, CreateSubjectRequest, UpdateSubjectRequest,
  ClassDto, CreateClassRequest, UpdateClassRequest,
  TeachingAssignmentDto, CreateAssignmentRequest,
  StudentClassDto, StudentInClassDto, EnrollStudentRequest, StudentEnrollmentDto,
  WeeklyScheduleDto
} from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Grades (Admin) ──────────────────────────────────────────────────────────
  getGrades(): Observable<GradeDto[]> {
    return this.http.get<GradeDto[]>(`${this.base}/admin/grades`);
  }

  createGrade(req: CreateGradeRequest): Observable<GradeDto> {
    return this.http.post<GradeDto>(`${this.base}/admin/grades`, req);
  }

  updateGrade(id: number, req: UpdateGradeRequest): Observable<GradeDto> {
    return this.http.put<GradeDto>(`${this.base}/admin/grades/${id}`, req);
  }

  deleteGrade(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/grades/${id}`);
  }

  // ── Subjects (Admin) ────────────────────────────────────────────────────────
  getSubjectsByGrade(gradeId: number): Observable<SubjectDto[]> {
    return this.http.get<SubjectDto[]>(`${this.base}/admin/grades/${gradeId}/subjects`);
  }

  createSubject(req: CreateSubjectRequest): Observable<SubjectDto> {
    return this.http.post<SubjectDto>(`${this.base}/admin/subjects`, req);
  }

  updateSubject(id: number, req: UpdateSubjectRequest): Observable<SubjectDto> {
    return this.http.put<SubjectDto>(`${this.base}/admin/subjects/${id}`, req);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/subjects/${id}`);
  }

  // ── Classes (Admin) ─────────────────────────────────────────────────────────
  getClassesByGrade(gradeId: number): Observable<ClassDto[]> {
    return this.http.get<ClassDto[]>(`${this.base}/admin/grades/${gradeId}/classes`);
  }

  createClass(req: CreateClassRequest): Observable<ClassDto> {
    return this.http.post<ClassDto>(`${this.base}/admin/classes`, req);
  }

  updateClass(id: number, req: UpdateClassRequest): Observable<ClassDto> {
    return this.http.put<ClassDto>(`${this.base}/admin/classes/${id}`, req);
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/classes/${id}`);
  }

  getClassRoster(classId: number): Observable<StudentInClassDto[]> {
    return this.http.get<StudentInClassDto[]>(`${this.base}/admin/classes/${classId}/roster`);
  }

  // ── Teaching Assignments (Admin) ────────────────────────────────────────────
  getClassAssignments(classId: number): Observable<TeachingAssignmentDto[]> {
    return this.http.get<TeachingAssignmentDto[]>(`${this.base}/admin/classes/${classId}/assignments`);
  }

  createAssignment(req: CreateAssignmentRequest): Observable<TeachingAssignmentDto> {
    return this.http.post<TeachingAssignmentDto>(`${this.base}/admin/teaching-assignments`, req);
  }

  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/teaching-assignments/${id}`);
  }

  // ── Enrollments (Admin) ─────────────────────────────────────────────────────
  enrollStudent(req: EnrollStudentRequest): Observable<StudentClassDto> {
    return this.http.post<StudentClassDto>(`${this.base}/admin/enrollments`, req);
  }

  unenrollStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/enrollments/${id}`);
  }

  // ── Student ─────────────────────────────────────────────────────────────────
  getMyClass(): Observable<StudentEnrollmentDto> {
    return this.http.get<StudentEnrollmentDto>(`${this.base}/student/my-class`);
  }

  getMySchedule(weekStart: string): Observable<WeeklyScheduleDto> {
    const params = new HttpParams().set('weekStart', weekStart);
    return this.http.get<WeeklyScheduleDto>(`${this.base}/student/schedule`, { params });
  }
}
