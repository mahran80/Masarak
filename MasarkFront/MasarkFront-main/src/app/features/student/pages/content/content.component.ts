import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DatePipe, CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { StudentContentGroup, StudentContentItem } from '../../models';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-content-page',
  standalone: true,
  imports: [CommonModule, IconComponent, DatePipe],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentContentPageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly groups = signal<StudentContentGroup[]>([]);
  readonly selectedSubjectId = signal<any | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly isVideoModalOpen = signal<boolean>(false);
  readonly selectedVideoUrl = signal<SafeResourceUrl | null>(null);
  readonly selectedVideoIsBlob = signal<boolean>(false);

  readonly totalItems = computed(() =>
    this.groups().reduce((total, group) => total + group.items.length, 0),
  );

  readonly activeGroup = computed(() => {
    const id = this.selectedSubjectId();
    return this.groups().find(g => g.subject.subjectId === id) || null;
  });

  ngOnInit(): void {
    this.loadContent();
  }

  loadContent(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.studentService
      .getContentLibrary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.selectedSubjectId.set(null);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.groups.set([]);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  selectSubject(id: any): void {
    this.selectedSubjectId.set(id);
  }

  openResource(item: StudentContentItem): void {
    const isVideo = item.contentType?.toLowerCase().includes('video');
    
    if (item.sourceType === 'AzureBlob') {
      this.studentService.getDownloadUrl(item.contentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(url => {
        if (isVideo) {
          this.selectedVideoIsBlob.set(true);
          this.selectedVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
          this.isVideoModalOpen.set(true);
        } else {
          window.open(url, '_blank');
        }
      });
    } else {
      const url = item.url ?? item.fileUrl;
      if (!url) return;
      if (isVideo) {
        this.selectedVideoIsBlob.set(false);
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
          embedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
          embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        }
        this.selectedVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
        this.isVideoModalOpen.set(true);
      } else {
        window.open(url, '_blank');
      }
    }
  }

  closeVideo(): void {
    this.isVideoModalOpen.set(false);
    this.selectedVideoUrl.set(null);
  }

  contentTypeLabel(item: StudentContentItem): string {
    return item.contentType || 'Resource';
  }

  getSubjectImageUrl(subjectName: string): string {
    const name = (subjectName || '').toLowerCase();
    if (name.includes('math') || name.includes('رياضيات')) return '/assets/images/student/subject-mathematics-3d.png';
    if (name.includes('physic') || name.includes('فيزياء')) return '/assets/images/student/subject-physics-3d.jpg';
    if (name.includes('chem') || name.includes('كيمياء')) return '/assets/images/student/subject-chemistry-3d.jpg';
    if (name.includes('biolog') || name.includes('أحياء') || name.includes('احياء')) return '/assets/images/student/subject-biology-3d.jpg';
    if (name.includes('sci') || name.includes('علوم')) return '/assets/images/student/subject-science-3d.png';
    if (name.includes('comp') || name.includes('حاسب') || name.includes('برمجة') || name.includes('computer')) return '/assets/images/student/subject-computing-3d.png';
    if (name.includes('arab') || name.includes('عربي') || name.includes('عربية')) return '/assets/images/student/subject-arabic-3d.png';
    if (name.includes('eng') || name.includes('انجليزي') || name.includes('إنجليزية')) return '/assets/images/student/subject-english-3d.png';
    if (name.includes('hist') || name.includes('تاريخ')) return '/assets/images/student/subject-history-3d.jpg';
    if (name.includes('geo') || name.includes('جغرافيا')) return '/assets/images/student/subject-geography-3d.jpg';
    if (name.includes('islam') || name.includes('إسلامي') || name.includes('دين')) return '/assets/images/student/subject-islamic-3d.jpg';
    if (name.includes('fren') || name.includes('فرنسي')) return '/assets/images/student/subject-french-3d.jpg';
    return '/assets/images/student/subject-science-3d.png';
  }

  countByType(group: StudentContentGroup, type: 'pdf' | 'video' | 'resource'): number {
    return group.items.filter((item) => {
      const contentType = (item.contentType ?? '').toLowerCase();

      if (type === 'pdf') {
        return contentType.includes('pdf');
      }

      if (type === 'video') {
        return contentType.includes('video');
      }

      return !contentType.includes('pdf') && !contentType.includes('video');
    }).length;
  }
}
