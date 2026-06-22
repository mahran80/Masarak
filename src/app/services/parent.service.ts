import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  LinkStudentRequest, ParentStudentLinkDto, LinkedStudentDto, PagedResult
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class ParentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/parent`;

  /** POST /api/parent/link-student */
  linkStudent(code: string): Observable<ParentStudentLinkDto> {
    const body: LinkStudentRequest = { studentLinkageCode: code };
    return this.http.post<ParentStudentLinkDto>(`${this.base}/link-student`, body);
  }

  /** GET /api/parent/linked-students?pageNumber=&pageSize= */
  getLinkedStudents(pageNumber = 1, pageSize = 10): Observable<PagedResult<LinkedStudentDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize',   pageSize.toString());
    return this.http.get<PagedResult<LinkedStudentDto>>(`${this.base}/linked-students`, { params });
  }
}
