import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TeacherAssessmentService } from '../../../../services/teacher-assessment.service';
import { 
  QuestionDto, QuestionType, DifficultyLevel, 
  AddQuestionRequest, QuestionOptionDto 
} from '../../../../models/assessment.models';

@Component({
  selector: 'app-exam-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-container max-w-4xl">
      <div class="mb-8">
        <a routerLink="../../" class="text-brand-600 hover:underline text-sm mb-2 inline-block">← Back to Exams</a>
        <h1 class="text-3xl font-bold text-surface-900 font-display">Exam Builder</h1>
        <p class="text-surface-500 mt-1">Add and manage questions for this exam</p>
      </div>

      <!-- Add Question Form -->
      <div class="card p-6 mb-8 border-t-4 border-brand-500">
        <h2 class="text-lg font-bold mb-4">Add New Question</h2>
        
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="form-label">Type</label>
              <select formControlName="type" class="form-select" (change)="onTypeChange()">
                <option *ngFor="let t of questionTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Difficulty</label>
              <select formControlName="difficulty" class="form-select">
                <option *ngFor="let d of difficulties" [value]="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Marks</label>
              <input type="number" formControlName="marks" class="form-input" min="1"/>
            </div>
          </div>

          <div>
            <label class="form-label">Question Text</label>
            <textarea formControlName="text" class="form-input" rows="3"></textarea>
          </div>

          <!-- MCQ Options -->
          <div *ngIf="form.get('type')?.value === 'MCQ'" class="space-y-3 bg-surface-50 p-4 rounded-lg">
            <div class="flex justify-between items-center">
              <label class="form-label mb-0">Options</label>
              <button type="button" (click)="addOption()" class="text-sm text-brand-600 hover:underline">+ Add Option</button>
            </div>
            <div formArrayName="options" class="space-y-2">
              <div *ngFor="let opt of optionsArray.controls; let i=index" [formGroupName]="i" class="flex gap-2">
                <input type="text" formControlName="label" class="form-input w-16" placeholder="A"/>
                <input type="text" formControlName="text" class="form-input flex-1" placeholder="Option text..."/>
                <button type="button" (click)="removeOption(i)" class="btn-secondary btn-sm px-2 text-danger">✕</button>
              </div>
            </div>
            <div class="mt-3">
              <label class="form-label">Correct Option Label (e.g., A)</label>
              <input type="text" formControlName="correctAnswer" class="form-input w-24"/>
            </div>
          </div>

          <!-- True/False Correct Answer -->
          <div *ngIf="form.get('type')?.value === 'TrueFalse'" class="bg-surface-50 p-4 rounded-lg">
            <label class="form-label">Correct Answer</label>
            <select formControlName="correctAnswer" class="form-select w-32">
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>

          <!-- Fill in Blank Correct Answer -->
          <div *ngIf="form.get('type')?.value === 'FillInBlank'" class="bg-surface-50 p-4 rounded-lg">
            <label class="form-label">Correct Answer (Exact match)</label>
            <input type="text" formControlName="correctAnswer" class="form-input"/>
          </div>

          <div class="flex justify-end pt-2 border-t border-surface-200">
            <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary">
              {{ saving() ? 'Saving...' : 'Add Question' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Currently added questions (Since we don't have a GET endpoint for just questions, we just append to a local list for preview) -->
      <h2 class="text-xl font-bold mb-4">Added Questions Preview</h2>
      <div *ngIf="questions().length === 0" class="text-surface-500 italic">No questions added yet in this session.</div>
      <div class="space-y-4">
        <div *ngFor="let q of questions(); let i = index" class="card p-4">
          <div class="flex justify-between items-start">
            <span class="font-bold text-brand-600">Q{{ i + 1 }} ({{ q.marks }} marks)</span>
            <span class="badge bg-surface-200 text-surface-700 text-xs">{{ q.type }} · {{ q.difficulty }}</span>
          </div>
          <p class="mt-2 text-surface-900">{{ q.text }}</p>
          <ul *ngIf="q.options && q.options.length > 0" class="mt-2 space-y-1 pl-4 list-disc text-sm text-surface-700">
            <li *ngFor="let opt of q.options"><strong>{{ opt.label }}:</strong> {{ opt.text }}</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class ExamBuilderComponent implements OnInit {
  private svc = inject(TeacherAssessmentService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  examId!: number;
  saving = signal(false);
  questions = signal<QuestionDto[]>([]); // To preview added questions

  questionTypes = Object.values(QuestionType);
  difficulties = Object.values(DifficultyLevel);

  form = this.fb.group({
    type: [QuestionType.MCQ as string, Validators.required],
    text: ['', Validators.required],
    marks: [5, [Validators.required, Validators.min(1)]],
    difficulty: [DifficultyLevel.Medium as string, Validators.required],
    options: this.fb.array([]),
    correctAnswer: ['']
  });

  get optionsArray() {
    return this.form.get('options') as FormArray;
  }

  ngOnInit() {
    this.examId = Number(this.route.snapshot.paramMap.get('id'));
    this.addOption('A');
    this.addOption('B');
    this.addOption('C');
    this.addOption('D');
  }

  onTypeChange() {
    const type = this.form.get('type')?.value;
    if (type !== QuestionType.MCQ) {
      this.optionsArray.clear();
      if (type === QuestionType.TrueFalse) {
        this.form.patchValue({ correctAnswer: 'True' });
      } else {
        this.form.patchValue({ correctAnswer: '' });
      }
    } else {
      if (this.optionsArray.length === 0) {
        this.addOption('A'); this.addOption('B');
      }
    }
  }

  addOption(defaultLabel: string = '') {
    this.optionsArray.push(this.fb.group({
      label: [defaultLabel, Validators.required],
      text: ['', Validators.required]
    }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.value;
    const req: AddQuestionRequest = {
      type: v.type as QuestionType,
      text: v.text!,
      marks: v.marks!,
      difficulty: v.difficulty as DifficultyLevel,
      order: this.questions().length + 1,
      correctAnswer: v.correctAnswer || undefined,
      options: v.type === QuestionType.MCQ ? (v.options as QuestionOptionDto[]) : undefined
    };

    this.svc.addQuestion(this.examId, req).subscribe({
      next: (q) => {
        this.saving.set(false);
        this.questions.update(curr => [...curr, q]);
        // Reset form partially
        this.form.patchValue({ text: '', correctAnswer: v.type === QuestionType.TrueFalse ? 'True' : '' });
        if (v.type === QuestionType.MCQ) {
          this.optionsArray.controls.forEach(c => c.patchValue({ text: '' }));
        }
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to add question');
      }
    });
  }
}
