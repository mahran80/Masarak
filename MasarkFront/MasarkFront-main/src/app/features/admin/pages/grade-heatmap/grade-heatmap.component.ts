import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AiAnalyticsService } from '../../../../core/services/ai-analytics.service';
import { GradeHeatmapDto } from '../../../../models/ai-analytics.model';

@Component({
  selector: 'app-grade-heatmap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12" dir="rtl">
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span class="text-orange-600">🗺️</span>
              خريطة الأداء الحرارية
            </h1>
            <p class="text-sm text-slate-500 mt-1">عرض مرئي لمتوسط درجات كل فصل في كل مادة</p>
          </div>
          <a routerLink="/dashboard/admin/platform-analytics"
             class="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            ← العودة لتحليلات المنصة
          </a>
        </div>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse h-64"></div>
      }

      @else if (error()) {
        <div class="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <span class="text-3xl mb-2 block">⚠️</span>
          <p class="text-sm mb-4">{{ error() }}</p>
          <button (click)="loadHeatmap()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            إعادة المحاولة
          </button>
        </div>
      }

      @else if (data()) {
        <!-- Grade Label -->
        <div class="bg-gradient-to-l from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-lg">
          <h2 class="text-xl font-bold">{{ data()!.gradeName }}</h2>
          <p class="text-orange-100 text-sm">{{ data()!.classes.length }} فصل</p>
        </div>

        <!-- Legend -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div class="flex items-center gap-4 justify-center flex-wrap">
            <span class="text-xs font-bold text-slate-500">دليل الألوان:</span>
            <div class="flex items-center gap-1.5">
              <span class="w-4 h-4 rounded bg-[#22c55e]"></span>
              <span class="text-xs text-slate-600">≥ 80% (ممتاز)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-4 h-4 rounded bg-[#eab308]"></span>
              <span class="text-xs text-slate-600">60-79% (جيد)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-4 h-4 rounded bg-[#ef4444]"></span>
              <span class="text-xs text-slate-600">&lt; 60% (يحتاج تحسين)</span>
            </div>
          </div>
        </div>

        @if (data()!.classes.length === 0) {
          <div class="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span class="text-5xl block mb-3 opacity-50">🗺️</span>
            <p class="text-slate-500 font-medium">لا توجد فصول مسجلة في هذا الصف</p>
          </div>
        } @else {
          <!-- Heatmap Table -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th class="text-right px-4 py-3 font-bold text-slate-600 border-b border-slate-100 sticky right-0 bg-slate-50 z-10">الفصل</th>
                  @for (subj of allSubjects(); track subj) {
                    <th class="px-4 py-3 font-bold text-slate-600 border-b border-slate-100 text-center whitespace-nowrap">{{ subj }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (cls of data()!.classes; track cls.className) {
                  <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td class="px-4 py-3 font-bold text-slate-800 sticky right-0 bg-white z-10">{{ cls.className }}</td>
                    @for (subj of allSubjects(); track subj) {
                      @if (getCell(cls.className, subj); as cell) {
                        <td class="px-3 py-3 text-center">
                          <div class="inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px]"
                               [style.background-color]="cell.heatmapColor + '20'"
                               [style.border]="'2px solid ' + cell.heatmapColor">
                            <span class="font-black text-sm" [style.color]="cell.heatmapColor">
                              {{ cell.averageScore.toFixed(0) }}%
                            </span>
                          </div>
                        </td>
                      } @else {
                        <td class="px-3 py-3 text-center">
                          <span class="text-slate-300 text-xs">—</span>
                        </td>
                      }
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
})
export class GradeHeatmapComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly aiService = inject(AiAnalyticsService);

  data = signal<GradeHeatmapDto | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  allSubjects = signal<string[]>([]);

  gradeId = 0;

  // Cache for fast cell lookup
  private cellMap = new Map<string, { averageScore: number; heatmapColor: string }>();

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.gradeId = Number(params.get('gradeId')) || 1;
      this.loadHeatmap();
    });
  }

  loadHeatmap(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.aiService.getGradeHeatmap(this.gradeId).subscribe({
      next: (res) => {
        this.data.set(res);
        // Extract unique subjects
        const subjects = new Set<string>();
        this.cellMap.clear();
        for (const cls of res.classes) {
          for (const cell of cls.subjectScores) {
            subjects.add(cell.subjectName);
            this.cellMap.set(`${cls.className}::${cell.subjectName}`, {
              averageScore: cell.averageScore,
              heatmapColor: cell.heatmapColor,
            });
          }
        }
        this.allSubjects.set(Array.from(subjects));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('تعذر تحميل الخريطة الحرارية.');
        this.isLoading.set(false);
      },
    });
  }

  getCell(className: string, subjectName: string): { averageScore: number; heatmapColor: string } | null {
    return this.cellMap.get(`${className}::${subjectName}`) ?? null;
  }
}
