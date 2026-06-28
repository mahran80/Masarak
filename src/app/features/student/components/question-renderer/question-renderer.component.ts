import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerInputComponent } from '../answer-input/answer-input.component';
import { StudentExamQuestion, StudentExamAnswer } from '../../models';

@Component({
  selector: 'app-question-renderer',
  standalone: true,
  imports: [CommonModule, AnswerInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      <div class="flex items-start justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-800 leading-relaxed max-w-3xl whitespace-pre-line">{{ question.text }}</h3>
        
        @if (question.points) {
          <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-sm font-bold border border-slate-100 whitespace-nowrap">
            <span>{{ question.points }}</span>
            <span>درجة</span>
          </div>
        }
      </div>

      <div class="mt-4">
        <app-answer-input 
          [question]="question" 
          [answer]="answer"
          (answerChange)="onAnswerChange($event)">
        </app-answer-input>
      </div>
    </div>
  `
})
export class QuestionRendererComponent {
  @Input({ required: true }) question!: StudentExamQuestion;
  @Input() answer: StudentExamAnswer | null = null;
  
  @Output() answerChange = new EventEmitter<StudentExamAnswer>();

  onAnswerChange(answer: StudentExamAnswer): void {
    this.answerChange.emit(answer);
  }
}
