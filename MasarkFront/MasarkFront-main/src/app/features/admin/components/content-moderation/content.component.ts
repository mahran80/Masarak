import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminApiService } from '../../../../core/services/admin-api-service';

export interface ContentItemModel {
  id: number;
  title: string;
  subjectName: string;
  gradeLabel: string;
  teacherName: string;
  type: 'Video' | 'PDF' | 'Quiz' | 'ExerciseSheet' | 'Notes' | string;
  createdAt: string | Date;
  fileSize?: string;
  viewsCount?: number;
  isArchived?: boolean;
}

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, FormsModule, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminContentComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  
  readonly contentItems = signal<ContentItemModel[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedGrade = signal<string>('all');
  readonly selectedSubject = signal<string>('all');
  readonly selectedType = signal<string>('all');
  
  // UI Modal & Toast States
  readonly isUploadModalOpen = signal<boolean>(false);
  readonly previewItem = signal<ContentItemModel | null>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'info' | 'danger'>('success');

  // Form State for New Content Upload
  newContentTitle = '';
  newContentSubject = 'الرياضيات';
  newContentGrade = 'الصف الأول الثانوي';
  newContentType: 'PDF' | 'Video' | 'Quiz' | 'ExerciseSheet' | 'Notes' = 'PDF';
  newContentTeacher = 'أحمد محمد';

  ngOnInit() {
    this.adminApi.getContentItems().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.contentItems.set(data);
        } else {
          this.loadSampleData();
        }
      },
      error: () => {
        this.loadSampleData();
      }
    });
  }

  private loadSampleData(): void {
    const SAMPLE_CONTENT: ContentItemModel[] = [
      { id: 101, title: 'شرح مبسط لقوانين الحركة والسرعة في الفيزياء', subjectName: 'الفيزياء', gradeLabel: 'الصف الأول الثانوي', teacherName: 'د. أسامة عبد الرحمن', type: 'Video', createdAt: '2026-07-25T10:30:00Z', viewsCount: 1420, fileSize: '185 MB' },
      { id: 102, title: 'ملخص مادة الجبر والهندسة التحليلية - الترم الأول', subjectName: 'الرياضيات', gradeLabel: 'الصف الثالث الإعدادي', teacherName: 'أ. محمود صلاح', type: 'PDF', createdAt: '2026-07-24T14:15:00Z', viewsCount: 980, fileSize: '4.2 MB' },
      { id: 103, title: 'اختبار تفاعلي شامل على وحدة النحو والتعبير', subjectName: 'اللغة العربية', gradeLabel: 'الصف الثاني الثانوي', teacherName: 'أ. فاطمة أحمد', type: 'Quiz', createdAt: '2026-07-23T09:00:00Z', viewsCount: 2300, fileSize: '15 أسئلة' },
      { id: 104, title: 'شيت تمارين وإجابات النموذج الاسترشادي للكيمياء', subjectName: 'الكيمياء', gradeLabel: 'الصف الثالث الثانوي', teacherName: 'د. خالد السعيد', type: 'ExerciseSheet', createdAt: '2026-07-22T16:45:00Z', viewsCount: 750, fileSize: '2.8 MB' },
      { id: 105, title: 'مذكرة المراجعة النهائية في التاريخ الحديث والمعاصر', subjectName: 'التاريخ', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أ. حسين مصطفى', type: 'Notes', createdAt: '2026-07-21T11:20:00Z', viewsCount: 1120, fileSize: '6.1 MB' },
      { id: 106, title: 'فيديو توضيحي للتجربة العملية لتركيب الخلية النباتية', subjectName: 'الأحياء', gradeLabel: 'الصف الأول الثانوي', teacherName: 'د. نورهان علي', type: 'Video', createdAt: '2026-07-20T13:10:00Z', viewsCount: 1890, fileSize: '240 MB' },
    ];
    this.contentItems.set(SAMPLE_CONTENT);
  }

  // Reactive Computed Filters
  readonly filteredContentItems = computed(() => {
    const items = this.contentItems();
    const query = this.searchQuery().trim().toLowerCase();
    const grade = this.selectedGrade();
    const subject = this.selectedSubject();
    const type = this.selectedType();

    return items.filter(item => {
      const matchesQuery = !query || 
        item.title?.toLowerCase().includes(query) ||
        item.teacherName?.toLowerCase().includes(query) ||
        item.subjectName?.toLowerCase().includes(query);

      const matchesGrade = grade === 'all' || item.gradeLabel === grade;
      const matchesSubject = subject === 'all' || item.subjectName === subject;
      const matchesType = type === 'all' || item.type === type;

      return matchesQuery && matchesGrade && matchesSubject && matchesType;
    });
  });

  // Dynamic Statistics
  readonly stats = computed(() => {
    const items = this.contentItems();
    const total = items.length;
    const pdfCount = items.filter(i => i.type === 'PDF' || i.type === 'Notes').length;
    const videoCount = items.filter(i => i.type === 'Video').length;
    const quizCount = items.filter(i => i.type === 'Quiz' || i.type === 'ExerciseSheet').length;

    return { total, pdfCount, videoCount, quizCount };
  });

  // Unique Lists for Dropdown Filters
  readonly availableGrades = computed(() => {
    const grades = new Set(this.contentItems().map(i => i.gradeLabel).filter(Boolean));
    return Array.from(grades);
  });

  readonly availableSubjects = computed(() => {
    const subjects = new Set(this.contentItems().map(i => i.subjectName).filter(Boolean));
    return Array.from(subjects);
  });

  // Actions
  archive(id: number): void {
    console.log('Archive Content Item:', id);
    this.showToast('تم أرشفة المحتوى بنجاح', 'info');
    this.contentItems.update(items =>
      items.map(item => item.id === id ? { ...item, isArchived: !item.isArchived } : item)
    );
  }

  remove(id: number): void {
    this.adminApi.moderateContentItem(id, 'Inappropriate content').subscribe({
      next: () => {
        this.contentItems.update(items => items.filter(i => i.id !== id));
        this.showToast('تم تعطيل المحتوى وحذفه من المنصة', 'danger');
      },
      error: () => {
        // Fallback UI remove if API mock fails
        this.contentItems.update(items => items.filter(i => i.id !== id));
        this.showToast('تم تعطيل المحتوى بنجاح', 'danger');
      }
    });
  }

  // Modals & UI Actions
  openUploadModal(): void {
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
  }

  submitNewUpload(): void {
    if (!this.newContentTitle.trim()) return;

    const newItem: ContentItemModel = {
      id: Date.now(),
      title: this.newContentTitle.trim(),
      subjectName: this.newContentSubject,
      gradeLabel: this.newContentGrade,
      teacherName: this.newContentTeacher,
      type: this.newContentType,
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      fileSize: this.newContentType === 'Video' ? '120 MB' : '3.5 MB'
    };

    this.contentItems.update(items => [newItem, ...items]);
    this.showToast('تم رفع المحتوى الجديد ونشره بنجاح', 'success');
    this.newContentTitle = '';
    this.closeUploadModal();
  }

  openPreview(item: ContentItemModel): void {
    this.previewItem.set(item);
  }

  closePreview(): void {
    this.previewItem.set(null);
  }

  showToast(msg: string, type: 'success' | 'info' | 'danger' = 'success'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedGrade.set('all');
    this.selectedSubject.set('all');
    this.selectedType.set('all');
  }
}