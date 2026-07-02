import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicApiService } from '../../../../core/services/academic-api-service';
import { AdminApiService } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-academic-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-management.html',
  styleUrl: './academic-management.css',
})
export class AcademicManagementComponent implements OnInit {
  private readonly api = inject(AcademicApiService);
  private readonly adminApi = inject(AdminApiService);

  activeTab = signal<'grades' | 'subjects' | 'classes' | 'roster' | 'teachers' | 'specializations'>('grades');
  
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

  // Enrollment State
  // Enrollment type and subjects are automatically inferred by the backend based on Active Subscription

  // Loading & Modals
  isLoading = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);
  modalMode = signal<'create' | 'edit'>('create');
  modalType = signal<'grade' | 'subject' | 'class'>('grade');

  // Form & Feedback State
  formData: any = {};
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
    this.activeTab.set(tab);
    if (tab === 'grades') this.loadGrades();
    if (tab === 'subjects' && this.selectedGrade()) this.loadSubjects();
    if (tab === 'classes' && this.selectedGrade()) this.loadClasses();
    if (tab === 'roster' && this.selectedClass()) this.loadRoster();
    if (tab === 'teachers' && this.selectedClass()) {
      this.loadTeachers();
      // Subjects must be loaded for the assignment dropdown — use the class's grade
      if (!this.subjects().length && this.selectedGrade()) this.loadSubjects();
    }
    if (tab === 'specializations') {
      if (!this.allCategories().length) this.loadAllCategories();
      if (this.selectedTeacher()) this.loadTeacherSpecializations();
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
    if (this.activeTab() === 'roster') this.loadRoster();
    if (this.activeTab() === 'teachers') {
      this.loadTeachers();
      // Always refresh subjects for the selected grade when on teachers tab
      if (this.selectedGrade()) this.loadSubjects();
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
    setTimeout(() => this.feedbackMsg.set(''), 4000);
  }

  showConfirm(msg: string, action: () => void) {
    this.confirmAction.set({ msg, action });
  }

  // ── MODALS & CRUD ──
  openModal(type: 'grade' | 'subject' | 'class', mode: 'create' | 'edit', data?: any) {
    this.modalType.set(type);
    this.modalMode.set(mode);
    this.formData = data ? { ...data } : {};
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.formData = {};
  }

  saveModal() {
    const type = this.modalType();
    const mode = this.modalMode();
    const data = this.formData;

    if (!data.name?.trim()) {
      this.showFeedback('حقل الاسم مطلوب.', 'error');
      return;
    }

    const handleResult = (obs: import('rxjs').Observable<any>, successMsg: string, errorMsg: string, reloadFn: () => void) => {
      obs.subscribe({
        next: () => { this.closeModal(); reloadFn.call(this); this.showFeedback(successMsg); },
        error: () => this.showFeedback(errorMsg, 'error')
      });
    };

    if (type === 'subject') {
      if (!data.code?.trim()) {
        this.showFeedback('رمز المادة مطلوب.', 'error');
        return;
      }
      if (mode === 'create') {
        const req = { gradeId: this.selectedGrade()!, name: data.name, nameAr: data.nameAr || undefined, code: data.code };
        handleResult(this.api.createSubject(req), 'تمت إضافة المادة بنجاح.', 'فشل إنشاء المادة.', this.loadSubjects);
      } else {
        handleResult(this.api.updateSubject(data.subjectId, { name: data.name, nameAr: data.nameAr, isActive: data.isActive ?? true }), 'تم تحديث المادة بنجاح.', 'فشل تحديث المادة.', this.loadSubjects);
      }
    }

    if (type === 'class') {
      const yr = Number(this.academicYear());
      if (isNaN(yr) || yr < 2020) {
        this.showFeedback('سنة أكاديمية غير صالحة.', 'error');
        return;
      }
      if (mode === 'create') {
        const req = { gradeId: this.selectedGrade()!, name: data.name, maxCapacity: Number(data.maxCapacity ?? 30), academicYear: yr };
        handleResult(this.api.createClass(req), 'تمت إضافة الفصل بنجاح.', 'فشل إنشاء الفصل.', this.loadClasses);
      } else {
        handleResult(this.api.updateClass(data.classId, { name: data.name, maxCapacity: Number(data.maxCapacity ?? 30), isActive: data.isActive ?? true }), 'تم تحديث الفصل بنجاح.', 'فشل تحديث الفصل.', this.loadClasses);
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
