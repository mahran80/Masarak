export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number | string;
  children?: NavItem[];
}

export type NotificationType =
  | 'NewAssignment' | 'ExamOpening' | 'ExamGraded' | 'AttendanceAlert'
  | 'NewContent' | 'SubscriptionExpiring' | 'SubscriptionExpired'
  | 'NewEnrollment' | 'SubmissionReceived' | 'ExamFullyGraded'
  | 'MonthlyReportReady' | 'StudentAttendanceAlert' | 'StudentExamResult'
  | 'NewUserRegistered' | 'PaymentFailed' | 'LowPerformanceAlert';

export interface NotificationDto {
  notificationId: number;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}
