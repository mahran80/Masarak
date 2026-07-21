import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AttendanceRecordDto {
  attendanceId: number;
  studentId: number;
  studentName: string;
  status: 'Present' | 'Absent' | 'Excused';
  joinedAt?: string;
  teacherNote?: string;
}

export interface SessionAttendanceDto {
  sessionId: number;
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  records: AttendanceRecordDto[];
}

export interface OverrideAttendanceRequest {
  newStatus: 'Present' | 'Absent' | 'Excused';
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherAttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/teacher`;

  getSessionAttendance(sessionId: number): Observable<SessionAttendanceDto> {
    return this.http.get<SessionAttendanceDto>(`${this.baseUrl}/sessions/${sessionId}/attendance`);
  }

  overrideAttendance(attendanceId: number, request: OverrideAttendanceRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/attendance/${attendanceId}/override`, request);
  }
}
