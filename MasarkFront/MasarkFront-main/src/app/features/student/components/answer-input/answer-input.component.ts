import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentExamQuestion, StudentExamAnswer, StudentEntityId } from '../../models';

@Component({
  selector: 'app-answer-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4">
      <!-- Text / Essay -->
      @if (isTextQuestion()) {
        <textarea
          class="w-full min-h-[120px] bg-white border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
          placeholder="اكتب إجابتك هنا..."
          [value]="textAnswer()"
          (input)="onTextInput($event)">
        </textarea>
      }

      <!-- Single Choice (Radio) -->
      @if (isSingleChoiceQuestion()) {
        <div class="space-y-3">
          @for (choice of question.choices; track choice.choiceId) {
            <label class="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors"
                   [class.border-blue-500]="isChoiceSelected(choice.choiceId)"
                   [class.bg-blue-50]="isChoiceSelected(choice.choiceId)"
                   [class.border-slate-200]="!isChoiceSelected(choice.choiceId)"
                   [class.hover:bg-slate-50]="!isChoiceSelected(choice.choiceId)">
              <div class="flex items-center h-5">
                <input type="radio" 
                       [name]="'q_' + question.questionId"
                       [value]="choice.choiceId"
                       [checked]="isChoiceSelected(choice.choiceId)"
                       (change)="onSingleChoiceChange(choice.choiceId)"
                       class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500">
              </div>
              <div class="text-sm font-medium text-slate-700">
                {{ choice.text }}
              </div>
            </label>
          }
        </div>
      }

      <!-- Multiple Choice (Checkbox) -->
      @if (isMultipleChoiceQuestion()) {
        <div class="space-y-3">
          @for (choice of question.choices; track choice.choiceId) {
            <label class="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors"
                   [class.border-blue-500]="isChoiceSelected(choice.choiceId)"
                   [class.bg-blue-50]="isChoiceSelected(choice.choiceId)"
                   [class.border-slate-200]="!isChoiceSelected(choice.choiceId)"
                   [class.hover:bg-slate-50]="!isChoiceSelected(choice.choiceId)">
              <div class="flex items-center h-5">
                <input type="checkbox" 
                       [value]="choice.choiceId"
                       [checked]="isChoiceSelected(choice.choiceId)"
                       (change)="onMultipleChoiceChange(choice.choiceId, $event)"
                       class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500">
              </div>
              <div class="text-sm font-medium text-slate-700">
                {{ choice.text }}
              </div>
            </label>
          }
        </div>
      }

      <!-- File Upload -->
      @if (isFileQuestion()) {
        <div class="w-full flex justify-center items-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden">
          <input type="file" (change)="onFileChange($event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          <div class="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            @if (fileName()) {
              <p class="text-sm font-bold text-blue-600 truncate max-w-xs">{{ fileName() }}</p>
              <p class="text-xs text-slate-500 mt-1">انقر لتغيير الملف</p>
            } @else {
              <p class="text-sm font-bold text-slate-600">انقر أو اسحب الملف هنا</p>
              <p class="text-xs text-slate-400 mt-1">الحد الأقصى 10 ميغابايت</p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class AnswerInputComponent {
  @Input({ required: true }) question!: StudentExamQuestion;
  @Input() answer: StudentExamAnswer | null = null;
  
  @Output() answerChange = new EventEmitter<StudentExamAnswer>();

  isTextQuestion(): boolean {
    const qt = (this.question.questionType || '').toLowerCase();
    return qt.includes('text') || qt.includes('short') || qt.includes('essay');
  }

  isSingleChoiceQuestion(): boolean {
    const qt = (this.question.questionType || '').toLowerCase();
    return qt.includes('single') || qt.includes('mcq') || qt.includes('truefalse') || qt.includes('tf') || qt === 'choice';
  }

  isMultipleChoiceQuestion(): boolean {
    const qt = (this.question.questionType || '').toLowerCase();
    return qt.includes('multiple') && !qt.includes('single');
  }

  isFileQuestion(): boolean {
    const qt = (this.question.questionType || '').toLowerCase();
    return qt.includes('file') || qt.includes('upload');
  }

  textAnswer(): string {
    return this.answer?.answerText || '';
  }

  fileName(): string | null {
    return this.answer?.file?.name || null;
  }

  isChoiceSelected(choiceId: StudentEntityId): boolean {
    if (!this.answer) return false;
    const selectedChoiceIds = this.answer.selectedChoiceIds || [];
    return selectedChoiceIds.some(id => String(id) === String(choiceId));
  }

  onTextInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.answerChange.emit({
      questionId: this.question.questionId,
      answerText: value
    });
  }

  onSingleChoiceChange(choiceId: StudentEntityId): void {
    this.answerChange.emit({
      questionId: this.question.questionId,
      selectedOptionId: String(choiceId),
      selectedChoiceIds: [choiceId]
    });
  }

  onMultipleChoiceChange(choiceId: StudentEntityId, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const currentSelected = this.answer?.selectedChoiceIds || [];
    
    let nextSelected: StudentEntityId[];
    if (checked) {
      nextSelected = [...currentSelected, choiceId];
    } else {
      nextSelected = currentSelected.filter(id => String(id) !== String(choiceId));
    }
    
    this.answerChange.emit({
      questionId: this.question.questionId,
      selectedOptionId: nextSelected.map(String).join(','),
      selectedChoiceIds: nextSelected
    });
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    this.answerChange.emit({
      questionId: this.question.questionId,
      file: file
    });
  }
}
