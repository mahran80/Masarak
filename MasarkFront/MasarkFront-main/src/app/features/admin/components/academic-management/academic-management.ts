import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicApiService } from '../../../../core/services/academic-api-service';
import { AdminApiService } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-academic-management',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, FormFieldComponent],
  templateUrl: './academic-management.html',
  styleUrl: './academic-management.css',
})
export class AcademicManagementComponent implements OnInit {
  private readonly api = inject(AcademicApiService);
  private readonly adminApi = inject(AdminApiService);

  activeTab = signal<'grades' | 'subjects' | 'classes' | 'specializations'>('grades');
  classSubTab = signal<'info' | 'roster' | 'teachers'>('info');
  
  // Data State
  grades = signal<any[]>([]);
  subjects = signal<any[]>([]);
  classes = signal<any[]>([]);
  roster = signal<any[]>([]);
  teachers = signal<any[]>([]);
  allCategories = signal<any[]>([]);
  availableTeachers = signal<any[]>([]);
  availableStudents = signal<any[]>([]);
  filteredStudentsForGrade = computed(() => {
    const rosterUserIds = new Set(this.roster().map(r => r.userId));
    return this.availableStudents().filter(s => s.gradeId === this.selectedGrade() && !rosterUserIds.has(s.userId));
  });
  teacherSpecializations = signal<any[]>([]);

  // Selection State
  selectedGrade = signal<number | null>(null);
  selectedClass = signal<number | null>(null);
  selectedTeacher = signal<number | null>(null);
  academicYear = signal<string>(new Date().getFullYear().toString());

  readonly selectedGradeName = computed(() => {
    const gid = this.selectedGrade();
    if (!gid) return '';
    const g = this.grades().find(item => item.gradeId === gid);
    return g ? (g.nameAr || g.name) : '';
  });

  readonly selectedClassName = computed(() => {
    const cid = this.selectedClass();
    if (!cid) return '';
    const c = this.classes().find(item => item.classId === cid);
    return c ? c.name : '';
  });

  // Enrollment State
  // Enrollment type and subjects are automatically inferred by the backend based on Active Subscription

  // Loading & Modals
  isLoading = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);
  modalMode = signal<'create' | 'edit'>('create');
  modalType = signal<'grade' | 'subject' | 'class'>('grade');

  // Form & Feedback State
  formData: any = {};
  modalErrors = signal<Record<string, string>>({});
  feedbackMsg = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');
  confirmAction = signal<{ msg: string, action: () => void } | null>(null);

  ngOnInit(): void {
    this.loadGrades();
    this.loadAvailableTeachers();
    this.loadAvailableStudents();
  }

  loadAvailableTeachers() {
    this.api.getTeachers().subscribe({
      next: (res) => this.availableTeachers.set(res)
    });
  }

  loadAvailableStudents() {
    this.adminApi.getUsers(1, 1000, 'Student').subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.items || []);
        this.availableStudents.set(list);
      }
    });
  }

  setTab(tab: 'grades' | 'subjects' | 'classes' | 'roster' | 'teachers' | 'specializations') {
    if (tab === 'roster') {
      this.activeTab.set('classes');
      this.setClassSubTab('roster');
      return;
    }
    if (tab === 'teachers') {
      this.activeTab.set('classes');
      this.setClassSubTab('teachers');
      return;
    }
    this.activeTab.set(tab);
    if (tab === 'grades') this.loadGrades();
    if (tab === 'subjects' && this.selectedGrade()) this.loadSubjects();
    if (tab === 'classes') {
      if (this.selectedGrade()) this.loadClasses();
      if (this.classSubTab() === 'roster' && this.selectedClass()) this.loadRoster();
      if (this.classSubTab() === 'teachers' && this.selectedClass()) {
        this.loadTeachers();
        if (!this.subjects().length && this.selectedGrade()) this.loadSubjects();
      }
    }
    if (tab === 'specializations') {
      if (!this.allCategories().length) this.loadAllCategories();
      if (this.selectedTeacher()) this.loadTeacherSpecializations();
    }
  }

  setClassSubTab(subTab: 'info' | 'roster' | 'teachers') {
    this.classSubTab.set(subTab);
    if (subTab === 'info' && this.selectedGrade()) this.loadClasses();
    if (subTab === 'roster' && this.selectedClass()) this.loadRoster();
    if (subTab === 'teachers' && this.selectedClass()) {
      this.loadTeachers();
      if (!this.subjects().length && this.selectedGrade()) this.loadSubjects();
    }
  }

  // ── GENERIC LOADER HELPER ──
  private fetchData<T>(apiCall: import('rxjs').Observable<T>, targetSignal: import('@angular/core').WritableSignal<T>) {
    this.isLoading.set(true);
    apiCall.subscribe({
      next: (res) => { targetSignal.set(res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  // ── LOADERS ──
  loadGrades() {
    this.fetchData(this.api.getGrades(), this.grades);
  }

  loadSubjects() {
    const gid = this.selectedGrade();
    if (gid) this.fetchData(this.api.getSubjectsByGrade(gid), this.subjects);
  }

  loadAllCategories() {
    this.fetchData(this.api.getAllSubjectCategories(), this.allCategories);
  }

  loadClasses() {
    const gid = this.selectedGrade();
    if (gid) this.fetchData(this.api.getClassesByGrade(gid, this.academicYear()), this.classes);
  }

  loadRoster() {
    const cid = this.selectedClass();
    if (cid) this.fetchData(this.api.getClassRoster(cid), this.roster);
  }

  loadTeachers() {
    const cid = this.selectedClass();
    if (cid) this.fetchData(this.api.getAssignmentsForClass(cid, this.academicYear()), this.teachers);
  }

  loadTeacherSpecializations() {
    const tid = this.selectedTeacher();
    if (tid) this.fetchData(this.api.getTeacherSpecializations(tid), this.teacherSpecializations);
  }

  // ── UI HELPERS ──
  onGradeSelect(gid: number) {
    this.selectedGrade.set(gid);
    this.selectedClass.set(null);
    if (this.activeTab() === 'subjects') this.loadSubjects();
    if (this.activeTab() === 'classes') this.loadClasses();
  }

  onClassSelect(cid: number) {
    this.selectedClass.set(cid);
    if (this.activeTab() === 'classes') {
      if (this.classSubTab() === 'roster') this.loadRoster();
      if (this.classSubTab() === 'teachers') {
        this.loadTeachers();
        if (this.selectedGrade()) this.loadSubjects();
      }
    }
  }

  onTeacherSelect(tid: number) {
    this.selectedTeacher.set(tid);
    if (this.activeTab() === 'specializations') this.loadTeacherSpecializations();
  }

  // ── FEEDBACK HELPERS ──
  showFeedback(msg: string, type: 'success' | 'error' = 'success') {
    this.feedbackMsg.set(msg);
    this.feedbackType.set(type);
    if (type === 'success') {
      setTimeout(() => this.feedbackMsg.set(''), 4000);
    }
  }

  clearFeedback() {
    this.feedbackMsg.set('');
  }

  showConfirm(msg: string, action: () => void) {
    this.confirmAction.set({ msg, action });
  }

  // ── MODALS & CRUD ──
  openModal(type: 'grade' | 'subject' | 'class', mode: 'create' | 'edit', data?: any) {
    this.modalType.set(type);
    this.modalMode.set(mode);
    this.modalErrors.set({});
    this.formData = data ? { ...data } : {};
    if (type === 'grade' && mode === 'create') {
      this.formData.stage = this.formData.stage ?? '0';
      const maxOrder = this.grades().length ? Math.max(...this.grades().map(g => Number(g.order) || 0), 0) : 0;
      this.formData.order = this.formData.order ?? (maxOrder + 1);
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalErrors.set({});
    this.formData = {};
  }

  saveModal() {
    const type = this.modalType();
    const mode = this.modalMode();
    const data = this.formData;
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors['name'] = 'حقل الاسم مطلوب.';
    }

    if (type === 'subject') {
      if (!data.code?.trim()) {
        errors['code'] = 'رمز المادة مطلوب.';
      }
    }

    if (type === 'class') {
      const yr = Number(this.academicYear());
      if (isNaN(yr) || yr < 2020) {
        this.showFeedback('سنة أكاديمية غير صالحة.', 'error');
        return;
      }
      if (mode === 'create') {
        const cap = Number(data.maxCapacity ?? 30);
        if (isNaN(cap) || cap < 1) {
          errors['maxCapacity'] = 'الطاقة الاستيعابية يجب أن تكون رقماً أكبر من صفر.';
        }
      }
    }

    if (type === 'grade' && mode === 'create') {
      const stageNum = Number(data.stage);
      const orderNum = Number(data.order);
      if (isNaN(stageNum)) {
        errors['stage'] = 'المرحلة التعليمية مطلوبة.';
      }
      if (isNaN(orderNum) || orderNum <= 0) {
        errors['order'] = 'الترتيب يجب أن يكون رقماً أكبر من صفر.';
      }
    }

    if (Object.keys(errors).length > 0) {
      this.modalErrors.set(errors);
      this.showFeedback('يرجى تصحيح الأخطاء في النموذج.', 'error');
      return;
    }
    this.modalErrors.set({});

    if (mode === 'edit') {
      const typeLabel = type === 'grade' ? 'المرحلة' : type === 'subject' ? 'المادة' : 'الفصل';
      this.showConfirm(`هل أنت متأكد من حفظ تعديلات ${typeLabel}؟`, () => {
        this.executeSaveModal(type, mode, data);
      });
      return;
    }

    this.executeSaveModal(type, mode, data);
  }

  private executeSaveModal(type: 'grade' | 'subject' | 'class', mode: 'create' | 'edit', data: any) {
    const handleResult = (obs: import('rxjs').Observable<any>, successMsg: string, errorMsg: string, reloadFn: () => void) => {
      obs.subscribe({
        next: () => { this.closeModal(); reloadFn.call(this); this.showFeedback(successMsg); },
        error: () => this.showFeedback(errorMsg, 'error')
      });
    };

    if (type === 'subject') {
      if (mode === 'create') {
        const req = { gradeId: this.selectedGrade()!, name: data.name, nameAr: data.nameAr || undefined, code: data.code };
        handleResult(this.api.createSubject(req), 'تمت إضافة المادة بنجاح.', 'فشل إنشاء المادة.', this.loadSubjects);
      } else {
        handleResult(this.api.updateSubject(data.subjectId, { name: data.name, nameAr: data.nameAr, isActive: data.isActive ?? true }), 'تم تحديث المادة بنجاح.', 'فشل تحديث المادة.', this.loadSubjects);
      }
    }

    if (type === 'class') {
      const yr = Number(this.academicYear());
      if (mode === 'create') {
        const req = { gradeId: this.selectedGrade()!, name: data.name, maxCapacity: Number(data.maxCapacity ?? 30), academicYear: yr };
        handleResult(this.api.createClass(req), 'تمت إضافة الفصل بنجاح.', 'فشل إنشاء الفصل.', this.loadClasses);
      } else {
        handleResult(this.api.updateClass(data.classId, { name: data.name, maxCapacity: Number(data.maxCapacity ?? 30), isActive: data.isActive ?? true }), 'تم تحديث الفصل بنجاح.', 'فشل تحديث الفصل.', this.loadClasses);
      }
    }

    if (type === 'grade') {
      if (mode === 'create') {
        const req = { 
          name: data.name, 
          nameAr: data.nameAr, 
          stage: Number(data.stage ?? 0), 
          order: Number(data.order ?? 1) 
        };
        handleResult(this.api.createGrade(req), 'تمت إضافة المرحلة بنجاح.', 'فشل إنشاء المرحلة.', this.loadGrades);
      } else {
        handleResult(this.api.updateGrade(data.gradeId, { name: data.name, nameAr: data.nameAr, isActive: data.isActive ?? true }), 'تم تحديث المرحلة بنجاح.', 'فشل تحديث المرحلة.', this.loadGrades);
      }
    }
  }

  // ── ROSTER / TEACHERS ACTIONS ──
  enrollStudent(studentIdStr: string) {
    const cid = this.selectedClass();
    if (!cid || !studentIdStr) {
      this.showFeedback('الرجاء اختيار الطالب.', 'error');
      return;
    }
    const yr = Number(this.academicYear());
    if (isNaN(yr) || yr < 2020) {
      this.showFeedback('سنة أكاديمية غير صالحة.', 'error');
      return;
    }

    this.api.enrollStudent({
      studentId: +studentIdStr,
      classId: cid,
      academicYear: yr
    }).subscribe({
      next: () => { 
        this.loadRoster(); 
        this.showFeedback('تم تسجيل الطالب بنجاح.'); 
      },
      error: (err) => this.showFeedback('خطأ: ' + (err.error?.message || 'فشل التسجيل.'), 'error')
    });
  }

  unenrollStudent(studentClassId: number) {
    this.showConfirm('هل أنت متأكد من إلغاء قيد هذا الطالب من هذا الفصل؟', () => {
      this.api.unenrollStudent(studentClassId).subscribe({
        next: () => { this.loadRoster(); this.showFeedback('تم إلغاء القيد بنجاح.'); },
        error: () => this.showFeedback('فشل إلغاء القيد.', 'error')
      });
    });
  }

  assignTeacher(teacherIdStr: string, subjectIdStr: string) {
    const cid = this.selectedClass();
    const tId = parseInt(teacherIdStr, 10);
    const sId = parseInt(subjectIdStr, 10);
    const yr = Number(this.academicYear());

    if (!cid) {
      this.showFeedback('الرجاء اختيار الفصل أولاً.', 'error');
      return;
    }
    if (isNaN(tId) || isNaN(sId)) {
      this.showFeedback('تأكد من اختيار المعلم والمادة.', 'error');
      return;
    }
    if (isNaN(yr) || yr < 2020) {
      this.showFeedback('سنة أكاديمية غير صالحة.', 'error');
      return;
    }

    this.api.assignTeacher({
      classId: cid,
      subjectId: sId,
      teacherId: tId,
      academicYear: yr,
    }).subscribe({
      next: () => { this.loadTeachers(); this.showFeedback('تم تعيين المعلم بنجاح.'); },
      error: (err) => this.showFeedback('خطأ: ' + (err.error?.message || 'فشل التعيين.'), 'error')
    });
  }

  unassignTeacher(assignmentId: number) {
    this.showConfirm('هل أنت متأكد من إلغاء تعيين هذا المعلم؟', () => {
      this.api.unassignTeacher(assignmentId).subscribe({
        next: () => { this.loadTeachers(); this.showFeedback('تم إلغاء التعيين بنجاح.'); },
        error: () => this.showFeedback('فشل إلغاء التعيين.', 'error')
      });
    });
  }

  hasSpecialization(category: any): boolean {
    return this.teacherSpecializations().some(s => s.subjectCategoryId === category.subjectCategoryId);
  }

  toggleTeacherSubjectByName(category: any) {
    const current = this.teacherSpecializations();
    const isSpecialized = current.some(c => c.subjectCategoryId === category.subjectCategoryId);
    
    let newCategories: any[];
    if (isSpecialized) {
      newCategories = current.filter(c => c.subjectCategoryId !== category.subjectCategoryId);
    } else {
      newCategories = [...current, category];
    }
    this.teacherSpecializations.set(newCategories);
    this.api.updateTeacherSpecializations(this.selectedTeacher()!, newCategories.map(c => c.subjectCategoryId)).subscribe({
      next: () => { this.loadTeacherSpecializations(); this.showFeedback('تم تحديث التخصصات بنجاح.'); },
      error: () => this.showFeedback('فشل تحديث التخصصات.', 'error')
    });
  }
}
