import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriptionApiService } from '../../../../core/services/subscription-api-service';
import { PlanDto, SubscriptionDto } from '../../../../core/models/subscription.model';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { AdminApiService, AdminUserDto } from '../../../../core/services/admin-api-service';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { AcademicApiService } from '../../../../core/services/academic-api-service';
import { GradeDto } from '../../../../models/academic.model';

// Unified user model used throughout this component
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  hasActiveSubscription: boolean;
  gradeId?: number;
  specialization?: string;
  studentIds?: number[];
  status: 'Active' | 'Inactive';
  joinedAt: string;
  /** 'api' = came from backend, 'manual' = admin-added locally */
  source: 'api' | 'manual';
  subscription?: {
    subscriptionId: number;
    planName: string;
    planType: string;
    status: string;
    endDate: string;
  } | null;
}

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private readonly router = inject(Router);
  private readonly subApi = inject(SubscriptionApiService);
  private readonly authState = inject(AuthStateService);
  private readonly adminApi = inject(AdminApiService);
  private readonly academicApi = inject(AcademicApiService);

  private readonly usersStorageKey = 'masarak_admin_users_v2';
  private readonly subscriptionsStorageKey = 'masarak_student_subscriptions';

  /** Negative IDs for locally-added (manual) users. Never clashes with backend int IDs. */
  private nextManualId = -1;

  // ── State signals ─────────────────────────────────────────────────────────
  users = signal<AdminUser[]>([]);
  plans = signal<PlanDto[]>([]);
  allSubscriptions = signal<SubscriptionDto[]>([]);
  grades = signal<GradeDto[]>([]);

  selectedUser = signal<AdminUser | null>(null);
  isEditing = signal(false);
  showAddModal = signal(false);

  selectedPlanId = signal<number | null>(null);
  selectedStudentId = signal<number | null>(null);
  assigning = signal(false);

  feedback = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  isLoadingUsers = signal(true);
  activeTab = signal<'users' | 'subscriptions'>('users');
  private readonly _searchQuery = signal('');
  private readonly _roleFilter = signal('');

  get searchQuery(): string { return this._searchQuery(); }
  set searchQuery(v: string) { this._searchQuery.set(v); }
  get roleFilter(): string { return this._roleFilter(); }
  set roleFilter(v: string) { this._roleFilter.set(v); }

  // ── Form ──────────────────────────────────────────────────────────────────
  form = {
    name: '',
    email: '',
    role: 'Student',
    status: 'Active' as 'Active' | 'Inactive',
    password: '',
    phone: '',
    gradeId: null as number | null,
    specialization: '',
    studentIds: [] as number[],
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  studentUsers = computed(() => this.users().filter((u) => u.role === 'Student'));

  filteredUsers = computed(() => {
    const q = this._searchQuery().toLowerCase().trim();
    const role = this._roleFilter();
    return this.users().filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = !role || u.role === role;
      return matchQ && matchRole;
    });
  });

  totalStudents = computed(() => this.users().filter((u) => u.role === 'Student').length);
  totalTeachers = computed(() => this.users().filter((u) => u.role === 'Teacher').length);
  totalSubscribed = computed(() => this.users().filter((u) => u.subscription?.status === 'Active').length);

  parentStudentSearch = signal('');

  filteredStudentsForParent = computed(() => {
    const q = this.parentStudentSearch().trim().toLowerCase();
    const allStudents = this.studentUsers();
    
    if (!q) {
      return allStudents.slice(0, 5); // Show a few by default
    }
    
    return allStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.email && s.email.toLowerCase().includes(q))
    ).slice(0, 10); // Limit to 10 results
  });

  getStudentName(id: number): string {
    return this.users().find(u => u.id === id)?.name || `طالب #${id}`;
  }
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    this.loadGrades();
  }

  private loadGrades(): void {
    this.academicApi.getGrades().subscribe({
      next: (grades) => this.grades.set(grades),
      error: (err) => console.error('Failed to load grades', err)
    });
  }

  private loadData(): void {
    this.isLoadingUsers.set(true);

    forkJoin({
      plans: this.subApi.getPlans().pipe(catchError(() => of([] as PlanDto[]))),
      apiUsers: this.adminApi.getUsers().pipe(
        catchError((err) => {
          console.error('Failed to fetch users from backend API (/api/admin/users):', err);
          return of([] as AdminUserDto[]);
        }),
      ),
      allSubs: this.subApi
        .getAllSubscriptions({ pageNumber: 1, pageSize: 200 })
        .pipe(catchError(() => of({ items: [] as SubscriptionDto[] } as any))),
    }).subscribe(({ plans, apiUsers, allSubs }) => {
      this.plans.set(plans);

      const subItems: SubscriptionDto[] = Array.isArray(allSubs)
        ? allSubs
        : allSubs?.items ?? [];
      this.allSubscriptions.set(subItems);

      // Build subscription lookup by userId — prioritize Active subscriptions
      const subMap = new Map<number, SubscriptionDto>();
      subItems.forEach((s) => {
        const existing = subMap.get(s.userId);
        // Keep Active over any other status; if both same status, keep the newer one
        if (!existing || s.status === 'Active' || (existing.status !== 'Active' && s.subscriptionId > existing.subscriptionId)) {
          subMap.set(s.userId, s);
        }
      });

      // Normalise API users
      const rawApiUsers: AdminUserDto[] = Array.isArray(apiUsers)
        ? apiUsers
        : (apiUsers as any)?.items ?? [];

      const apiMapped: AdminUser[] = rawApiUsers.map((u) => ({
        id: u.userId,
        name: u.fullName || u.email,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        hasActiveSubscription: !!u.hasActiveSubscription,
        gradeId: u.gradeId,
        specialization: u.specialization,
        studentIds: u.studentIds,
        status: u.isActive ? 'Active' : 'Inactive',
        joinedAt: this.formatDate(u.createdAt),
        source: 'api',
        subscription: this.mapSub(subMap.get(u.userId)),
      }));

      // Load locally-added manual users
      const manualUsers = this.loadManualUsers();

      // Merge: API wins for same id
      const apiIds = new Set(apiMapped.map((u) => u.id));
      const mergedManual = manualUsers.filter((u) => !apiIds.has(u.id));

      // Also sync current logged-in user
      const currentUser = this.authState.user();
      if (currentUser && !apiIds.has(currentUser.userId)) {
        const mapped: AdminUser = {
          id: currentUser.userId,
          name: currentUser.fullName || currentUser.email,
          email: currentUser.email,
          role: currentUser.role,
          isActive: currentUser.isActive,
          createdAt: currentUser.createdAt,
          hasActiveSubscription: false,
          status: currentUser.isActive ? 'Active' : 'Inactive',
          joinedAt: this.formatDate(currentUser.createdAt),
          source: 'api',
          subscription: this.mapSub(subMap.get(currentUser.userId)),
        };
        apiMapped.push(mapped);
      }

      const merged = [...apiMapped, ...mergedManual];
      this.users.set(merged);
      this.isLoadingUsers.set(false);
    });
  }

  private mapSub(sub?: SubscriptionDto): AdminUser['subscription'] {
    if (!sub) return null;
    return {
      subscriptionId: sub.subscriptionId,
      planName: sub.planName,
      planType: sub.planType,
      status: sub.status,
      endDate: sub.endDate,
    };
  }

  // ── Manual users storage ──────────────────────────────────────────────────
  private loadManualUsers(): AdminUser[] {
    try {
      const raw = localStorage.getItem(this.usersStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AdminUser[];
      if (!Array.isArray(parsed)) return [];

      // Re-assign safe negative IDs to any old users that had huge Date.now() IDs
      // (Int32 max is 2,147,483,647; anything over that is invalid for the backend)
      const MAX_INT32 = 2_147_483_647;
      let counter = this.nextManualId;
      const fixed = parsed.map((u) => {
        if (u.id > MAX_INT32 || u.id > 0) {
          return { ...u, id: counter-- };
        }
        return u;
      });
      this.nextManualId = counter;
      return fixed;
    } catch {
      return [];
    }
  }

  private persistManualUsers(): void {
    const manual = this.users().filter((u) => u.source === 'manual');
    localStorage.setItem(this.usersStorageKey, JSON.stringify(manual));
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  openAddModal(): void {
    this.form = { name: '', email: '', role: 'Student', status: 'Active', password: '', phone: '', gradeId: null, specialization: '', studentIds: [] };
    this.selectedUser.set(null);
    this.parentStudentSearch.set('');
    this.isEditing.set(false);
    this.showAddModal.set(true);
    this.feedback.set(null);
  }

  openEditModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.form = { 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      status: user.status, 
      password: '', 
      phone: '', 
      gradeId: user.gradeId || null, 
      specialization: user.specialization || '', 
      studentIds: user.studentIds ? [...user.studentIds] : [] 
    };
    this.isEditing.set(true);
    this.parentStudentSearch.set('');
    this.showAddModal.set(true);
    this.feedback.set(null);
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.selectedUser.set(null);
    this.isEditing.set(false);
    this.feedback.set(null);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  saveUser(): void {
    const trimmedName = this.form.name.trim();
    if (!trimmedName) {
      this.setFeedback('يرجى إدخال اسم المستخدم', 'error');
      return;
    }

    const password = this.form.password?.trim();
    if (!this.isEditing() && (!password || password.length < 8)) {
      this.setFeedback('كلمة المرور مطلوبة وطولها 8 أحرف على الأقل', 'error');
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = this.users().some((u) => {
      const same = u.name.toLowerCase() === normalizedName;
      return this.isEditing() ? same && u.id !== this.selectedUser()?.id : same;
    });

    if (isDuplicate) {
      this.setFeedback('هذا المستخدم موجود بالفعل', 'error');
      return;
    }

    if (this.isEditing()) {
      // Editing existing user – keep local/manual handling for now
      const updated: AdminUser = {
        ...this.selectedUser()!,
        name: trimmedName,
        email: this.form.email,
        role: this.form.role,
        status: this.form.status,
        isActive: this.form.status === 'Active',
        hasActiveSubscription: this.selectedUser()!.hasActiveSubscription,
        gradeId: this.form.gradeId || undefined,
        specialization: this.form.specialization || undefined,
        studentIds: [...this.form.studentIds],
      };
      this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      this.persistManualUsers();
      this.setFeedback('تم تعديل المستخدم بنجاح');
      setTimeout(() => this.closeModal(), 900);
      return;
    }

    if (!this.form.name || !this.form.email || !this.form.password) {
      this.feedback.set('الرجاء ملء جميع الحقول المطلوبة');
      this.feedbackType.set('error');
      return;
    }

    if (this.form.role === 'Student' && !this.form.gradeId) {
      this.feedback.set('الرجاء اختيار المرحلة الدراسية للطالب');
      this.feedbackType.set('error');
      return;
    }

    if (this.form.role === 'Teacher' && (!this.form.specialization || !this.form.specialization.trim())) {
      this.feedback.set('الرجاء إدخال التخصص للمعلم');
      this.feedbackType.set('error');
      return;
    }

    if (this.form.role === 'Parent' && this.form.studentIds.length === 0) {
      this.feedback.set('الرجاء اختيار طالب واحد على الأقل لولي الأمر');
      this.feedbackType.set('error');
      return;
    }

    // Creating a new user – use backend API
    const req: any = {
      fullName: this.form.name,
      email: this.form.email,
      password: this.form.password,
      role: this.form.role,
      phone: this.form.phone,
    };

    if (this.form.role === 'Student') {
      req.gradeId = this.form.gradeId;
    } else if (this.form.role === 'Teacher') {
      req.specialization = this.form.specialization;
    } else if (this.form.role === 'Parent') {
      req.studentIds = this.form.studentIds;
    }

    this.adminApi.createUser(req).subscribe({
      next: (created) => {
        // Map the returned user to our AdminUser shape
        const newUser: AdminUser = {
          id: created.userId,
          name: created.fullName || created.email,
          email: created.email,
          role: created.role,
          isActive: created.isActive,
          createdAt: created.createdAt,
          hasActiveSubscription: !!created.hasActiveSubscription,
          status: created.isActive ? 'Active' : 'Inactive',
          joinedAt: this.formatDate(created.createdAt),
          source: 'api',
          subscription: null,
        };
        this.users.update((list) => [newUser, ...list]);
        this.setFeedback('تمت إضافة المستخدم بنجاح');
        setTimeout(() => this.closeModal(), 900);
        // Refresh data to ensure teachers list updates
        this.loadData();
          if (created.role === 'Teacher') {
            // Navigate to teachers page to see the new teacher
            // navigation after creating teacher (if needed)
            // this.router.navigate(['/dashboard/admin/teachers']);
          }
      },
      error: (err) => {
        const backendMessage = err?.error?.message || err?.error?.title || 'فشل إنشاء المستخدم عبر الخادم. تأكد من صحة البيانات.';
        this.setFeedback(backendMessage, 'error');
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

    if (user.source === 'api') {
      // Call the real API endpoint for backend users
      this.adminApi.deleteUser(user.id).subscribe({
        next: () => {
          this.users.update((list) => list.filter((u) => u.id !== user.id));
          this.setFeedback(`تم حذف المستخدم "${user.name}" بنجاح`);
        },
        error: () => {
          this.setFeedback('تعذر حذف المستخدم من الخادم. يرجى المحاولة مرة أخرى.', 'error');
        },
      });
    } else {
      // For manually-added local users, just remove from state
      this.users.update((list) => list.filter((u) => u.id !== user.id));
      this.persistManualUsers();
      this.setFeedback(`تم حذف المستخدم "${user.name}" بنجاح`);
    }
  }

  toggleUserStatus(user: AdminUser): void {
    if (user.source !== 'api') {
      this.setFeedback('يمكن تغيير حالة المستخدمين المسجلين عبر الخادم فقط.', 'error');
      return;
    }
    
    if (user.status === 'Active') {
      const reason = prompt('يرجى إدخال سبب التعطيل:');
      if (!reason) return;
      this.adminApi.deactivateUser(user.id, reason).subscribe({
        next: () => {
          this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: 'Inactive' } : u));
          this.setFeedback(`تم تعطيل المستخدم ${user.name}`);
        },
        error: () => this.setFeedback('تعذر تعطيل المستخدم.', 'error')
      });
    } else {
      this.adminApi.activateUser(user.id).subscribe({
        next: () => {
          this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: 'Active' } : u));
          this.setFeedback(`تم تفعيل المستخدم ${user.name}`);
        },
        error: () => this.setFeedback('تعذر تفعيل المستخدم.', 'error')
      });
    }
  }

  resetPassword(user: AdminUser): void {
    if (user.source !== 'api') {
      this.setFeedback('يمكن إعادة تعيين كلمة المرور للمستخدمين المسجلين عبر الخادم فقط.', 'error');
      return;
    }
    
    // Ask for new password, or leave empty to auto-generate
    const newPassword = prompt(
      `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم "${user.name}"؟\n\nأدخل كلمة المرور الجديدة (أو اترك الحقل فارغاً لتوليد كلمة مرور عشوائية):`
    );

    // If user clicked Cancel on the prompt, it returns null. So we abort.
    if (newPassword === null) return;
    
    this.adminApi.resetUserPassword(user.id, newPassword).subscribe({
      next: (res) => {
        if (res.password) {
          alert(`تمت إعادة تعيين كلمة المرور بنجاح.\nكلمة المرور الجديدة: ${res.password}`);
        } else {
          this.setFeedback('تم إرسال رابط إعادة التعيين إلى بريد المستخدم.');
        }
      },
      error: () => this.setFeedback('تعذر إعادة تعيين كلمة المرور.', 'error')
    });
  }

  cancelSubscription(userId: number, subscriptionId: number): void {
    if (!confirm('هل أنت متأكد من إلغاء هذا الاشتراك؟')) return;
    this.subApi.adminCancel(subscriptionId, 'إلغاء من لوحة الإدارة').subscribe({
      next: () => {
        this.users.update((list) =>
          list.map((u) =>
            u.id === userId && u.subscription
              ? { ...u, subscription: { ...u.subscription, status: 'Cancelled' } }
              : u,
          ),
        );
        this.setFeedback('تم إلغاء الاشتراك بنجاح');
      },
      error: () => {
        this.setFeedback('تعذر إلغاء الاشتراك. يرجى المحاولة مرة أخرى.', 'error');
      },
    });
  }

  // ── Subscription assignment ────────────────────────────────────────────────
  assignSubscription(): void {
    const studentId = this.selectedStudentId();
    if (!studentId) { this.setFeedback('اختر طالبًا أولاً', 'error'); return; }
    if (!this.selectedPlanId()) { this.setFeedback('اختر خطة أولاً', 'error'); return; }

    const student = this.studentUsers().find((u) => u.id === studentId);
    
    if (student?.source === 'manual') {
      this.setFeedback('لا يمكن إضافة اشتراك لطالب غير محفوظ في قاعدة البيانات', 'error');
      this.assigning.set(false);
      return;
    }

    this.assigning.set(true);
    this.setFeedback(null);

    const plan = this.plans().find((p) => p.planId === this.selectedPlanId());
    const note = `Assigned from admin panel for ${student?.name ?? 'student'}`;

    this.subApi
      .adminActivate({ studentUserId: studentId, planId: this.selectedPlanId()!, note })
      .subscribe({
        next: (createdSub) => {
          this.assigning.set(false);
          if (student && plan) {
            this.users.update((list) =>
              list.map((u) =>
                u.id === studentId
                  ? { ...u, subscription: { subscriptionId: createdSub.subscriptionId, planName: plan.name, planType: plan.type, status: 'Active', endDate: createdSub.endDate } }
                  : u,
              ),
            );
          }
          this.setFeedback(`تمت إضافة الاشتراك للطالب ${student?.name ?? 'المحدد'}`);
          this.selectedStudentId.set(null);
          this.selectedPlanId.set(null);
        },
        error: (err) => {
          this.assigning.set(false);
          const backendMessage = err?.error?.message || 'تعذر إضافة الاشتراك. تأكد من صلاحية الطالب أو الخطة.';
          this.setFeedback(backendMessage, 'error');
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private setFeedback(msg: string | null, type: 'success' | 'error' = 'success'): void {
    this.feedback.set(msg);
    this.feedbackType.set(type);
  }

  private formatDate(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB');
  }

  subStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'badge-active';
      case 'Expired': return 'badge-expired';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  }

  subStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Active: 'نشط', Expired: 'منتهي', Cancelled: 'ملغى', Pending: 'معلق',
    };
    return map[status] ?? status;
  }

  planTypeLabel(type: string): string {
    const map: Record<string, string> = {
      Monthly: 'شهري', PerSubject: 'لكل مادة', FullCurriculum: 'المنهج الكامل',
    };
    return map[type] ?? type;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      Student: 'طالب', Teacher: 'معلم', Admin: 'مدير', Parent: 'ولي أمر',
    };
    return map[role] ?? role;
  }

  roleClass(role: string): string {
    switch (role) {
      case 'Student': return 'role-student';
      case 'Teacher': return 'role-teacher';
      case 'Admin': return 'role-admin';
      default: return 'role-parent';
    }
  }

  // Handle multiple student selection for parents
  toggleStudentSelection(studentId: number): void {
    const idx = this.form.studentIds.indexOf(studentId);
    if (idx === -1) {
      this.form.studentIds.push(studentId);
    } else {
      this.form.studentIds.splice(idx, 1);
    }
  }
}
