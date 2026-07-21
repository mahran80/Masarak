# Phase 5 — AI Recommendations, Smart Reports & Analytics

**Developer:** Dev 5  
**Complexity:** Very High  
**Dependencies:** Phase 1 (Auth), Phase 2 (Academic entities), Phase 3 (StudentPerformance, ExamResult events via RabbitMQ), Phase 4 (Attendance data)

---

## Objective

Deliver the AI-powered intelligence layer of the platform. This phase consumes performance, attendance, and assessment data produced by Phases 2–4, feeds it to OpenAI/Claude/Gemini via a configurable external AI provider abstraction, and generates: (1) per-student subject weakness analysis, (2) adaptive content recommendations, (3) smart parent reports, and (4) admin/teacher analytics dashboards. Rule-based logic is used where AI is unnecessary (e.g., attendance threshold alerts); external AI API is invoked for narrative generation, weakness analysis, and personalized recommendations. Results are cached aggressively in Redis because AI API calls are expensive.

---

## 1. Functional Requirements

### Student-Facing
- Student receives a "My Learning Insights" dashboard showing: weak topics per subject (AI-identified), recommended content items from the content library, and a performance trend line chart
- Recommendations are refreshed after each grading event (RabbitMQ consumer)

### Parent-Facing
- Parent receives a monthly "Smart Report" per linked student: overall performance summary, attendance summary, subject-by-subject AI narrative, and recommended actions
- Parent can request a fresh report on demand (triggers AI API call; result cached for 24 hours)

### Teacher-Facing
- Teacher sees a class analytics dashboard: class average per subject, distribution histogram, top/bottom 5 students, sessions delivered vs sessions scheduled
- Teacher sees per-student detail drill-down with AI-generated teaching suggestion ("This student struggles with algebra word problems — consider providing additional practice sheets")

### Admin-Facing
- Platform-wide analytics: total active students, teacher count, subscription revenue, session completion rate
- Grade-level performance heatmap across all classes

### Rule-Based Features (no AI API)
- Attendance alert: if student attendance drops below 75%, flag automatically
- Performance alert: if student average exam score drops below 50% in any subject, flag automatically
- Alerts stored in DB and surfaced as notifications (consumed by Phase 6)

### AI Provider Strategy
- Use OpenAI GPT-4o as primary, with fallback to Claude Sonnet 4 and Gemini 1.5 Flash
- Provider is configurable via appsettings (no code change required to switch)
- All prompts are template-based, stored in DB for admin editing without redeployment
- All AI responses are stored in the `ai_recommendations` table with TTL

---

## 2. Domain Layer (`Masarak.Domain`)

### Entities

```csharp
public class AiRecommendation
{
    public int AiRecommendationId { get; private set; }
    public int StudentUserId { get; private set; }
    public int? SubjectId { get; private set; }
    public RecommendationType Type { get; private set; } // WeaknessAnalysis, ContentRecommendation, ParentReport, TeachingSuggestion
    public string Payload { get; private set; }          // JSON: structured recommendation data
    public string? ProviderUsed { get; private set; }    // "openai-gpt-4o", "claude-sonnet-4", "gemini-1.5-flash"
    public int? PromptTokensUsed { get; private set; }
    public int? CompletionTokensUsed { get; private set; }
    public DateTime GeneratedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }      // soft TTL: if past, regenerate on next request
    public bool IsActive { get; private set; }

    public static AiRecommendation Create(int studentUserId, int? subjectId,
        RecommendationType type, string payload, string provider,
        int promptTokens, int completionTokens, int cacheTtlHours) { ... }
    
    public bool IsExpired() => DateTime.UtcNow > ExpiresAt;
}

public class PerformanceAlert
{
    public int PerformanceAlertId { get; private set; }
    public int StudentUserId { get; private set; }
    public int? SubjectId { get; private set; }
    public AlertType AlertType { get; private set; }     // LowAttendance, LowExamScore, MissedAssignments
    public string Message { get; private set; }
    public decimal TriggerValue { get; private set; }    // the value that triggered (e.g., 45.0 for 45%)
    public decimal Threshold { get; private set; }       // the threshold breached (e.g., 50.0)
    public bool IsResolved { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    public static PerformanceAlert Create(int studentUserId, int? subjectId,
        AlertType alertType, string message, decimal triggerValue, decimal threshold) { ... }
    public void Resolve() { IsResolved = true; ResolvedAt = DateTime.UtcNow; }
}

public class AiPromptTemplate
{
    public int AiPromptTemplateId { get; private set; }
    public string Key { get; private set; }              // "weakness_analysis", "parent_report", "teaching_suggestion"
    public string SystemPrompt { get; private set; }
    public string UserPromptTemplate { get; private set; } // with {placeholders}
    public int MaxTokens { get; private set; }
    public decimal Temperature { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string UpdatedBy { get; private set; }
}

public class AnalyticsDashboardSnapshot
{
    public int SnapshotId { get; private set; }
    public SnapshotScope Scope { get; private set; }     // Platform, Grade, Class
    public int? ScopeEntityId { get; private set; }     // gradeId or classId if scoped
    public string DataJson { get; private set; }         // serialized analytics payload
    public DateTime GeneratedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }      // regenerated on expiry

    public bool IsExpired() => DateTime.UtcNow > ExpiresAt;
}
```

### Value Objects

```csharp
public record WeaknessAnalysisResult(
    IEnumerable<WeakTopic> WeakTopics,
    string NarrativeSummary,
    decimal OverallConfidenceScore);

public record WeakTopic(
    string TopicName,
    decimal ErrorRate,
    string[] RecommendedActions);

public record ContentRecommendation(
    int ContentItemId,
    string Title,
    string Reason,
    decimal RelevanceScore);

public record ParentReportData(
    string StudentName,
    string ReportMonth,
    decimal OverallPerformanceScore,
    decimal AttendancePercentage,
    IEnumerable<SubjectSummary> SubjectSummaries,
    string AiNarrative,
    IEnumerable<string> RecommendedActions);
```

### Enums

```csharp
public enum RecommendationType { WeaknessAnalysis, ContentRecommendation, ParentReport, TeachingSuggestion, ClassAnalytics }
public enum AlertType { LowAttendance, LowExamScore, MissedAssignments }
public enum SnapshotScope { Platform, Grade, Class }
public enum AiProvider { OpenAI, Claude, Gemini }
```

---

## 3. Application Layer

### Interfaces

```csharp
public interface IAiProvider
{
    string ProviderName { get; }
    Task<AiCompletionResult> CompleteAsync(AiPromptRequest request, CancellationToken ct);
}

public record AiPromptRequest(string SystemPrompt, string UserPrompt, int MaxTokens, decimal Temperature);
public record AiCompletionResult(string Content, int PromptTokens, int CompletionTokens, string ProviderUsed);

public interface IAiProviderFactory
{
    // Returns configured primary provider, falls back on exception
    IAiProvider GetProvider(AiProvider preferred);
    IAiProvider GetFallbackProvider(AiProvider failed);
}

public interface IAiRecommendationRepository
{
    Task<AiRecommendation?> GetActiveByStudentAndTypeAsync(int studentUserId, int? subjectId, RecommendationType type, CancellationToken ct);
    Task AddAsync(AiRecommendation rec, CancellationToken ct);
    Task DeactivateAsync(int studentUserId, int? subjectId, RecommendationType type, CancellationToken ct);
}

public interface IPerformanceAlertRepository
{
    Task<PerformanceAlert?> GetUnresolvedAsync(int studentUserId, int? subjectId, AlertType type, CancellationToken ct);
    Task AddAsync(PerformanceAlert alert, CancellationToken ct);
    Task UpdateAsync(PerformanceAlert alert, CancellationToken ct);
    Task<IEnumerable<PerformanceAlert>> GetUnresolvedByStudentAsync(int studentUserId, CancellationToken ct);
}

public interface IAiPromptTemplateRepository
{
    Task<AiPromptTemplate?> GetByKeyAsync(string key, CancellationToken ct);
    Task UpdateAsync(AiPromptTemplate template, CancellationToken ct);
}

public interface IAnalyticsSnapshotRepository
{
    Task<AnalyticsDashboardSnapshot?> GetAsync(SnapshotScope scope, int? entityId, CancellationToken ct);
    Task UpsertAsync(AnalyticsDashboardSnapshot snapshot, CancellationToken ct);
}
```

### Commands

```csharp
// Triggered by RabbitMQ consumers after grading events
public record GenerateWeaknessAnalysisCommand(int StudentUserId, int SubjectId, int ClassId) : IRequest<WeaknessAnalysisDto>;
public record GenerateContentRecommendationsCommand(int StudentUserId, int SubjectId) : IRequest<IEnumerable<ContentRecommendationDto>>;

// Triggered on demand or monthly schedule
public record GenerateParentReportCommand(int ParentUserId, int StudentUserId, string ReportMonth) : IRequest<ParentReportDto>;

// Teacher request
public record GenerateTeachingSuggestionCommand(int TeacherUserId, int StudentUserId, int SubjectId) : IRequest<TeachingSuggestionDto>;

// Admin actions on prompt templates
public record UpdatePromptTemplateCommand(int AdminId, string Key, string SystemPrompt, string UserPromptTemplate, int MaxTokens, decimal Temperature) : IRequest<Unit>;

// Rule-based alert evaluation (triggered by RabbitMQ consumer)
public record EvaluatePerformanceAlertsCommand(int StudentUserId, int SubjectId, int ClassId, int AcademicYear) : IRequest<IEnumerable<PerformanceAlertDto>>;
```

### Queries

```csharp
// Student
public record GetMyLearningInsightsQuery(int StudentUserId, int AcademicYear) : IRequest<LearningInsightsDashboardDto>;
public record GetMyRecommendedContentQuery(int StudentUserId, int SubjectId) : IRequest<IEnumerable<ContentRecommendationDto>>;

// Parent
public record GetParentReportQuery(int ParentUserId, int StudentUserId, string ReportMonth) : IRequest<ParentReportDto?>;
public record GetStudentAlertsForParentQuery(int ParentUserId, int StudentUserId) : IRequest<IEnumerable<PerformanceAlertDto>>;

// Teacher
public record GetClassAnalyticsDashboardQuery(int TeacherUserId, int ClassId, int SubjectId, int AcademicYear) : IRequest<ClassAnalyticsDashboardDto>;
public record GetStudentInsightForTeacherQuery(int TeacherUserId, int StudentUserId, int SubjectId) : IRequest<StudentInsightDto>;

// Admin
public record GetPlatformAnalyticsQuery(int AcademicYear) : IRequest<PlatformAnalyticsDto>;
public record GetGradeHeatmapQuery(int GradeId, int AcademicYear) : IRequest<GradeHeatmapDto>;
public record GetAllPromptTemplatesQuery() : IRequest<IEnumerable<AiPromptTemplateDto>>;
```

### DTOs

```csharp
public record WeaknessAnalysisDto(int SubjectId, string SubjectName, IEnumerable<WeakTopicDto> WeakTopics, string NarrativeSummary, DateTime GeneratedAt);
public record WeakTopicDto(string TopicName, decimal ErrorRate, IEnumerable<string> RecommendedActions);
public record ContentRecommendationDto(int ContentItemId, string Title, string ContentType, string Reason, decimal RelevanceScore);
public record ParentReportDto(string StudentName, string ReportMonth, decimal OverallScore, decimal AttendancePercentage, IEnumerable<SubjectSummaryDto> Subjects, string AiNarrative, IEnumerable<string> RecommendedActions, DateTime GeneratedAt);
public record SubjectSummaryDto(string SubjectName, decimal AverageScore, decimal AttendancePercentage, string AiSubjectNarrative);
public record TeachingSuggestionDto(string StudentName, string SubjectName, string Suggestion, IEnumerable<string> ActionItems, DateTime GeneratedAt);
public record LearningInsightsDashboardDto(IEnumerable<WeaknessAnalysisDto> SubjectAnalyses, IEnumerable<ContentRecommendationDto> Recommendations, IEnumerable<PerformanceAlertDto> ActiveAlerts, IEnumerable<PerformanceTrendDto> PerformanceTrends);
public record PerformanceTrendDto(string SubjectName, IEnumerable<ScorePointDto> ExamScores);
public record ScorePointDto(DateTime Date, decimal Score);
public record ClassAnalyticsDashboardDto(string ClassName, string SubjectName, decimal ClassAverage, IEnumerable<ScoreDistributionBucketDto> Distribution, IEnumerable<StudentScoreDto> TopFive, IEnumerable<StudentScoreDto> BottomFive, int SessionsScheduled, int SessionsCompleted);
public record PlatformAnalyticsDto(int TotalActiveStudents, int TotalTeachers, int TotalActiveSubscriptions, decimal TotalRevenueThisMonth, decimal SessionCompletionRate, IEnumerable<GradeEnrollmentDto> EnrollmentByGrade);
public record GradeHeatmapDto(string GradeName, IEnumerable<ClassHeatmapRowDto> Classes);
public record ClassHeatmapRowDto(string ClassName, IEnumerable<SubjectScoreCellDto> SubjectScores);
public record SubjectScoreCellDto(string SubjectName, decimal AverageScore, string HeatmapColor); // computed server-side
```

### AI Prompt Templates (seeded in DB)

```
Key: "weakness_analysis"
System: "You are an educational analyst for Egyptian K-12 curriculum. Analyze student performance data and identify specific topic weaknesses. Respond only in JSON."
User Template: "Student: {student_name}, Subject: {subject_name}, Grade: {grade_name}. Exam results: {exam_results_json}. Assignment results: {assignment_results_json}. Identify top 3 weak topics, provide error rate per topic (0-1), and 2 specific recommended actions per topic in {language}. Return JSON matching schema: {schema}."

Key: "parent_report"
System: "You are a student academic advisor writing a monthly report for an Egyptian parent. Be encouraging, clear, and specific. Write in {language}."
User Template: "Student: {student_name}, Report month: {month}. Performance data: {performance_json}. Attendance: {attendance_json}. Write a 200-word narrative summary and 3 specific recommended actions for the parent."

Key: "teaching_suggestion"
System: "You are a curriculum expert for Egyptian K-12 education. Provide concise, actionable teaching suggestions."
User Template: "Teacher subject: {subject_name}, Grade: {grade_name}, Student weak topics: {weak_topics_json}. Provide one targeted teaching suggestion and 3 specific action items."
```

---

## 4. Infrastructure Layer

### AI Provider Implementations

```csharp
// OpenAI Provider
// NuGet: OpenAI (official SDK)
public class OpenAiProvider : IAiProvider
{
    public string ProviderName => "openai-gpt-4o";
    // Uses OpenAIClient, ChatClient for "gpt-4o"
    // Maps AiPromptRequest → ChatMessage[]
    // Returns AiCompletionResult with token counts
}

// Claude Provider
// NuGet: Anthropic.SDK
public class ClaudeProvider : IAiProvider
{
    public string ProviderName => "claude-sonnet-4-6";
    // Uses AnthropicClient
    // Maps to Messages API
}

// Gemini Provider
// NuGet: Google.AI.Generativelanguage (or raw HttpClient to v1beta)
public class GeminiProvider : IAiProvider
{
    public string ProviderName => "gemini-1.5-flash";
}

// Factory with fallback chain
public class AiProviderFactory : IAiProviderFactory
{
    // Primary provider read from IConfiguration: "AI:PrimaryProvider"
    // Fallback chain: OpenAI → Claude → Gemini
    // Caches provider instances
}
```

### Redis Caching for AI Results

```csharp
// Cache keys:
// weakness:{studentUserId}:{subjectId}     TTL: 24 hours (invalidated on new grading event)
// recommendations:{studentUserId}:{subjectId} TTL: 12 hours
// parent_report:{studentUserId}:{month}    TTL: 24 hours
// class_analytics:{classId}:{subjectId}   TTL: 6 hours
// platform_analytics:{year}               TTL: 1 hour

// All cache operations in IAiRecommendationCacheService wrapping IDistributedCache
// Serialize/deserialize with System.Text.Json
```

### RabbitMQ Consumers (from Phase 3 events)

```csharp
// PerformanceRecalculatedConsumer
// Consumes: PerformanceRecalculatedEvent
// On consume:
//   1. Invalidates Redis cache for affected student/subject
//   2. Enqueues GenerateWeaknessAnalysisCommand (via IMediator)
//   3. Enqueues EvaluatePerformanceAlertsCommand
//   4. If alert triggered: publishes AlertCreatedEvent → consumed by Phase 6 Notifications

// Monthly Report Scheduler
// Uses Hangfire or IHostedService with monthly cron
// For each active student: publishes GenerateParentReportCommand
// Reports cached; parent fetches via query
```

### EF Core Configurations

```csharp
// Tables: ai_recommendations, performance_alerts, ai_prompt_templates, analytics_snapshots

// AiRecommendationConfiguration
builder.HasIndex(r => new { r.StudentUserId, r.SubjectId, r.Type, r.IsActive });
builder.Property(r => r.Type).HasConversion<string>().HasMaxLength(30);
builder.Property(r => r.Payload).HasColumnType("nvarchar(max)");

// PerformanceAlertConfiguration
builder.HasIndex(a => new { a.StudentUserId, a.SubjectId, a.AlertType, a.IsResolved });
builder.Property(a => a.AlertType).HasConversion<string>().HasMaxLength(30);

// AiPromptTemplateConfiguration
builder.HasIndex(t => t.Key).IsUnique();

// AnalyticsDashboardSnapshotConfiguration
builder.Property(s => s.DataJson).HasColumnType("nvarchar(max)");
builder.HasIndex(s => new { s.Scope, s.ScopeEntityId }).IsUnique();
```

---

## 5. API Endpoints

```
// Student
GET    /api/student/insights                             → GetMyLearningInsightsQuery [StudentOnly + Subscription]
GET    /api/student/recommendations/{subjectId}         → GetMyRecommendedContentQuery [StudentOnly + Subscription]

// Parent
GET    /api/parent/reports/{studentId}/{month}          → GetParentReportQuery [ParentOnly]
POST   /api/parent/reports/{studentId}/generate         → GenerateParentReportCommand [ParentOnly] (on-demand)
GET    /api/parent/children/{studentId}/alerts          → GetStudentAlertsForParentQuery [ParentOnly]

// Teacher
GET    /api/teacher/analytics/{classId}/{subjectId}     → GetClassAnalyticsDashboardQuery [TeacherOnly]
GET    /api/teacher/students/{studentId}/insights/{subjectId} → GetStudentInsightForTeacherQuery
POST   /api/teacher/students/{studentId}/suggestions/{subjectId} → GenerateTeachingSuggestionCommand

// Admin
GET    /api/admin/analytics/platform                    → GetPlatformAnalyticsQuery [AdminOnly]
GET    /api/admin/analytics/grades/{gradeId}/heatmap    → GetGradeHeatmapQuery [AdminOnly]
GET    /api/admin/ai/prompt-templates                   → GetAllPromptTemplatesQuery [AdminOnly]
PUT    /api/admin/ai/prompt-templates/{key}             → UpdatePromptTemplateCommand [AdminOnly]
```

---

## 6. Database Migration

```
Migration name: Phase5_AiAndAnalytics

New tables: ai_recommendations, performance_alerts, ai_prompt_templates, analytics_snapshots

Seeder: SeedAiPromptTemplates.cs — seeds all 3 prompt templates with default values
```

---

## 7. Angular Frontend

### Module Structure

```
features/
  analytics/
    pages/
      student/
        learning-insights/       ← weakness cards, recommendations, trend chart
      parent/
        smart-report/            ← formatted monthly report with "Generate" button
        child-alerts/            ← active alerts list
      teacher/
        class-analytics/         ← class avg, histogram, top/bottom 5 table
        student-insight/         ← per-student detail with AI suggestion
      admin/
        platform-analytics/      ← KPI cards: students, revenue, session rate
        grade-heatmap/           ← color-coded table
        prompt-editor/           ← edit AI prompt templates (textarea)
    components/
      kpi-card/                  ← metric + label + trend arrow
      performance-chart/         ← line chart (ng2-charts/Chart.js)
      heatmap-cell/              ← color-coded cell (green ≥80, yellow 60-80, red <60)
      weakness-card/             ← topic name + error rate bar + recommended actions
      recommendation-card/       ← content item thumbnail + reason text
      alert-badge/               ← LowAttendance / LowScore chip with severity color
    services/
      analytics.service.ts
      ai.service.ts
```

### Angular Models

```typescript
export interface LearningInsights { subjectAnalyses: WeaknessAnalysis[]; recommendations: ContentRecommendation[]; activeAlerts: PerformanceAlert[]; performanceTrends: PerformanceTrend[]; }
export interface WeaknessAnalysis { subjectName: string; weakTopics: WeakTopic[]; narrativeSummary: string; }
export interface WeakTopic { topicName: string; errorRate: number; recommendedActions: string[]; }
export interface ParentReport { studentName: string; reportMonth: string; overallScore: number; attendancePercentage: number; subjects: SubjectSummary[]; aiNarrative: string; recommendedActions: string[]; }
export interface ClassAnalytics { classAverage: number; distribution: ScoreBucket[]; topFive: StudentScore[]; bottomFive: StudentScore[]; sessionsScheduled: number; sessionsCompleted: number; }
export interface PlatformAnalytics { totalActiveStudents: number; totalTeachers: number; totalRevenueThisMonth: number; sessionCompletionRate: number; }
```

### Angular Routing

```typescript
{ path: 'student/insights', component: LearningInsightsPage, canActivate: [AuthGuard, StudentGuard, SubscriptionGuard] },
{ path: 'parent/reports/:studentId', component: SmartReportPage, canActivate: [AuthGuard, ParentGuard] },
{ path: 'teacher/analytics/:classId/:subjectId', component: ClassAnalyticsPage, canActivate: [AuthGuard, TeacherGuard] },
{ path: 'admin/analytics', component: PlatformAnalyticsPage, canActivate: [AuthGuard, AdminGuard] },
{ path: 'admin/analytics/heatmap/:gradeId', component: GradeHeatmapPage, canActivate: [AuthGuard, AdminGuard] },
{ path: 'admin/ai/templates', component: PromptEditorPage, canActivate: [AuthGuard, AdminGuard] },
```

---

## 8. Definition of Done

- [ ] `GenerateWeaknessAnalysisHandler` calls AI provider, parses JSON response, stores in `ai_recommendations`, caches in Redis
- [ ] Fallback provider chain triggers on OpenAI error without surfacing error to end user
- [ ] `EvaluatePerformanceAlertsHandler` correctly triggers `LowAttendance` at 75% and `LowExamScore` at 50% thresholds
- [ ] Parent report generated on demand and cached 24 hours — second request returns cached version
- [ ] Admin can edit prompt templates; next AI call uses new template
- [ ] Class analytics heatmap renders with correct color coding in Angular
- [ ] Performance trend line chart shows chronological exam scores per subject
- [ ] RabbitMQ consumer correctly invalidates cache and triggers recommendation regeneration
- [ ] All AI API calls logged with provider, tokens used, and latency for cost monitoring
- [ ] Unit tests: `EvaluatePerformanceAlertsHandler` (all thresholds), `AiProviderFactory` (fallback logic)

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| AI API costs exceed budget | Rate-limit AI calls per student per day; cache aggressively; use Gemini Flash as default (cheapest) |
| OpenAI JSON response malformed | Validate JSON schema before storing; return cached/stale result on parse failure; log and alert |
| AI generates content in wrong language | Language is a required parameter in every prompt template; always pass `"Arabic"` or `"English"` based on user preference |
| Analytics query performance at scale | All analytics queries backed by pre-computed snapshots refreshed on schedule, not real-time joins |
| Prompt injection via student name fields | Sanitize all user-data strings before template substitution; strip `{`, `}`, and newlines |
