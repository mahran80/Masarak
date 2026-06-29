export interface WeaknessAnalysisDto {
  subjectId: number;
  subjectName: string;
  weakTopics: WeakTopicDto[];
  narrativeSummary: string;
  generatedAt: string;
}

export interface WeakTopicDto {
  topicName: string;
  errorRate: number;
  recommendedActions: string[];
}

export interface ContentRecommendationDto {
  contentItemId: number;
  title: string;
  contentType: string;
  reason: string;
  relevanceScore: number;
}

export interface PerformanceAlertDto {
  performanceAlertId: number;
  alertType: string;
  message: string;
  triggerValue: number;
  threshold: number;
  createdAt: string;
}

export interface PerformanceTrendDto {
  subjectName: string;
  examScores: ScorePointDto[];
}

export interface ScorePointDto {
  date: string;
  score: number;
}

export interface LearningInsightsDashboardDto {
  subjectAnalyses: WeaknessAnalysisDto[];
  recommendations: ContentRecommendationDto[];
  activeAlerts: PerformanceAlertDto[];
  performanceTrends: PerformanceTrendDto[];
}

export interface ParentReportDto {
  studentName: string;
  reportMonth: string;
  overallScore: number;
  attendancePercentage: number;
  subjects: SubjectSummaryDto[];
  aiNarrative: string;
  recommendedActions: string[];
  generatedAt: string;
}

export interface SubjectSummaryDto {
  subjectName: string;
  averageScore: number;
  attendancePercentage: number;
  aiSubjectNarrative: string;
}

export interface TeachingSuggestionDto {
  studentName: string;
  subjectName: string;
  suggestion: string;
  actionItems: string[];
  generatedAt: string;
}

export interface StudentInsightDto {
  studentId: number;
  studentName: string;
  weaknessAnalyses: WeaknessAnalysisDto[];
  teachingSuggestion: TeachingSuggestionDto;
}

export interface ClassAnalyticsDashboardDto {
  className: string;
  subjectName: string;
  classAverage: number;
  distribution: ScoreDistributionBucketDto[];
  topFive: StudentScoreDto[];
  bottomFive: StudentScoreDto[];
  sessionsScheduled: number;
  sessionsCompleted: number;
}

export interface ScoreDistributionBucketDto {
  bucketRange: string;
  studentCount: number;
}

export interface StudentScoreDto {
  studentId: number;
  studentName: string;
  score: number;
}

export interface PlatformAnalyticsDto {
  totalActiveStudents: number;
  totalTeachers: number;
  totalActiveSubscriptions: number;
  totalRevenueThisMonth: number;
  sessionCompletionRate: number;
  enrollmentByGrade: GradeEnrollmentDto[];
}

export interface GradeEnrollmentDto {
  gradeName: string;
  studentCount: number;
}

export interface GradeHeatmapDto {
  gradeName: string;
  classes: ClassHeatmapRowDto[];
}

export interface ClassHeatmapRowDto {
  className: string;
  subjectScores: SubjectScoreCellDto[];
}

export interface SubjectScoreCellDto {
  subjectName: string;
  averageScore: number;
  heatmapColor: string;
}

export interface AiPromptTemplateDto {
  key: string;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
}

export interface UpdatePromptTemplateRequest {
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
}

export interface GenerateParentReportRequest {
  reportMonth: string;
}
