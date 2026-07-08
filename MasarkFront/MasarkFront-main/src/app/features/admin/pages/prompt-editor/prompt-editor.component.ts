import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { AiPromptTemplateDto, UpdatePromptTemplateRequest } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-prompt-editor',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-purple-600"><app-icon name="robot" size="1.2em"></app-icon></span>
              إدارة قوالب الذكاء الاصطناعي
            </h1>
            <p class="text-sm text-slate-500 mt-1">تعديل قوالب المطالبات المستخدمة في توليد التقارير والتحليلات</p>
          </div>
          <a routerLink="/dashboard/admin"
             class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ← العودة للوحة الإدارة
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-48"></div>
          }
        </div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block"><app-icon name="exclamation-triangle" size="1.2em"></app-icon>️</span>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadTemplates()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else {
        <!-- Success Message -->
        @if (successMessage()) {
          <div class="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-200 flex items-center gap-2 text-sm font-bold">
            <app-icon name="check-circle" size="1.2em"></app-icon> {{ successMessage() }}
          </div>
        }

        <!-- Template Cards -->
        @for (template of templates(); track template.key) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <!-- Template Header -->
            <div class="bg-gradient-to-l from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 class="text-white font-bold text-lg">{{ getTemplateLabel(template.key) }}</h3>
                <p class="text-purple-200 text-xs mt-0.5">Key: {{ template.key }}</p>
              </div>
              <div class="text-right text-xs text-purple-200">
                <p>آخر تحديث: {{ template.updatedAt | date:'short' }}</p>
                <p>بواسطة: {{ template.updatedBy }}</p>
              </div>
            </div>

            <!-- Template Body -->
            <div class="p-6 space-y-5">
              <!-- System Prompt -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <app-icon name="settings" size="1.2em"></app-icon> System Prompt
                </label>
                <textarea [(ngModel)]="editData[template.key].systemPrompt"
                          rows="3"
                          class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none bg-slate-50"
                          dir="ltr"></textarea>
              </div>

              <!-- User Prompt Template -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <app-icon name="chat" size="1.2em"></app-icon> User Prompt Template
                </label>
                <textarea [(ngModel)]="editData[template.key].userPromptTemplate"
                          rows="5"
                          class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none bg-slate-50"
                          dir="ltr"></textarea>
              </div>

              <!-- Parameters -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-600">Max Tokens</label>
                  <input type="number" [(ngModel)]="editData[template.key].maxTokens"
                         class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                         dir="ltr" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-600">Temperature (0-1)</label>
                  <input type="number" [(ngModel)]="editData[template.key].temperature"
                         step="0.1" min="0" max="1"
                         class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                         dir="ltr" />
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end pt-2">
                <button (click)="saveTemplate(template.key)"
                        [disabled]="savingKey() === template.key"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (savingKey() === template.key) {
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  } @else {
                    <app-icon name="archive" size="1.2em"></app-icon> حفظ التغييرات
                  }
                </button>
              </div>
            </div>
          </div>
        }

        @if (templates().length === 0) {
          <div class="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-5xl block mb-3 opacity-50"><app-icon name="robot" size="1.2em"></app-icon></span>
            <p class="text-slate-500 font-medium">لا توجد قوالب مسجلة في النظام</p>
          </div>
        }
      }
    </div>
  `,
})
export class PromptEditorComponent implements OnInit {
  private readonly aiService = inject(AiAnalyticsService);

  templates = signal<AiPromptTemplateDto[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  savingKey = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  editData: Record<string, { systemPrompt: string; userPromptTemplate: string; maxTokens: number; temperature: number }> = {};

  private readonly templateLabels: Record<string, string> = {
    weakness_analysis: '<app-icon name="chart" size="1.2em"></app-icon> تحليل نقاط الضعف',
    parent_report: '<app-icon name="document-text" size="1.2em"></app-icon> تقرير ولي الأمر الشهري',
    teaching_suggestion: '<app-icon name="sparkles" size="1.2em"></app-icon> اقتراح تعليمي للمعلم',
  };

  getTemplateLabel(key: string): string {
    return this.templateLabels[key] ?? key;
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getAllPromptTemplates().subscribe({
      next: (res) => {
        this.templates.set(res);
        this.editData = {};
        for (const t of res) {
          this.editData[t.key] = {
            systemPrompt: t.systemPrompt,
            userPromptTemplate: t.userPromptTemplate,
            maxTokens: t.maxTokens,
            temperature: t.temperature,
          };
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل قوالب الذكاء الاصطناعي.');
        this.isLoading.set(false);
      },
    });
  }

  saveTemplate(key: string): void {
    this.savingKey.set(key);
    this.successMessage.set(null);

    const data = this.editData[key];
    const request: UpdatePromptTemplateRequest = {
      systemPrompt: data.systemPrompt,
      userPromptTemplate: data.userPromptTemplate,
      maxTokens: data.maxTokens,
      temperature: data.temperature,
    };

    this.aiService.updatePromptTemplate(key, request).subscribe({
      next: () => {
        this.savingKey.set(null);
        this.successMessage.set(`تم حفظ قالب "${this.getTemplateLabel(key)}" بنجاح.`);
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.savingKey.set(null);
        this.successMessage.set(null);
        alert('فشل حفظ القالب. يرجى المحاولة مرة أخرى.');
      },
    });
  }
}
