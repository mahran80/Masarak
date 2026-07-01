import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SessionDto {
  sessionId: number;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  endsAt: string;
  embedUrl?: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
  subjectName: string;
  className: string;
  teacherName: string;
}

@Injectable({
  providedIn: 'root',
})
export class TeacherSessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teacher/sessions`;

  getMySessions(from: string, to: string): Observable<SessionDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SessionDto[]>(this.baseUrl, { params });
  }
}
