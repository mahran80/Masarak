import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.component.html'
})
export class FormFieldComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) fieldId = '';
  @Input() errorMessage: string | null = null;
  @Input() required = false;
  @Input() hint: string | null = null;
}
