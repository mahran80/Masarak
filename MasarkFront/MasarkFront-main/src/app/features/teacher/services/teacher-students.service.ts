import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface StudentInClass {
  studentClassId: number;
  studentId: number;
  userId: number;
  fullName: string;
  email: string;
  enrollmentType: string;
  enrolledSubjects: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherStudentsService {
  private readonly http = inject(HttpClient);
  private readonly teacherBaseUrl = `${environment.apiUrl}/teacher`;

  getStudents(teachingAssignmentId: number): Observable<StudentInClass[]> {
    return this.http.get<StudentInClass[]>(`${this.teacherBaseUrl}/teaching-assignments/${teachingAssignmentId}/students`);
  }
}
