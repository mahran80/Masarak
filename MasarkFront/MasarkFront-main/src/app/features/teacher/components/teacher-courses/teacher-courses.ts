import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, catchError, forkJoin } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export type ContentType = 'Video' | 'PDF' | 'Notes' | 'ExerciseSheet';
export type InnerTab = 'files' | 'upload';

interface TeachingAssignment {
  id: number;
  className: string;
  subjectName: string;
  academicYear: number;
}

interface ContentItem {
  contentItemId: number;
  type: ContentType;
  sourceType: string;
  title: string;
  description?: string;
  resourceUrl: string;
  fileSizeBytes?: number;
  createdAt: string;
  isActive: boolean;
}

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [NgClass, DatePipe, FormsModule],
  templateUrl: './teacher-courses.html',
  styleUrl: './teacher-courses.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherCourses implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly teacherBaseUrl = `${environment.apiUrl}/teacher`;

  // ─── State ─────────────────────────────────────────────────────────────────
  readonly teachingAssignments = signal<TeachingAssignment[]>([]);
  readonly selectedTaId = signal<number | null>(null);
  readonly contentItems = signal<ContentItem[]>([]);
  readonly viewMode = signal<'list' | 'grid'>('list');
  readonly filterType = signal<string>('الكل');

  readonly isLoadingAssignments = signal(true);
  readonly isLoadingContent = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // ─── Inner Tabs ────────────────────────────────────────────────────────────
  readonly activeTab = signal<InnerTab>('files');

  // ─── Upload Form ──────────────────────────────────────────────────────────
  readonly uploadMode = signal<'file' | 'url'>('file');
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal<string | null>(null);

  uploadTitle = '';
  uploadDescription = '';
  uploadContentType: ContentType = 'PDF';
  uploadFile: File | null = null;
  uploadUrl = '';

  readonly contentTypes: ContentType[] = ['Video', 'PDF', 'Notes', 'ExerciseSheet'];
  readonly filterOptions = ['الكل', 'Video', 'PDF', 'Notes', 'ExerciseSheet'];

  // ─── Computed ──────────────────────────────────────────────────────────────
  readonly selectedAssignment = computed(() =>
    this.teachingAssignments().find((a) => a.id === this.selectedTaId()) ?? null,
  );

  readonly filteredContent = computed(() => {
    const f = this.filterType();
    return this.contentItems().filter((item) => f === 'الكل' || item.type === f);
  });

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.isLoadingAssignments.set(true);
    this.errorMessage.set(null);

    const now = new Date();
    const thisYear = now.getFullYear();
    const nextYear = thisYear + 1;

    const fetch = (year: number) =>
      this.http
        .get<TeachingAssignment[]>(`${this.teacherBaseUrl}/assignments?academicYear=${year}`)
        .pipe(catchError(() => of([] as TeachingAssignment[])));

    forkJoin([fetch(thisYear), fetch(nextYear)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([thisYearData, nextYearData]) => {
        const seen = new Set<number>();
        const merged = [...thisYearData, ...nextYearData].filter((a) => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        this.teachingAssignments.set(merged);
        this.isLoadingAssignments.set(false);
        const firstId = merged[0]?.id ?? null;
        if (firstId !== null) this.selectAssignment(firstId);
      });
  }

  selectAssignment(taId: number): void {
    this.selectedTaId.set(taId);
    this.filterType.set('الكل');
    this.activeTab.set('files');
    this.resetUploadForm();
    this.loadContent(taId);
  }

  switchTab(tab: InnerTab): void {
    this.activeTab.set(tab);
    this.uploadError.set(null);
    this.uploadSuccess.set(null);
  }

  loadContent(taId: number): void {
    this.isLoadingContent.set(true);
    this.errorMessage.set(null);
    this.http
      .get<ContentItem[]>(`${this.teacherBaseUrl}/content/${taId}`)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveError(err));
          this.isLoadingContent.set(false);
          return of([]);
        }),
      )
      .subscribe((items) => {
        this.contentItems.set(items.filter((i) => i.isActive));
        this.isLoadingContent.set(false);
      });
  }

  openFile(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] ?? null;
    if (this.uploadFile && !this.uploadTitle) {
      this.uploadTitle = this.uploadFile.name.replace(/\.[^.]+$/, '');
    }
  }

  submitUpload(): void {
    const taId = this.selectedTaId();
    if (!taId || !this.uploadTitle.trim()) {
      this.uploadError.set('يرجى ملء حقل العنوان.');
      return;
    }
    this.uploadMode() === 'file' ? this.submitFileUpload(taId) : this.submitUrlUpload(taId);
  }

  private submitFileUpload(taId: number): void {
    if (!this.uploadFile) { this.uploadError.set('يرجى اختيار ملف.'); return; }

    const formData = new FormData();
    formData.append('file', this.uploadFile);
    formData.append('teachingAssignmentId', String(taId));
    formData.append('type', this.uploadContentType);
    formData.append('title', this.uploadTitle.trim());
    if (this.uploadDescription.trim()) formData.append('description', this.uploadDescription.trim());

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadSuccess.set(null);

    this.http.post<ContentItem>(`${this.teacherBaseUrl}/content/file`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.contentItems.update((items) => [item, ...items]);
          this.isUploading.set(false);
          this.uploadSuccess.set(`✅ تم رفع "${item.title}" بنجاح!`);
          this.resetUploadForm();
          setTimeout(() => { this.activeTab.set('files'); this.uploadSuccess.set(null); }, 1800);
        },
        error: (err: HttpErrorResponse) => {
          this.isUploading.set(false);
          this.uploadError.set(this.resolveError(err));
        },
      });
  }

  private submitUrlUpload(taId: number): void {
    if (!this.uploadUrl.trim()) { this.uploadError.set('يرجى إدخال الرابط.'); return; }

    const body = {
      teachingAssignmentId: taId,
      type: this.uploadContentType,
      sourceType: 'URL',
      title: this.uploadTitle.trim(),
      description: this.uploadDescription.trim() || null,
      url: this.uploadUrl.trim(),
    };

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadSuccess.set(null);

    this.http.post<ContentItem>(`${this.teacherBaseUrl}/content/url`, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.contentItems.update((items) => [item, ...items]);
          this.isUploading.set(false);
          this.uploadSuccess.set(`✅ تمت إضافة "${item.title}" بنجاح!`);
          this.resetUploadForm();
          setTimeout(() => { this.activeTab.set('files'); this.uploadSuccess.set(null); }, 1800);
        },
        error: (err: HttpErrorResponse) => {
          this.isUploading.set(false);
          this.uploadError.set(this.resolveError(err));
        },
      });
  }

  private resetUploadForm(): void {
    this.uploadTitle = '';
    this.uploadDescription = '';
    this.uploadContentType = 'PDF';
    this.uploadFile = null;
    this.uploadUrl = '';
    this.uploadError.set(null);
  }

  deleteContent(id: number): void {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return;
    this.http.delete<void>(`${this.teacherBaseUrl}/content/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.contentItems.update((items) => items.filter((i) => i.contentItemId !== id)),
        error: (err: HttpErrorResponse) => this.errorMessage.set(this.resolveError(err)),
      });
  }

  typeIcon(type: ContentType): string {
    return ({ Video: '▶️', PDF: '📄', Notes: '📝', ExerciseSheet: '📋' } as Record<ContentType, string>)[type] ?? '📁';
  }

  typeLabel(type: ContentType): string {
    return ({ Video: 'فيديو', PDF: 'PDF', Notes: 'ملاحظات', ExerciseSheet: 'ورقة تدريب' } as Record<ContentType, string>)[type] ?? type;
  }

  formatBytes(bytes?: number): string {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private resolveError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'لا يمكن الوصول إلى الخادم. تحقق من اتصالك.';
    const msg = err.error?.message ?? err.error?.detail ?? err.error?.error ?? null;
    return msg ?? `حدث خطأ (${err.status}). الرجاء المحاولة مرة أخرى.`;
  }
}
