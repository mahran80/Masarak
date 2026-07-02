import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, forkJoin, of, tap } from 'rxjs';

export interface TeachingAssignment {
  id: number;
  className: string;
  subjectName: string;
  academicYear: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherContextService {
  private readonly http = inject(HttpClient);
  private readonly teacherBaseUrl = `${environment.apiUrl}/teacher`;

  readonly assignments = signal<TeachingAssignment[]>([]);
  readonly selectedAssignmentId = signal<number | null>(null);
  readonly isLoading = signal(false);

  readonly selectedAssignment = computed(() => 
    this.assignments().find(a => a.id === this.selectedAssignmentId()) ?? null
  );

  loadAssignments() {
    if (this.assignments().length > 0) return; // Already loaded

    this.isLoading.set(true);
    const now = new Date();
    const thisYear = now.getFullYear();
    const nextYear = thisYear + 1;

    const fetch = (year: number) =>
      this.http.get<TeachingAssignment[]>(`${this.teacherBaseUrl}/assignments?academicYear=${year}`)
        .pipe(catchError(() => of([] as TeachingAssignment[])));

    forkJoin([fetch(thisYear), fetch(nextYear)])
      .subscribe(([thisYearData, nextYearData]) => {
        const seen = new Set<number>();
        const merged = [...thisYearData, ...nextYearData].filter((a) => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        
        this.assignments.set(merged);
        this.isLoading.set(false);
        
        // Auto-select the first one if none is selected
        if (merged.length > 0 && !this.selectedAssignmentId()) {
          this.selectedAssignmentId.set(merged[0].id);
        }
      });
  }

  selectAssignment(id: number) {
    this.selectedAssignmentId.set(id);
  }
}
