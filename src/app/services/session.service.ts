import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  TeachingAssignmentDto,
  SessionDto,
  CreateSessionRequest,
  UpdateSessionRequest
} from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Teaching Assignments (Teacher) ─────────────────────────────────────────
  getMyAssignments(): Observable<TeachingAssignmentDto[]> {
    return this.http.get<TeachingAssignmentDto[]>(`${this.base}/teacher/assignments`);
  }

  // ── Sessions (Teacher) ──────────────────────────────────────────────────────
  getMySessionsRange(from: string, to: string): Observable<SessionDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<SessionDto[]>(`${this.base}/teacher/sessions`, { params });
  }

  createSession(req: CreateSessionRequest): Observable<SessionDto> {
    return this.http.post<SessionDto>(`${this.base}/teacher/sessions`, req);
  }

  updateSession(id: number, req: UpdateSessionRequest): Observable<SessionDto> {
    return this.http.put<SessionDto>(`${this.base}/teacher/sessions/${id}`, req);
  }

  cancelSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/teacher/sessions/${id}`);
  }
}
