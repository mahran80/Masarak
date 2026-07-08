import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentExamGrade } from '../../models';

@Component({
  selector: 'app-student-grades-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGradesPageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

  grades = signal<StudentExamGrade[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentService.getExamGrades().subscribe({
      next: (data) => {
        this.grades.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load exam grades.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  viewDetails(studentExamId: number | string): void {
    this.router.navigate(['/dashboard/student/exams/result', studentExamId]);
  }
}
