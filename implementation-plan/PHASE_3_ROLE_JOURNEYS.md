# PHASE 3 — Role-Specific Journeys

> **Goal**: With the foundation (P1) and shell (P2) in place, improve the end-to-end experience for each role. Close all remaining P2 findings and address the high-friction workflows identified in Report 2. After this phase, every user journey flows without dead ends or contextual gaps.

---

## 1. Scope

Phase 3 focuses on:
- **Student**: Pre-exam instructions, exam result → performance link, performance ↔ insights cross-link, lesson → assignment contextual link, subscription redirect fix
- **Parent**: Per-child context bar, Add-vs-Link student clarification, registration success feedback
- **Teacher**: Assessment workflow streamlining (already improved via sidebar in P2), exam creator post-creation navigation
- **Admin**: 6-tab cognitive load reduction, grade Order auto-calculation, grade card affordance, admin CRUD undo/feedback improvements, selected context indicator
- **Cross-role**: Help tooltips, logout confirmation polish, notification click-to-navigate polish

Phase 3 does **NOT** include: visual polish/animation fine-tuning (P4), full QA regression suite (P4), performance optimization (P4).

---

## 2. Prerequisites

| Prerequisite | Status |
|---|---|
| Phase 2 complete — sidebar, breadcrumbs, visual tokens | Required |
| Sidebar navigation IA final (no more nav restructuring) | From P2 |
| `ConfirmDialog` from P1 | Available |
| Breadcrumbs auto-generated from route data | From P2 |

---

## 3. Findings Addressed

| Finding ID | Source | Status | Task |
|---|---|---|---|
| EX-05 (no pre-exam instructions) | R3 | CONFIRMED P2 | T3-01 |
| Result→Performance link | R2 | CONFIRMED P2 | T3-02 |
| Performance↔Insights link | R2 | CONFIRMED P2 | T3-03 |
| Lesson→Assignment link | R2 | CONFIRMED P2 | T3-04 |
| Student sub→profile redirect | R2 | CONFIRMED P2 | T3-05 |
| Parent per-child context | R2 | CONFIRMED P2 | T3-06 |
| Add-vs-Link confusion | R2 | CONFIRMED P2 | T3-07 |
| Registration no success page | R2 | CONFIRMED P2 | T3-08 |
| N6-02 (no selection context) | R1 | CONFIRMED P2 | T3-09 |
| Miller (6 tabs) | R1 | CONFIRMED P2 | T3-10 |
| Tesler (grade Order auto-calc) | R1 | CONFIRMED P2 | T3-11 |
| Norman-Affordance (grade cards) | R1 | CONFIRMED P2 | T3-12 |
| N10-01 (no help/tooltips) | R1 | CONFIRMED P2 | T3-13 |
| N1-03 ("0 مرحلة" during load) | R1 | CONFIRMED P3 | T3-14 |
| R-08 (6-tab scroll) | R3 | CONFIRMED MEDIUM | T3-10 |
| Admin CRUD no undo | R2 | CONFIRMED P2 | T3-15 |

---

## 4. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Pre-exam instructions are a MODAL overlay, not a separate route | Student is already on the exams page; adding a route changes the flow unnecessarily. A modal keeps context. |
| D2 | Parent per-child context bar: horizontal bar below breadcrumbs showing child name + quick-links (report, attendance, alerts, schedule) | Avoids full page navigation back to children list. Bar appears on any `/parent/*/:studentId` route. |
| D3 | Admin 6-tab → 4-tab + sub-tabs | Group "تسكين الطلاب" and "تعيين المعلمين" under the "الفصول" tab as sub-sections. Remove "تخصصات المعلمين" as a separate tab — merge into "تعيين المعلمين". Reduces to: المراحل | المواد | الفصول (with student/teacher sub-sections) | تخصصات. |
| D4 | Grade Order auto-calculate: default = max(existing orders) + 1, editable | Tesler's Law: hide complexity but allow override. |
| D5 | No separate "undo" feature for admin CRUD | Too complex to implement undo for server-side CRUD. Instead: improve confirmation before destructive updates, keep error messages persistent, add explicit "هل أنت متأكد؟" on updates (not just creates). |
| D6 | Help tooltips: title attribute on key actions + tooltip component for complex ones | Start with exam and assessment flows. Use native `title` for simple hover text; build tooltip component only if needed later. |
| D7 | "Add Student" vs "Link Student" merged into one page with two clear tabs | Parent sees: "إضافة طالب جديد" tab (creates new account) and "ربط طالب موجود" tab (enters linkage code). Clear Arabic labels and descriptions. |

---

## 5. Tasks

### T3-01: Pre-exam instructions screen
**Findings**: EX-05
**Files**:
- `MasarkFront/.../features/student/pages/exams/exams.component.html`
- `MasarkFront/.../features/student/pages/exams/exams.component.ts`

**Changes**:
1. When student clicks "ابدأ الاختبار", instead of immediately calling `startSelectedExam()`:
   - Show an instructions overlay/section with:
     - Exam name (from `selectedExam().exam.examName` or `title`)
     - Subject name (from `selectedExam().subject.subjectName`)
     - Duration: `selectedExam().exam.durationMinutes` دقيقة
     - Question count: `selectedExam().exam.totalQuestions || 'غير محدد'` سؤال
     - Rules (static Arabic text):
       - "سيتم حفظ إجاباتك تلقائياً كل 30 ثانية."
       - "لا يمكنك العودة للاختبار بعد تسليمه."
       - "سيتم التسليم تلقائياً عند انتهاء الوقت."
       - "تأكد من اتصالك بالإنترنت."
     - Two buttons: "بدء الاختبار" (primary, calls `startSelectedExam()`) and "رجوع" (closes overlay).
2. Add `showInstructions = signal<boolean>(false)` in TS.
3. "ابدأ الاختبار" button sets `showInstructions(true)`.
4. Actual start button in instructions calls `startSelectedExam()` and sets `showInstructions(false)`.

**Effort**: 3h

### T3-02: Exam result → performance link
**Findings**: Result→Performance link (R2)
**Files**:
- `MasarkFront/.../features/student/pages/exams/exams.component.html`

**Changes**:
1. In the exam result section (~L152-168), after the result display, add:
   ```html
   <div class="mt-4 flex gap-3">
     <a routerLink="/dashboard/student/performance" 
        class="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
       <app-icon name="trend-up" [size]="16"></app-icon>
       عرض تقرير الأداء الكامل
     </a>
     <a routerLink="/dashboard/student/insights"
        class="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
       <app-icon name="sparkles" [size]="16"></app-icon>
       رؤى التعلم
     </a>
   </div>
   ```

**Effort**: 1h

### T3-03: Performance ↔ Insights cross-link
**Findings**: Performance↔Insights link (R2)
**Files**:
- `MasarkFront/.../features/student/pages/performance/performance.component.html` (find and edit)
- `MasarkFront/.../features/student/pages/insights/insights.component.html` (find and edit)

**Changes**:
1. In performance page, add a card/banner:
   ```html
   <div class="mt-6 p-4 rounded-card bg-surface-alt border border-border flex items-center justify-between">
     <div>
       <p class="text-sm font-bold text-slate-800">رؤى التعلم بالذكاء الاصطناعي</p>
       <p class="text-xs text-slate-500 mt-1">اكتشف نقاط القوة والضعف بناءً على أدائك</p>
     </div>
     <a routerLink="/dashboard/student/insights" class="btn-primary text-sm px-4 py-2">
       عرض الرؤى
     </a>
   </div>
   ```
2. In insights page, add reciprocal link to performance.

**Effort**: 2h

### T3-04: Lesson → Assignment contextual link
**Findings**: Lesson→Assignment link (R2)
**Files**:
- Find student lesson detail template/component

**Changes**:
1. If the lesson detail page shows lesson content, add a section:
   ```html
   <div class="mt-4">
     <a routerLink="/dashboard/student/assignments" [queryParams]="{ lessonId: lesson.id }"
        class="text-sm font-semibold text-brand hover:underline">
       <app-icon name="clipboard-document-list" [size]="16"></app-icon>
       عرض الواجبات المرتبطة بهذا الدرس
     </a>
   </div>
   ```
2. If assignments page supports `lessonId` query param filtering — great. If not, this becomes a navigation link without filtering (still useful for context).
3. **Verify** lesson detail component exists and has lesson context before implementing.

**Effort**: 2h

### T3-05: Student subscription redirect fix
**Findings**: Student sub→profile redirect (R2)
**Files**:
- `MasarkFront/.../features/student/routes/student.routes.ts`

**Changes**:
1. At L87-90, change redirect from `profile` to the plans page (now inside dashboard from P2):
   ```ts
   { path: 'subscription', redirectTo: '/dashboard/student/plans', pathMatch: 'full' }
   ```
   OR: create a `StudentSubscriptionComponent` that shows subscription status and links to plans.
2. **Decision**: Simple redirect to plans is sufficient for now. The sidebar already has "الخطط والاشتراكات".

**Effort**: 0.5h

### T3-06: Parent per-child context bar
**Findings**: Parent per-child context (R2)
**Files** (NEW + modified):
- `MasarkFront/.../features/parent/components/child-context-bar/child-context-bar.component.ts` (NEW)
- `MasarkFront/.../features/parent/components/child-context-bar/child-context-bar.component.html` (NEW)
- Parent pages: `smart-report`, `child-alerts`, `attendance`, `schedule` (add component)

**Specification**:
1. Component: `ChildContextBarComponent`
   - Input: `studentId` (from route param)
   - Fetches child name from `ParentService`
   - Renders horizontal bar:
   ```
   ┌────────────────────────────────────────────────────┐
   │ 👤 أحمد محمد  |  📊 التقرير  |  📅 الحضور  |  🔔 التنبيهات  |  📆 الجدول │
   └────────────────────────────────────────────────────┘
   ```
   - Active link highlighted.
   - Routes:
     - التقرير → `parent/reports/:studentId`
     - الحضور → `parent/attendance/:studentId`
     - التنبيهات → `parent/alerts/:studentId`
     - الجدول → `parent/schedule/:studentId`
2. Add `<app-child-context-bar [studentId]="studentId" />` at the top of each child-specific parent page.
3. Bar is responsive: horizontal scroll on mobile with `overflow-x-auto`.

**Effort**: 4h

### T3-07: Add-vs-Link student clarification
**Findings**: Add-vs-Link confusion (R2)
**Files**:
- `MasarkFront/.../features/parent/pages/children/children.component.html` (find and edit)
- OR: Create a combined page

**Changes**:
1. In the children list page, replace separate "إضافة طالب" and "ربط طالب" buttons (if they exist) with:
   ```html
   <div class="flex gap-3 mb-6">
     <button class="btn-primary" (click)="activeAction.set('add')">
       <app-icon name="plus" [size]="16"></app-icon>
       إنشاء حساب طالب جديد
     </button>
     <button class="btn-outline" (click)="activeAction.set('link')">
       <app-icon name="link" [size]="16"></app-icon>
       ربط طالب موجود بالكود
     </button>
   </div>
   ```
2. Add descriptive text under each option:
   - "إنشاء حساب طالب جديد" — "سيتم إنشاء حساب جديد للطالب وربطه تلقائياً بحسابك."
   - "ربط طالب موجود بالكود" — "إذا كان للطالب حساب بالفعل، أدخل كود الربط الخاص به."
3. **Verify** actual children page structure before implementing.

**Effort**: 2h

### T3-08: Registration success feedback
**Findings**: Registration no success page (R2)
**Files**:
- `MasarkFront/.../features/auth/signup/signup.ts`

**Changes**:
1. In `onSubmit()` success handler (L140-169), before navigating:
   - Use toast service to show success message:
   ```ts
   this.toastService.show({
     type: 'success',
     title: 'تم إنشاء الحساب بنجاح',
     message: this.mode === 'Parent' 
       ? 'مرحباً! يمكنك الآن إضافة أبنائك.'
       : 'تم إنشاء حساب الطالب وربطه بنجاح.'
   });
   ```
2. Import `ToastService` if not already imported.

**Effort**: 1h

### T3-09: Academic management — persistent selection context
**Findings**: N6-02
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. Add a context bar above the tabs showing current selections:
   ```html
   <div class="flex items-center gap-2 text-sm mb-4 bg-surface-alt rounded-lg px-4 py-2">
     @if (selectedGrade()) {
       <span class="bg-brand-light text-brand px-3 py-1 rounded-badge font-bold">
         المرحلة: {{ grades().find(g => g.gradeId === selectedGrade())?.nameAr || selectedGrade() }}
       </span>
     }
     @if (selectedClass()) {
       <span class="bg-brand-light text-brand px-3 py-1 rounded-badge font-bold">
         الفصل: {{ classes().find(c => c.classId === selectedClass())?.name || selectedClass() }}
       </span>
     }
   </div>
   ```
2. This bar persists across tab switches, showing what's currently selected.

**Effort**: 1.5h

### T3-10: Admin 6-tab cognitive load reduction
**Findings**: Miller (R1), R-08
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`
- `MasarkFront/.../admin/components/academic-management/academic-management.ts`

**Changes**:
1. Reduce visible tabs from 6 to 4:
   - **المراحل** (Grades) — unchanged
   - **المواد** (Subjects) — unchanged
   - **الفصول** (Classes) — now includes enrollment + teacher assignment as sub-sections
   - **التخصصات** (Specializations) — unchanged
2. Within the "الفصول" tab, add sub-section toggles:
   ```html
   <div class="flex gap-2 mt-4 mb-3">
     <button [class.bg-brand]="classSubTab() === 'info'" (click)="classSubTab.set('info')">بيانات الفصول</button>
     <button [class.bg-brand]="classSubTab() === 'roster'" (click)="classSubTab.set('roster')">تسكين الطلاب</button>
     <button [class.bg-brand]="classSubTab() === 'teachers'" (click)="classSubTab.set('teachers')">تعيين المعلمين</button>
   </div>
   ```
3. Add `classSubTab = signal<'info' | 'roster' | 'teachers'>('info')` in TS.
4. On mobile: tabs use `overflow-x-auto` with scroll snap and a scroll indicator shadow.

**Effort**: 4h

### T3-11: Grade Order auto-calculation
**Findings**: Tesler (R1)
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.ts`
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. In `openModal('grade', 'create')`: pre-fill `order` with `Math.max(...grades().map(g => g.order ?? 0), 0) + 1`.
2. In HTML: grade creation modal order field keeps existing `<input type="number">` but pre-filled. User can override.
3. Add placeholder text: `placeholder="ترتيب تلقائي"`.

**Effort**: 1h

### T3-12: Grade card affordance
**Findings**: Norman-Affordance (R1)
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. Grade cards that navigate to subjects: add a visible "عرض المواد →" link/arrow.
2. Add `cursor-pointer hover:border-brand hover:shadow-md transition-all` to make them look clickable.
3. Add `role="button"` and `tabindex="0"` with `(keydown.enter)="onGradeSelect(grade.gradeId)"`.

**Effort**: 1h

### T3-13: Help tooltips on key actions
**Findings**: N10-01
**Files**:
- `MasarkFront/.../features/student/pages/exams/exams.component.html`
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. Add `title` attributes on key buttons:
   - Exam "ابدأ الاختبار" → `title="سيبدأ الاختبار فوراً وسيتم احتساب الوقت"`
   - Exam "تسليم الاختبار" → `title="لا يمكن التراجع بعد التسليم"`
   - Admin "إضافة مرحلة" → `title="أضف مرحلة دراسية جديدة (مثال: الصف الأول الابتدائي)"`
   - Admin "إضافة مادة" → `title="يجب اختيار المرحلة أولاً"`
2. These are native browser tooltips. A full tooltip component can be built later if needed.

**Effort**: 1h

### T3-14: Academic management loading state fix
**Findings**: N1-03
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.html`

**Changes**:
1. In the grades tab header, change:
   ```html
   {{ grades().length }} مرحلة مسجلة
   ```
   to:
   ```html
   @if (isLoading()) {
     <span class="animate-pulse bg-slate-200 rounded w-16 h-4 inline-block"></span>
   } @else {
     {{ grades().length }} مرحلة مسجلة
   }
   ```

**Effort**: 0.5h

### T3-15: Admin CRUD update confirmation
**Findings**: Admin CRUD no undo (R2)
**Files**:
- `MasarkFront/.../admin/components/academic-management/academic-management.ts`

**Changes**:
1. In `saveModal()`, when `mode === 'edit'`:
   - Before calling the API, show ConfirmDialog:
   ```ts
   this.confirmDialog.confirm({
     title: 'تأكيد التعديل',
     body: `هل أنت متأكد من تعديل ${typeLabel}؟`,
     confirmLabel: 'تأكيد التعديل',
     cancelLabel: 'إلغاء'
   }).subscribe(confirmed => {
     if (confirmed) { /* existing update logic */ }
   });
   ```
2. `typeLabel` maps: grade → "المرحلة", subject → "المادة", class → "الفصل".
3. Creates do NOT need confirmation (user explicitly opened modal and filled form).

**Effort**: 1.5h

---

## 6. Wireframes (ASCII)

### Pre-Exam Instructions (T3-01)
```
┌─────────────────────────────────────────────┐
│           تعليمات الاختبار                    │
│                                              │
│  📝 اختبار: الرياضيات - الفصل الأول           │
│  📚 المادة: الرياضيات                         │
│  ⏱ المدة: 60 دقيقة                           │
│  ❓ عدد الأسئلة: 25 سؤال                      │
│                                              │
│  ── تعليمات هامة ──                           │
│                                              │
│  • سيتم حفظ إجاباتك تلقائياً كل 30 ثانية.    │
│  • لا يمكنك العودة للاختبار بعد تسليمه.       │
│  • سيتم التسليم تلقائياً عند انتهاء الوقت.    │
│  • تأكد من اتصالك بالإنترنت.                  │
│                                              │
│       [رجوع]         [بدء الاختبار]           │
└─────────────────────────────────────────────┘
```

### Parent Child Context Bar (T3-06)
```
┌─────────────────────────────────────────────────────┐
│ 👤 أحمد محمد  │  📊 التقرير  │  📅 الحضور  │  🔔 التنبيهات  │  📆 الجدول │
└─────────────────────────────────────────────────────┘
```

### Admin 4-Tab Layout (T3-10)
```
┌──────────┬──────────┬──────────┬──────────────┐
│ المراحل  │  المواد  │ الفصول   │ التخصصات     │
└──────────┴──────────┴──────────┴──────────────┘
                         ↓
              ┌────────────────────────────┐
              │ [بيانات] [طلاب] [معلمين]  │  ← sub-sections
              └────────────────────────────┘
```

### Admin Selection Context Bar (T3-09)
```
┌──────────────────────────────────────────────────┐
│  المرحلة: الصف الأول الابتدائي  │  الفصل: فصل أ │
└──────────────────────────────────────────────────┘
```

---

## 7. Verification Checklist

- [ ] Student: click "ابدأ الاختبار" → see instructions with duration, question count, rules → click "بدء الاختبار" → exam starts
- [ ] Student: exam result shows links to performance and insights pages
- [ ] Student: performance page shows link to insights; insights shows link back to performance
- [ ] Student: "الخطط والاشتراكات" in sidebar navigates to plans inside dashboard (not outside)
- [ ] Parent: navigate to child report → see context bar with child name and quick-links
- [ ] Parent: click "الحضور" in context bar → navigate to attendance WITHOUT going through children list
- [ ] Parent: children page shows clear "إنشاء حساب طالب جديد" vs "ربط طالب موجود"
- [ ] Parent registration: see success toast before navigating
- [ ] Admin: academic management shows 4 tabs instead of 6
- [ ] Admin: "الفصول" tab has sub-sections for classes, enrollment, teacher assignment
- [ ] Admin: selection context bar shows selected grade/class across tab switches
- [ ] Admin: creating a grade pre-fills Order field with next number
- [ ] Admin: grade cards show visual clickability cue (border, arrow)
- [ ] Admin: editing a grade/subject/class shows confirmation dialog
- [ ] Admin: grades count doesn't show "0" during loading
- [ ] Help: hovering over "ابدأ الاختبار" shows tooltip
- [ ] Mobile: admin tabs scroll horizontally without breaking

---

## 8. Definition of Done

1. **All P2 journey findings resolved** — no dead-end user flows
2. **Pre-exam instructions** shown before every exam start
3. **Parent per-child context bar** on all child-specific pages
4. **Admin tabs reduced** from 6 to 4 with sub-sections
5. **Cross-links** between exam results, performance, and insights
6. **Registration** shows success feedback
7. **All existing tests pass**
8. **Build succeeds** with zero new errors
9. **No regressions** in P1/P2 work

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Pre-exam instructions modal blocks timer start if modal state leaks | Low | `showInstructions` signal is independent of exam state; exam starts ONLY when `startSelectedExam()` is called |
| Parent context bar: child name fetching adds extra API call per page | Medium | Cache child name in `ParentService` signal; only fetch once per session per child |
| Admin 4-tab restructure breaks existing tab-change logic | Medium | `activeTab()` signal values change; update all references; test all tab flows |
| Lesson→Assignment link: lesson detail page structure unknown | Medium | Verify component exists first; if minimal, just add a routerLink with no filtering |
| Registration toast might flash too briefly before navigation | Low | Show toast BEFORE `router.navigate()`; toast persists across navigation (if using global toast container in `DashboardLayout`) |

---

## 10. Handoff to Phase 4

Phase 3 delivers:
- ✅ Complete student exam journey: instructions → attempt → result → performance → insights
- ✅ Parent child management without friction
- ✅ Admin academic management with reduced cognitive load
- ✅ Cross-page navigation links closing journey gaps
- ✅ Help tooltips on key actions

Phase 4 should:
1. Run full accessibility audit (automated + manual)
2. Fix any remaining contrast, focus, or ARIA issues
3. Lighthouse / performance checks
4. Visual QA across all roles and breakpoints
5. Final documentation and handoff

