import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherAssessmentService } from '../../../services/teacher-assessment.service';
import { AddQuestionRequest, QuestionType, TeacherQuestion, TeacherQuestionOption, UpdateQuestionRequest } from '../../../models/teacher-assessment.model';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './question-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorComponent implements OnInit {
  @Input({ required: true }) examId!: number;
  @Input() questionToEdit: TeacherQuestion | null = null;
  
  @Output() saved = new EventEmitter<TeacherQuestion>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly assessmentService = inject(TeacherAssessmentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  questionForm!: FormGroup;
  
  readonly questionTypes: { value: QuestionType, label: string }[] = [
    { value: 'MCQ', label: 'اختيار من متعدد (إجابة واحدة أو عدة إجابات)' },
    { value: 'TrueFalse', label: 'صح أو خطأ' },
    { value: 'ShortAnswer', label: 'إجابة قصيرة' },
    { value: 'Essay', label: 'مقال' },
    { value: 'FillInBlank', label: 'أكمل الفراغ' },
    { value: 'FileUpload', label: 'رفع ملف' }
  ];

  ngOnInit(): void {
    this.questionForm = this.fb.group({
      type: ['MCQ', [Validators.required]],
      text: ['', [Validators.required]],
      marks: [1, [Validators.required, Validators.min(0)]],
      difficulty: ['Medium', [Validators.required]],
      order: [1],
      correctAnswer: [''],
      options: this.fb.array([])
    });

    if (this.questionToEdit) {
      this.questionForm.patchValue({
        type: this.questionToEdit.type,
        text: this.questionToEdit.text,
        marks: this.questionToEdit.marks,
        difficulty: this.questionToEdit.difficulty,
        order: this.questionToEdit.order,
      });

      if (this.questionToEdit.options) {
        this.questionToEdit.options.forEach((opt: TeacherQuestionOption) => this.addOption(opt.label, opt.text));
      }
    } else {
      this.setupDefaultOptions('MCQ');
    }

    this.questionForm.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(type => {
        this.setupDefaultOptions(type);
      });
  }

  get optionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  addOption(label: string = '', text: string = ''): void {
    this.optionsArray.push(this.fb.group({
      label: [label, Validators.required],
      text: [text, Validators.required]
    }));
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index);
  }

  private setupDefaultOptions(type: QuestionType): void {
    this.optionsArray.clear();
    this.questionForm.get('correctAnswer')?.setValue('');

    if (type === 'MCQ') {
      this.addOption('A', '');
      this.addOption('B', '');
      this.addOption('C', '');
      this.addOption('D', '');
    } else if (type === 'TrueFalse') {
      this.addOption('True', 'صح');
      this.addOption('False', 'خطأ');
    }
  }

  onSave(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formData = this.questionForm.value;
    const request: AddQuestionRequest = {
      type: formData.type,
      text: formData.text,
      marks: formData.marks,
      difficulty: formData.difficulty,
      order: formData.order,
      correctAnswer: formData.correctAnswer,
      options: this.optionsArray.length > 0 ? formData.options : undefined
    };

    if (this.questionToEdit) {
      this.assessmentService.updateQuestion(this.examId, this.questionToEdit.questionId, request as UpdateQuestionRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (q) => {
            this.isSubmitting.set(false);
            this.saved.emit(q);
          },
          error: (_err: unknown) => {
            this.isSubmitting.set(false);
            this.errorMessage.set('فشل في تحديث السؤال.');
          }
        });
    } else {
      this.assessmentService.addQuestion(this.examId, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (q) => {
            this.isSubmitting.set(false);
            this.saved.emit(q);
          },
          error: (_err: unknown) => {
            this.isSubmitting.set(false);
            this.errorMessage.set('فشل في إضافة السؤال.');
          }
        });
    }
  }
}
