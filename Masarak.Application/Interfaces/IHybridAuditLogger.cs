using Masarak.Domain.Enums;
using System.Threading.Tasks;

namespace Masarak.Application.Interfaces
{
    public interface IHybridAuditLogger
    {
        void LogGeneration(int studentUserId, RecommendationType type, string providerUsed, int promptTokens, int completionTokens, long latencyMs, string routingStage);
        void LogRoutingDecision(string intent, string requestType, int studentUserId);
    }
}
