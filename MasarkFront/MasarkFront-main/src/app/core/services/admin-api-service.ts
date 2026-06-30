import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  hasActiveSubscription?: boolean;
  gradeId?: number | null;
  specialization?: string | null;
  studentIds?: number[];
}

export interface AdminUserDetailDto extends AdminUserDto {
  examsTaken: number;
  assignmentsSubmitted: number;
  attendancePercentage: number;
}

export interface SystemHealthDto {
  totalUsers: number;
  activeUsers: number;
  totalNotifications: number;
  activeSubscriptions: number;
  totalContentItems: number;
  totalSessions: number;
  recentErrors: string[];
}

export interface AdminUsersPagedResult {
  items: AdminUserDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminCreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  /** GET /api/admin/users?page=&pageSize=&role= */
  getUsers(
    page = 1,
    pageSize = 100,
    role?: string,
  ): Observable<AdminUsersPagedResult | AdminUserDto[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (role) params = params.set('role', role);
    return this.http.get<AdminUsersPagedResult | AdminUserDto[]>(`${this.base}/users`, { params });
  }

  /** POST /api/auth/register — mapped from admin create user */
  createUser(req: AdminCreateUserRequest): Observable<AdminUserDto> {
    const payload = { ...req, confirmPassword: req.password };
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, payload).pipe(
      map(res => res.user as AdminUserDto)
    );
  }

  /** DELETE /api/admin/users/{id} */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/users/${userId}`);
  }

  /** GET /api/admin/dashboard */
  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/dashboard`);
  }

  /** GET /api/admin/performance/classes/{classId}/subjects/{subjectId} */
  getClassReport(classId: number, subjectId: number, academicYear: string): Observable<any> {
    let params = new HttpParams().set('academicYear', academicYear);
    return this.http.get<any>(`${this.base}/performance/classes/${classId}/subjects/${subjectId}`, { params });
  }

  // --- Phase 6 Endpoints ---

  /** GET /api/admin/users/{id} */
  getUserDetails(userId: number): Observable<AdminUserDetailDto> {
    return this.http.get<AdminUserDetailDto>(`${this.base}/users/${userId}`);
  }

  /** PUT /api/admin/users/{id}/deactivate */
  deactivateUser(userId: number, reason: string): Observable<void> {
    return this.http.put<void>(`${this.base}/users/${userId}/deactivate`, { reason });
  }

  /** PUT /api/admin/users/{id}/activate */
  activateUser(userId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/users/${userId}/activate`, {});
  }

  /** POST /api/admin/users/{id}/reset-password */
  resetUserPassword(userId: number, newPassword?: string): Observable<{ password?: string, message?: string }> {
    return this.http.post<{ password?: string, message?: string }>(`${this.base}/users/${userId}/reset-password`, { newPassword });
  }

  /** PUT /api/admin/content/{id}/moderate */
  moderateContentItem(contentId: number, reason: string): Observable<void> {
    return this.http.put<void>(`${this.base}/content/${contentId}/moderate`, { reason });
  }

  /** GET /api/admin/system/health */
  getSystemHealth(): Observable<SystemHealthDto> {
    return this.http.get<SystemHealthDto>(`${this.base}/system/health`);
  }
}
