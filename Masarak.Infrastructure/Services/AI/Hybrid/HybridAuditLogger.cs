using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class HybridAuditLogger : IHybridAuditLogger
    {
        private readonly ILogger<HybridAuditLogger> _logger;

        public HybridAuditLogger(ILogger<HybridAuditLogger> logger)
        {
            _logger = logger;
        }

        public void LogGeneration(int studentUserId, RecommendationType type, string providerUsed, int promptTokens, int completionTokens, long latencyMs, string routingStage)
        {
            _logger.LogInformation(
                "AI_AUDIT | Student: {StudentUserId} | Type: {Type} | Provider: {Provider} | Tokens: {PromptTokens}/{CompletionTokens} | Latency: {LatencyMs}ms | Stage: {RoutingStage}",
                studentUserId, type, providerUsed, promptTokens, completionTokens, latencyMs, routingStage);
        }

        public void LogRoutingDecision(string intent, string requestType, int studentUserId)
        {
            _logger.LogDebug(
                "AI_ROUTING | Request: {RequestType} | Student: {StudentUserId} | Intent: {Intent}",
                requestType, studentUserId, intent);
        }
    }
}
