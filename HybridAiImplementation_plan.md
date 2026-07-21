# Hybrid AI Orchestration Layer — Implementation Plan
**Project:** Masarak Educational Platform  
**Codebase:** `d:\ITI\Masarak\Allaa`  
**Date:** 2026-07-21  
**Status:** Ready for Engineering Review

---

## 1. Executive Summary

The current AI subsystem (`AiAnalyticsService`, 729 lines) works correctly but calls the LLM on every request that is not Redis-cached. It has no intent classification, no deterministic shortcut, no per-user quota enforcement, and no retrieval layer.

The **Hybrid AI Orchestration Layer** adds a decision pipeline *in front of* `AiAnalyticsService` that answers as many requests as possible without touching the LLM:

| Stage | Saves |
|---|---|
| Auth + scope guard | Prevents cross-user data leaks |
| Intent classification | Routes deterministic questions away from LLM |
| Deterministic resolver | Answers threshold/stat questions with pure SQL |
| Redis cache check | Avoids regeneration for valid TTL hits |
| Existing analytics reuse | SQL aggregates for analytics dashboards |
| LLM generation | Only reached when all above stages miss |
| Provider fallback | Already implemented — unchanged |

This is **additive only**. No existing service, controller, entity, or consumer is modified.

---

## 2. Current Architecture Alignment

### Existing Components — DO NOT MODIFY

| Component | File | Role |
|---|---|---|
| `IAiAnalyticsService` | `Masarak.Application/Interfaces/IAiAnalyticsService.cs` | Service contract |
| `AiAnalyticsService` | `Masarak.Infrastructure/Services/AI/AiAnalyticsService.cs` | Core implementation |
| `IAiProvider` / `IAiProviderFactory` | `Masarak.Application/Interfaces/IAiProvider.cs` | Provider abstraction |
| `OpenAiProvider`, `ClaudeProvider`, `GeminiProvider` | `Masarak.Infrastructure/Services/AI/AiProviders.cs` | Provider implementations |
| `PerformanceRecalculatedAiConsumer` | `Masarak.Infrastructure/Messaging/Phase5Consumers.cs` | Event-driven trigger |
| `ParentReportsController` | `Masarak.API/Controllers/ParentReportsController.cs` | Parent-facing API |
| `StudentInsightsController` | `Masarak.API/Controllers/StudentInsightsController.cs` | Student-facing API |
| `TeacherAnalyticsController` | `Masarak.API/Controllers/TeacherAnalyticsController.cs` | Teacher-facing API |
| `AiRecommendation` entity | `Masarak.Domain/Entities/AiRecommendation.cs` | Persistence with TTL |
| `AiPromptTemplate` entity | `Masarak.Domain/Entities/AiPromptTemplate.cs` | DB-stored prompts |

### Integration Strategy

The new `HybridAiOrchestrator` **implements `IAiAnalyticsService`** and wraps the existing `AiAnalyticsService`. Controllers keep injecting `IAiAnalyticsService` — only the DI binding changes.

```
Controller
    │ injects IAiAnalyticsService
    ▼
HybridAiOrchestrator        ← NEW (implements IAiAnalyticsService)
    │ delegates when needed
    ▼
AiAnalyticsService          ← EXISTING (unchanged, registered as keyed service)
    │
    ▼
IAiProviderFactory          ← EXISTING (unchanged)
```

---

## 3. Hybrid Request Flow

```
Request arrives at Controller
        │
[Stage 1] HybridAuthGuard
  - Role scope validation (Student/Parent/Teacher)
  - Data-scope: parent→student link, teacher→class assignment
  - Subscription active check where required
  - FAIL FAST on violation
        │
[Stage 2] HybridIntentClassifier
  - Classifies: Deterministic | CacheHit | Analytics | LlmRequired
        │
  ┌─────┴──────┬────────────────┬─────────────────┐
  │            │                │                  │
Deterministic  CacheHit      Analytics         LlmRequired
  │            │                │                  │
DeterministicR  Redis return   AiAnalyticsService  [Stage 3] QuotaCheck
esolver         (no LLM)      SQL methods only        │
  │                            (no LLM)         [Stage 4] GenerationCoordinator
  │                                               - SanitizeForPrompt
  │                                               - Build context (existing BuildStudentSubjectContextAsync)
  │                                               - Call AiAnalyticsService.GenerateX
  │                                                       │
  │                                              [Stage 5] Provider Fallback
  │                                               - Handled by existing AiProviderFactory
  │                                                       │
  │                                              [Stage 6] Persist + Cache + Audit
  │                                               - AiRecommendation (existing pattern)
  │                                               - Redis write (existing pattern)
  │                                               - HybridAuditLog entry (new)
  │                                                       │
  └──────────────────────────────────────────────────────┘
                            │
                      Return DTO to Controller
```

---

## 4. Routing and Decision Engine

### Intent Classification Rules (Rule-Based, No LLM)

| Request | Condition | Route |
|---|---|---|
| `GetClassAnalyticsAsync` | Always | Analytics (pure SQL) |
| `GetPlatformAnalyticsAsync` | Always | Analytics (pure SQL) |
| `GetGradeHeatmapAsync` | Always | Analytics (pure SQL) |
| `GetStudentAlertsForParentAsync` | Always | Analytics (DB lookup) |
| `EvaluatePerformanceAlertsAsync` | Always | Deterministic (threshold check) |
| `GetLearningInsightsAsync` | Active non-expired `AiRecommendation` exists | CacheHit |
| `GetLearningInsightsAsync` | No records or all expired | LlmRequired |
| `GetParentReportAsync` | Redis hit | CacheHit |
| `GetParentReportAsync` | DB record exists, not expired | Analytics |
| `GenerateParentReportAsync` | Always | LlmRequired |
| `GenerateWeaknessAnalysisAsync` | Always (from consumer) | LlmRequired |
| `GenerateTeachingSuggestionAsync` | Always | LlmRequired |

Classification reads only Redis key existence (O(1)) and `AiRecommendation.IsActive` flag (indexed). No full data loads.

---

## 5. Role-Based Behavior

| Role | Allowed Operations | Scope Restriction |
|---|---|---|
| **Student** | `GetLearningInsightsAsync`, `GetRecommendedContentAsync` | Own `studentUserId` from JWT claim only |
| **Parent** | `GetParentReportAsync`, `GenerateParentReportAsync`, `GetStudentAlertsForParentAsync` | Only linked students via `ParentStudentLinks` table |
| **Teacher** | `GetClassAnalyticsAsync`, `GetStudentInsightAsync`, `GenerateTeachingSuggestionAsync` | Only students in assigned classes via `TeachingAssignment` |
| **Admin** | `GetPlatformAnalyticsAsync`, `GetGradeHeatmapAsync`, prompt templates | Platform-wide, no per-student scope |

`HybridAuthGuard` enforces **data-level** scope. It does not duplicate the `[Authorize]` policy on controllers — it adds the second layer of enforcement at the service boundary.

---

## 6. Security Model

### Prompt Injection Prevention

The existing `GenerateAiNarrativeAsync` substitutes user data into prompt templates. The new `HybridContextComposer` sanitizes all user-derived strings before handoff:

```csharp
// Applied to: student name, subject name, grade name
private static string SanitizeForPrompt(string input)
{
    if (string.IsNullOrEmpty(input)) return input;
    return input
        .Replace("{", "").Replace("}", "")
        .Replace("\n", " ").Replace("\r", "")
        .Replace("ignore previous instructions", "", StringComparison.OrdinalIgnoreCase)
        .Trim()[..Math.Min(input.Length, 200)];
}
```

### Cross-User Data Leakage Prevention

- All cache keys include `studentUserId`: `weakness:{studentUserId}:{subjectId}`.
- `HybridAuthGuard` validates `studentUserId` matches caller scope **before** any cache read.
- No shared cache keys across users.

### Secret Protection

AI API keys remain in `appsettings.json` under `AI:OpenAI:ApiKey`, `AI:Claude:ApiKey`, `AI:Gemini:ApiKey` — already implemented in existing providers. The new layer never accesses secrets directly.

---

## 7. Quota and Cost Strategy

### Per-Student Daily LLM Quota

```csharp
// Redis key: ai_quota:{studentUserId}:{yyyy-MM-dd}
// TTL: seconds until midnight UTC
// Limit: appsettings "AI:DailyQuotaPerStudent" (suggested default: 3)

public interface IHybridQuotaService
{
    Task<bool> IsWithinQuotaAsync(int studentUserId, CancellationToken ct);
    Task IncrementAsync(int studentUserId, CancellationToken ct);
}
```

When quota exceeded:
1. Return the most recent non-expired `AiRecommendation` from DB (stale-but-valid).
2. If no stale record, return a canned degraded DTO with `DataSource = "quota_exceeded"`.
3. Never return HTTP 429 to end users — degrade gracefully.

### What Never Reaches the LLM

- Attendance/score threshold alerts (`EvaluatePerformanceAlertsAsync` — pure SQL).
- Class, platform, and grade analytics dashboards (pure SQL aggregates).
- Any request with a valid Redis or DB cache hit.
- Any request where daily quota is exhausted.

### Cost Attribution

Existing `AiRecommendation` already stores `PromptTokensUsed` and `CompletionTokensUsed`. New `HybridAuditLogger` adds per-call entries with: stage that triggered LLM, provider used, latency, token counts.

---

## 8. Caching Strategy

### Existing Cache Keys — Unchanged

```
weakness:{studentUserId}:{subjectId}           TTL: 24h
recommendations:{studentUserId}:{subjectId}    TTL: 12h
parent_report:{studentUserId}:{month}          TTL: 24h
```

Invalidation on `PerformanceRecalculatedEvent` is already implemented in `PerformanceRecalculatedAiConsumer` — unchanged.

### New Cache Keys

```
ai_quota:{studentUserId}:{yyyy-MM-dd}          TTL: midnight UTC — daily LLM call counter
```

### Safety Rules

1. Always include `studentUserId` in every cache key.
2. Cache writes happen after successful LLM generation and DB persistence.
3. Never serve one student's cached data in response to another student's request.

---

## 9. Retrieval Strategy

**Phase 1:** Keep the existing context-stuffing approach in `BuildStudentSubjectContextAsync`. It already retrieves: student exams, student answers, lessons, content items, and performance stats — serialized as JSON for the LLM.

**Phase 2:** Add lightweight content retrieval in `HybridContextComposer`:

1. Identify weak lesson IDs from existing `AiRecommendation.Payload` (already parsed in `AiAnalyticsService`).
2. Query `ContentItems WHERE LessonId IN (weak lesson ids) AND IsActive = true`.
3. Take top 5, ordered by: `Video` type first, then `File`.
4. Append to context JSON before LLM call.

No vector database required. The `ContentItem` entity and table already exist.

---

## 10. Provider Fallback Integration

The existing `AiProviderFactory` implements the full fallback chain: **OpenAI → Claude → Gemini**. This is unchanged. `HybridAiOrchestrator` never calls providers directly — it delegates to `AiAnalyticsService.GenerateWeaknessAnalysisAsync` etc., which internally use `GenerateAiNarrativeAsync` → `IAiProviderFactory`.

The only addition: the orchestrator wraps the entire generation call to handle **total provider failure** (all three fail):

1. Return most recent stale `AiRecommendation` if available.
2. Else, return graceful degraded DTO with `DataSource = "provider_unavailable"`.
3. Log failure via `ILogger<HybridAiOrchestrator>`.

---

## 11. Proposed New Components

All new components in `Masarak.Infrastructure/Services/AI/Hybrid/`:

```
Masarak.Application/Interfaces/
  IHybridQuotaService.cs
  IHybridAuditLogger.cs

Masarak.Infrastructure/Services/AI/Hybrid/
  HybridAiOrchestrator.cs         — implements IAiAnalyticsService, wraps AiAnalyticsService
  HybridIntentClassifier.cs       — rule-based intent classification (pure logic, no DB)
  HybridAuthGuard.cs              — data-scope validation
  HybridQuotaService.cs           — Redis-based per-student quota
  HybridContextComposer.cs        — prompt sanitization + context enrichment
  HybridAuditLogger.cs            — structured audit log writer
  DeterministicResponseResolver.cs — canned responses for threshold questions
```

| Component | Single Responsibility |
|---|---|
| `HybridAiOrchestrator` | Orchestration pipeline only |
| `HybridIntentClassifier` | Classification only — pure logic, no I/O |
| `HybridAuthGuard` | Data-scope enforcement only |
| `HybridQuotaService` | Quota read/write only |
| `HybridContextComposer` | Sanitization + context enrichment only |
| `HybridAuditLogger` | Structured logging only |
| `DeterministicResponseResolver` | Canned responses only — pure functions |

---

## 12. DDD and SOLID Analysis

### Bounded Contexts

| Context | Responsibility | Owns |
|---|---|---|
| **AI Orchestration** | Route, quota, classify, audit | `HybridAiOrchestrator`, `HybridIntentClassifier`, `HybridQuotaService` |
| **AI Generation** | Build context, call LLM, persist | `AiAnalyticsService` (unchanged) |
| **AI Providers** | LLM API communication, fallback | `AiProviders.cs` (unchanged) |
| **Domain Analytics** | Pure SQL aggregates | `AiAnalyticsService` SQL methods (unchanged) |
| **Security** | Data-scope enforcement | `HybridAuthGuard` |

### SOLID

**S — Single Responsibility:** Each new component has one job. The orchestrator does not know Redis internals; `HybridQuotaService` does not know about LLM calls.

**O — Open/Closed:** New intent routes are added as new cases in `HybridIntentClassifier` without touching existing routing. New providers are added to `AiProviderFactory` without touching the orchestrator.

**L — Liskov Substitution:** `HybridAiOrchestrator` fully implements `IAiAnalyticsService`. All controllers, consumers, and tests that injected `AiAnalyticsService` work identically with zero changes.

**I — Interface Segregation:** `IHybridQuotaService`, `IHybridAuditLogger` are narrow interfaces. No component implements methods it does not need.

**D — Dependency Inversion:** `HybridAiOrchestrator` depends on `IAiAnalyticsService` (not `AiAnalyticsService`), `IHybridQuotaService`, `IHybridAuditLogger`, `IDistributedCache`, `ILogger`. No concrete class dependencies.

---

## 13. Implementation Phases

### Phase 1 — Safety Wrapper (1–2 days)
Zero new functionality. Proves zero regressions.

- [ ] Create `HybridAiOrchestrator` as a thin pass-through implementing `IAiAnalyticsService`.
- [ ] Extract `ValidateParentStudentLinkAsync` from `AiAnalyticsService` into shared `HybridAuthGuard`.
- [ ] Update DI: bind `IAiAnalyticsService` → `HybridAiOrchestrator`; register `AiAnalyticsService` as `[FromKeyedServices("core")]`.
- [ ] Run all existing integration tests — must pass 100%.

### Phase 2 — Intent Classification + Deterministic Resolver (2–3 days)

- [ ] Create `HybridIntentClassifier` with routing table from Section 4.
- [ ] Create `DeterministicResponseResolver` for threshold alerts.
- [ ] Wire into orchestrator pipeline.
- [ ] Verify `EvaluatePerformanceAlertsAsync` produces zero LLM calls.
- [ ] Add unit tests for all classifier branches.

### Phase 3 — Quota Service (1 day)

- [ ] Create `IHybridQuotaService` + `HybridQuotaService` (Redis INCR, midnight TTL).
- [ ] Add `"AI:DailyQuotaPerStudent": 3` to `appsettings.json`.
- [ ] Wire quota check before every LLM generation call.
- [ ] Implement stale-result fallback when quota exceeded.

### Phase 4 — Prompt Injection Hardening (1 day)

- [ ] Create `HybridContextComposer.SanitizeForPrompt()`.
- [ ] Apply to all user-derived strings before template substitution.
- [ ] Add unit tests with injection attempt strings including Arabic text.

### Phase 5 — Audit Logging (1 day)

- [ ] Create `IHybridAuditLogger` + `HybridAuditLogger` writing structured `ILogger` entries.
- [ ] Log per-request: routing stage, provider used, token counts, latency.
- [ ] Optional: `HybridAuditLog` DB entity + EF migration for persistent cost tracking.

### Phase 6 — Content Retrieval Enrichment (2–3 days)

- [ ] Implement content retrieval in `HybridContextComposer` from `ContentItems` table.
- [ ] Inject top-5 relevant content items into LLM context for weak lessons.
- [ ] Verify teaching suggestions reference specific content items.

---

## 14. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DI registration change breaks existing flows | Medium | High | Phase 1 is pure pass-through. Run full integration test suite before merging. |
| `HybridAuthGuard` logic drifts from `AiAnalyticsService.ValidateParentStudentLinkAsync` | Medium | High | Extract shared `HybridAuthGuard` in Phase 1; `AiAnalyticsService` calls it too. |
| Redis quota key not expiring → permanent lockout | Low | High | Explicit TTL = `(midnight UTC - now).TotalSeconds`. Unit test this calculation. |
| Sanitizer strips valid Arabic characters | Low | Medium | Sanitizer targets control chars only (`{}`, newlines, injection phrases). Test with Arabic names. |
| Wrong intent classification for edge cases | Medium | Medium | Log every routing decision. Add `DataSource` field to all DTOs. Monitor for unexpected LLM calls. |
| `AiAnalyticsService` registered as both keyed and default causing DI conflict | Low | High | Use `AddKeyedScoped<IAiAnalyticsService, AiAnalyticsService>("core")` explicitly. |

---

## 15. Acceptance Criteria

**Functional**
- [ ] All existing endpoints return identical responses before and after orchestrator introduction.
- [ ] `EvaluatePerformanceAlertsAsync` triggers zero LLM calls.
- [ ] `GetClassAnalyticsAsync`, `GetPlatformAnalyticsAsync`, `GetGradeHeatmapAsync` trigger zero LLM calls.
- [ ] Redis cache hit returns cached result without calling `GenerateParentReportAsync`.
- [ ] After exceeding daily quota, subsequent requests return degraded result without HTTP error.

**Security**
- [ ] Parent JWT cannot retrieve data for an unlinked student.
- [ ] Student JWT cannot retrieve another student's insights.
- [ ] Injection string `{ignore previous instructions}` does not reach LLM verbatim.

**Observability**
- [ ] Every LLM call logs: `studentUserId`, `recommendationType`, `providerUsed`, `promptTokens`, `completionTokens`, `latencyMs`, `routingStage`.

**Performance**
- [ ] Orchestrator overhead (Redis + scope check) < 5ms per request.
- [ ] No N+1 queries introduced (use `AnyAsync`, not `ToListAsync`, for scope checks).

---

## 16. DI Registration Sketch

```csharp
// In InfrastructureServiceRegistration.cs

// Existing providers (unchanged)
services.AddScoped<OpenAiProvider>();
services.AddScoped<ClaudeProvider>();
services.AddScoped<GeminiProvider>();
services.AddScoped<IAiProviderFactory, AiProviderFactory>();

// Core analytics service registered under a key (changed from default)
services.AddKeyedScoped<IAiAnalyticsService, AiAnalyticsService>("core");

// New hybrid components
services.AddScoped<IHybridQuotaService, HybridQuotaService>();
services.AddScoped<IHybridAuditLogger, HybridAuditLogger>();
services.AddScoped<HybridIntentClassifier>();
services.AddScoped<HybridAuthGuard>();
services.AddScoped<HybridContextComposer>();
services.AddScoped<DeterministicResponseResolver>();

// Orchestrator as the default IAiAnalyticsService (controllers inject this)
services.AddScoped<IAiAnalyticsService, HybridAiOrchestrator>();
```

`HybridAiOrchestrator` constructor:

```csharp
public HybridAiOrchestrator(
    [FromKeyedServices("core")] IAiAnalyticsService coreService,
    HybridIntentClassifier classifier,
    HybridAuthGuard authGuard,
    IHybridQuotaService quotaService,
    IHybridAuditLogger auditLogger,
    HybridContextComposer contextComposer,
    DeterministicResponseResolver deterministicResolver,
    IDistributedCache cache,
    ILogger<HybridAiOrchestrator> logger)
```

---

## 17. Suggested Next Steps

1. **Agree on component names** — confirm `HybridAiOrchestrator`, `HybridIntentClassifier`, etc. match team conventions.
2. **Start with Phase 1** — pass-through orchestrator only. Merge after all tests pass.
3. **Add `DataSource` field to all AI DTOs** — most impactful zero-regression change. Makes every response self-describing (`cache` / `deterministic` / `llm` / `stale`).
4. **Extract `ValidateParentStudentLinkAsync`** from `AiAnalyticsService` into `HybridAuthGuard` before building Phase 2.
5. **Add `"AI:DailyQuotaPerStudent"` to `appsettings.json`** immediately — even before Phase 3 is built.
6. **Run baseline cost query now:**
   ```sql
   SELECT ProviderUsed, SUM(PromptTokensUsed), SUM(CompletionTokensUsed), COUNT(*)
   FROM ai_recommendations
   GROUP BY ProviderUsed
   ```
   Establish cost baseline before the hybrid layer changes call patterns.
