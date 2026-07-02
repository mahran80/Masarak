import { LinkedStudentDto } from '../../../core/models/subscription.model';
import { SubjectSummaryDto, PerformanceAlertDto } from '../../../models/ai-analytics.model';

export interface ParentDashboardKPIs {
  totalChildren: number;
  activeSubscriptions: number;
  overallAttendanceRate: number;
}

export interface ParentChildData extends LinkedStudentDto {
  // Can extend this later with UI specific state like selected status
  recentAlerts?: PerformanceAlertDto[];
}
