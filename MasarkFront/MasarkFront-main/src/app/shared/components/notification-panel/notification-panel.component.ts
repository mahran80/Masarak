import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, HostListener } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { NotificationService } from '../../../core/services/notification.service';

const NOTIFICATION_ICON_MAP: Record<string, string> = {
  'NewAssignment': 'clipboard',
  'ExamOpening': 'calendar',
  'ExamGraded': 'check-circle',
  'AttendanceAlert': 'exclamation-triangle',
  'NewContent': 'book-open',
  'SubscriptionExpiring': 'clock',
  'SubscriptionExpired': 'close',
  'NewEnrollment': 'user',
  'SubmissionReceived': 'archive',
  'ExamFullyGraded': 'check-badge',
  'MonthlyReportReady': 'chart',
  'StudentAttendanceAlert': 'exclamation-triangle',
  'StudentExamResult': 'check-badge',
  'NewUserRegistered': 'user',
  'PaymentFailed': 'credit-card',
  'LowPerformanceAlert': 'trend-up'
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  constructor(public notificationService: NotificationService) {}

  iconFor(type: string): string {
    return NOTIFICATION_ICON_MAP[type] ?? 'bell';
  }

  onMarkRead(notification: any): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.notificationId);
    }
    const dest = this.getDestination(notification);
    if (dest) {
      this.router.navigateByUrl(dest);
      this.close.emit();
    }
  }

  private getDestination(notification: any): string | null {
    if (notification.actionUrl) {
      let finalUrl = notification.actionUrl;
      if (!finalUrl.startsWith('/dashboard') && finalUrl.startsWith('/')) {
        finalUrl = '/dashboard' + finalUrl;
      } else if (!finalUrl.startsWith('/dashboard')) {
        finalUrl = '/dashboard/' + finalUrl;
      }
      return finalUrl;
    }

    switch (notification.type || notification.notificationType) {
      case 'ExamGraded':
      case 'StudentExamResult':
      case 'ExamFullyGraded':
      case 'ExamOpening':
        return '/dashboard/student/exams';
      case 'NewAssignment':
        return '/dashboard/student/assignments';
      case 'MonthlyReportReady':
        return '/dashboard/parent/children';
      case 'AttendanceAlert':
      case 'StudentAttendanceAlert':
        return '/dashboard/student/attendance';
      case 'NewContent':
        return '/dashboard/student/content';
      case 'SubscriptionExpiring':
      case 'SubscriptionExpired':
        return '/dashboard/plans';
      case 'SessionStarted':
        return '/dashboard/teacher/sessions';
      default:
        return null;
    }
  }

  onMarkAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}