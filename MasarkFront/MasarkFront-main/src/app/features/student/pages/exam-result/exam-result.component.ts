import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { StudentExamResult } from '../../models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-student-exam-result',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, IconComponent],
  templateUrl: './exam-result.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExamResultPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly studentService = inject(StudentService);
  private readonly location = inject(Location);

  result = signal<StudentExamResult | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  goBack() {
    this.location.back();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadResult(id);
    } else {
      this.error.set('معرف الاختبار مفقود');
      this.isLoading.set(false);
    }
  }

  loadResult(studentExamId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.studentService.getExamResult(studentExamId).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('فشل في تحميل نتيجة الاختبار.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Correct':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
      case 'Incorrect':
        return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
      case 'PendingReview':
        return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
      case 'PartiallyCorrect':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Correct': return 'إجابة صحيحة';
      case 'Incorrect': return 'إجابة خاطئة';
      case 'PendingReview': return 'قيد التصحيح اليدوي';
      case 'PartiallyCorrect': return 'إجابة صحيحة جزئياً';
      case 'AutoGraded': return 'مصحح آلياً';
      default: return status;
    }
  }
}
