import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'orange' | 'navy';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [IconComponent, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="app-btn"
      [class]="'app-btn--' + variant + ' app-btn--' + size"
      [class.app-btn--block]="block"
      [class.app-btn--icon-only]="iconOnly"
      [type]="type"
      [disabled]="disabled"
      (click)="clicked.emit($event)">
      <app-icon *ngIf="icon" [name]="icon" [size]="iconSize"></app-icon>
      <span *ngIf="!iconOnly"><ng-content></ng-content></span>
    </button>
  `,
  styles: [`
    .app-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
      font-weight: 600;
      white-space: nowrap;
      transition: filter .15s ease, opacity .15s ease, background-color .15s ease;
      font-family: inherit;
    }
    .app-btn:disabled { opacity: .55; cursor: not-allowed; }
    .app-btn:not(:disabled):hover { filter: brightness(0.94); }

    .app-btn--sm { padding: 6px 12px; font-size: 0.875rem; }
    .app-btn--md { padding: 11px 20px; font-size: 1rem; }
    .app-btn--lg { padding: 14px 28px; font-size: 1.125rem; }

    .app-btn--block { width: 100%; }
    .app-btn--icon-only { padding: 8px; }

    .app-btn--primary { background-color: #002045; color: #fff; }
    .app-btn--secondary { background-color: #2563eb; color: #fff; }
    .app-btn--orange { background-color: #f97316; color: #fff; }
    .app-btn--navy { background-color: #0f172a; color: #fff; }
    .app-btn--outline { background-color: #ffffff; color: #1e293b; border-color: #e2e8f0; }
    .app-btn--ghost { background-color: transparent; color: #002045; }
    .app-btn--danger { background-color: #dc2626; color: #fff; }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() block = false;
  @Input() icon = '';
  @Input() iconSize = 18;
  @Input() iconOnly = false;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
