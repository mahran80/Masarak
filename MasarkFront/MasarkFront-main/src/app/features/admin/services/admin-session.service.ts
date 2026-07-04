import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminScheduleSessionRequest {
  classId: number;
  subjectId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  isRecurring: boolean;
  recurUntil?: string;
}

export interface AdminSessionDto {
  sessionId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  endsAt: string;
  embedUrl?: string;
  status: string;
  subjectName: string;
  classId: number;
  className: string;
  teacherName: string;
  seriesId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/sessions`;

  scheduleSessionSeries(request: AdminScheduleSessionRequest): Observable<AdminSessionDto[]> {
    return this.http.post<AdminSessionDto[]>(this.apiUrl, request);
  }

  cancelSessionSeries(seriesId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/series/${seriesId}`);
  }

  cancelSingleSession(sessionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sessionId}`);
  }

  reactivateSession(sessionId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${sessionId}/reactivate`, {});
  }

  getClassSchedule(classId: number, from: string, to: string): Observable<AdminSessionDto[]> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<AdminSessionDto[]>(`${this.apiUrl}/class/${classId}`, { params });
  }

  getTeacherSchedule(teacherId: number, from: string, to: string): Observable<AdminSessionDto[]> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to);
    return this.http.get<AdminSessionDto[]>(`${this.apiUrl}/teacher/${teacherId}`, { params });
  }
}
