using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class HybridAiOrchestrator : IAiAnalyticsService
    {
        private readonly IAiAnalyticsService _coreService;
        private readonly HybridIntentClassifier _classifier;
        private readonly HybridAuthGuard _authGuard;
        private readonly IHybridQuotaService _quotaService;
        private readonly IHybridAuditLogger _auditLogger;
        private readonly HybridContextComposer _contextComposer;
        private readonly DeterministicResponseResolver _deterministicResolver;
        private readonly IDistributedCache _cache;
        private readonly ILogger<HybridAiOrchestrator> _logger;
        private readonly IAiRecommendationRepository _recRepo;

        public HybridAiOrchestrator(
            [FromKeyedServices("core")] IAiAnalyticsService coreService,
            HybridIntentClassifier classifier,
            HybridAuthGuard authGuard,
            IHybridQuotaService quotaService,
            IHybridAuditLogger auditLogger,
            HybridContextComposer contextComposer,
            DeterministicResponseResolver deterministicResolver,
            IDistributedCache cache,
            ILogger<HybridAiOrchestrator> logger,
            IAiRecommendationRepository recRepo)
        {
            _coreService = coreService;
            _classifier = classifier;
            _authGuard = authGuard;
            _quotaService = quotaService;
            _auditLogger = auditLogger;
            _contextComposer = contextComposer;
            _deterministicResolver = deterministicResolver;
            _cache = cache;
            _logger = logger;
            _recRepo = recRepo;
        }

        // ── Student-Facing ──────────────────────────────────────────────────
        public async Task<LearningInsightsDashboardDto> GetLearningInsightsAsync(int studentUserId, int academicYear, CancellationToken ct)
        {
            var intent = await _classifier.ClassifyLearningInsightsAsync(studentUserId, ct);
            _auditLogger.LogRoutingDecision(intent.ToString(), nameof(GetLearningInsightsAsync), studentUserId);

            // Inherently Analytics/CacheHit - Just pass through to core service
            var result = await _coreService.GetLearningInsightsAsync(studentUserId, academicYear, ct);
            // We could add DataSource property to DTO here, assuming we update DTOs.
            return result;
        }

        public async Task<IEnumerable<ContentRecommendationDto>> GetRecommendedContentAsync(int studentUserId, int subjectId, CancellationToken ct)
        {
            // Just read from DB, no LLM
            return await _coreService.GetRecommendedContentAsync(studentUserId, subjectId, ct);
        }

        // ── Parent-Facing ───────────────────────────────────────────────────
        public async Task<ParentReportDto?> GetParentReportAsync(int parentUserId, int studentUserId, string reportMonth, CancellationToken ct)
        {
            await _authGuard.ValidateParentStudentLinkAsync(parentUserId, studentUserId, ct);

            var cacheKey = $"parent_report:{studentUserId}:{reportMonth}";
            var cached = await _cache.GetStringAsync(cacheKey, ct);
            
            var intent = await _classifier.ClassifyParentReportAsync(studentUserId, reportMonth, cached != null, ct);
            _auditLogger.LogRoutingDecision(intent.ToString(), nameof(GetParentReportAsync), studentUserId);

            if (intent == HybridIntent.CacheHit && cached != null)
            {
                var result = JsonSerializer.Deserialize<ParentReportDto>(cached);
                return result! with { DataSource = "Cache" };
            }

            if (intent == HybridIntent.Analytics)
            {
                // Has DB record, just let core service handle it
                return await _coreService.GetParentReportAsync(parentUserId, studentUserId, reportMonth, ct);
            }

            // Fallback: Generate
            return await GenerateParentReportAsync(parentUserId, studentUserId, reportMonth, ct);
        }

        public async Task<ParentReportDto> GenerateParentReportAsync(int parentUserId, int studentUserId, string reportMonth, CancellationToken ct)
        {
            await _authGuard.ValidateParentStudentLinkAsync(parentUserId, studentUserId, ct);
            _auditLogger.LogRoutingDecision(HybridIntent.LlmRequired.ToString(), nameof(GenerateParentReportAsync), studentUserId);

            if (!await _quotaService.IsWithinQuotaAsync(studentUserId, ct))
            {
                _logger.LogWarning("Quota exceeded for student {StudentUserId}", studentUserId);
                // Try to get stale report
                var rec = await _recRepo.GetActiveByStudentAndTypeAsync(studentUserId, null, RecommendationType.ParentReport, ct);
                if (rec != null)
                {
                    try { 
                        var staleResult = JsonSerializer.Deserialize<ParentReportDto>(rec.Payload)!; 
                        return staleResult with { DataSource = "Stale_Quota_Exceeded" };
                    } catch { }
                }
                return _deterministicResolver.GetDegradedParentReport("Student", reportMonth, 0, 0);
            }

            await _quotaService.IncrementAsync(studentUserId, ct);
            return await _coreService.GenerateParentReportAsync(parentUserId, studentUserId, reportMonth, ct);
        }

        public async Task<IEnumerable<PerformanceAlertDto>> GetStudentAlertsForParentAsync(int parentUserId, int studentUserId, CancellationToken ct)
        {
            await _authGuard.ValidateParentStudentLinkAsync(parentUserId, studentUserId, ct);
            return await _coreService.GetStudentAlertsForParentAsync(parentUserId, studentUserId, ct);
        }

        // ── Teacher-Facing ──────────────────────────────────────────────────
        public async Task<ClassAnalyticsDashboardDto> GetClassAnalyticsAsync(int teacherUserId, int classId, int subjectId, int academicYear, CancellationToken ct)
        {
            await _authGuard.ValidateTeacherClassLinkAsync(teacherUserId, classId, subjectId, ct);
            _auditLogger.LogRoutingDecision(HybridIntent.Analytics.ToString(), nameof(GetClassAnalyticsAsync), 0);
            return await _coreService.GetClassAnalyticsAsync(teacherUserId, classId, subjectId, academicYear, ct);
        }

        public async Task<TeachingSuggestionDto> GenerateTeachingSuggestionAsync(int teacherUserId, int studentUserId, int subjectId, CancellationToken ct)
        {
            await _authGuard.ValidateTeacherStudentLinkAsync(teacherUserId, studentUserId, subjectId, ct);
            _auditLogger.LogRoutingDecision(HybridIntent.LlmRequired.ToString(), nameof(GenerateTeachingSuggestionAsync), studentUserId);

            if (!await _quotaService.IsWithinQuotaAsync(studentUserId, ct))
            {
                return _deterministicResolver.GetDegradedTeachingSuggestion("Student", "Subject");
            }

            await _quotaService.IncrementAsync(studentUserId, ct);
            return await _coreService.GenerateTeachingSuggestionAsync(teacherUserId, studentUserId, subjectId, ct);
        }

        public async Task<StudentInsightDto> GetStudentInsightAsync(int teacherUserId, int studentUserId, int subjectId, CancellationToken ct)
        {
            await _authGuard.ValidateTeacherStudentLinkAsync(teacherUserId, studentUserId, subjectId, ct);
            return await _coreService.GetStudentInsightAsync(teacherUserId, studentUserId, subjectId, ct);
        }

        // ── Admin-Facing ────────────────────────────────────────────────────
        public async Task<PlatformAnalyticsDto> GetPlatformAnalyticsAsync(int academicYear, CancellationToken ct)
            => await _coreService.GetPlatformAnalyticsAsync(academicYear, ct);

        public async Task<GradeHeatmapDto> GetGradeHeatmapAsync(int gradeId, int academicYear, CancellationToken ct)
            => await _coreService.GetGradeHeatmapAsync(gradeId, academicYear, ct);

        public async Task<IEnumerable<AiPromptTemplateDto>> GetAllPromptTemplatesAsync(CancellationToken ct)
            => await _coreService.GetAllPromptTemplatesAsync(ct);

        public async Task UpdatePromptTemplateAsync(string key, UpdatePromptTemplateRequest request, string updatedBy, CancellationToken ct)
            => await _coreService.UpdatePromptTemplateAsync(key, request, updatedBy, ct);

        // ── Rule-Based Alerts ───────────────────────────────────────────────
        public async Task<IEnumerable<PerformanceAlertDto>> EvaluatePerformanceAlertsAsync(int studentUserId, int subjectId, int classId, int academicYear, CancellationToken ct)
        {
            _auditLogger.LogRoutingDecision(HybridIntent.Deterministic.ToString(), nameof(EvaluatePerformanceAlertsAsync), studentUserId);
            return await _coreService.EvaluatePerformanceAlertsAsync(studentUserId, subjectId, classId, academicYear, ct);
        }

        // ── AI Generation (triggered by consumers) ──────────────────────────
        public async Task GenerateWeaknessAnalysisAsync(int studentUserId, int subjectId, int classId, CancellationToken ct)
        {
            _auditLogger.LogRoutingDecision(HybridIntent.LlmRequired.ToString(), nameof(GenerateWeaknessAnalysisAsync), studentUserId);
            
            if (!await _quotaService.IsWithinQuotaAsync(studentUserId, ct))
            {
                _logger.LogWarning("Quota exceeded for weakness analysis generation. Student: {StudentUserId}", studentUserId);
                return;
            }

            await _quotaService.IncrementAsync(studentUserId, ct);
            await _coreService.GenerateWeaknessAnalysisAsync(studentUserId, subjectId, classId, ct);
        }
    }
}
