import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LinkedStudentDto } from '../../../core/models/subscription.model';
import { ParentStudentLinkDto, LinkStudentRequest } from '../../../core/models/subscription.model';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/parent`;

  // --- State ---
  private readonly _linkedStudents = signal<LinkedStudentDto[]>([]);
  readonly linkedStudents = this._linkedStudents.asReadonly();
  
  private readonly _selectedStudentId = signal<number | null>(null);
  readonly selectedStudentId = this._selectedStudentId.asReadonly();

  // Derived state
  readonly selectedStudent = computed(() => {
    const id = this._selectedStudentId();
    if (!id) return null;
    return this._linkedStudents().find(s => s.studentUserId === id) || null;
  });

  readonly hasStudents = computed(() => this._linkedStudents().length > 0);

  // --- API Methods ---

  /** GET /api/parent/linked-students */
  fetchLinkedStudents(): Observable<LinkedStudentDto[]> {
    return this.http.get<LinkedStudentDto[]>(`${this.baseUrl}/linked-students`).pipe(
      tap(students => {
        this._linkedStudents.set(students);
        // Automatically select the first student if none selected
        if (students.length > 0 && !this._selectedStudentId()) {
          this._selectedStudentId.set(students[0].studentUserId);
        } else if (students.length === 0) {
          this._selectedStudentId.set(null);
        }
      })
    );
  }

  /** POST /api/parent/link-student */
  linkStudent(linkageCode: string): Observable<ParentStudentLinkDto> {
    const request: LinkStudentRequest = { studentLinkageCode: linkageCode };
    return this.http.post<ParentStudentLinkDto>(`${this.baseUrl}/link-student`, request);
  }

  /** GET /api/parent/children/{childId}/grades */
  getChildGrades(childId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/children/${childId}/grades`);
  }

  /** GET /api/parent/children/{studentId}/attendance */
  getChildAttendance(studentId: number, academicYear?: number): Observable<any[]> {
    let params = new HttpParams();
    if (academicYear) {
      params = params.set('academicYear', academicYear.toString());
    }
    return this.http.get<any[]>(`${this.baseUrl}/children/${studentId}/attendance`, { params });
  }

  /** POST /api/parent/children/{childId}/subscribe */
  subscribeForChild(childId: number, planId: number, successUrl: string, cancelUrl: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/children/${childId}/subscribe`, { planId, successUrl, cancelUrl });
  }

  // --- Actions ---

  setSelectedStudent(studentId: number) {
    this._selectedStudentId.set(studentId);
  }
}
