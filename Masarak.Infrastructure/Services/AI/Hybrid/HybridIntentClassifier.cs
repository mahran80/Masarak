using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public enum HybridIntent
    {
        Deterministic,
        CacheHit,
        Analytics,
        LlmRequired
    }

    public class HybridIntentClassifier
    {
        private readonly IAiRecommendationRepository _recRepo;

        public HybridIntentClassifier(IAiRecommendationRepository recRepo)
        {
            _recRepo = recRepo;
        }

        // We can just have pure logic for intents that don't need DB checks
        // But for things like GetLearningInsights, we check if active non-expired records exist.
        
        public async Task<HybridIntent> ClassifyLearningInsightsAsync(int studentUserId, CancellationToken ct)
        {
            // If there's an active weakness analysis for the student, it's a CacheHit (mostly).
            // Actually, LearningInsights aggregates many things. If we have at least one active weakness analysis, we can say CacheHit.
            // If we have none, LlmRequired? No, GetLearningInsights doesn't trigger LLM directly; it reads whatever is there.
            // Wait, looking at AiAnalyticsService, GetLearningInsightsAsync reads from DB. It does NOT generate.
            // So GetLearningInsightsAsync is inherently Analytics/CacheHit.
            return HybridIntent.Analytics;
        }

        public async Task<HybridIntent> ClassifyParentReportAsync(int studentUserId, string reportMonth, bool isRedisHit, CancellationToken ct)
        {
            if (isRedisHit) return HybridIntent.CacheHit;

            // Check if DB has an active, non-expired report
            var rec = await _recRepo.GetActiveByStudentAndTypeAsync(studentUserId, null, RecommendationType.ParentReport, ct);
            if (rec != null && !rec.IsExpired() && rec.Payload.Contains(reportMonth))
            {
                return HybridIntent.Analytics;
            }

            return HybridIntent.LlmRequired;
        }

        public HybridIntent ClassifyGenerateParentReport() => HybridIntent.LlmRequired;
        public HybridIntent ClassifyGenerateWeaknessAnalysis() => HybridIntent.LlmRequired;
        public HybridIntent ClassifyGenerateTeachingSuggestion() => HybridIntent.LlmRequired;
        
        public HybridIntent ClassifyEvaluateAlerts() => HybridIntent.Deterministic;
        public HybridIntent ClassifyClassAnalytics() => HybridIntent.Analytics;
        public HybridIntent ClassifyPlatformAnalytics() => HybridIntent.Analytics;
        public HybridIntent ClassifyGradeHeatmap() => HybridIntent.Analytics;
        public HybridIntent ClassifyStudentAlerts() => HybridIntent.Analytics;
    }
}
