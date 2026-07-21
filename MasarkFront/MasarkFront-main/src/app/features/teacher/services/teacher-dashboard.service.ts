import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TeacherDashboardStats {
  totalStudents: number;
  activeCourses: number;
  assignmentsToGrade: number;
  averagePerformance: number;
}

export interface TeacherActivity {
  title: string;
  time: string;
  icon: string;
  color: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
}

export interface TeacherChartData {
  labels: string[];
  datasets: ChartDataset[];
}

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/teacher/dashboard`;

  getStats(): Observable<TeacherDashboardStats> {
    return this.http.get<TeacherDashboardStats>(`${this.apiUrl}/stats`);
  }

  getActivities(): Observable<TeacherActivity[]> {
    return this.http.get<TeacherActivity[]>(`${this.apiUrl}/activities`);
  }

  getPerformanceChart(): Observable<TeacherChartData> {
    return this.http.get<TeacherChartData>(`${this.apiUrl}/charts/performance`);
  }

  getAttendanceChart(): Observable<TeacherChartData> {
    return this.http.get<TeacherChartData>(`${this.apiUrl}/charts/attendance`);
  }
}
