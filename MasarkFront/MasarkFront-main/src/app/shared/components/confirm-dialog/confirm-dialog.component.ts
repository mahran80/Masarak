import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (this.dialogService.currentDialog()) {
      event.preventDefault();
      this.onCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.dialogService.resolve(true);
  }

  onCancel(): void {
    this.dialogService.resolve(false);
  }
}
