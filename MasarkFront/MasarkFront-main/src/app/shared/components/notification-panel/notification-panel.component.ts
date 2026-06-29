import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
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

  constructor(public notificationService: NotificationService) {}

  iconFor(type: string): string {
    return NOTIFICATION_ICON_MAP[type] ?? 'bell';
  }

  onMarkRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  onMarkAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}