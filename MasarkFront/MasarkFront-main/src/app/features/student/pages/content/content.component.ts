import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DatePipe, Location } from '@angular/common';
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
  imports: [IconComponent, DatePipe],
  templateUrl: './content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentContentPageComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly location = inject(Location);

  goBack() {
    this.location.back();
  }

  readonly groups = signal<StudentContentGroup[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly isVideoModalOpen = signal<boolean>(false);
  readonly selectedVideoUrl = signal<SafeResourceUrl | null>(null);
  readonly selectedVideoIsBlob = signal<boolean>(false);

  readonly totalItems = computed(() =>
    this.groups().reduce((total, group) => total + group.items.length, 0),
  );

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
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.groups.set([]);
          this.errorMessage.set(this.studentService.resolveErrorMessage(error));
          this.isLoading.set(false);
        },
      });
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
