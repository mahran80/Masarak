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
    <div class="prompt-workspace space-y-8 pb-16 font-sans text-slate-800" dir="rtl">
      <!-- Header -->
      <div class="prompt-page-header flex flex-col gap-2">
        <div class="flex items-center gap-2 text-[13px] font-semibold text-slate-400">
          <span>الرئيسية</span>
          <app-icon name="chevron-left" [size]="12"></app-icon>
          <span class="text-slate-700 font-bold">الذكاء الاصطناعي</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#4F8CD4] shadow-sm">
              <app-icon name="robot" [size]="20"></app-icon>
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-900">إدارة قوالب الذكاء الاصطناعي</h1>
              <p class="text-[13px] font-semibold text-slate-500">تعديل قوالب المطالبات المستخدمة في توليد التقارير والتحليلات</p>
            </div>
          </div>
          <a routerLink="/dashboard/admin"
             class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            العودة للوحة الإدارة
            <app-icon name="chevron-left" [size]="14"></app-icon>
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="space-y-6">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-pulse h-48"></div>
          }
        </div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <app-icon name="exclamation-triangle" [size]="24"></app-icon>
          </div>
          <p class="text-[15px] font-bold">{{ error() }}</p>
          <button (click)="loadTemplates()" class="mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-[13px]">
            إعادة المحاولة
          </button>
        </div>
      }

      @else {
        <!-- Success Message -->
        @if (successMessage()) {
          <div class="bg-sky-50 text-[#4F8CD4] p-4 rounded-xl border border-sky-100 flex items-center gap-2 text-[13px] font-bold shadow-sm mb-6">
            <app-icon name="check-circle" size="1.2em"></app-icon> {{ successMessage() }}
          </div>
        }

        <div class="templates-grid grid grid-cols-1 gap-6">
          <!-- Template Cards -->
          @for (template of templates(); track template.key) {
            <div class="template-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              
              <!-- Template Header (White/Blue Theme, No Purple) -->
              <div class="template-card-header bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#4F8CD4] shadow-sm shrink-0">
                    <app-icon [name]="getTemplateIcon(template.key)" [size]="20"></app-icon>
                  </div>
                  <div>
                    <h3 class="text-slate-800 font-black text-[15px]">{{ getTemplateLabel(template.key) }}</h3>
                    <p class="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Key: {{ template.key }}</p>
                  </div>
                </div>
                
                <!-- Highly legible metadata text -->
                <div class="text-right sm:text-left flex flex-col sm:items-end gap-1">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold">
                    <app-icon name="clock" [size]="12"></app-icon>
                    آخر تحديث: {{ template.updatedAt | date:'short' }}
                  </span>
                  <span class="text-[11px] font-semibold text-slate-400">بواسطة: {{ template.updatedBy }}</span>
                </div>
              </div>

              <!-- Template Body -->
              <div class="template-card-body p-6 space-y-6">
                <!-- System Prompt -->
                <div class="prompt-field system-prompt-field space-y-2">
                  <label class="text-[13px] font-black text-slate-700 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                      <app-icon name="settings" [size]="14"></app-icon>
                    </div>
                    System Prompt
                  </label>
                  <textarea [(ngModel)]="editData[template.key].systemPrompt"
                            rows="3"
                            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-mono leading-relaxed focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none shadow-sm text-slate-700"
                            dir="ltr"></textarea>
                </div>

                <!-- User Prompt Template -->
                <div class="prompt-field user-prompt-field space-y-2">
                  <label class="text-[13px] font-black text-slate-700 flex items-center gap-2">
                    <div class="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                      <app-icon name="chat" [size]="14"></app-icon>
                    </div>
                    User Prompt Template
                  </label>
                  <textarea [(ngModel)]="editData[template.key].userPromptTemplate"
                            rows="5"
                            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-mono leading-relaxed focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none shadow-sm text-slate-700"
                            dir="ltr"></textarea>
                </div>

                <!-- Parameters Grid -->
                <div class="params-panel grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-slate-50/50 border border-slate-100 rounded-xl">
                  <div class="space-y-2">
                    <label class="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Max Tokens</label>
                    <input type="number" [(ngModel)]="editData[template.key].maxTokens"
                           class="w-full h-[44px] bg-white border border-slate-200 rounded-xl px-4 text-[13px] font-mono focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all shadow-sm"
                           dir="ltr" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Temperature (0-1)</label>
                    <input type="number" [(ngModel)]="editData[template.key].temperature"
                           step="0.1" min="0" max="1"
                           class="w-full h-[44px] bg-white border border-slate-200 rounded-xl px-4 text-[13px] font-mono focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all shadow-sm"
                           dir="ltr" />
                  </div>
                </div>

                <!-- Save Button (Blue Theme) -->
                <div class="save-row flex justify-end pt-2">
                  <button (click)="saveTemplate(template.key)"
                          [disabled]="savingKey() === template.key"
                          class="bg-[#4F8CD4] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md">
                    @if (savingKey() === template.key) {
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الحفظ...
                    } @else {
                      <app-icon name="archive" [size]="16"></app-icon> حفظ التغييرات
                    }
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (templates().length === 0) {
          <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <app-icon name="robot" [size]="32"></app-icon>
            </div>
            <p class="text-[15px] font-black text-slate-700">لا توجد قوالب مسجلة في النظام</p>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './prompt-editor.component.css',
})
export class PromptEditorComponent implements OnInit {
  private readonly aiService = inject(AiAnalyticsService);

  templates = signal<AiPromptTemplateDto[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  savingKey = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  editData: Record<string, { systemPrompt: string; userPromptTemplate: string; maxTokens: number; temperature: number }> = {};

  // Clean strings without raw HTML
  private readonly templateLabels: Record<string, string> = {
    weakness_analysis: 'تحليل نقاط الضعف',
    parent_report: 'تقرير ولي الأمر الشهري',
    teaching_suggestion: 'اقتراح تعليمي للمعلم',
  };

  // Dedicated icon mapping
  private readonly templateIcons: Record<string, string> = {
    weakness_analysis: 'chart-bar',
    parent_report: 'document-text',
    teaching_suggestion: 'sparkles',
  };

  getTemplateLabel(key: string): string {
    return this.templateLabels[key] ?? key;
  }

  getTemplateIcon(key: string): string {
    return this.templateIcons[key] ?? 'code';
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
        // Fixed interpolations to display clean text and icon correctly in the UI
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
