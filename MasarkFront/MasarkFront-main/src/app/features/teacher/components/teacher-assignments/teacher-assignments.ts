import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../services/teacher-assessment.service';
import { TeacherAssignment } from '../../models/teacher-assessment.model';

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink],
  templateUrl: './teacher-assignments.html',
  styleUrl: './teacher-assignments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAssignments implements OnInit {
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly assignments = signal<TeacherAssignment[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Default teachingAssignmentId = 1 (placeholder until we have a selector)
  private readonly defaultTeachingAssignmentId = 1;

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.assessmentService.getAssignments(this.defaultTeachingAssignmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.assignments.set(data);
          this.isLoading.set(false);
        },
        error: (_err: unknown) => {
          this.errorMessage.set('فشل في تحميل الواجبات. الرجاء المحاولة مرة أخرى.');
          this.isLoading.set(false);
        }
      });
  }

  publishAssignment(id: number): void {
    if (confirm('هل أنت متأكد من نشر هذا الواجب؟ بمجرد نشره سيتمكن الطلاب من رؤيته.')) {
      this.assessmentService.publishAssignment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadAssignments());
    }
  }

  closeAssignment(id: number): void {
    if (confirm('هل أنت متأكد من إغلاق هذا الواجب؟ لن يتمكن الطلاب من تسليمه بعد الإغلاق.')) {
      this.assessmentService.closeAssignment(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadAssignments());
    }
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      Draft: 'مسودة',
      Published: 'منشور',
      Closed: 'مغلق',
    };
    return labels[status] ?? status;
  }
}
