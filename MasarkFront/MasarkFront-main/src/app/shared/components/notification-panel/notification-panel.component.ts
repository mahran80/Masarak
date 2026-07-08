import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { NotificationService } from '../../../core/services/notification.service';

const NOTIFICATION_ICON_MAP: Record<string, string> = {
  'NewAssignment': 'file-text',
  'ExamOpening': 'calendar',
  'ExamGraded': 'check-circle',
  'AttendanceAlert': 'alert-circle',
  'NewContent': 'book-open',
  'SubscriptionExpiring': 'clock',
  'SubscriptionExpired': 'x-circle',
  'NewEnrollment': 'user-plus',
  'SubmissionReceived': 'inbox',
  'ExamFullyGraded': 'award',
  'MonthlyReportReady': 'pie-chart',
  'StudentAttendanceAlert': 'alert-triangle',
  'StudentExamResult': 'percent',
  'NewUserRegistered': 'user-check',
  'PaymentFailed': 'credit-card',
  'LowPerformanceAlert': 'trending-down'
};

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [NgFor, NgIf, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss'
})
export class NotificationPanelComponent {

  @Output() close = new EventEmitter<void>();

  private router = inject(Router);

  constructor(public notificationService: NotificationService) {}

  iconFor(type: string): string {
    return NOTIFICATION_ICON_MAP[type] ?? 'bell';
  }

  onMarkRead(notification: any): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationId);
    }
    if (notification.actionUrl) {
      // Ensure the URL is correctly routed under the dashboard layout
      let finalUrl = notification.actionUrl;
      if (!finalUrl.startsWith('/dashboard') && finalUrl.startsWith('/')) {
        finalUrl = '/dashboard' + finalUrl;
      } else if (!finalUrl.startsWith('/dashboard')) {
        finalUrl = '/dashboard/' + finalUrl;
      }
      this.router.navigateByUrl(finalUrl);
      this.close.emit();
    }
  }

  onMarkAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}