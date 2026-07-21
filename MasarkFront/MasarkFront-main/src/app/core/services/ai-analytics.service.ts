import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PlatformAnalyticsDto,
  GradeHeatmapDto,
  AiPromptTemplateDto,
  UpdatePromptTemplateRequest,
  ParentReportDto,
  GenerateParentReportRequest,
  PerformanceAlertDto,
  ClassAnalyticsDashboardDto,
  StudentInsightDto,
  TeachingSuggestionDto,
  LearningInsightsDashboardDto,
  ContentRecommendationDto
} from '../../models/ai-analytics.model';

@Injectable({ providedIn: 'root' })
export class AiAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // --- Admin Endpoints ---

  /** GET /api/admin/analytics/platform */
  getPlatformAnalytics(academicYear: number = 2026): Observable<PlatformAnalyticsDto> {
    const params = new HttpParams().set('academicYear', academicYear.toString());
    return this.http.get<PlatformAnalyticsDto>(`${this.baseUrl}/admin/analytics/platform`, { params });
  }

  /** GET /api/admin/analytics/grades/{gradeId}/heatmap */
  getGradeHeatmap(gradeId: number, academicYear: number = 2026): Observable<GradeHeatmapDto> {
    const params = new HttpParams().set('academicYear', academicYear.toString());
    return this.http.get<GradeHeatmapDto>(`${this.baseUrl}/admin/analytics/grades/${gradeId}/heatmap`, { params });
  }

  /** GET /api/admin/ai/prompt-templates */
  getAllPromptTemplates(): Observable<AiPromptTemplateDto[]> {
    return this.http.get<AiPromptTemplateDto[]>(`${this.baseUrl}/admin/ai/prompt-templates`);
  }

  /** PUT /api/admin/ai/prompt-templates/{key} */
  updatePromptTemplate(key: string, request: UpdatePromptTemplateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/admin/ai/prompt-templates/${key}`, request);
  }

  // --- Parent Endpoints ---

  /** GET /api/parent/reports/{studentId}/{month} */
  getParentReport(studentId: number, month: string): Observable<ParentReportDto> {
    return this.http.get<ParentReportDto>(`${this.baseUrl}/parent/reports/${studentId}/${month}`);
  }

  /** POST /api/parent/reports/{studentId}/generate */
  generateParentReport(studentId: number, request: GenerateParentReportRequest): Observable<ParentReportDto> {
    return this.http.post<ParentReportDto>(`${this.baseUrl}/parent/reports/${studentId}/generate`, request);
  }

  /** GET /api/parent/children/{studentId}/alerts */
  getStudentAlerts(studentId: number): Observable<PerformanceAlertDto[]> {
    return this.http.get<PerformanceAlertDto[]>(`${this.baseUrl}/parent/children/${studentId}/alerts`);
  }

  // --- Teacher Endpoints ---

  /** GET /api/teacher/analytics/{classId}/{subjectId} */
  getClassAnalytics(classId: number, subjectId: number, academicYear: number = 2026): Observable<ClassAnalyticsDashboardDto> {
    const params = new HttpParams().set('academicYear', academicYear.toString());
    return this.http.get<ClassAnalyticsDashboardDto>(`${this.baseUrl}/teacher/analytics/${classId}/${subjectId}`, { params });
  }

  /** GET /api/teacher/students/{studentId}/insights/{subjectId} */
  getStudentInsightForTeacher(studentId: number, subjectId: number): Observable<StudentInsightDto> {
    return this.http.get<StudentInsightDto>(`${this.baseUrl}/teacher/students/${studentId}/insights/${subjectId}`);
  }

  /** POST /api/teacher/students/{studentId}/suggestions/{subjectId} */
  generateTeachingSuggestion(studentId: number, subjectId: number): Observable<TeachingSuggestionDto> {
    return this.http.post<TeachingSuggestionDto>(`${this.baseUrl}/teacher/students/${studentId}/suggestions/${subjectId}`, {});
  }

  // --- Student Endpoints ---

  /** GET /api/student/insights */
  getStudentInsights(academicYear: number = 2026): Observable<LearningInsightsDashboardDto> {
    const params = new HttpParams().set('academicYear', academicYear.toString());
    return this.http.get<LearningInsightsDashboardDto>(`${this.baseUrl}/student/insights`, { params });
  }

  /** GET /api/student/recommendations/{subjectId} */
  getStudentRecommendations(subjectId: number): Observable<ContentRecommendationDto[]> {
    return this.http.get<ContentRecommendationDto[]>(`${this.baseUrl}/student/recommendations/${subjectId}`);
  }
}
