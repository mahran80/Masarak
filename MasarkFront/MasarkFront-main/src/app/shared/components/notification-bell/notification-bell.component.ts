import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [NgIf, IconComponent, NotificationPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent {

  readonly isOpen = signal(false);

  constructor(public notificationService: NotificationService) {}

  togglePanel(): void {
    this.isOpen.update(v => !v);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }
}