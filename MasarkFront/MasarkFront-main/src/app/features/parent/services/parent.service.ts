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

  fetchLinkedStudents(): Observable<LinkedStudentDto[]> {
    return this.http.get<LinkedStudentDto[]>(`${this.baseUrl}/linked-students`).pipe(
      tap(students => {
        this._linkedStudents.set(students);
        
        if (students.length > 0) {
          // If no student is selected, or the currently selected student is not in the new list, select the first one
          const isValidSelection = students.some(s => s.studentUserId === this._selectedStudentId());
          if (!isValidSelection) {
            this._selectedStudentId.set(students[0].studentUserId);
          }
        } else {
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

  /** GET /api/parent/children/{studentId}/schedule */
  getChildSchedule(studentId: number, weekStart?: string): Observable<any> {
    let params = new HttpParams();
    if (weekStart) {
      params = params.set('weekStart', weekStart);
    }
    return this.http.get<any>(`${this.baseUrl}/children/${studentId}/schedule`, { params });
  }

  /** POST /api/parent/children/{childId}/subscribe */
  subscribeForChild(childId: number, planId: number, successUrl: string, cancelUrl: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/children/${childId}/subscribe`, { planId, successUrl, cancelUrl });
  }

  /** GET /api/parent/children/{childId}/subscription */
  getChildSubscription(childId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/children/${childId}/subscription`);
  }

  /** POST /api/parent/children/{childId}/subscribe/change */
  changeChildSubscription(childId: number, newPlanId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/children/${childId}/subscribe/change`, { newPlanId });
  }

  // --- Actions ---

  setSelectedStudent(studentId: number) {
    this._selectedStudentId.set(studentId);
  }
}
