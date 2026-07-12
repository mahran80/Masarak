import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MessageResponse } from '../../../core/models/auth.models';

export interface TeacherProfileDetails {
  hiringDate: string;
}

export interface StudentProfileDetails {
  enrollmentDate: string;
  academicStatus: string;
  gradeId: number;
}

export interface LinkedChildDto {
  studentId: number;
  userId: number;
  fullName: string;
  avatarUrl?: string;
  gradeName?: string;
  className?: string;
  hasActiveSubscription: boolean;
}

export interface UserProfileDto {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  country?: string;
  avatarUrl?: string;
  bio?: string;
  headline?: string;
  createdAt: string;
  teacherDetails?: TeacherProfileDetails;
  studentDetails?: StudentProfileDetails;
  linkedChildren?: LinkedChildDto[];
}

export interface UpdateProfileDto {
  fullName: string;
  phone?: string;
  country?: string;
  bio?: string;
  headline?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/profile`;

  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(this.apiUrl);
  }

  getStudentProfile(studentId: number): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/student/${studentId}`);
  }

  updateProfile(data: UpdateProfileDto): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(this.apiUrl, data);
  }

  uploadAvatar(file: File): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MessageResponse>(`${this.apiUrl}/avatar`, formData);
  }

  removeAvatar(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/avatar`);
  }

  updateStudentProfile(studentId: number, data: UpdateProfileDto): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/student/${studentId}`, data);
  }

  uploadStudentAvatar(studentId: number, file: File): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MessageResponse>(`${this.apiUrl}/student/${studentId}/avatar`, formData);
  }

  removeStudentAvatar(studentId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.apiUrl}/student/${studentId}/avatar`);
  }
}
